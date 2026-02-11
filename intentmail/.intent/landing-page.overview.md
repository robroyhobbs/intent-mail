# IntentMail Landing Page: 10/10 developer-focused homepage

## One sentence
Replace the generic SaaS landing page with a dark-hero, Resend/Linear-inspired marketing page that tells the story of intent-driven email.

## Why?
The current homepage is a functional but generic template. For a developer-audience email product, the landing page needs to demonstrate the "before/after" transformation, show real API usage, and create an immediate "I get it" moment.

## Core experience flow

```
Visitor lands
    ↓
[Dark gradient hero] "Stop writing templates. Start declaring intents."
    ↓
[Problem/Solution] Pain of old way vs. IntentMail way
    ↓
[Before/After code] 100 lines of HTML → 8 lines of API
    ↓
[Email preview] Intent config → rendered branded email
    ↓
[Features grid] 6 capabilities at a glance
    ↓
[How it works] 3 steps: Brand → Intent → API
    ↓
[Provider logos] BYOP credibility
    ↓
[Compact pricing] 4 tiers, highlight Growth
    ↓
[Final CTA] "Start free, no credit card"
```

## Architecture

```
src/app/(marketing)/page.tsx  ← Replace this file
src/app/globals.css           ← Add 3 CSS keyframe animations
```

No new dependencies. Pure Tailwind + shadcn/ui + lucide-react.

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| Replace or new route? | Replace existing | One canonical homepage |
| Visual style | Dark hero + light body | Resend/Linear feel, developer trust |
| Target audience | Developers | API-first product, code examples front and center |
| Animations | CSS-only | No added bundle size, subtle polish |
| Pricing on page? | Compact section | Reduce friction, link to /pricing for details |
| New dependencies? | None | Ship fast, no risk |

## Scope

**In:** 11 sections, CSS animations, responsive, dark hero, email preview mockup, compact pricing
**Out:** Interactive demos, video, dark mode toggle, new npm packages

## Risk + Mitigation

| Risk | Fix |
|------|-----|
| Large file | Single-file landing pages are standard |
| Email mockup looks fake | Use real brand colors and realistic content |
| Animation jank | `prefers-reduced-motion` media query |

## Next steps
1. `/intent-critique` — check for over-engineering
2. `/intent-plan` — phased build plan
3. `/intent-build-now` — implement
