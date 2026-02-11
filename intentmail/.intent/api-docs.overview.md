# IntentMail API Docs: Developer documentation for the email API

## One sentence

In-app developer docs at /docs/\* with quickstart guide and full API reference for all 22 endpoints.

## Why?

The landing page links to /docs but nothing exists there. Developers need to understand auth, send their first email, and reference all endpoints to integrate IntentMail.

## Core experience

```
Developer clicks "View Documentation" on landing page
    ↓
/docs → Quickstart: send first email in 5 minutes
    ↓
/docs/api-reference → Auth, rate limits, error format
    ↓
/docs/api-reference/send → The main endpoint (detailed)
    ↓
/docs/api-reference/brands|intents|providers|api-keys → CRUD reference
```

## Architecture

```
src/app/(marketing)/docs/
├── layout.tsx              ← Sidebar + content area (server component)
├── _components.tsx         ← Shared helpers (CodeBlock, ParamTable, etc.)
├── _sidebar-toggle.tsx     ← Mobile sidebar toggle (client component)
├── page.tsx                ← Quickstart guide
└── api-reference/
    ├── page.tsx            ← Overview (auth, errors, rate limits)
    ├── send/page.tsx       ← POST /emails/send
    ├── brands/page.tsx     ← Brands CRUD (5 endpoints)      [Phase 2]
    ├── intents/page.tsx    ← Intents CRUD (5 endpoints)      [Phase 2]
    ├── providers/page.tsx  ← Providers CRUD (6 endpoints)    [Phase 2]
    └── api-keys/page.tsx   ← API Keys CRUD (5 endpoints)     [Phase 2]
```

Phase 1: 6 files (critical path). Phase 2: +4 CRUD pages. No new dependencies.

## Key decisions

| Question  | Choice                     | Why                                           |
| --------- | -------------------------- | --------------------------------------------- |
| Where?    | In-app /docs/\*            | Matches existing nav link, no separate deploy |
| Scope?    | Quickstart + API reference | Covers 80% of developer needs                 |
| Examples? | curl + TypeScript          | Primary audience = Node/TS devs               |
| Styling?  | CSS-only code blocks       | No syntax highlight library needed            |

## Scope

**In:** Quickstart, API reference (all 22 endpoints), curl + TS examples, sidebar nav
**Out:** Search, versioning, SDK docs, concepts guides, interactive playground

## Next steps

1. ~~`/intent-critique`~~ ✓ Done (3 fixes: shared components, phased scope, client sidebar toggle)
2. ~~`/intent-plan`~~ ✓ Done (4 phases: foundation, quickstart, API ref + send, CRUD pages)
3. ~~`/intent-build-now`~~ ✓ Done (10 files, ~1,500 lines, all pages return 200, build passes)
4. ~~`/intent-sync`~~ ✓ Done (implementation details synced back to intent)
