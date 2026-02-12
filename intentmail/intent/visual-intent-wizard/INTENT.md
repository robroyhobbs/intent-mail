# Visual Intent Creation Wizard

## 1. Overview

**Problem:** The current intent creation form is a multi-tab text-heavy form that feels like filling out a spreadsheet. Users must type into 15+ fields across 5 tabs. It's not visual, not modern, and creates unnecessary friction.

**Solution:** A 2-step visual wizard with AI-powered auto-fill, clickable chip selectors, and a live structural email preview. Type one sentence, AI fills the rest, tweak with clicks, see the email layout update live, save.

**Priority:** High — this is the core creation experience for the product.

**Target User:** SaaS teams creating email intents. Non-technical marketers and technical founders alike.

**Scope:** Replace the existing `IntentForm` component entirely. New wizard for both create and edit flows.

## 2. Architecture

### Component Structure

```
src/components/intents/
├── intent-wizard.tsx          # Main 2-step wizard container + state
├── wizard-step-describe.tsx   # Step 1: One-line AI describe
├── wizard-step-customize.tsx  # Step 2: Chips + preview + save
├── chip-selector.tsx          # Reusable clickable chip group
├── template-cards.tsx         # Visual template card picker
├── live-preview.tsx           # Structural email preview (iframe)
└── intent-form.tsx            # [DELETED - replaced by wizard]

src/app/api/v1/intents/
├── generate/route.ts          # NEW: Gemini auto-fill endpoint
└── ... (existing routes unchanged)
```

### Data Flow

```
User types one line (or clicks quick-start chip)
       ↓
POST /api/v1/intents/generate
  → Gemini generates structured JSON
  → Returns all intent fields pre-filled
       ↓
Wizard loads Step 2 with AI output
       ↓
User tweaks via chips (voice, urgency, CTA style, template)
       ↓
Each chip change → instant client-side preview re-render
  → Template structure + brand colors + placeholder content
  → No AI call needed — renders from slot prompts/static text
       ↓
User clicks "Create Intent" → POST /api/v1/intents (existing)
```

## 3. Detailed Behavior

### Step 1: Describe (What kind of email?)

**Layout:** Centered, full-width. Minimal UI. Just an input and a button.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│          What kind of email do you want to send?        │
│                                                         │
│  ┌───────────────────────────────────────────┐  ┌────┐ │
│  │ Welcome email for new trial signups       │  │ Go │ │
│  └───────────────────────────────────────────┘  └────┘ │
│                                                         │
│  Welcome · Receipt · Password Reset · Trial Expiring    │
│  Invoice · Custom...                                    │
│                                                         │
│                       ● ○  Step 1 of 2                  │
└─────────────────────────────────────────────────────────┘
```

**Behavior:**
- User types a free-text description (1 sentence)
- Press Enter or click "Go" → loading spinner ("Generating your intent...")
- Calls `POST /api/v1/intents/generate` with `{ description, brandId }`
- On success → transition to Step 2 with all fields pre-filled
- On failure → retry once with spinner, then load Step 2 with generic defaults

**Quick-start chips** below the input for zero-typing:
`Welcome` `Receipt` `Password Reset` `Trial Expiring` `Invoice` `Custom...`
Clicking a chip fills the input and auto-submits.

### Step 2: Customize, Preview & Save

**Layout:** Split view. Left panel: visual controls + save. Right panel: live structural preview.

```
┌──────────────────────────┬──────────────────────────────┐
│  Intent: Welcome Email   │                              │
│  ─────────────────────   │   ┌────────────────────────┐ │
│                          │   │  Subject: Welcome to   │ │
│  Brand                   │   │  {{productName}},      │ │
│  [Default ▼]             │   │  {{firstName}}!        │ │
│                          │   │                        │ │
│  Voice                   │   │  [greeting]            │ │
│  ┌──────────┐ ┌────────┐│   │  Warm welcome using    │ │
│  │ Friendly │ │Enterpr.││   │  first name            │ │
│  │  SaaS ✓  │ │ Formal ││   │                        │ │
│  └──────────┘ └────────┘│   │  [main_copy]           │ │
│  ┌──────────┐ ┌────────┐│   │  Brief welcome,        │ │
│  │ Startup  │ │ Bold & ││   │  explain next steps.   │ │
│  │ Casual   │ │ Direct ││   │                        │ │
│  └──────────┘ └────────┘│   │  ┌──────────────────┐  │ │
│  ┌──────────┐           │   │  │  Get Started →   │  │ │
│  │ Caring   │           │   │  └──────────────────┘  │ │
│  │ Support  │           │   │                        │ │
│  └──────────┘           │   │  The {{productName}}   │ │
│                          │   │  Team                  │ │
│  Urgency                 │   └────────────────────────┘ │
│  ○ None  ○ Low           │                              │
│  ○ Medium  ○ High        │   ── Subject Variants ──     │
│                          │   • Your {{productName}}     │
│  CTA Style               │     account is ready         │
│  ○ Soft  ● Medium        │   • Let's get started,      │
│  ○ Strong                │     {{firstName}}            │
│                          │                              │
│  Template                │                              │
│  [Simple] [Transaction]  │                              │
│  [Security] [Info Box]   │                              │
│                          │                              │
│  [← Back]  [Create Intent]                             │
│                          │                              │
│            ○ ●  Step 2 of 2                            │
└──────────────────────────┴──────────────────────────────┘
```

**ChipSelector Component** (reusable for all chip types):

Props: `options: { value, label, color? }[]`, `value`, `onChange`, `mode: "single" | "multi"`

Used for:
- **Voice** (single select): Friendly SaaS, Enterprise Formal, Startup Casual, Bold & Direct, Caring Support
- **Urgency** (single select): None (gray), Low (blue), Medium (yellow), High (red)
- **CTA Style** (single select): Soft, Medium, Strong

**Voice Chips → Tone Mapping:**
| Chip | Maps to `tone` field |
|------|---------------------|
| Friendly SaaS | "Warm, professional, helpful" |
| Enterprise Formal | "Formal, authoritative, clear" |
| Startup Casual | "Casual, energetic, conversational" |
| Bold & Direct | "Direct, confident, action-oriented" |
| Caring Support | "Empathetic, patient, reassuring" |

**Template Cards:** Small visual cards with template name + slot count. Click to switch. Slots auto-initialize from selected template.

**Live Preview (Structural — No AI Call):**
- Rendered client-side in an `<iframe>` using `srcDoc`
- Uses the email template HTML structure with brand colors
- Slot content shows the prompt text as placeholder (e.g., "[greeting] Warm welcome using first name")
- Subject line, CTA button text, and static slots render with actual values
- Updates instantly on every chip/template change (no debounce needed — it's client-side)
- On mobile: preview stacks below controls

**Save:**
- "Create Intent" button at bottom of left panel
- Calls `POST /api/v1/intents` (existing endpoint)
- On success → redirect to `/dashboard/intents` with success toast
- On error → show inline error, stay on step 2

### Edit Flow

When editing an existing intent:
- Skip Step 1 (AI describe)
- Load directly into Step 2 with existing values
- Button says "Save Changes" instead of "Create Intent"
- Uses `PUT /api/v1/intents/[id]` instead of POST

## 4. API: Gemini Auto-Fill Endpoint

### `POST /api/v1/intents/generate`

**Auth:** Clerk session (dashboard route, not API key)

**Request:**
```json
{
  "description": "Welcome email for new trial signups",
  "brandId": "clxyz123"
}
```

**Response:**
```json
{
  "name": "Welcome Email",
  "slug": "welcome-email",
  "purpose": "Welcome new trial users and guide them to their first action",
  "tone": "Warm, professional, helpful",
  "urgency": "NONE",
  "subjectDefault": "Welcome to {{productName}}, {{firstName}}!",
  "subjectVariants": [
    "Your {{productName}} account is ready",
    "Let's get started, {{firstName}}"
  ],
  "templateId": "simple",
  "slots": [
    { "id": "greeting", "prompt": "Warm welcome using first name" },
    { "id": "main_copy", "prompt": "Brief welcome, explain next steps. 2-3 sentences." },
    { "id": "cta", "buttonText": "Go to Dashboard", "url": "{{dashboardUrl}}" },
    { "id": "signoff", "static": "The {{productName}} Team" }
  ],
  "contentGoal": "Get user to click through to the dashboard",
  "contentMustInclude": ["Confirmation they signed up", "Clear next step"],
  "contentMustNotInclude": ["Pricing", "Feature lists"],
  "ctaText": "Go to Dashboard",
  "ctaUrl": "{{dashboardUrl}}",
  "ctaStyle": "STRONG"
}
```

**Gemini Prompt Strategy:**
- System prompt: "You are an email marketing expert. Given a description of an email intent, generate a complete intent configuration as JSON."
- Include the schema definition in the system prompt
- Include the brand voice context if brandId is provided
- Temperature: 0.7 (creative but structured)
- Response format: JSON mode

## 5. Constraints

- **No new dependencies** — use existing stack (React 19, Radix UI, Tailwind, Gemini)
- **Same data model** — wizard outputs the same Prisma Intent fields, no schema changes
- **Same API** — uses existing `POST /api/v1/intents` and `PUT /api/v1/intents/[id]`
- **Mobile responsive** — preview stacks below controls on small screens
- **Brand colors** — chips and preview should reflect selected brand's color palette

## 6. Decisions Summary

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Entry point | One-line + AI fill | Lowest friction, feels cutting edge |
| Input style | Visual chips/tags | No typing for tone/urgency/CTA |
| Tone chips | Brand voice presets (5) | More intuitive than raw emotions |
| Preview | Structural HTML, side-by-side | Instant rendering, no AI call per change |
| Steps | 2 (describe → customize+save) | Critique: review step was redundant friction |
| AI provider | Gemini (existing) | Already in stack, no new dependency |
| Preview update | Instant, client-side | No debounce needed — structural render |
| Old form | Replaced entirely | Simpler codebase |
| AI fallback | Retry + spinner, then defaults | Graceful degradation |
| Edit flow | Skip step 1, load step 2 | Reuse same components |
| Chip components | One reusable ChipSelector | Critique: 3 identical patterns → 1 component |

## 7. MVP Scope

### In
- 2-step wizard (describe → customize + preview + save)
- Gemini auto-fill from one line
- Reusable ChipSelector for voice, urgency, CTA style
- Template card picker
- Structural email preview (client-side, instant)
- Quick-start chips on Step 1
- Edit mode (skip step 1)
- Mobile responsive layout

### Out
- AI-generated content in preview (just structural)
- Drag-and-drop slot reordering
- Custom tone chip creation
- A/B test variant preview
- Preview dark mode toggle
- Undo/redo
- Auto-save drafts

## 8. Risks

| Risk | Mitigation |
|------|-----------|
| Gemini API latency (2-5s) | Show engaging loading animation, retry once |
| Gemini output quality | Validate JSON schema, fall back to defaults |
| Mobile layout complexity | Stack preview below controls, collapse chips |
| Structural preview feels incomplete | Clear slot labels, show "[slot_name] prompt text" pattern |

## 9. Open Items

- None — ready for planning and implementation.

<!-- critique: 2026-02-11 -->
<!-- critique-findings: 3 found, 3 accepted -->
<!-- critique-changes: merged chip components, removed step 3, structural preview -->
