# IntentMail Landing Page Specification

## 1. Overview

- **Product:** IntentMail — AI-native, intent-driven email platform
- **Page:** Marketing homepage (replaces existing `src/app/(marketing)/page.tsx`)
- **Priority:** High — primary conversion surface
- **Target User:** Developers building products that send transactional/marketing emails
- **Scope:** Single-page redesign, CSS-only animations, no new dependencies
- **Inspiration:** Resend.com (developer email, dark hero, email previews) + Linear.app (dramatic gradients, minimal typography)

## 2. Architecture

- **File:** `src/app/(marketing)/page.tsx` (replace in-place)
- **Framework:** Next.js 14 App Router, server component
- **Styling:** Tailwind CSS + CSS custom properties (existing setup)
- **Components:** shadcn/ui (Button, Badge, Card already available)
- **Icons:** lucide-react (already installed)
- **Animations:** CSS-only (keyframes in globals.css + Tailwind animate)
- **No new dependencies required**

## 3. Page Sections (Top to Bottom)

### 3.1 Navigation (sticky)

- Logo (Send icon + "IntentMail")
- Links: Features, Pricing, Docs
- CTA: Sign In (ghost), Get Started (primary)
- Backdrop blur on scroll

### 3.2 Hero (Dark gradient background)

- Badge: "AI-Native Email for Developers"
- Headline: "Stop writing email templates. Start declaring email intents."
- Subheadline: Explain intent-driven approach in one sentence
- Primary CTA: "Start for Free" + secondary "View Docs"
- Trust line: "1,000 free emails/month. No credit card required."
- Visual: Animated gradient mesh background (CSS radial-gradient + animation)

### 3.3 Before/After Code Comparison (merged with Problem/Solution)

- Header: "The Old Way vs. The IntentMail Way"
- Subheader listing pain points: hardcoded templates, no brand consistency, no validation, provider lock-in
- **Before panel:** Messy raw email HTML (30+ lines of table-based markup with inline styles)
- **After panel:** Clean 8-line IntentMail API call
- Syntax-highlighted code blocks side by side (CSS styled, no highlight.js needed)
- Caption: "From 100+ lines of template HTML to 8 lines of intent"
- (CRITIQUE: merged Problem/Solution into this section header to eliminate scroll overlap)

### 3.4 Email Preview

- Single rendered email mockup card (brand colors, greeting, body, CTA button)
- Small badge overlay: `intent: onboarding.welcome`
- Shows the quality of output without complex dual-panel layout
- (CRITIQUE: simplified from dual-panel to single panel — same impact, 60% less markup)

### 3.5 Features Grid (3-column)

Six feature cards with icons:

1. **Intent-Driven** (MessageSquare) — Define purpose, not markup
2. **Brand Consistency** (Palette) — 10-color palettes, typography, voice rules
3. **BYOP** (Shield) — Resend, SendGrid, Postmark, AWS SES, Mailgun
4. **Quality Scoring** (Zap) — 100-point validation with blocking/warning/suggestion
5. **Developer API** (Code) — One endpoint, intent slug or ID, Handlebars data
6. **Analytics** (BarChart3) — Opens, clicks, bounces, delivery tracking

### 3.6 Provider Badges

- "Works with your email provider" heading
- Styled pill badges: Resend, SendGrid, Postmark, AWS SES, Mailgun
- No logo images needed — clean text badges with border styling
- (CRITIQUE: replaced logo strip with text badges — no image assets required)

### 3.7 Compact Pricing

- 4-column grid (FREE / STARTER / GROWTH / ENTERPRISE)
- Price + top 3 features per plan
- Growth plan highlighted as "Popular"
- "View all features" link to /pricing

### 3.8 Final CTA (gradient background)

- "Ready to send better emails?"
- "Start with 1,000 free emails. No credit card required."
- Large "Create Free Account" button

### 3.9 Footer

- Logo, nav links, copyright
- Same as existing

## 4. Visual Design Decisions

| Decision        | Choice                                             | Rationale                                                          |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| Hero background | Dark navy gradient with animated mesh              | Matches Resend/Linear aesthetic, creates dramatic first impression |
| Code blocks     | Dark zinc-950 with custom syntax colors            | Developer-focused, shows real API usage                            |
| Animations      | CSS fade-in on scroll, gradient shift, hover lifts | Subtle polish without JS overhead                                  |
| Color accent    | Primary blue (#4598fa equivalent) on dark          | High contrast, draws eye to CTAs                                   |
| Typography      | System + existing Inter setup                      | No additional font loads                                           |
| Email preview   | Static HTML mockup card                            | Shows output quality without complex rendering                     |

## 5. CSS Animations to Add (globals.css)

```css
@keyframes gradient-shift {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-gradient {
  animation: gradient-shift 8s ease infinite;
  background-size: 200% 200%;
}
.animate-fade-in-up {
  animation: fade-in-up 0.6s ease-out forwards;
}
.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}
```

## 6. MVP Scope

### Included

- All 9 sections described above (reduced from 11 after critique)
- CSS animations (gradient, fade-in, hover effects)
- Mobile responsive (existing Tailwind breakpoints)
- Dark hero + light body sections
- Static email preview mockup
- Compact pricing from PLANS config

### Excluded

- No interactive email builder demo
- No real-time API playground
- No video/animated demos
- No dark mode toggle (hero is dark by design, rest follows system)
- No new npm dependencies

## 7. Risks

| Risk                           | Mitigation                                                             |
| ------------------------------ | ---------------------------------------------------------------------- |
| Large page file (500+ lines)   | Single file is fine for a landing page; no component extraction needed |
| Email preview looks fake       | Use realistic content and actual brand color values                    |
| Code blocks hard to read       | Use carefully chosen syntax colors, not a library                      |
| CSS animations janky on mobile | Use `prefers-reduced-motion` media query                               |

## 8. Finalized Implementation Details

> Synced on: 2026-02-10
> Status: IMPLEMENTED

### Files Modified

| File                           | Change                                                          |
| ------------------------------ | --------------------------------------------------------------- |
| `src/app/globals.css`          | Added 3 keyframe animations + `prefers-reduced-motion` fallback |
| `src/app/(marketing)/page.tsx` | Full rewrite — 482 lines, 9 sections                            |

### Final Section Structure

| #   | Section         | Anchor        | Background                                                   |
| --- | --------------- | ------------- | ------------------------------------------------------------ |
| 1   | Navigation      | sticky header | `slate-950/80` + backdrop-blur-xl                            |
| 2   | Hero            | —             | `slate-950` + animated gradient mesh (blue/violet glow orbs) |
| 3   | Before/After    | —             | `slate-50` + dark code panels (red-tinted vs emerald-tinted) |
| 4   | Email Preview   | —             | white, centered `max-w-md` mockup card                       |
| 5   | Features Grid   | `#features`   | `slate-50`, 3-col `max-w-5xl`                                |
| 6   | Provider Badges | —             | white, flex-wrap pill badges                                 |
| 7   | Compact Pricing | `#pricing`    | `slate-50`, 4-col from `PLANS` import                        |
| 8   | Final CTA       | —             | `slate-950` + animated gradient                              |
| 9   | Footer          | —             | `slate-950`                                                  |

### Design Tokens Used

| Token           | Value                            | Usage                                                         |
| --------------- | -------------------------------- | ------------------------------------------------------------- |
| Brand blue      | `#4598fa` / `blue-500`           | CTAs, email preview header, feature icons, pricing highlights |
| Gradient accent | `blue-600/20` to `violet-600/20` | Hero + CTA backgrounds                                        |
| Code "Old Way"  | `red-400` / `red-500/10`         | Before panel header                                           |
| Code "New Way"  | `emerald-400` / `emerald-500/10` | After panel header                                            |
| Syntax: keys    | `blue-400`                       | JSON key highlighting                                         |
| Syntax: values  | `emerald-400`                    | JSON string highlighting                                      |

### Component Dependencies (confirmed)

- `Button` from `@/components/ui/button` (variants: default, ghost, outline)
- `Badge` from `@/components/ui/badge` (variants: default, secondary)
- `PLANS` from `@/lib/stripe` (pricing data, imported as `const`)
- Icons: Send, Palette, MessageSquare, Zap, Shield, BarChart3, Code, Check, ArrowRight, Mail

### CSS Animations (confirmed)

| Animation                | Duration    | Usage                           |
| ------------------------ | ----------- | ------------------------------- |
| `gradient-shift`         | 8s infinite | Hero + CTA gradient backgrounds |
| `fade-in-up`             | 0.6s once   | Hero content entrance           |
| `pulse-glow`             | 3s infinite | Blue/violet glow orbs in hero   |
| `prefers-reduced-motion` | —           | Disables all 3 animations       |

### Key Decisions Confirmed

| Decision                 | Final Choice                            | Rationale                                   |
| ------------------------ | --------------------------------------- | ------------------------------------------- |
| Nav style                | Dark (slate-950) always                 | Matches hero, consistent with Resend/Linear |
| Footer style             | Dark (slate-950)                        | Bookends with nav for cohesive feel         |
| Pricing source           | `PLANS` import, `.slice(0, 3)` features | Single source of truth, compact display     |
| Enterprise CTA           | `mailto:sales@intentmail.com`           | No self-serve for enterprise                |
| Code syntax coloring     | Manual `<span>` classes                 | No highlight.js dependency needed           |
| Email mockup brand color | Hardcoded `#4598fa`                     | Matches IntentMail brand primary            |
