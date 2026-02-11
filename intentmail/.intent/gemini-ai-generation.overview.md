# Gemini AI Generation: AI-powered email copy at send-time via Google Gemini

## One sentence

Replace placeholder stubs with real Gemini Flash 3 Preview calls to generate personalized email copy per slot at send-time.

## Why?

IntentMail's "intent-driven" value prop requires AI generation — currently every prompt slot renders as `[Content for: ...]`. Without this, the platform is just a template engine. Gemini turns it into an AI-native email platform.

## Core experience

```
Developer sends email via API:
  POST /emails/send { to, intentId, brandId, data: { firstName: "Alice", plan: "Growth" } }
      ↓
Intent has generationEnabled: true, slots with prompts
      ↓
For each prompt slot:
  Build prompt (brand voice + intent purpose + slot type + recipient data)
      ↓
  Gemini Flash 3 Preview → "Hey Alice, your Growth plan just got even better..."
      ↓
Render HTML email with AI-generated copy
      ↓
Send via provider (Resend/SendGrid/etc.)

If Gemini fails:
  Queue to Redis → retry 3x (30s, 2m, 10m) → FAILED after 3
```

## Architecture

```
src/lib/ai/
├── gemini.ts        ← SDK client + prompt builder + generateSlotText()
├── limits.ts        ← Plan-based generation limits (Redis counter)
└── queue.ts         ← Upstash Redis retry queue

src/lib/email/
└── client.ts        ← Updated: calls gemini.ts for prompt slots

src/app/api/
├── v1/emails/send/  ← Updated: handles 'queued' response status
└── internal/
    └── process-queue/ ← NEW: retry endpoint (cron/QStash)

.env.example         ← GOOGLE_AI_API_KEY, GOOGLE_AI_MODEL
package.json         ← @google/generative-ai
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| When generate? | Send-time | Personalized per recipient |
| Model? | Gemini Flash 3 Preview | Fast, cheap, user preference |
| If AI fails? | Queue + retry 3x | Ensures delivery |
| Brand voice? | System prompt | Zero UI changes |
| Caching? | None | Simplicity |
| Cost limits? | Plan-based (100/1K/10K/∞) | Matches billing tiers |
| Images? | Out of MVP | Text copy first |

## Scope

**In:** Gemini SDK, prompt construction, send-time generation, retry queue, plan limits, static fallback
**Out:** Image gen, caching, A/B testing, dashboard preview, token tracking, streaming, multi-model

## Risk + Mitigation

| Risk | Mitigation |
|------|------------|
| Gemini latency | Flash is ~200ms, fine for email |
| Bad content | System prompt constraints + existing validator |
| Cost explosion | Plan-based generation limits |
| Prompt injection | Sanitize recipient data, whitelist fields |

## Next steps

1. `/intent-critique` — check for over-engineering
2. `/intent-plan` — phased TDD execution
3. `/intent-build-now` or `/swarm run` — implement
4. `/intent-sync` — sync back
