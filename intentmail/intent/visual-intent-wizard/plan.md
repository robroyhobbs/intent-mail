# Execution Plan: visual-intent-wizard

## Overview

Replace the existing 5-tab text-heavy IntentForm with a 2-step visual wizard featuring AI-powered auto-fill, clickable chip selectors, and a live structural email preview. One sentence in → AI fills everything → tweak with clicks → see preview → save.

## Prerequisites

- Existing Gemini integration at `src/lib/ai/gemini.ts` (confirmed)
- Existing template system at `src/lib/email/templates/slots.ts` (7 templates, confirmed)
- Existing CRUD API routes at `src/app/api/v1/intents/` (confirmed)
- Existing Prisma Intent model with all required fields (confirmed)
- `@google/generative-ai` ^0.24.1 installed (confirmed)
- Vitest needs to be configured (no test runner currently set up)

---

## Phase 0: Test Infrastructure + Gemini Auto-Fill API

### Description

Set up vitest test runner for the project, then build the `POST /api/v1/intents/generate` endpoint that takes a one-line description and returns a fully structured intent JSON via Gemini. This is the backend foundation — the wizard's "magic" depends on this endpoint producing good structured output.

### Tests

#### Happy Path

- [x] Vitest runs successfully with `pnpm test` script
- [x] POST /api/v1/intents/generate returns 200 with valid intent JSON for "Welcome email for new trial signups"
- [x] Response includes all required fields: name, slug, purpose, tone, urgency, subjectDefault, subjectVariants, templateId, slots, contentGoal, contentMustInclude, contentMustNotInclude, ctaText, ctaUrl, ctaStyle
- [x] Slug is auto-generated from name (lowercase, hyphenated)
- [x] Generated slots match the selected templateId's slot structure
- [x] Response includes brandId context when provided in request
- [x] Urgency field is a valid enum value (NONE, LOW, MEDIUM, HIGH)
- [x] ctaStyle is a valid enum value (SOFT, MEDIUM, STRONG)

#### Bad Path

- [x] Returns 401 when no Clerk session present
- [x] Returns 400 when description is empty string
- [x] Returns 400 when description exceeds 500 characters
- [x] Returns 400 when brandId references non-existent brand
- [x] Returns 400 when brandId belongs to different organization
- [x] Returns 200 with sensible defaults when Gemini returns malformed JSON
- [x] Returns 200 with defaults when Gemini API is unreachable (retry + fallback)
- [x] Returns 429 when generation rate limit is exceeded

#### Edge Cases

- [x] Handles description with only whitespace (trim + reject)
- [x] Handles description with special characters and unicode
- [x] Handles request without brandId (uses generic defaults, no brand context)
- [x] Handles concurrent requests from same user without race conditions
- [x] Gemini response with extra/unknown fields is gracefully handled (stripped)

#### Security

- [x] Endpoint requires authenticated Clerk session
- [x] Organization scoping: can only use brands from own org
- [x] Description input is sanitized before sending to Gemini prompt
- [x] Rate limiting enforced per organization (existing limits system)

#### Data Leak

- [x] Error responses don't expose Gemini API key or internal errors
- [x] Error responses don't expose organization IDs or brand details
- [x] Gemini prompt doesn't include other organizations' data

#### Data Damage

- [x] Endpoint is read-only (generates JSON, doesn't write to DB)
- [x] Malformed Gemini output doesn't corrupt fallback defaults
- [x] Rate limit counter is atomic (no double-counting)

### E2E Gate

```bash
# 1. Verify vitest runs
cd /Users/robroyhobbs/work/intentmail && npx vitest run --reporter=verbose 2>&1 | tail -20

# 2. Verify the generate endpoint schema (requires dev server running)
# Start dev server, then:
curl -s -X POST http://localhost:3000/api/v1/intents/generate \
  -H "Content-Type: application/json" \
  -d '{"description": "Welcome email for new trial signups"}' \
  | node -e "
    const j = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const required = ['name','slug','purpose','tone','urgency','subjectDefault','templateId','slots','ctaStyle'];
    const missing = required.filter(k => !(k in j));
    if (missing.length) { console.error('Missing:', missing); process.exit(1); }
    console.log('All required fields present');
  "
```

### Acceptance Criteria

- [ ] `pnpm test` script added to package.json and vitest configured
- [ ] POST /api/v1/intents/generate endpoint exists and returns valid JSON
- [ ] Gemini prompt produces structured intent from one-line description
- [ ] Fallback to sensible defaults on AI failure
- [ ] Rate limiting integrated with existing limits system
- [ ] All 6 test categories pass
- [ ] Code committed

---

## Phase 1: Reusable UI Components (ChipSelector, TemplateCards, LivePreview)

### Description

Build the three reusable visual components that power the wizard's Step 2. These are standalone, testable UI primitives: `ChipSelector` (clickable chip groups for voice/urgency/CTA), `TemplateCards` (visual template picker), and `LivePreview` (structural email preview rendered in an iframe). No wizard integration yet — just the building blocks.

### Tests

#### Happy Path

- [ ] ChipSelector renders all provided options as clickable chips
- [ ] ChipSelector single-select mode: clicking a chip selects it and deselects others
- [ ] ChipSelector fires onChange with selected value on click
- [ ] ChipSelector shows visual selected state (checkmark or highlight)
- [ ] ChipSelector supports optional color prop per option (urgency colors)
- [ ] TemplateCards renders card for each of the 7 templates
- [ ] TemplateCards shows template name and slot count on each card
- [ ] TemplateCards fires onSelect with templateId when card is clicked
- [ ] TemplateCards shows selected state on active template
- [ ] LivePreview renders iframe with structural HTML content
- [ ] LivePreview shows slot placeholders as "[slot_id] prompt text"
- [ ] LivePreview renders subject line with actual value
- [ ] LivePreview renders CTA button with actual text and style
- [ ] LivePreview applies brand primary color to header/CTA
- [ ] LivePreview updates instantly when props change (no debounce)

#### Bad Path

- [ ] ChipSelector with empty options array renders nothing (no crash)
- [ ] ChipSelector with undefined value shows no selection
- [ ] TemplateCards with invalid templateId shows no selected card
- [ ] LivePreview with empty slots array renders template skeleton only
- [ ] LivePreview with missing brand colors uses default gray palette

#### Edge Cases

- [ ] ChipSelector with very long label text truncates gracefully
- [ ] TemplateCards responsive: wraps cards on narrow containers
- [ ] LivePreview on mobile viewport stacks below controls (CSS only)
- [ ] LivePreview iframe resizes correctly when container width changes
- [ ] ChipSelector keyboard accessible (Tab + Enter to select)

#### Security

- [ ] LivePreview iframe uses sandbox attribute to prevent script execution
- [ ] LivePreview srcDoc content is escaped (no XSS from slot prompts)
- [ ] Template card content comes from hardcoded templates only (no user HTML)

#### Data Leak

- [ ] LivePreview doesn't expose raw slot config objects in rendered HTML
- [ ] ChipSelector doesn't expose internal value mappings in DOM attributes

#### Data Damage

- [ ] ChipSelector onChange never fires with invalid/undefined value
- [ ] TemplateCards onSelect only fires with valid template IDs from the template registry

### E2E Gate

```bash
# Verify components render without errors
cd /Users/robroyhobbs/work/intentmail && npx vitest run --reporter=verbose src/components/intents/ 2>&1 | tail -30

# Verify component files exist with correct exports
node -e "
  const fs = require('fs');
  const files = [
    'src/components/intents/chip-selector.tsx',
    'src/components/intents/template-cards.tsx',
    'src/components/intents/live-preview.tsx'
  ];
  files.forEach(f => {
    if (!fs.existsSync(f)) { console.error('Missing:', f); process.exit(1); }
    console.log('OK:', f);
  });
"
```

### Acceptance Criteria

- [ ] ChipSelector component at `src/components/intents/chip-selector.tsx`
- [ ] TemplateCards component at `src/components/intents/template-cards.tsx`
- [ ] LivePreview component at `src/components/intents/live-preview.tsx`
- [ ] All components use existing Tailwind + Radix UI (no new dependencies)
- [ ] All 6 test categories pass
- [ ] Code committed

---

## Phase 2: Wizard Container + Step 1 (Describe)

### Description

Build the `IntentWizard` container that manages 2-step navigation and state, plus `WizardStepDescribe` — the first screen where users type one line and get AI-generated intent fields. Includes quick-start chips, loading animation, and graceful fallback on AI failure. Wire up the generate endpoint from Phase 0.

### Tests

#### Happy Path

- [ ] IntentWizard renders Step 1 by default (describe screen)
- [ ] Step 1 shows centered input field with "What kind of email?" prompt
- [ ] Step 1 shows quick-start chips: Welcome, Receipt, Password Reset, Trial Expiring, Invoice, Custom...
- [ ] Typing in input and pressing Enter triggers generation
- [ ] Clicking "Go" button triggers generation
- [ ] Clicking a quick-start chip fills input and auto-submits
- [ ] Loading state shows spinner with "Generating your intent..." text
- [ ] On successful generation, transitions to Step 2 with pre-filled data
- [ ] Step indicator shows "Step 1 of 2" with correct visual state

#### Bad Path

- [ ] Empty input submission is prevented (button disabled, Enter no-op)
- [ ] Network error during generation shows retry spinner, then loads Step 2 with defaults
- [ ] Gemini returns partial data — missing fields filled with sensible defaults
- [ ] Double-click on "Go" doesn't trigger duplicate API calls

#### Edge Cases

- [ ] Very long input text (500 chars) is accepted and sent to API
- [ ] Rapid chip clicks only trigger one API call (debounce/lock)
- [ ] Browser back button from Step 2 returns to Step 1 with previous input preserved
- [ ] "Custom..." chip focuses the input field instead of submitting

#### Security

- [ ] Input is sanitized before display (no XSS from pasted content)
- [ ] API call includes Clerk session cookie automatically (Next.js fetch)

#### Data Leak

- [ ] Loading state doesn't flash previous intent data
- [ ] Failed generation error message doesn't expose API details

#### Data Damage

- [ ] Navigation between steps preserves all form state
- [ ] Refreshing page on Step 1 resets cleanly (no stale state)

### E2E Gate

```bash
# Verify wizard component exists and renders
cd /Users/robroyhobbs/work/intentmail && npx vitest run --reporter=verbose src/components/intents/intent-wizard 2>&1 | tail -30

# Verify the new page route exists
node -e "
  const fs = require('fs');
  const files = [
    'src/components/intents/intent-wizard.tsx',
    'src/components/intents/wizard-step-describe.tsx'
  ];
  files.forEach(f => {
    if (!fs.existsSync(f)) { console.error('Missing:', f); process.exit(1); }
    console.log('OK:', f);
  });
"
```

### Acceptance Criteria

- [ ] IntentWizard container at `src/components/intents/intent-wizard.tsx`
- [ ] WizardStepDescribe at `src/components/intents/wizard-step-describe.tsx`
- [ ] Quick-start chips trigger AI generation
- [ ] Loading animation during Gemini call
- [ ] Graceful fallback to defaults on AI failure
- [ ] All 6 test categories pass
- [ ] Code committed

---

## Phase 3: Step 2 (Customize + Preview + Save) + Integration

### Description

Build `WizardStepCustomize` — the split-view screen with visual controls on the left (brand, voice, urgency, CTA, template chips) and live structural preview on the right. Wire up save (POST for create, PUT for edit). Replace old IntentForm entirely. Update `/dashboard/intents/new` and `/dashboard/intents/[id]` pages to use the new wizard. Support edit flow (skip Step 1, load directly into Step 2).

### Tests

#### Happy Path

- [ ] Step 2 shows split layout: controls left, preview right
- [ ] Brand dropdown shows all org brands + "No specific brand" option
- [ ] Voice chips render 5 options, selected one maps to correct tone string
- [ ] Urgency chips render 4 options with color coding (gray/blue/yellow/red)
- [ ] CTA Style chips render 3 options (Soft/Medium/Strong)
- [ ] Template cards render all 7 templates, clicking one switches slots
- [ ] Preview updates instantly on every control change
- [ ] "Create Intent" button saves via POST /api/v1/intents and redirects to list
- [ ] Success toast appears after save
- [ ] Edit mode: loads existing intent directly into Step 2
- [ ] Edit mode: button says "Save Changes", uses PUT
- [ ] Edit mode: back button is hidden (no Step 1)
- [ ] "Back" button returns to Step 1 (create mode only)
- [ ] Step indicator shows "Step 2 of 2"

#### Bad Path

- [ ] Save with missing required fields shows inline validation errors
- [ ] Save with duplicate slug shows error from API (409 conflict)
- [ ] Network error on save shows inline error, stays on Step 2
- [ ] Edit mode with invalid intent ID shows 404 / redirect
- [ ] Switching template clears slot data that doesn't match new template

#### Edge Cases

- [ ] Mobile viewport: preview stacks below controls
- [ ] Very long intent name wraps correctly in header
- [ ] Switching brand updates preview colors immediately
- [ ] Rapid template switching doesn't cause preview flicker
- [ ] Edit intent with deleted brand shows "No specific brand" selected
- [ ] Subject variants display in preview sidebar area

#### Security

- [ ] Save request includes Clerk session (authenticated)
- [ ] Cannot save intent for another organization
- [ ] Slot prompt content is escaped in preview iframe (no XSS)
- [ ] Brand dropdown only shows current org's brands

#### Data Leak

- [ ] Preview iframe doesn't expose raw JSON state
- [ ] Error messages from save don't expose internal IDs or stack traces

#### Data Damage

- [ ] Save is atomic: either all fields persist or none
- [ ] Edit mode doesn't wipe fields that aren't displayed in wizard (e.g., generationConstraints preserved)
- [ ] Template switch initializes new slots from template defaults (doesn't leave orphaned slots)
- [ ] Old IntentForm component removed cleanly (no dead imports)

### E2E Gate

```bash
# Verify all wizard files exist
cd /Users/robroyhobbs/work/intentmail && node -e "
  const fs = require('fs');
  const files = [
    'src/components/intents/intent-wizard.tsx',
    'src/components/intents/wizard-step-describe.tsx',
    'src/components/intents/wizard-step-customize.tsx',
    'src/components/intents/chip-selector.tsx',
    'src/components/intents/template-cards.tsx',
    'src/components/intents/live-preview.tsx'
  ];
  const missing = files.filter(f => !fs.existsSync(f));
  if (missing.length) { console.error('Missing:', missing); process.exit(1); }
  console.log('All wizard files present');
"

# Verify old form is removed
node -e "
  const fs = require('fs');
  if (fs.existsSync('src/components/intents/intent-form.tsx')) {
    console.error('intent-form.tsx should be deleted');
    process.exit(1);
  }
  console.log('Old form removed');
"

# Verify build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -20

# Run all tests
npx vitest run --reporter=verbose 2>&1 | tail -30
```

### Acceptance Criteria

- [ ] WizardStepCustomize at `src/components/intents/wizard-step-customize.tsx`
- [ ] Split layout: controls left, preview right (stacked on mobile)
- [ ] All chip selectors wired up (voice, urgency, CTA style)
- [ ] Template cards switch templates and reinitialize slots
- [ ] Live structural preview updates on every change
- [ ] Create flow: POST + redirect + toast
- [ ] Edit flow: loads Step 2 directly, PUT + redirect + toast
- [ ] Old IntentForm deleted
- [ ] `/dashboard/intents/new` page uses IntentWizard
- [ ] `/dashboard/intents/[id]` page uses IntentWizard in edit mode
- [ ] Build passes with no errors
- [ ] All 6 test categories pass
- [ ] Code committed

---

## Final E2E Verification

```bash
# Full build
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -20

# All tests pass
npx vitest run --reporter=verbose

# Verify all wizard files exist, old form removed
node -e "
  const fs = require('fs');
  const required = [
    'src/components/intents/intent-wizard.tsx',
    'src/components/intents/wizard-step-describe.tsx',
    'src/components/intents/wizard-step-customize.tsx',
    'src/components/intents/chip-selector.tsx',
    'src/components/intents/template-cards.tsx',
    'src/components/intents/live-preview.tsx',
    'src/app/api/v1/intents/generate/route.ts'
  ];
  const deleted = ['src/components/intents/intent-form.tsx'];

  required.forEach(f => {
    if (!fs.existsSync(f)) { console.error('MISSING:', f); process.exit(1); }
  });
  deleted.forEach(f => {
    if (fs.existsSync(f)) { console.error('SHOULD BE DELETED:', f); process.exit(1); }
  });
  console.log('All checks passed');
"

# Verify generate endpoint responds
curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/v1/intents/generate
```

## Risk Mitigation

| Risk                               | Mitigation                                            | Contingency                                               |
| ---------------------------------- | ----------------------------------------------------- | --------------------------------------------------------- |
| Gemini API latency (2-5s)          | Loading animation with engaging text                  | Fallback to sensible defaults after retry                 |
| Gemini output quality varies       | Strict JSON schema validation via Zod                 | Merge AI output with defaults for missing fields          |
| Mobile layout complexity           | CSS-first approach (flexbox/grid), test at 375px      | Stack preview below controls, collapse to single column   |
| Preview feels too "structural"     | Clear slot labels with "[slot_name] prompt text"      | Acceptable for MVP, can add AI rendering later            |
| Removing old form breaks edit flow | Edit mode tested explicitly in Phase 3                | Keep old form as backup until Phase 3 E2E passes          |
| No existing test runner            | Configure vitest in Phase 0 before any component work | Can fall back to build-only verification if vitest issues |

## References

- [Intent](./INTENT.md)
- [Template System](../../src/lib/email/templates/slots.ts)
- [Existing Gemini Integration](../../src/lib/ai/gemini.ts)
- [Existing Intent API](../../src/app/api/v1/intents/)
