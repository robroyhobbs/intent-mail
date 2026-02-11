# IntentMail API Documentation Specification

## 1. Overview

- **Product:** IntentMail developer documentation
- **Deliverable:** In-app docs at `/docs/*` routes inside the Next.js app
- **Priority:** P1 — critical for developer adoption
- **Target User:** Developers integrating IntentMail's email API into their apps
- **Scope:** Quickstart guide + full API reference with curl & TypeScript examples
- **Existing:** Landing page nav already links to `/docs`

## 2. Architecture

- **Location:** `src/app/(marketing)/docs/` (inside marketing route group, public)
- **Format:** Next.js pages (server components, 1 client component for sidebar toggle)
- **Styling:** Same Tailwind + shadcn/ui as landing page
- **Layout:** Sidebar navigation + main content area
- **Code blocks:** Dark-themed with copy button, syntax-colored via CSS classes
- **No new dependencies**

### Route Structure

```
/docs                     → Quickstart (default landing)
/docs/quickstart          → Quickstart guide (redirect from /docs)
/docs/api-reference       → API reference overview + auth
/docs/api-reference/send  → POST /api/v1/emails/send (the main endpoint)
/docs/api-reference/brands    → Brands CRUD
/docs/api-reference/intents   → Intents CRUD
/docs/api-reference/providers → Providers CRUD
/docs/api-reference/api-keys  → API Keys CRUD
```

## 3. Page Content

### 3.1 Docs Layout (`/docs/layout.tsx`)

Shared layout with:

- Left sidebar (240px): navigation links for all doc pages
- Main content area: rendered page content
- Sticky sidebar on desktop, collapsible on mobile via `DocsSidebarToggle` client component
- Dark nav header inherited from marketing layout
- Breadcrumb trail
- (CRITIQUE: mobile sidebar toggle requires `'use client'` — extract as small client component, layout stays server component)

### 3.2 Quickstart (`/docs/page.tsx`)

**Goal:** Send first email in under 5 minutes.

Sections:

1. **Overview** — What IntentMail does in 2 sentences
2. **Step 1: Create Account** — Sign up, create org
3. **Step 2: Get API Key** — Dashboard → API Keys → Create
4. **Step 3: Configure Provider** — Dashboard → Providers → Add (Resend example)
5. **Step 4: Create Your First Intent** — Dashboard → Intents → Create (onboarding.welcome)
6. **Step 5: Send an Email** — curl + TypeScript examples
7. **What's Next** — Links to API reference, brand configuration

Code examples at Step 5:

```bash
curl -X POST https://your-app.com/api/v1/emails/send \
  -H "Authorization: Bearer im_live_..." \
  -H "Content-Type: application/json" \
  -d '{
    "intent": "onboarding.welcome",
    "to": "user@example.com",
    "data": {
      "firstName": "Sarah",
      "dashboardUrl": "https://app.example.com/dash"
    }
  }'
```

```typescript
const response = await fetch("https://your-app.com/api/v1/emails/send", {
  method: "POST",
  headers: {
    Authorization: "Bearer im_live_...",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    intent: "onboarding.welcome",
    to: "user@example.com",
    data: {
      firstName: "Sarah",
      dashboardUrl: "https://app.example.com/dash",
    },
  }),
});

const { data } = await response.json();
console.log(data.messageId); // Provider message ID
```

### 3.3 API Reference Overview (`/docs/api-reference/page.tsx`)

Sections:

1. **Base URL** — `https://your-app.com/api/v1`
2. **Authentication** — Bearer token, API key creation, scopes
3. **Rate Limiting** — Plan-based limits, X-RateLimit headers
4. **Error Format** — Standard error response shape with codes
5. **Endpoints Overview** — Table of all endpoints with methods

Error format:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded",
    "details": {}
  }
}
```

Error codes table:
| Code | Status | Description |
|------|--------|-------------|
| UNAUTHORIZED | 401 | Invalid or missing API key |
| FORBIDDEN | 403 | API key lacks required scope |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Request rate exceeded |
| QUOTA_EXCEEDED | 429 | Monthly email quota exceeded |
| VALIDATION_ERROR | 400 | Invalid request data |
| SEND_FAILED | 500 | Provider delivery failure |
| INTERNAL_ERROR | 500 | Unexpected server error |

### 3.4 Send Email (`/docs/api-reference/send/page.tsx`)

The most important endpoint page. Sections:

1. **Endpoint** — `POST /api/v1/emails/send`
2. **Authentication** — Bearer token with `email:send` scope
3. **Request Body** — All fields with types, required/optional, descriptions
4. **Response** — Success and error shapes
5. **Examples** — curl + TypeScript for minimal and full requests
6. **Rate Limit Headers** — X-RateLimit-Limit, Remaining, Reset

### 3.5 Brands CRUD (`/docs/api-reference/brands/page.tsx`)

All 5 endpoints:

- POST /api/v1/brands — Create
- GET /api/v1/brands — List
- GET /api/v1/brands/:id — Get
- PUT /api/v1/brands/:id — Update
- DELETE /api/v1/brands/:id — Delete

Each with: method, URL, auth, request body, response, example.

### 3.6 Intents CRUD (`/docs/api-reference/intents/page.tsx`)

All 5 endpoints (same pattern as brands).

### 3.7 Providers CRUD (`/docs/api-reference/providers/page.tsx`)

All 5 endpoints + POST /test.

### 3.8 API Keys CRUD (`/docs/api-reference/api-keys/page.tsx`)

All 5 endpoints (POST, GET list, GET by id, PATCH, DELETE).

## 4. Visual Design

- **Sidebar:** slate-50 background, blue-500 active link highlight
- **Code blocks:** slate-950 background, 13px monospace, copy button top-right
- **Parameters tables:** Striped rows, clear type annotations
- **Badges:** GET = green, POST = blue, PUT = amber, DELETE = red, PATCH = purple
- **Typography:** Same as landing page
- **Responsive:** Sidebar collapses to hamburger menu on mobile

## 5. Reusable Components

Shared component file at `src/app/(marketing)/docs/_components.tsx`:

- **CodeBlock** — Dark code container with language label and copy functionality
- **EndpointHeader** — Method badge + path + description
- **ParamTable** — Parameter name, type, required, description
- **ResponseBlock** — Success/error response examples

All 4 helpers in one co-located file, imported by all API reference pages. Avoids duplicating ~80 lines across 6 pages.

(CRITIQUE: extracted from inline-per-page to shared file — DRY without over-abstracting)

## 6. Decisions Summary

| Decision            | Choice                                 | Rationale                                     |
| ------------------- | -------------------------------------- | --------------------------------------------- |
| Location            | In-app Next.js routes                  | No extra deployment, matches nav link         |
| Format              | Server components + 1 client component | Fast, minimal client JS (sidebar toggle only) |
| Sidebar             | Fixed left sidebar                     | Standard docs UX, easy navigation             |
| Code examples       | curl + TypeScript                      | Primary audience is TS/Node developers        |
| Syntax highlighting | CSS classes (no library)               | Consistent with landing page approach         |
| Layout              | Shared docs layout.tsx                 | Consistent nav across all docs pages          |

## 7. MVP Scope

### Phase 1 (MVP) — Critical Path

- Shared docs layout with sidebar navigation + `DocsSidebarToggle` client component
- Shared `_components.tsx` (CodeBlock, EndpointHeader, ParamTable, ResponseBlock)
- Quickstart guide (5-step)
- API reference overview (auth, rate limits, errors, endpoints table)
- Send email endpoint (detailed, curl + TypeScript examples)

### Phase 2 — CRUD Reference Pages

- Brands CRUD (5 endpoints)
- Intents CRUD (5 endpoints)
- Providers CRUD (6 endpoints)
- API Keys CRUD (5 endpoints)
- curl + TypeScript examples for each

(CRITIQUE: phased to ship the critical path first — send endpoint is 90% of what developers need to get started)

### Excluded

- Full-text search
- Versioned docs
- SDK/library documentation
- Concepts/guides (brand config guide, template system guide)
- Webhook integration guide
- Interactive API playground
- Dark mode toggle for docs

## 8. Risks

| Risk                                | Mitigation                              |
| ----------------------------------- | --------------------------------------- |
| Many pages = lots of repetitive JSX | Use consistent patterns, inline helpers |
| Docs get stale as API changes       | Docs reference same types as codebase   |
| Large total LOC across 8 pages      | Each page is independent, manageable    |

## 9. Open Items

- None — implementation complete

## 10. Finalized Implementation Details

> Synced on: 2026-02-10
> Status: IMPLEMENTED

### Files Created

| File                                                        | Lines | Type   | Purpose                                              |
| ----------------------------------------------------------- | ----- | ------ | ---------------------------------------------------- |
| `src/app/(marketing)/docs/layout.tsx`                       | 95    | Server | Sidebar nav + header + content area                  |
| `src/app/(marketing)/docs/page.tsx`                         | 170   | Server | Quickstart guide (5 steps)                           |
| `src/app/(marketing)/docs/_components.tsx`                  | 162   | Client | CodeBlock, EndpointHeader, ParamTable, ResponseBlock |
| `src/app/(marketing)/docs/_sidebar-toggle.tsx`              | 34    | Client | Mobile hamburger sidebar toggle                      |
| `src/app/(marketing)/docs/api-reference/page.tsx`           | 197   | Server | Auth, rate limits, errors, 22-endpoint table         |
| `src/app/(marketing)/docs/api-reference/send/page.tsx`      | 206   | Server | POST /api/v1/emails/send (detailed)                  |
| `src/app/(marketing)/docs/api-reference/brands/page.tsx`    | 143   | Server | Brands CRUD (5 endpoints)                            |
| `src/app/(marketing)/docs/api-reference/intents/page.tsx`   | 145   | Server | Intents CRUD (5 endpoints)                           |
| `src/app/(marketing)/docs/api-reference/providers/page.tsx` | 179   | Server | Providers CRUD (6 endpoints)                         |
| `src/app/(marketing)/docs/api-reference/api-keys/page.tsx`  | 169   | Server | API Keys CRUD (5 endpoints)                          |

**Total:** 10 files, ~1,500 lines. 8 server components, 2 client components.

### Shared Component Exports (`_components.tsx`)

| Component        | Props                                                   | Usage                             |
| ---------------- | ------------------------------------------------------- | --------------------------------- |
| `CodeBlock`      | `{ code: string, language: string }`                    | Dark code block with copy button  |
| `EndpointHeader` | `{ method: string, path: string, description: string }` | Method badge + path + description |
| `ParamTable`     | `{ params: { name, type, required, description }[] }`   | Striped parameter table           |
| `ResponseBlock`  | `{ success: string, error?: string }`                   | Success/error JSON examples       |

### Design Tokens Used

| Token         | Value                                        | Usage                        |
| ------------- | -------------------------------------------- | ---------------------------- |
| Heading text  | `text-slate-900`                             | H1, H2, H3                   |
| Body text     | `text-slate-600`                             | Paragraphs, descriptions     |
| Code block bg | `bg-slate-950`                               | All code containers          |
| Code text     | `text-slate-300`, `text-[13px]`              | Code content                 |
| Link color    | `text-blue-600 hover:text-blue-500`          | Navigation, cross-references |
| Inline code   | `rounded bg-slate-100 px-1.5 py-0.5 text-sm` | Inline code spans            |
| Sidebar bg    | `bg-slate-50`                                | Left sidebar background      |
| Active link   | `hover:text-blue-600`                        | Sidebar active state         |
| Header bg     | `bg-slate-950/80 backdrop-blur-xl`           | Sticky dark header           |

### Method Badge Colors (Confirmed)

| Method | Classes                                                 |
| ------ | ------------------------------------------------------- |
| GET    | `bg-emerald-500/10 text-emerald-700 border-emerald-200` |
| POST   | `bg-blue-500/10 text-blue-700 border-blue-200`          |
| PUT    | `bg-amber-500/10 text-amber-700 border-amber-200`       |
| PATCH  | `bg-purple-500/10 text-purple-700 border-purple-200`    |
| DELETE | `bg-red-500/10 text-red-700 border-red-200`             |

### Alert Box Patterns (New)

| Type    | Classes                                       | Usage                  |
| ------- | --------------------------------------------- | ---------------------- |
| Warning | `border-amber-200 bg-amber-50 text-amber-800` | API key security notes |
| Danger  | `border-red-200 bg-red-50 text-red-800`       | Delete warnings        |
| Info    | `border-blue-200 bg-blue-50 text-blue-800`    | Parameter notes        |

### Navigation Structure

Sidebar nav uses `navItems` array with nested children:

- Quickstart (`/docs`)
- API Reference (`/docs/api-reference`)
  - Send Email (`/docs/api-reference/send`)
  - Brands (`/docs/api-reference/brands`)
  - Intents (`/docs/api-reference/intents`)
  - Providers (`/docs/api-reference/providers`)
  - API Keys (`/docs/api-reference/api-keys`)

### Key Decisions Confirmed

| Decision               | Final Choice                         | Rationale                               |
| ---------------------- | ------------------------------------ | --------------------------------------- |
| Component location     | `_components.tsx` (shared)           | DRY — used by all 6 API reference pages |
| Client components      | 2 only (components + sidebar toggle) | Minimal client JS                       |
| Static prerendering    | All pages marked `○` in build        | Fast, no server rendering needed        |
| Sidebar responsiveness | Fixed on desktop, toggle on mobile   | `lg:` breakpoint with backdrop overlay  |
| Code examples          | curl + TypeScript per endpoint       | Matches target audience                 |
| Alert patterns         | 3 variants (amber/red/blue)          | Consistent visual language for warnings |
| PATCH vs PUT           | API Keys uses PATCH, others use PUT  | Matches actual route implementation     |
