# Email Preview + Test Send

> Preview rendered emails and send test emails from the intent detail page.

## Problem
Users create intents with template + slot configurations but can't see what the final email looks like without actually sending it.

## Solution
Add a preview section to the intent detail page that renders the email in an iframe using the existing renderer, plus a button to send a test email to the user's own address.

## Architecture
```
Intent Detail Page
  └── Preview Section (new)
        ├── iframe (srcdoc = server-rendered HTML)
        ├── Brand selector dropdown
        ├── Sample data inputs
        ├── Refresh Preview button
        └── Send Test Email button → uses sendEmail() → user's Clerk email
```

## Scope
- In: Preview iframe, brand selector, sample data, test send to self
- Out: Custom email input, template editor, AI generation in preview
