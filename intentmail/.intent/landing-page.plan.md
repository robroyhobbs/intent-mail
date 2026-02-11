# Execution Plan: IntentMail Landing Page

## Overview

Replace the generic SaaS landing page (`src/app/(marketing)/page.tsx`) with a 10/10 developer-focused marketing page. Dark gradient hero, before/after code comparison, email preview mockup, features grid, provider badges, compact pricing, and final CTA. CSS-only animations, no new dependencies.

Two files touched: `globals.css` (add animations) and `page.tsx` (full rewrite).

## Prerequisites

- shadcn/ui components exist (Button, Badge, Card) — confirmed
- lucide-react installed — confirmed
- Tailwind CSS + tailwindcss-animate configured — confirmed
- PLANS config importable from `@/lib/stripe` — confirmed
- No new dependencies required

---

## Phase 0: CSS Animations Foundation

### Description

Add CSS keyframe animations and utility classes to `globals.css`. These are used by the hero gradient, fade-in effects, and glow accents throughout the page.

### Implementation

Add to `src/app/globals.css`:
- `@keyframes gradient-shift` — hero background animation
- `@keyframes fade-in-up` — section entrance animation
- `@keyframes pulse-glow` — accent glow effect
- Utility classes: `.animate-gradient`, `.animate-fade-in-up`, `.animate-pulse-glow`
- `@media (prefers-reduced-motion: reduce)` — disable animations for accessibility

### Tests

#### Happy Path
- [ ] Animation classes render without CSS errors (page loads without console warnings)
- [ ] `animate-gradient` produces visible background movement on hero section

#### Bad Path
- [ ] No animation conflicts with existing `tailwindcss-animate` classes

#### Edge Cases
- [ ] `prefers-reduced-motion: reduce` disables all custom animations
- [ ] Animations don't cause layout shift (CLS = 0)

#### Security
- [ ] No external CSS imports or URLs in keyframes

#### Data Leak
- [ ] N/A (CSS only, no data)

#### Data Damage
- [ ] N/A (CSS only, no state)

### E2E Gate

```bash
# Verify CSS syntax is valid and page builds
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5
# Check animations exist in globals.css
grep -c "@keyframes" src/app/globals.css
# Expected: 3 keyframes (gradient-shift, fade-in-up, pulse-glow)
```

### Acceptance Criteria

- [ ] 3 keyframe animations added to globals.css
- [ ] prefers-reduced-motion media query included
- [ ] No build errors
- [ ] Existing styles unchanged

---

## Phase 1: Page Structure — Nav + Hero + Footer

### Description

Replace `page.tsx` with the new page structure. Start with the three "frame" sections: sticky nav, dark gradient hero, and footer. This establishes the visual identity before adding content sections.

### Implementation

Rewrite `src/app/(marketing)/page.tsx`:
- Sticky nav with backdrop blur, logo, nav links (Features anchor, Pricing anchor, Docs), Sign In/Get Started CTAs
- Dark hero section: navy-to-black gradient background with animated mesh, badge, headline, subheadline, dual CTAs, trust line
- Footer: logo, nav links, copyright (carried from existing)

### Tests

#### Happy Path
- [ ] Page renders at `/` without errors
- [ ] Nav is sticky and has backdrop blur
- [ ] Hero has dark gradient background with animation
- [ ] Headline text: "Stop writing email templates. Start declaring email intents."
- [ ] Both CTA buttons link to `/sign-up` and `/docs`
- [ ] Footer shows current year

#### Bad Path
- [ ] Missing environment variables don't crash the page (server component, no env needed)
- [ ] Broken nav links don't cause hydration errors

#### Edge Cases
- [ ] Mobile viewport: nav collapses gracefully (hidden md:flex pattern)
- [ ] Very long viewport: hero fills at least 60vh
- [ ] Gradient animation doesn't flash on initial load

#### Security
- [ ] No external script tags or inline event handlers
- [ ] All links use Next.js `<Link>` component (no raw `<a>` to internal routes)

#### Data Leak
- [ ] No API keys, secrets, or internal URLs in page source

#### Data Damage
- [ ] N/A (static server component)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5
# Verify page exports a default function
grep -c "export default function" src/app/\(marketing\)/page.tsx
# Expected: 1
```

### Acceptance Criteria

- [ ] Dark gradient hero renders with animation
- [ ] Nav sticky with blur
- [ ] Footer present
- [ ] Build passes
- [ ] Mobile responsive

---

## Phase 2: Content Sections — Before/After + Email Preview + Features

### Description

Add the three core content sections between hero and footer:
1. Before/After code comparison (merged with problem/solution framing)
2. Email preview mockup (single panel with intent badge)
3. Features grid (6 cards, 3-column)

### Implementation

- **Before/After**: Two-column layout. Left: truncated HTML template code (dark bg, red-tinted header "The Old Way"). Right: clean IntentMail API call (dark bg, green-tinted header "The IntentMail Way"). CSS syntax coloring (span classes for strings, keys, values).
- **Email Preview**: Centered card with realistic email content — branded header (blue), greeting "Hey Sarah,", body paragraph, blue CTA button "Go to Dashboard", signature "The IntentMail Team". Badge overlay: `intent: onboarding.welcome`.
- **Features Grid**: 6 cards in 3-column grid using existing Card component. Icons from lucide-react: MessageSquare, Palette, Shield, Zap, Code, BarChart3.

### Tests

#### Happy Path
- [ ] Before/After section shows two code panels side by side on desktop
- [ ] "Before" code shows realistic HTML email markup
- [ ] "After" code shows the IntentMail curl command
- [ ] Email preview card renders with brand blue (#4598fa) header
- [ ] Email preview has intent badge overlay
- [ ] All 6 feature cards render with correct icons and text
- [ ] Feature grid is 3 columns on lg, 2 on md, 1 on sm

#### Bad Path
- [ ] Code blocks don't overflow horizontally (overflow-x-auto)
- [ ] Feature descriptions don't truncate unexpectedly

#### Edge Cases
- [ ] Before/After stacks vertically on mobile (single column)
- [ ] Email preview card is max-width constrained (doesn't stretch full width)
- [ ] Very small viewport (320px): all sections readable

#### Security
- [ ] Code examples don't contain real API keys (use "im_live_..." placeholder)
- [ ] Email preview doesn't include real email addresses (use user@example.com)

#### Data Leak
- [ ] No production URLs in code examples

#### Data Damage
- [ ] N/A (static content)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5
# Verify all 6 feature icons are imported
grep -c "lucide-react" src/app/\(marketing\)/page.tsx
# Expected: 1 import line with 6+ icons
# Verify email preview content
grep -c "onboarding.welcome" src/app/\(marketing\)/page.tsx
# Expected: >= 1
```

### Acceptance Criteria

- [ ] Before/After code comparison is visually dramatic
- [ ] Email preview looks like a real branded email
- [ ] All 6 features rendered with icons
- [ ] Responsive on all breakpoints
- [ ] Build passes

---

## Phase 3: Provider Badges + Compact Pricing + Final CTA

### Description

Add the final three content sections:
1. Provider badges (pill-shaped text badges for 5 providers)
2. Compact pricing grid (4 plans from PLANS config)
3. Final CTA section (gradient background)

### Implementation

- **Provider Badges**: "Works with your email provider" heading. Five pill badges: Resend, SendGrid, Postmark, AWS SES, Mailgun. Styled with border + muted background.
- **Compact Pricing**: Import `PLANS` from `@/lib/stripe`. 4-column grid. Each card: plan name, price, top 3 features, CTA button. Growth highlighted with primary border + "Popular" badge. "View all features →" link to `/pricing`.
- **Final CTA**: Full-width gradient section (primary color). "Ready to send better emails?" heading. "Create Free Account" button.

### Tests

#### Happy Path
- [ ] All 5 provider names render as pill badges
- [ ] Pricing grid shows all 4 plans (Free, Starter, Growth, Enterprise)
- [ ] Free plan shows "$0" or "Free", Starter shows "$29", Growth shows "$99", Enterprise shows "Custom"
- [ ] Growth plan has "Popular" badge and primary border
- [ ] "View all features" links to /pricing
- [ ] Final CTA button links to /sign-up
- [ ] Pricing data imports from @/lib/stripe PLANS config

#### Bad Path
- [ ] If PLANS config shape changes, TypeScript catches it at build time
- [ ] Missing Stripe price IDs don't affect display (price IDs aren't shown)

#### Edge Cases
- [ ] Pricing grid stacks to 2-column on md, 1-column on sm
- [ ] Provider badges wrap naturally on small viewports
- [ ] Enterprise "Custom" price renders without /month suffix

#### Security
- [ ] Stripe price IDs not exposed in page source (only prices rendered)
- [ ] No Stripe API calls made at render time (static data from PLANS const)

#### Data Leak
- [ ] Page source doesn't contain Stripe secret key or webhook secret
- [ ] Price IDs from env vars not leaked to client

#### Data Damage
- [ ] N/A (read-only from static config)

### E2E Gate

```bash
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -5
# Verify PLANS import
grep "from '@/lib/stripe'" src/app/\(marketing\)/page.tsx
# Expected: 1 match
# Verify all provider names present
grep -c "Resend\|SendGrid\|Postmark\|AWS SES\|Mailgun" src/app/\(marketing\)/page.tsx
# Expected: >= 5
# Verify pricing section
grep -c "Popular" src/app/\(marketing\)/page.tsx
# Expected: >= 1
```

### Acceptance Criteria

- [ ] 5 provider badges rendered
- [ ] 4 pricing cards with correct prices from PLANS
- [ ] Growth plan highlighted
- [ ] Final CTA gradient section present
- [ ] Build passes
- [ ] Full page is responsive and visually polished

---

## Final E2E Verification

```bash
# Full build verification
cd /Users/robroyhobbs/work/intentmail && npx next build 2>&1 | tail -10

# Verify page structure completeness
echo "=== Section checks ==="
FILE="src/app/(marketing)/page.tsx"
echo "Nav: $(grep -c 'sticky' $FILE) sticky elements"
echo "Hero: $(grep -c 'gradient' $FILE) gradient references"
echo "Before/After: $(grep -c 'Old Way\|IntentMail Way' $FILE) comparison headers"
echo "Email Preview: $(grep -c 'onboarding.welcome' $FILE) intent references"
echo "Features: $(grep -c 'lucide-react' $FILE) icon imports"
echo "Providers: $(grep -c 'Resend\|SendGrid\|Postmark' $FILE) provider mentions"
echo "Pricing: $(grep -c 'PLANS' $FILE) pricing references"
echo "CTA: $(grep -c 'Create Free Account\|Get Started\|Start for Free' $FILE) CTA buttons"

# Verify no secrets leaked
echo "=== Security check ==="
grep -i "secret\|api_key\|password\|token" $FILE && echo "WARNING: Possible secret!" || echo "Clean"

# Verify responsive classes
echo "=== Responsive check ==="
echo "md breakpoints: $(grep -co 'md:' $FILE)"
echo "lg breakpoints: $(grep -co 'lg:' $FILE)"
echo "sm breakpoints: $(grep -co 'sm:' $FILE)"
```

## Risk Mitigation

| Risk | Mitigation | Contingency |
|------|------------|-------------|
| Page too long (500+ LOC) | Acceptable for landing page, single file | Extract sections to components if maintenance becomes an issue |
| CSS syntax highlighting looks wrong | Use carefully chosen span colors for code blocks | Fall back to monochrome code if colors clash |
| Pricing data gets stale | Import from PLANS config (single source of truth) | Update PLANS in stripe.ts, page auto-updates |
| Animation jank on mobile | prefers-reduced-motion + GPU-accelerated transforms | Disable animations entirely if issues persist |

## References

- [Intent Specification](./landing-page.intent.md)
- [Overview](./landing-page.overview.md)
- [Existing Page](../src/app/(marketing)/page.tsx)
- [PLANS Config](../src/lib/stripe.ts)
