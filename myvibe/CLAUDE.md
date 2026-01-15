# MyVibe.so (VibeHub)

> AI Native Engineering for Creators - From description to deployed in minutes

## Product Overview

**Category:** WOW Product
**Priority:** P0 for Q1 2026
**Status:** In Development
**Package:** `vibe-hub`

### What It Is

MyVibe.so is an **AI Native Engineering platform for creators**—where anyone can use natural language to create, modify, and deploy live experiences without developer handoff.

**The Core Transformation:**
| Before (AI-Assisted) | After (AI-Native with MyVibe) |
|----------------------|-------------------------------|
| AI generates design draft | AI deploys working UI |
| Developer rewrites code | One-click live deployment |
| Manual Git/CI workflow | Built-in versioning & rollback |
| Static output | Living, data-connected panels |

**What Vibe Coding means:**
- Describe what you want in natural language
- AI generates deployable UI (not just designs)
- One-click publish with real data connections
- A/B test, version, and rollback without touching code

### AI Native Engineering Prototype

MyVibe itself is built using the AI Native approach—**our own product is our best demo**:

- All pages constructed as **Vibe Panels** (not hardcoded React)
- Every UI change uses Vibe Coding first
- Version control as deployment infrastructure
- Dogfooding forces us down the AI-native pathway

**The Development Process Shift:**
```
Traditional: Write code → Package → Deploy → Hope it works
AI Native:   Describe → Generate schema → Instant deploy → Iterate live
```

### The New Web in Action

MyVibe embodies the paradigm shift from traditional web ("design first, build, publish") to the New Web ("run first, explore, solidify"):

| Traditional Publishing | MyVibe (New Web) |
|------------------------|------------------|
| Design → Build → Deploy | Describe → Generate → Deploy |
| Static once published | Living, always evolving |
| Content is a deliverable | Content is an experience |
| Readers consume | Users interact |
| Published = done | Published = alive |

Your projects aren't artifacts frozen in time—they're **living systems** that continue to grow and respond.

### What It's NOT
- Not another static site builder (you deploy working UI, not templates)
- Not a traditional CMS (AI-native, not form-based)
- Not just a code playground (full deployment pipeline)
- Not "AI-assisted" design tools (output runs immediately, no dev handoff)

---

## Target Audience

**Primary:** Creators, developers, technical writers
**Secondary:** Educators, indie hackers, content marketers

### User Personas

1. **The Vibe Coder** - Ships projects fast, wants to share with built-in polish
2. **The Technical Creator** - Makes tutorials, demos, interactive explanations
3. **The Indie Hacker** - Needs landing pages and demos that just work

---

## Brand Voice & Tone

- **Creative and inspiring** - Celebrate what people build
- **Viral-friendly** - Content wants to be shared
- **Developer-aware** - Technical accuracy matters
- **Not corporate** - Fresh, modern, approachable

### Do Say
- "Ship your vibe"
- "Live documents for the AI era"
- "From idea to published in minutes"
- "Your code, your content, your way"

### Don't Say
- "Easy" or "simple" (respect user intelligence)
- "Revolutionary" (overused)
- "Web3" or "blockchain" (not the focus)

---

## Tech Stack

```
Frontend: React 19, MUI 7, Vite 7
Backend:  Express 4, SQLite3, Sequelize
AI:       @aigne/core, @aigne/afs, @anthropic-ai/claude-agent-sdk
Testing:  Vitest
Other:    Docker support, ZIP handling with security validation
```

---

## Architecture: Vibe Panels & UI-DSL

### Core Concept: Panels as Installable Vibes

Pages are no longer static React components. Each page is composed of **Vibe Panels**:

```
Panel = Data Source Declaration + Display Configuration + Interactive Logic
```

| Component | What It Does |
|-----------|--------------|
| **Data Source** | Declares what data the panel needs (vibes list, user info, etc.) |
| **UI Schema** | Layout, copy, styling defined in UI-DSL |
| **Interactions** | User actions and responses |

### UI-DSL Schema

AI outputs structured schema, not freeform HTML:

```typescript
// Standard component types
Page | Section | CardList | Hero | Carousel | ActionButton | UserBadge | VibeList
```

**Why UI-DSL matters:**
- Flexible enough for creativity
- Constrained enough for safety, performance, consistency
- AI can modify without breaking functionality
- Rendering engine handles actual output

### Data Layer Separation

**Critical principle:** AI modifies display layer only, never business logic.

```
┌─────────────────────────────────────────┐
│  Display Layer (AI can modify)          │
│  - UI Schema, Layout, Copy, Styling     │
├─────────────────────────────────────────┤
│  Data Contract (Fixed API)              │
│  - VibeList: title, cover, author, url  │
│  - UserBadge: name, avatar, role, link  │
├─────────────────────────────────────────┤
│  Business Logic (Protected)             │
│  - Database, Auth, Core Functions       │
└─────────────────────────────────────────┘
```

This ensures:
- Creators only change what users see
- Core functionality stays secure
- AI modifications are safe by design

### Version Control & A/B Testing

Every panel modification automatically:
1. Creates a new version (with diff, timestamp, author)
2. Can be labeled (e.g., `experiment-20250106-matt-header`)
3. Supports traffic-based A/B testing
4. One-click promote or rollback

```
Matt changes homepage via Vibe → System deploys as Variant B
├── 10% traffic sees new version
├── Compare: visits, clicks, dwell time, conversions
├── If good: One-click promote to default
└── If bad: Instant rollback, no dev needed
```

### Vibe → Schema Compiler

The "Page Generation Agent" workflow:

```
Input:  Natural language + optional sketch/reference
        "I want a hero section for creators, emphasizing AI-generated
         live docs, carousel on top, popular vibes below..."

Agent:  1. Generate structured UI schema
        2. Bind to standard data sources (/api/vibes/popular)
        3. Validate against MyVibe component specs

Output: Deployable panel at /home?variant=Matt-20250106
```

---

## Development

### Commands
```bash
# Development
pnpm install              # Install dependencies
blocklet dev              # Start local development

# Testing
npm run test              # Run Vitest tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Build & Deploy
npm run bundle            # Build client + api
npm run analyze           # Bundle size analysis
npm run deploy            # Deploy to Blocklet Server
```

### Key Directories
```
src/                      # React frontend
api/src/                  # Express backend
  hooks/                  # Blocklet lifecycle hooks
  routes/                 # API routes
  store/                  # Database models & migrations
```

---

## Key Features

### Creator Empowerment
1. **Vibe Coding** - Natural language to deployable UI (no dev handoff)
2. **One-Click Deploy** - From description to live in minutes
3. **Built-in A/B Testing** - Test variants without touching code
4. **Version Control** - Every change tracked, instant rollback

### Platform Capabilities
5. **Live Document Publishing** - Interactive documents that run code
6. **Vibe Panels** - Installable, composable UI components
7. **Data-Connected** - Panels automatically bind to real data sources
8. **ZIP Upload & Security** - Safe handling with bomb protection
9. **Open Graph Previews** - Beautiful link previews when shared
10. **Discussion Integration** - Comments and community built-in

### Team Collaboration (Upcoming)
11. **Team Spaces** - Private, team-only, or public vibes
12. **In-Page Annotations** - Comment directly on page elements
13. **Revision Tasks** - Comments can trigger AI revision workflows

---

## Revenue Model

- **Freemium** with premium features
- Upsell to DID Spaces storage
- Credit consumption via AIGNE Hub

---

## Key Messaging

### Primary Tagline
**"Ship your vibe"**

### Supporting Taglines
- "From description to deployed"
- "AI helps you think it. AI helps you launch it."
- "No dev handoff required"
- "Living documents for a living web"
- "Your projects deserve an audience"

### Elevator Pitch
> MyVibe.so is AI Native Engineering for creators. Describe what you want, and AI generates deployable UI—not just designs. One-click publish with real data connections, built-in versioning, and A/B testing. No Git, no CI, no developer handoff. From "I want this" to "it's live" in minutes.

### The Key Shift (Use in Marketing)
```
Before: "AI helps us think of UI"
After:  "AI directly helps us launch UI"
```

### Core Emotion: **Delight + Empowerment**
Users should feel surprised and pleased ("wait, it's live already?") AND empowered ("I built this myself, no dev needed").

### Key Benefits

| Benefit | What It Does | How It Feels |
|---------|--------------|--------------|
| **No Handoff** | AI deploys working UI | "I don't need a developer anymore" |
| **Speed** | Describe → Deploy in minutes | "Wait, it's live already?" |
| **Iterate Live** | A/B test, version, rollback | "I can experiment without fear" |
| **Sharing** | Built-in virality | The joy of showing off your work |
| **Interactive** | Live, data-connected panels | "Click this, watch what happens" |

### Voice Examples

**Do Say:**
- "From 'I want this' to 'it's live' in minutes"
- "AI doesn't just design it—AI deploys it"
- "Ship it. Test it. Iterate it. No dev required."
- "Your homepage, your way, live in minutes"

**Don't Say:**
- "AI-assisted" (we're AI-native—output runs immediately)
- "Generate designs" (we generate deployable UI)
- "Simply deploy" (not delightful)
- "Easy" or "simple" (respect the craft)

### Call-to-Action Options
- "Ship your first vibe"
- "Describe your homepage"
- "See it live"
- "Deploy without code"

---

## Competitive Positioning

| Competitor | Their Focus | MyVibe Advantage |
|------------|-------------|------------------|
| **Figma/Canva** | Design tools | Output deploys immediately, not handed to devs |
| **Webflow** | Visual builder | AI-native (describe, don't drag-drop) |
| **Vercel** | Deployment | No code/CI required, built-in A/B testing |
| **Framer** | Design → Code | AI generates from description, not design files |
| **CodePen** | Code snippets | Full deployable panels, not fragments |

### Why MyVibe Wins
1. **AI-Native, not AI-Assisted** - Output runs immediately
2. **No Developer Handoff** - Creators deploy directly
3. **Built-in Experimentation** - A/B testing without engineering
4. **Living Documents** - Content evolves, doesn't rot

---

## Q1 2026 Goals

- [ ] Public launch
- [ ] Minimal UI-DSL (homepage hero + list support)
- [ ] Home Variant toggle + basic A/B management
- [ ] Page Generation Vibe (read schema → generate variant)
- [ ] Integration with AIGNE Hub credits
- [ ] Viral growth mechanics (homepage design contest potential)

---

## Related Products

- **AIGNE Hub** - Powers AI features, credits
- **DID Spaces** - Storage backend
- **ArcSphere** - Mobile companion for consuming vibes

---

*Parent guide: See /Users/robroyhobbs/work/CLAUDE.md for company context*
