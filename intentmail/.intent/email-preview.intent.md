# Email Preview + Test Send

## Overview

Add email preview and test send capability to the intent detail page. Users can see a rendered preview of their email template with sample data in an iframe, and send a test email to their own address.

## Responsibilities

**Does:**
- Renders email HTML from intent + brand using existing renderer
- Displays preview in an iframe on the intent detail page
- Allows sending test email to the authenticated user's email
- Uses sample/default data for template variables
- Skips AI generation in preview (uses static fallbacks)

**Does not:**
- Create new API routes (server actions only)
- Duplicate rendering logic (reuses existing renderer.ts)
- Allow sending to arbitrary email addresses
- Add template editing UI or visual builder

## Structure

```
Intent Detail Page (/dashboard/intents/[id])
├── Existing IntentForm component
├── [NEW] Preview Section
│   ├── Preview iframe (server-rendered HTML)
│   ├── Brand selector (if multiple brands)
│   ├── Sample data inputs (firstName, productName)
│   └── Refresh preview button
└── [NEW] Test Send Section
    ├── Send Test button
    └── Status feedback (success/error message)

Server Actions (inline in page):
├── generatePreview(intentId, brandId, sampleData) → HTML string
└── sendTestEmail(intentId, brandId, sampleData) → success/error
```

## API

### Server Action: generatePreview
```typescript
async function generatePreview(formData: FormData): Promise<string> {
  // Loads intent + brand from DB
  // Generates slot content with static fallbacks (no AI)
  // Returns renderFullEmail() HTML string
}
```

### Server Action: sendTestEmail
```typescript
async function sendTestEmail(formData: FormData): Promise<void> {
  // Uses existing sendEmail() with user's email as recipient
  // Adds [TEST] prefix to subject
  // Redirects with success/error param
}
```

## Constraints

- Preview iframe uses srcdoc attribute (no separate route needed)
- All rendering reuses existing renderer.ts functions
- Sample data defaults: firstName="Alice", productName="YourProduct"
- Test send uses the org's default or selected provider
- Test send respects rate limits but does NOT count against monthly quota
- Preview section only visible when intent has a valid templateId

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Preview location | Intent detail page | Natural place to preview, no new routes |
| Rendering | Server-rendered iframe (srcdoc) | Uses existing renderer, accurate output |
| Test target | Current user's email | Simple, secure, no abuse potential |
| AI generation | Skip in preview | Speed + no quota consumption |
