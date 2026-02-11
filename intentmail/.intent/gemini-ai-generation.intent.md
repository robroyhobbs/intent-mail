# Gemini AI Email Generation Specification

## 1. Overview

- **Product positioning:** Core differentiator — AI-native email generation powered by Google Gemini
- **Core concept:** When an intent has `generationEnabled: true` and slots have `prompt` fields, use Gemini Flash 3 Preview to generate personalized email copy at send-time
- **Priority:** P0 (core feature, currently stubbed)
- **Target user:** IntentMail API consumers (developers sending emails)
- **Project scope:** New AI module + update email client + add generation limits + queue for retries

## 2. Architecture

### Current State (Stubs)

```
Intent (generationEnabled: true, slots with prompt fields)
    ↓
client.ts → generateSlotContent()
    ↓
if (slotConfig?.prompt) → "[Content for: ${prompt}]"   ← PLACEHOLDER
```

### Target State

```
API Request: POST /emails/send
    ↓
client.ts → sendEmail()
    ↓
Check generation limits (plan-based)
    ↓
generateSlotContent() → for each slot with prompt:
    ↓
┌─────────────────────────────────────┐
│  src/lib/ai/gemini.ts               │
│  buildPrompt(intent, brand, slot,   │
│              recipientData)          │
│      ↓                              │
│  Gemini Flash 3 Preview API call    │
│      ↓                              │
│  Parse response → slot text         │
└─────────────────────────────────────┘
    ↓ (success)                  ↓ (failure)
Render email normally       Queue to Redis, retry later
    ↓                            ↓
Send via provider           Return { status: 'queued' }
```

### New Files

```
src/lib/ai/
├── gemini.ts           ← Gemini SDK client, prompt builder, generate()
└── limits.ts           ← Plan-based generation limit tracking
```

<!-- CRITIQUE: dropped queue.ts — inline retry + static fallback instead of full queue system -->

### Modified Files

```
src/lib/email/client.ts         ← Wire AI generation into slot content
src/lib/email/types.ts          ← Add AI-related types if needed
src/app/api/v1/emails/send/route.ts ← No changes needed (static fallback is transparent)
.env.example                    ← Add GOOGLE_AI_API_KEY, GOOGLE_AI_MODEL
package.json                    ← Add @google/generative-ai
```

## 3. Detailed Behavior

### 3.1 Prompt Construction

For each slot with a `prompt` field, build a Gemini prompt:

```typescript
// System prompt (per-request, includes brand voice)
const systemPrompt = `You are an email copywriter for ${brand.name}.
Tone: ${brand.voice.tone}
${brand.voice.doSay.length ? `Do say: ${brand.voice.doSay.join(", ")}` : ""}
${brand.voice.dontSay.length ? `Don't say: ${brand.voice.dontSay.join(", ")}` : ""}

Email purpose: ${intent.purpose}
Urgency: ${intent.urgency}
${intent.generation.constraints.length ? `Constraints:\n${intent.generation.constraints.map((c) => `- ${c}`).join("\n")}` : ""}

Rules:
- Write ONLY the requested content, no preamble or explanation
- Match the requested format exactly (headline, paragraph, bullet list, etc.)
- Keep it concise and actionable`;

// User prompt (per-slot)
const userPrompt = `Write a ${slot.type} for this email.
Prompt: ${slotConfig.prompt}
${slot.maxLength ? `Max length: ${slot.maxLength} characters` : ""}
${recipientData ? `Recipient context: ${JSON.stringify(relevantRecipientData)}` : ""}`;
```

### 3.2 Gemini API Call

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash",
});

async function generateSlotText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    },
  });
  return result.response.text().trim();
}
```

### 3.3 Slot Type Formatting

Different slot types need different output parsing:

| Slot Type     | Expected Output          | Post-processing                                  |
| ------------- | ------------------------ | ------------------------------------------------ |
| `headline`    | Single line of text      | Trim, enforce maxLength                          |
| `paragraph`   | 1-3 sentences            | Trim                                             |
| `bullet-list` | Newline-separated items  | Split by `\n`, filter empty, return as `items[]` |
| `greeting`    | "Hey {name}," style      | Trim                                             |
| `ps-line`     | Single sentence          | Trim                                             |
| `info-box`    | Short informational text | Trim                                             |
| `stats-box`   | Stat or number highlight | Trim                                             |
| `testimonial` | Quote text               | Trim (attribution from slot config, not AI)      |

### 3.4 Generation Flow in client.ts

```typescript
// In generateSlotContent(), replace the placeholder:
if (slotConfig?.prompt && intent.generation.enabled) {
  try {
    const text = await generateWithGemini(
      intent,
      brand,
      slotDef,
      slotConfig,
      data,
    );

    if (slotDef.type === "bullet-list") {
      slotContent[slotDef.id] = {
        items: text
          .split("\n")
          .filter(Boolean)
          .map((l) => l.replace(/^[-•]\s*/, "")),
      };
    } else {
      slotContent[slotDef.id] = { text };
    }
  } catch (error) {
    // AI failed — fall back to static content
    console.warn(`AI generation failed for slot ${slotDef.id}:`, error);
    slotContent[slotDef.id] = {
      text: slotConfig.static ?? slotConfig.prompt ?? "",
    };
  }
} else if (slotConfig?.prompt) {
  // generationEnabled is false — use prompt as static text fallback
  slotContent[slotDef.id] = { text: slotConfig.prompt };
}
```

### 3.5 Failure Handling (Inline Retry + Static Fallback)

<!-- CRITIQUE: replaced full Redis queue system with inline retry + static fallback. Saves ~200 LOC and eliminates cron/retry endpoint infrastructure. -->

When Gemini fails for a slot:

1. Retry once after 1-second delay
2. If retry fails, fall back to slot's static content or prompt text
3. Email sends with whatever content is available (AI or static)
4. `console.warn` logs the failure for monitoring

```typescript
async function generateWithRetry(
  intent: IntentConfig,
  brand: BrandConfig,
  slot: SlotDefinition,
  slotConfig: IntentSlotConfig,
  data: Record<string, unknown>,
): Promise<string> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await generateSlotText(
        buildSystemPrompt(intent, brand),
        buildUserPrompt(slot, slotConfig, data),
      );
    } catch (error) {
      if (attempt === 0) await new Promise((r) => setTimeout(r, 1000));
      else throw error;
    }
  }
  throw new Error("unreachable");
}
```

No queue, no cron, no retry endpoint. Email always sends.

### 3.6 Plan-Based Generation Limits

Track AI generations per org per billing cycle:

```typescript
// In src/lib/ai/limits.ts
const AI_GENERATION_LIMITS: Record<Plan, number> = {
  FREE: 100,
  STARTER: 1_000,
  GROWTH: 10_000,
  ENTERPRISE: Infinity,
};

async function checkGenerationLimit(
  orgId: string,
  plan: Plan,
): Promise<boolean> {
  // Use Redis counter: `ai-gen:{orgId}:{month}`
  // Increment on each generation, check against plan limit
  // TTL = end of billing cycle
}
```

Add to `sendEmail()` flow before generation:

```typescript
const withinLimit = await checkGenerationLimit(organizationId, org.plan);
if (!withinLimit) {
  // Fall back to static content, don't generate
  // Or return error depending on preference
}
```

### 3.7 Error Handling

| Scenario                      | Behavior                                                               |
| ----------------------------- | ---------------------------------------------------------------------- |
| Gemini API key missing        | Throw on first generation attempt, log error. Static content fallback. |
| Gemini rate limited (429)     | Inline retry once, then static fallback                                |
| Gemini server error (5xx)     | Inline retry once, then static fallback                                |
| Gemini returns empty/invalid  | Use slot's static content as fallback                                  |
| Generation limit exceeded     | Skip AI, use static content, include warning in response               |
| Gemini returns unsafe content | Use static content fallback, log for review                            |

## 4. Environment Variables

```bash
# Google AI (required for AI generation)
GOOGLE_AI_API_KEY="..."
GOOGLE_AI_MODEL="gemini-2.0-flash"  # or gemini-3.0-flash-preview when available
```

## 5. Decisions Summary

| Decision          | Choice                                   | Rationale                                           |
| ----------------- | ---------------------------------------- | --------------------------------------------------- |
| SDK               | `@google/generative-ai`                  | Official Google SDK, TypeScript support             |
| Model             | Gemini Flash 3 Preview (configurable)    | User preference, fast + cheap for email copy        |
| Generation timing | Send-time                                | Personalized per recipient using their data         |
| Failure handling  | Inline retry + static fallback           | CRITIQUE: no queue infra needed, email always sends |
| Brand voice       | System prompt injection                  | Zero UI changes, leverages existing brand config    |
| Caching           | None                                     | Simplicity, each send gets fresh personalized copy  |
| Cost limits       | Plan-based (100/1K/10K/∞)                | Matches existing billing tier model                 |
| Image generation  | Out of MVP                               | Focus on text copy first                            |
| Prompt structure  | System (brand+intent) + User (slot+data) | Clean separation of context vs request              |
| Static fallback   | Use slot's static content or prompt text | Email still sends even if AI fails                  |

## 6. MVP Scope

**In:**

- Gemini SDK integration (`@google/generative-ai`)
- Prompt construction from intent + brand + slot + recipient data
- Send-time generation for all prompt-bearing slots
- Inline retry (2 attempts) + static content fallback
- Plan-based generation limits via Redis counter
- Static content fallback when AI unavailable

**Out:**

- Image generation (Imagen 3 or similar)
- Caching/deduplication of generated content
- A/B testing of AI vs static content
- Generation preview in dashboard UI
- Token usage tracking/reporting
- Streaming generation
- Multiple model support (only Gemini for now)
- Fine-tuning or custom models

## 7. Risks

| Risk                                   | Mitigation                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------- |
| Gemini latency adds to send time       | Flash model is fast (~200ms). Acceptable for email (not real-time chat).      |
| Gemini generates inappropriate content | System prompt constraints + existing email validator catches issues           |
| Cost escalation from high-volume orgs  | Plan-based limits cap generations per month                                   |
| Gemini outage degrades emails          | Static fallback ensures delivery; operator monitors via logs                  |
| Prompt injection via recipient data    | Sanitize data before injecting into prompts. Only include whitelisted fields. |
| Model deprecation                      | Model ID is configurable via env var, easy to swap                            |

## 8. Open Items

- Exact Gemini Flash 3 Preview model ID (may be `gemini-3.0-flash-preview` — verify when available)
- Whether to track token usage per org for billing visibility (deferred to post-MVP)
- Monitoring dashboard for AI fallback rates (deferred)
