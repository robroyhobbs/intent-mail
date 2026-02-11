# Execution Plan: api-docs

## Overview

Build in-app developer documentation at `/docs/*` routes inside the Next.js marketing route group. Phase 0-2 delivers the critical path (layout, quickstart, API reference overview, send endpoint). Phase 3 adds CRUD reference pages for brands, intents, providers, and API keys.

## Prerequisites

- Landing page implemented (status: done)
- Marketing route group exists at `src/app/(marketing)/`
- All 22 API endpoints are functional
- shadcn/ui components available (Button, Badge)
- lucide-react icons installed

## Phase 0: Foundation — Layout, Shared Components, Sidebar Toggle

### Description

Create the docs infrastructure: shared layout with sidebar navigation, reusable documentation components (CodeBlock, EndpointHeader, ParamTable, ResponseBlock), and a client-side sidebar toggle for mobile. This phase produces no visible docs pages yet — just the scaffolding.

### Files

- `src/app/(marketing)/docs/layout.tsx` — Sidebar + content area (server component)
- `src/app/(marketing)/docs/_components.tsx` — Shared doc helpers
- `src/app/(marketing)/docs/_sidebar-toggle.tsx` — Mobile sidebar toggle (`'use client'`)

### Tests

#### Happy Path
- [ ] Docs layout renders sidebar and content area
- [ ] Sidebar shows all navigation links (Quickstart, API Reference, Send, Brands, Intents, Providers, API Keys)
- [ ] Active link is highlighted with blue-500
- [ ] Breadcrumb trail renders correctly for nested routes
- [ ] CodeBlock renders dark code container with language label
- [ ] CodeBlock copy button copies content to clipboard
- [ ] EndpointHeader renders method badge (GET=green, POST=blue, PUT=amber, DELETE=red, PATCH=purple) + path
- [ ] ParamTable renders rows with name, type, required badge, description
- [ ] ResponseBlock renders success and error JSON examples

#### Bad Path
- [ ] Layout handles missing children gracefully
- [ ] CodeBlock handles empty code string
- [ ] ParamTable handles empty params array
- [ ] EndpointHeader handles unknown HTTP method

#### Edge Cases
- [ ] Sidebar scrolls independently when content exceeds viewport
- [ ] Layout works when sidebar toggle state changes rapidly
- [ ] CodeBlock handles very long lines (horizontal scroll, no wrap break)
- [ ] ParamTable handles params with very long descriptions

#### Security
- [ ] CodeBlock escapes HTML in code content (no XSS via examples)
- [ ] No user-controlled content rendered as dangerouslySetInnerHTML

#### Data Leak
- [ ] No internal paths or secrets in component source
- [ ] Error states don't expose component internals

#### Data Damage
- [ ] N/A for static components — no data mutations

### E2E Gate

```bash
# Verify layout file exists and compiles
cd /Users/robroyhobbs/work/intentmail
npx next build 2>&1 | tail -20

# Verify route is accessible (dev server)
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs
# Expected: 200 (or 404 until page.tsx exists — layout alone won't serve)
```

### Acceptance Criteria

- [ ] `layout.tsx` renders sidebar (240px, slate-50 bg) + main content area
- [ ] Sidebar is sticky on desktop, toggleable via hamburger on mobile
- [ ] `_components.tsx` exports CodeBlock, EndpointHeader, ParamTable, ResponseBlock
- [ ] `_sidebar-toggle.tsx` is the only `'use client'` component
- [ ] All method badges use correct colors
- [ ] Build passes with no errors

---

## Phase 1: Quickstart Guide

### Description

Create the docs landing page at `/docs` — a 5-step quickstart guide that gets developers from zero to sending their first email. This is the first page developers see when clicking "View Documentation" from the landing page.

### Files

- `src/app/(marketing)/docs/page.tsx` — Quickstart guide

### Tests

#### Happy Path
- [ ] Page renders at `/docs` route
- [ ] Shows 5 numbered steps: Create Account → Get API Key → Configure Provider → Create Intent → Send Email
- [ ] curl code example renders in CodeBlock with bash language label
- [ ] TypeScript code example renders in CodeBlock with typescript language label
- [ ] "What's Next" section contains links to `/docs/api-reference` and brand configuration
- [ ] Page title and meta description are set

#### Bad Path
- [ ] Page handles missing layout gracefully (renders standalone if accessed directly)

#### Edge Cases
- [ ] Code blocks maintain formatting on narrow viewports (horizontal scroll)
- [ ] Step numbering displays correctly with different screen widths
- [ ] Long URLs in code examples don't break layout

#### Security
- [ ] Example API keys use placeholder format (`im_live_...`), never real keys
- [ ] Example URLs use `your-app.com`, not production domains

#### Data Leak
- [ ] No real API keys, org IDs, or internal URLs in examples
- [ ] Example email addresses use `user@example.com` (RFC 2606 compliant)

#### Data Damage
- [ ] N/A — static page, no mutations

### E2E Gate

```bash
# Verify page serves correctly
curl -s http://localhost:3000/docs | grep -c "Quickstart"
# Expected: >= 1

# Verify curl example is present
curl -s http://localhost:3000/docs | grep -c "emails/send"
# Expected: >= 1

# Verify navigation from landing page works
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs
# Expected: 200
```

### Acceptance Criteria

- [ ] `/docs` returns 200 and renders quickstart guide
- [ ] All 5 steps are visible and numbered
- [ ] curl + TypeScript examples present with correct syntax coloring
- [ ] Links to API reference work
- [ ] Page renders within docs layout with sidebar

---

## Phase 2: API Reference Overview + Send Endpoint

### Description

Create the API reference overview page (auth, rate limits, errors, endpoints table) and the send email endpoint page (the most important API endpoint). These two pages together give developers everything they need to integrate.

### Files

- `src/app/(marketing)/docs/api-reference/page.tsx` — API reference overview
- `src/app/(marketing)/docs/api-reference/send/page.tsx` — POST /api/v1/emails/send

### Tests

#### Happy Path
- [ ] API reference overview renders at `/docs/api-reference`
- [ ] Base URL section shows `https://your-app.com/api/v1`
- [ ] Authentication section explains Bearer token and API key creation
- [ ] Rate limiting section documents X-RateLimit headers
- [ ] Error format section shows standard error response JSON
- [ ] Error codes table lists all 8 codes: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, QUOTA_EXCEEDED, VALIDATION_ERROR, SEND_FAILED, INTERNAL_ERROR
- [ ] Endpoints overview table lists all 22 endpoints with methods
- [ ] Send endpoint page renders at `/docs/api-reference/send`
- [ ] Send page shows POST method badge + `/api/v1/emails/send` path
- [ ] Request body table documents all fields: to (required), intent/intentId, brandId, data, subject, tags, metadata, scheduledFor
- [ ] Response section shows success shape (`{ data: { messageId, subject, to, status } }`)
- [ ] curl + TypeScript examples for both minimal and full requests
- [ ] Rate limit headers section documents X-RateLimit-Limit, Remaining, Reset

#### Bad Path
- [ ] Endpoints table handles missing method gracefully
- [ ] Send page handles rendering without parent layout

#### Edge Cases
- [ ] Error codes table aligns properly on narrow screens
- [ ] Endpoints overview table scrolls horizontally on mobile
- [ ] Long endpoint paths don't break table layout
- [ ] Both minimal (3 fields) and full (all fields) request examples shown

#### Security
- [ ] Authentication section warns about keeping API keys secret
- [ ] Example responses don't contain real organization IDs
- [ ] Scope requirements clearly documented for send endpoint (`email:send`)

#### Data Leak
- [ ] Error format examples use generic messages, no real stack traces
- [ ] Rate limit section doesn't reveal exact infrastructure details
- [ ] No real API keys in any example

#### Data Damage
- [ ] N/A — static pages, no mutations

### E2E Gate

```bash
# Verify API reference overview
curl -s http://localhost:3000/docs/api-reference | grep -c "Authentication"
# Expected: >= 1

# Verify error codes table
curl -s http://localhost:3000/docs/api-reference | grep -c "RATE_LIMITED"
# Expected: >= 1

# Verify send endpoint page
curl -s http://localhost:3000/docs/api-reference/send | grep -c "emails/send"
# Expected: >= 1

# Verify send page has request body docs
curl -s http://localhost:3000/docs/api-reference/send | grep -c "intent"
# Expected: >= 1

# Both pages return 200
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/api-reference
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/api-reference/send
# Expected: 200, 200
```

### Acceptance Criteria

- [ ] `/docs/api-reference` returns 200 with auth, rate limits, errors, endpoints table
- [ ] `/docs/api-reference/send` returns 200 with full send endpoint documentation
- [ ] All 8 error codes documented with status codes and descriptions
- [ ] Send endpoint documents all request fields with types and required/optional
- [ ] Both minimal and full request examples in curl + TypeScript
- [ ] Sidebar highlights correct active page
- [ ] Build passes

---

## Phase 3: CRUD Reference Pages

### Description

Add the 4 CRUD reference pages for Brands (5 endpoints), Intents (5 endpoints), Providers (6 endpoints), and API Keys (5 endpoints). Each page follows the same pattern: list of endpoints, each with method badge, path, auth, request body, response, and example.

### Files

- `src/app/(marketing)/docs/api-reference/brands/page.tsx` — Brands CRUD (5 endpoints)
- `src/app/(marketing)/docs/api-reference/intents/page.tsx` — Intents CRUD (5 endpoints)
- `src/app/(marketing)/docs/api-reference/providers/page.tsx` — Providers CRUD (6 endpoints)
- `src/app/(marketing)/docs/api-reference/api-keys/page.tsx` — API Keys CRUD (5 endpoints)

### Tests

#### Happy Path
- [ ] Brands page renders all 5 endpoints: POST, GET list, GET by id, PUT, DELETE
- [ ] Intents page renders all 5 endpoints: POST, GET list, GET by id, PUT, DELETE
- [ ] Providers page renders all 6 endpoints: POST, GET list, GET by id, PUT, DELETE, POST /test
- [ ] API Keys page renders all 5 endpoints: POST, GET list, GET by id, PATCH, DELETE
- [ ] Each endpoint shows method badge + path via EndpointHeader
- [ ] Each endpoint shows auth requirements
- [ ] Each endpoint shows request body (where applicable) via ParamTable
- [ ] Each endpoint shows response shape via ResponseBlock
- [ ] Each endpoint has curl example
- [ ] Each endpoint has TypeScript example
- [ ] Sidebar navigation links to all 4 new pages

#### Bad Path
- [ ] Pages render without errors when layout is missing context
- [ ] EndpointHeader handles PATCH method correctly (purple badge)

#### Edge Cases
- [ ] Providers page handles the extra `/test` endpoint (6 vs 5)
- [ ] API Keys page uses PATCH instead of PUT for update
- [ ] Brand colors configuration (10 color properties) fits in ParamTable
- [ ] Intent slot configurations render without breaking layout

#### Security
- [ ] Delete endpoint examples include warning about irreversibility
- [ ] API key creation example shows scope restrictions
- [ ] Provider credential fields marked as write-only (not returned in GET)

#### Data Leak
- [ ] Provider API key examples use `sk_test_...` placeholder, not real keys
- [ ] Brand configuration examples don't contain real organization data
- [ ] API key examples show hashed prefix only, not full key

#### Data Damage
- [ ] N/A — static pages, no mutations

### E2E Gate

```bash
# Verify all 4 CRUD pages return 200
for page in brands intents providers api-keys; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/docs/api-reference/$page)
  echo "$page: $status"
done
# Expected: all 200

# Verify each page has endpoint content
curl -s http://localhost:3000/docs/api-reference/brands | grep -c "api/v1/brands"
curl -s http://localhost:3000/docs/api-reference/intents | grep -c "api/v1/intents"
curl -s http://localhost:3000/docs/api-reference/providers | grep -c "api/v1/providers"
curl -s http://localhost:3000/docs/api-reference/api-keys | grep -c "api/v1/api-keys"
# Expected: all >= 1

# Full build passes
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5
```

### Acceptance Criteria

- [ ] All 4 CRUD pages return 200
- [ ] Brands: 5 endpoints documented with examples
- [ ] Intents: 5 endpoints documented with examples
- [ ] Providers: 6 endpoints documented (including POST /test)
- [ ] API Keys: 5 endpoints documented (uses PATCH for update)
- [ ] Each endpoint has curl + TypeScript examples
- [ ] Sidebar shows all pages with correct active highlighting
- [ ] Full build passes with zero errors

---

## Final E2E Verification

```bash
cd /Users/robroyhobbs/work/intentmail

# Full build
npx next build 2>&1 | tail -10

# All 7 doc pages return 200
for page in "" "api-reference" "api-reference/send" "api-reference/brands" "api-reference/intents" "api-reference/providers" "api-reference/api-keys"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/docs/$page")
  echo "/docs/$page: $status"
done

# Landing page "View Documentation" link target exists
curl -s http://localhost:3000/ | grep -o 'href="/docs"' | head -1

# Sidebar navigation present on all pages
curl -s http://localhost:3000/docs | grep -c "Quickstart"
curl -s http://localhost:3000/docs/api-reference | grep -c "Send Email"

# Responsive check — no fixed-width elements breaking mobile
curl -s http://localhost:3000/docs | grep -c "overflow"
```

## Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| 10 files = large total LOC | Shared _components.tsx reduces duplication by ~80 lines/page | Accept size — docs are inherently content-heavy |
| CRUD pages are repetitive | Follow exact same pattern for all 4, copy-adapt from first | Template the first CRUD page, replicate pattern |
| Code examples go stale | Examples match current Zod schemas in route.ts files | Add "last verified" date to overview page |
| Mobile sidebar toggle adds client JS | Isolated to single _sidebar-toggle.tsx component | Fall back to CSS-only `<details>` if issues arise |

## References

- [Intent](./api-docs.intent.md)
- [Overview](./api-docs.overview.md)
- [Landing Page Intent](./landing-page.intent.md) (design patterns to match)
