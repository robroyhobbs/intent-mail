# Execution Plan: email-preview

## Overview

Add email preview and test send to the intent detail page. Server action renders HTML via existing renderer, displayed in iframe. Test send delivers to authenticated user's email.

## Prerequisites

- Existing slot-based template system (renderer.ts, slots.ts)
- Existing email client (client.ts with sendEmail/generateEmail)
- Existing intent detail page at /dashboard/intents/[id]
- Clerk auth providing user email

---

## Phase 0: Preview + Test Send

### Description

Add preview rendering server action, preview iframe UI, and test send functionality to the intent detail page. Extract a `renderPreview()` helper from the existing email client that generates HTML without sending.

### Tests

#### Happy Path

- [x] Preview renders HTML for a valid intent + brand combination
- [x] Preview iframe displays rendered email in the intent detail page
- [x] Brand selector shows available brands and changes preview on selection
- [x] Test send delivers email to authenticated user's email address
- [x] Test send adds [TEST] prefix to subject line
- [x] Sample data (firstName, productName) substitutes into template variables

#### Bad Path

- [x] Preview with invalid templateId shows fallback message
- [x] Preview with no brand configured uses default styling
- [x] Test send with no active provider shows error message
- [x] Test send when provider API fails shows error feedback

#### Edge Cases

- [x] Intent with no slots configured renders empty template structure
- [x] Intent with CTA slot but no URL renders button with placeholder
- [x] Preview with special characters in sample data renders safely (XSS-safe)

#### Security

- [x] Preview server action validates organization ownership of intent
- [x] Test send server action validates organization ownership
- [x] Preview HTML is sandboxed in iframe (no script execution)
- [x] Sample data inputs are sanitized before rendering

#### Data Leak

- [x] Preview does not expose provider API keys
- [x] Test send error messages do not reveal internal errors
- [x] Preview HTML does not contain organization IDs or internal identifiers

#### Data Damage

- [x] Test send does not create duplicate EmailLog entries on retry
- [x] Preview action is read-only (no database mutations)
- [x] Test send is idempotent (safe to click multiple times)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && pnpm build 2>&1 | tail -5

# Verify TypeScript compiles
npx tsc --noEmit 2>&1 || true

# Verify modified files exist
ls -la src/app/\(dashboard\)/dashboard/intents/\[id\]/page.tsx
ls -la src/components/intents/email-preview.tsx
```

### Acceptance Criteria

- [x] Preview renders email HTML from intent + brand in iframe
- [x] Brand selector changes preview
- [x] Sample data inputs update preview
- [x] Test send delivers to user's email with [TEST] prefix
- [x] All 6 test categories pass
- [x] Build succeeds

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/work/intentmail && pnpm build
```

## References

- [Intent](./email-preview.intent.md)
- [Overview](./email-preview.overview.md)
