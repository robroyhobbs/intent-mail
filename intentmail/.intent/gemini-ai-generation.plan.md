# Execution Plan: gemini-ai-generation

## Overview

Replace AI generation stubs with real Gemini Flash 3 Preview calls. Personalized email copy at send-time with inline retry, static fallback, and plan-based generation limits.

## Prerequisites

- Email client (`src/lib/email/client.ts`) with working slot-based template system
- Upstash Redis configured (for generation limits)
- Intent system with `generationEnabled` and `generationConstraints` fields

---

## Phase 0: Gemini SDK Client + Prompt Builder

### Description

Install `@google/generative-ai`, create `src/lib/ai/gemini.ts` with prompt construction and generation functions. This is the core AI module — no integration with email client yet.

### Tests

#### Happy Path

- [ ] buildSystemPrompt includes brand name, tone, doSay, dontSay
- [ ] buildSystemPrompt includes intent purpose and urgency
- [ ] buildSystemPrompt includes generation constraints
- [ ] buildUserPrompt includes slot type and prompt text
- [ ] buildUserPrompt includes maxLength when specified
- [ ] buildUserPrompt includes sanitized recipient data
- [ ] generateSlotText returns trimmed text from Gemini response
- [ ] generateWithRetry returns on first attempt success
- [ ] generateWithRetry retries once after failure then succeeds

#### Bad Path

- [ ] generateSlotText throws when GOOGLE_AI_API_KEY is missing
- [ ] generateWithRetry throws after 2 failed attempts
- [ ] generateSlotText handles Gemini returning empty string
- [ ] generateSlotText handles Gemini API error (network/5xx)
- [ ] buildSystemPrompt handles missing/empty voice settings gracefully
- [ ] buildUserPrompt handles missing maxLength and recipient data

#### Edge Cases

- [ ] buildSystemPrompt with empty doSay/dontSay arrays (no "Do say:" line)
- [ ] buildSystemPrompt with empty generation constraints
- [ ] buildUserPrompt with empty recipient data object
- [ ] generateSlotText with very long prompt (>1000 chars)
- [ ] generateWithRetry waits ~1 second between attempts

#### Security

- [ ] recipient data is sanitized (only string/number values, no objects/functions)
- [ ] prompt injection patterns in recipient data don't break system prompt
- [ ] GOOGLE_AI_API_KEY is not exposed in error messages
- [ ] system prompt instructs model to write content only, no code execution

#### Data Leak

- [ ] error messages don't contain API key
- [ ] error messages don't contain full prompt text
- [ ] console.warn for retry doesn't log recipient PII

#### Data Damage

- [ ] failed generation doesn't mutate any input parameters
- [ ] concurrent generateSlotText calls are independent (no shared state)

### E2E Gate

```bash
# Tests pass
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/ai/gemini.test.ts

# Module exports correctly
cd /Users/robroyhobbs/work/intentmail && node -e "const m = require('./src/lib/ai/gemini'); console.log(Object.keys(m))" 2>&1 || npx tsx -e "import * as m from './src/lib/ai/gemini'; console.log(Object.keys(m))"
```

### Acceptance Criteria

- [ ] All 6 test categories pass
- [ ] `@google/generative-ai` installed
- [ ] `src/lib/ai/gemini.ts` exports: buildSystemPrompt, buildUserPrompt, generateSlotText, generateWithRetry
- [ ] Prompt includes brand voice, intent purpose, slot type, recipient data
- [ ] Inline retry with 1s delay between attempts

---

## Phase 1: Plan-Based Generation Limits

### Description

Create `src/lib/ai/limits.ts` — track AI generations per org per month using Upstash Redis counters. Check limits before generation, respect plan tiers.

### Tests

#### Happy Path

- [x] checkGenerationLimit returns true when under limit
- [x] checkGenerationLimit returns false when at/over limit
- [x] incrementGenerationCount increments Redis counter
- [x] FREE plan limit is 100
- [x] STARTER plan limit is 1,000
- [x] GROWTH plan limit is 10,000
- [x] ENTERPRISE plan has no limit (returns true always)

#### Bad Path

- [x] checkGenerationLimit handles Redis connection failure (returns true — fail open)
- [x] incrementGenerationCount handles Redis failure gracefully (doesn't throw)
- [x] handles invalid plan value gracefully

#### Edge Cases

- [x] counter resets at start of new billing cycle (TTL-based)
- [x] counter at exactly the limit returns false
- [x] concurrent increments don't skip counts (Redis INCR is atomic)
- [x] first call of month creates counter with correct TTL

#### Security

- [x] org IDs are used as-is (CUIDs, no injection risk in Redis keys)
- [x] cannot bypass limits by manipulating request

#### Data Leak

- [x] Redis key format doesn't expose sensitive org data
- [x] error logs don't include org details beyond ID

#### Data Damage

- [x] Redis failure doesn't block email sending (fail open)
- [x] counter overflow not possible (Int max > any plan limit)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/ai/limits.test.ts
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `src/lib/ai/limits.ts` exports: checkGenerationLimit, incrementGenerationCount
- [x] Uses same Upstash Redis client as rate limiter
- [x] Fail-open on Redis errors (don't block sends)

---

## Phase 2: Wire into Email Client + Config

### Description

Connect Gemini generation into `generateSlotContent()` in `client.ts`. Make slot content generation async. Add static fallback on failure. Update `.env.example`. Verify full build.

### Tests

#### Happy Path

- [x] email with generationEnabled + prompt slots calls Gemini
- [x] generated text appears in rendered HTML email
- [x] bullet-list slot splits Gemini response into items array
- [x] email without generationEnabled uses static content (no Gemini call)
- [x] email with no prompt slots doesn't call Gemini

#### Bad Path

- [x] Gemini failure falls back to static content for that slot
- [x] Gemini failure falls back to prompt text when no static content
- [x] missing GOOGLE_AI_API_KEY falls back to static for all slots
- [x] generation limit exceeded skips AI, uses static content

#### Edge Cases

- [x] email with mix of prompt and static slots (only prompt slots call Gemini)
- [x] email with all slots as prompt (multiple Gemini calls)
- [x] generation limit hit mid-email (some slots AI, rest static)
- [x] intent with generationEnabled but no prompt slots (no Gemini calls)

#### Security

- [x] recipient data passed to Gemini is sanitized
- [x] generated content goes through existing escapeHtml in renderer
- [x] API key for email provider not mixed up with AI API key

#### Data Leak

- [x] fallback to static doesn't expose that AI was attempted
- [x] API response doesn't include raw Gemini prompts or responses
- [x] console.warn for AI failure doesn't log email content

#### Data Damage

- [x] AI failure for one slot doesn't affect other slots
- [x] email still sends completely even if all AI slots fall back
- [x] generation limit counter increments on successful AI call

### E2E Gate

```bash
# Build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5

# .env.example has new vars
grep "GOOGLE_AI" /Users/robroyhobbs/work/intentmail/.env.example

# package.json has dependency
grep "generative-ai" /Users/robroyhobbs/work/intentmail/package.json
```

### Acceptance Criteria

- [x] All 6 test categories pass
- [x] `generateSlotContent()` is async and calls Gemini for prompt slots
- [x] Static fallback works for all failure modes
- [x] Generation limits checked before AI calls
- [x] `.env.example` documents GOOGLE_AI_API_KEY and GOOGLE_AI_MODEL
- [ ] Production build passes

---

## Final E2E Verification

```bash
# Full build
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -10

# All test files pass
cd /Users/robroyhobbs/work/intentmail && npx tsx src/lib/ai/gemini.test.ts && npx tsx src/lib/ai/limits.test.ts
```

## Risk Mitigation

| Risk                         | Mitigation                                            | Contingency                |
| ---------------------------- | ----------------------------------------------------- | -------------------------- |
| Gemini SDK API changes       | Pin version in package.json                           | Rollback to pinned version |
| Gemini latency varies        | 500ms timeout on generation                           | Static fallback kicks in   |
| Redis unavailable for limits | Fail open (allow generation)                          | Monitor Redis health       |
| Prompt produces bad copy     | Existing email validator catches jargon/passive voice | Static fallback            |

## References

- [Intent](./gemini-ai-generation.intent.md)
- [Overview](./gemini-ai-generation.overview.md)
