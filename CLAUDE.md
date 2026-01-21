# ArcBlock Engineering Guide

> AI-Native Engineering Company - Building system-level infrastructure for an AI-native era.

## Active Loading Policy (ALP)

This workspace uses the `arcblock-context` plugin for comprehensive product knowledge.

**On-demand context loading:**
```
/arcblock-context              # Show available topics
/arcblock-context <topic>      # Load specific context
/arcblock-context all          # Load full overview
```

**Common topics:** `arcsphere`, `afs`, `aine`, `docsmith`, `aigne`, `paymentkit`, `agent-fleet`, `strategy`

**Auto-loading triggers:** When discussing specific products or technical concepts, load the relevant context first using `/arcblock-context <topic>`.

---

## Company Identity

**What we are:** An AI-Native Engineering company building foundational infrastructure for a future where AI is a first-class system participant.

**What we are NOT:**
- Not a blockchain company
- Not a dApp infrastructure provider
- Not a DID/Web3 toolchain

**Core Principles:**
- Everything is **Blocklet** - all services run as Blocklets on Blocklet Server
- Everything is **Self-Hostable** - Launcher, Store, Spaces can be deployed independently
- Everything uses **DID** - all identity is DID-based, all credentials use Verifiable Credentials (VC)

**Team:** 10-30 people, 100% founder control, no VC, fully independent

---

## The New Web Vision

> **Traditional Web:** "Design first, then build, then publish"
> **New Web:** "Run first, then explore, then solidify"

ArcBlock is building the infrastructure for a fundamentally different internet—one where websites are no longer structures built once for all, but **living systems that continuously grow and evolve through human + AI collaboration**.

### The Problem with Traditional Web

| Issue | Impact |
|-------|--------|
| Structure determined upfront | Difficult to adjust once built |
| Small changes affect entire site | High risk, slow iteration |
| Release is a one-time action | Slow releases, high trial-and-error costs |
| Marketing/Sales wait for engineering | Business bottlenecked by dev cycles |
| Blog disconnected from website | Fragmented content, inconsistent messaging |

### The New Web Model

In the new model, **websites are running systems from day one**:

- Each page/function is an **independent capability unit** (Blocklet)
- Modification, testing, and content generation happen **on the running system**
- Good results are "solidified," bad ones discarded
- AI is a **constrained collaborator**, not a black box

**Core Shift:**
| Traditional Web | New Web |
|-----------------|---------|
| Local development → Deploy | Online operation → Local evolution |
| Page is a static product | Page is an evolvable unit |
| One change may break everything | Each unit is independent and safe |
| Release is one-time action | Publishing is ongoing process |
| CMS for content | System itself is content |
| Human maintains structure | Human + AI collaborative evolution |

### What This Enables

**For Marketing/Sales:**
- Customer-customized pages generated in minutes
- No more "waiting for project scheduling"
- Content is naturally part of the website (no patchwork blogs)

**For Developers:**
- Less firefighting, clearer boundaries
- AI experiments within safe spaces
- People responsible for judgment, not maintenance

**Safety by Design:**
- Each page/capability is isolated
- Modifications are reversible and auditable
- AI operates only within allowed boundaries

### How Our Products Enable the New Web

| Product | Role in New Web |
|---------|-----------------|
| **Blocklet Server** | The runtime for independent, evolvable units |
| **DocSmith** | Living documentation that evolves with code |
| **MyVibe.so** | Living documents - "run first, explore, solidify" |
| **ArcSphere** | Window into the living, AI-enabled internet |
| **Agent Fleet** | AI collaborators that help systems evolve |
| **AIGNE Framework** | The constrained AI collaboration engine |

### The One-Sentence Summary

> Traditional Web is "building a building"; the New Web is "nurturing a living entity."
> It can grow, experiment, make mistakes, and be repaired—rather than being built once and handled with utmost care.

---

## Brand Guidelines

### Colors

| Purpose | Light Mode | Dark Mode | Usage |
|---------|-----------|-----------|-------|
| Primary | `#4598fa` | `#4598fa` | Main actions, links, highlights |
| Secondary | `#00b8db` | `#00d3f3` | Supporting elements, accents |
| Success | `#28A948` | `#00AD3A` | Positive states, confirmations |
| Warning | `#ff9300` | `#FFAE00` | Caution states, alerts |
| Error | `#fb2c36` | `#ff6467` | Error states, destructive actions |
| DID Accent | `#49C3AD` | `#49C3AD` | DID-related features |

### Typography

| Usage | Font Family | Notes |
|-------|-------------|-------|
| Headings (H1-H6) | Bai Jamjuree | All titles, section headers |
| Body text | Inter | Primary reading text |
| UI elements | Lexend | Buttons, labels, UI chrome |
| AIGNE branding | Audiowide | AIGNE logo and brand text |
| AIGNE products | Poppins | Product names in AIGNE suite |

### Brand Voice
- Professional but approachable
- Technical accuracy over marketing fluff
- Focus on capability and empowerment
- Avoid: "simply", "just", "easy" - respect user intelligence

---

## Technology Architecture

AFS + AINE form the foundation; everything else derives naturally from them.

```
┌─────────────────────────────────────────────────────────────┐
│  AI-Native Engineering (AINE)                               │
│  Engineering system for "uncertain computing agents"        │
│  Intent → Context → Contract → Chamber → Build/Run/Ops     │
├─────────────────────────────────────────────────────────────┤
│  AFS (Agentic File System)                                  │
│  Everything is File, View, Context, Identity                │
│  AI-Native system abstraction layer                         │
├─────────────────────────────────────────────────────────────┤
│  Agent / Skill / Chamber Runtime                            │
│  Skills + DID + Capability + Chamber + AFS                  │
├─────────────────────────────────────────────────────────────┤
│  Identity / DID / Capability                                │
│  DID = accountable identity (not wallet)                    │
│  Capability = minimum authorization unit                    │
├─────────────────────────────────────────────────────────────┤
│  Blocklet Runtime & Server                                  │
│  Deployable, composable units with identity & capabilities  │
└─────────────────────────────────────────────────────────────┘
```

### Core Concepts

**AFS (Agentic File System)**
- Not a feature, tool, or SDK - it's the "final determination layer" for AI-Native systems
- All UI/interaction capabilities must first map to AFS

**AINE (AI-Native Engineering)**
- Core flow: Intent → Context → Contract → Chamber → Build/Run/Ops → Feedback
- Readback/Replay/Diff are critical - this is engineering, not conversation

**Chamber**
- Basic code construction unit for AI-native frameworks
- Achieves function-level/module-level hard isolation
- Solves global context explosion and cross-module contamination in large-scale AI engineering

**DID + Capability**
- DID = accountable subject identifier, not a wallet
- Capability = minimum authorization unit, separated from Identity

**Blocklet**
- Bounded, identity-aware, capability-declaring minimum deployable unit
- Traditional web components + AI-native components (Agent Fleet) run in parallel

---

## Engineering Principles

Based on aviation concepts for reliability:

| Aviation Concept | Engineering Principle | Application |
|------------------|----------------------|-------------|
| 1-2-3 Pause | Don't Fiddle | Pause 3 seconds in emergencies, don't react instinctively |
| Checklist | Checklist Discipline | Don't rely on memory, rely on checklists |
| Readback | Readback Principle | Repeat back to confirm, prevent misunderstanding becoming code |
| HUD | Ambient Awareness | AI interfaces should be like HUD - non-interrupting, transparent, environment-aware |

---

## Shared Tech Conventions

### Stack
- **Language:** TypeScript (strict mode)
- **Runtime:** Node.js 20+
- **Package Manager:** pnpm (preferred), npm supported
- **Frontend:** React 19, MUI 7 (Material UI), Vite 7
- **Backend:** Express 4, Sequelize 6, SQLite3
- **AI Integration:** @aigne/core, @aigne/afs, @aigne/aigne-hub
- **Auth:** @arcblock/did-connect, DID-based authentication
- **Payments:** @blocklet/payment-*, PaymentKit vendor SDK
- **Deployment:** All services deploy as Blocklets to Blocklet Server

### Code Quality Tools
- **Linting:** ESLint with @arcblock/eslint-config-ts
- **Formatting:** Prettier with import sorting
- **Git Hooks:** simple-git-hooks, lint-staged
- **Testing:** Jest, Vitest, Playwright

### Common Commands (All Products)
```bash
# Development
pnpm install              # Install dependencies
blocklet dev              # Start local development
npm run lint              # Check code style
npm run lint:fix          # Auto-fix linting issues

# Build & Deploy
npm run bundle            # Create production bundle
blocklet deploy           # Deploy to Blocklet Server
blocklet upload           # Upload to Blocklet Store

# Version Management
npm run bump-version      # Bump version (uses bumpp or zx scripts)
```

### Code Standards
- Use English for all code comments and documentation
- Follow existing patterns in each codebase
- Prefer functional approaches where appropriate
- Use Biome for projects that have migrated from ESLint

---

## Product Context Selector

When starting work on a specific product, reference its section below for context:

| Product | Audience | Core Emotion | Key Message |
|---------|----------|--------------|-------------|
| **ArcSphere** | Consumers, mobile users | Access | "Your real-time window into the AI-enabled internet" |
| **MyVibe.so** | Creators, non-developers | Delight + Empowerment | "AI doesn't just design it—AI deploys it" |
| **DocSmith** | Developers, B2B | Control | "Your code changes, your docs follow" |
| **AIGNE Framework** | Developers | Capability | "Functional, TypeScript-first AI agents" |
| **AIGNE Hub** | Developers, admins | Reliability | "One API, multiple providers" |
| **PaymentKit** | Developers, vendors | Security | "Secure vendor integration" |
| **Launcher** | End users, admins | Simplicity | "Deploy your own server" |

### Product-Specific Files

Each product has its own detailed CLAUDE.md:
- `/Users/robroyhobbs/work/myvibe/CLAUDE.md` - Full AI Native Engineering guide
- `/Users/robroyhobbs/work/docsmith/CLAUDE.md` - DocOps and living documentation
- `/Users/robroyhobbs/work/arcsphere/CLAUDE.md` - Consumption layer and Fleet access
- `/Users/robroyhobbs/work/aigne-framework/CLAUDE.md` - SDK reference
- `/Users/robroyhobbs/work/aigne-hub/CLAUDE.md` - Gateway documentation
- `/Users/robroyhobbs/work/paymentkit/CLAUDE.md` - Vendor integration guide

---

## Products

### Released Products

---

#### ArcSphere
> Your real-time window into the AI-enabled internet

- **Platforms:** iOS, Android
- **Category:** WOW Product (Consumer)
- **Repo:** Private (arc-sphere)
- **Package:** `arc-sphere-agent`
- **Tagline:** "First mobile access to Agent Fleets"

**Strategic Position:**
ArcSphere is the **consumption layer**—while MyVibe and DocSmith focus on creation, ArcSphere is where users experience the AI-enabled internet.

| Created In | Consumed In ArcSphere |
|------------|----------------------|
| MyVibe.so | Live documents, interactive vibes |
| DocSmith | Generated documentation |
| Agent Fleet | Persistent agent outputs |

**Tech Stack:**
- React 19, MUI 7, Vite 7, Framer Motion
- Express 4, SQLite3, Sequelize
- @aigne/core, @aigne/aigne-hub, @aigne/agent-library

**Key Features:**
- **Agent Fleet Access** (Upcoming) - First mobile interface to personal AI agents
- **Skill Browser** - Browse, discover, activate AI Skills
- **Action Ring** - Radial touch menu for instant AI actions
- **Spatial Tab Navigation** - 8×8 grid as 3D sphere, end "tab chaos"
- **AI Chat** - Context-aware with @ mentions, voice input
- **Digital Passport (DID)** - Passwordless identity

**Commands:**
```bash
blocklet dev              # Start development
npm run bundle            # Build all (client + runtime + api)
npm run bundle:analyze    # Analyze bundle size
npm run deploy            # Deploy to server
```

**Key Message:** "Your agents, in your pocket"

*See /Users/robroyhobbs/work/arcsphere/CLAUDE.md for full product guide*

---

#### AIGNE Hub
> The Unified AI Gateway for the AIGNE Ecosystem

- **Category:** Infrastructure, Revenue
- **Repo:** https://github.com/AIGNE-io/aigne-hub
- **Package:** Blocklet

**Tech Stack:**
- React 19, Node.js, TypeScript
- SQLite with Sequelize ORM
- AIGNE Framework integration

**Key Features:**
- Multi-provider AI support (OpenAI, Anthropic, Gemini, DeepSeek, Ollama, xAI, Bedrock, OpenRouter)
- Credit-based billing with custom pricing
- Encrypted API key storage (self-hosting)
- Usage analytics and cost tracking
- Built-in playground for model testing
- OAuth + role-based access controls

**Deployment:** Via Blocklet Store → search "AIGNE Hub"

---

#### AIGNE Framework
> Functional, TypeScript-first AI agent development framework

- **Category:** Core SDK
- **Repo:** https://github.com/AIGNE-io/aigne-framework
- **Package:** `@aigne/core`
- **License:** Elastic-2.0

**Tech Stack:**
- TypeScript 98.8%, Node.js 20+
- pnpm workspaces (monorepo)
- Biome (linting), TypeDoc (docs)

**Key Features:**
- Multi-LLM support: OpenAI, Gemini, Claude, Nova, Ollama, DeepSeek, xAI, Bedrock
- Workflow patterns: Sequential, concurrent, routing, handoff, reflection, orchestration
- AFS (Agentic File System) integration
- MCP (Model Context Protocol) support
- Secure code execution sandbox
- Blocklet ecosystem integration

**Packages:**
```
@aigne/core              # Core agent framework
@aigne/cli               # Command-line tools
@aigne/agent-library     # Pre-built agents
@aigne/afs               # Agentic File System
@aigne/observability     # Monitoring
@aigne/memory            # Memory management
```

**Installation:**
```bash
npm install @aigne/core
# or
pnpm add @aigne/core
```

---

#### PaymentKit
> Vendor SDK for payment integration with signature verification

- **Category:** Infrastructure, Revenue Critical
- **Repo:** https://github.com/blocklet/payment-kit
- **Package:** `@blocklet/payment-vendor`
- **License:** Apache-2.0

**Tech Stack:**
- TypeScript, Express middleware
- Ed25519 signature verification
- @ocap/wallet for cryptographic operations

**Key Features:**
- Vendor authentication and signature verification
- Broker/Vendor integration patterns
- Rate limiting and health check middleware
- Whitelist management for trusted brokers

**Integration Patterns:**
```typescript
// Vendor side (receiving requests)
import VendorSDK from '@blocklet/payment-vendor';
app.use('/api/vendor', VendorSDK.middleware.ensureAuth());

// Broker side (sending requests)
import { VendorAuth } from '@blocklet/payment-vendor';
const { headers, body } = VendorAuth.signRequestWithHeaders(request);
```

---

#### Blocklet Server
> Deployable platform for traditional + AI-native Blocklet hybrid deployment

- **Priority:** Medium (Core Infrastructure)
- **Role:** Foundation for all ArcBlock services

---

#### DID Wallet
> Multi-chain decentralized identity wallet

- **Priority:** Medium
- **Integration:** Complements ArcSphere

---

#### DID Spaces
> Decentralized personal data storage (S3 compatible)

- **Priority:** Medium
- **Revenue:** Storage fees

---

#### AIStro
> AI astrology application - consumer vertical AI product

- **Priority:** Maintenance mode
- **Purpose:** LLM learning sandbox, organic growth only

---

### In Development

---

#### MyVibe.so (VibeHub)
> AI Native Engineering for Creators - From description to deployed in minutes

- **Category:** WOW Product
- **Priority:** P0 for Q1 2026
- **Repo:** Private (vibe-hub)
- **Package:** `vibe-hub`
- **Tagline:** "Ship your vibe"
- **Core Emotion:** Delight + Empowerment

**What It Is:**
An AI Native Engineering platform where anyone can use natural language to create, modify, and deploy live experiences without developer handoff.

**The Core Transformation:**
```
Before: AI generates design draft → Developer rewrites → Manual deploy
After:  Describe what you want → AI deploys working UI → One-click live
```

**Tech Stack:**
- React 19, MUI 7, Vite 7
- Express 4, SQLite3, Sequelize
- @aigne/core, @aigne/afs, @anthropic-ai/claude-agent-sdk
- Docker support (dockerode)
- Vitest for testing

**Key Concepts:**
- **Vibe Panels** - Installable UI components (not hardcoded React)
- **UI-DSL** - Structured schema AI outputs (Page, Section, CardList, Hero, etc.)
- **Data Layer Separation** - AI modifies display only, never business logic
- **Version Control as Infrastructure** - Every change tracked, A/B testing built-in

**Key Features:**
- Vibe Coding - Natural language to deployable UI
- One-click deploy with real data connections
- Built-in A/B testing and instant rollback
- Live document publishing with ZIP security
- Open Graph previews for sharing

**Commands:**
```bash
blocklet dev              # Start development
npm run bundle            # Build client + api
npm run test              # Run Vitest tests
npm run test:coverage     # Coverage report
npm run analyze           # Bundle analysis
```

**Key Message:** "AI doesn't just design it—AI deploys it"

*See /Users/robroyhobbs/work/myvibe/CLAUDE.md for full product guide*

---

#### DocSmith
> AI-Native DocOps Platform - Documentation as accelerator, not burden

- **Category:** B2B Tool
- **Priority:** High
- **Repos:**
  - https://github.com/AIGNE-io/aigne-doc-smith (main)
  - https://github.com/AIGNE-io/doc-smith-skill (Claude Code skill)
- **Tagline:** "Documentation as accelerator, not burden"
- **Core Emotion:** Control (B2B buyers want confidence, not AI randomness)

**What It Is:**
An AI-Native DocOps platform that transforms documentation from a static burden into **living documentation**—dynamic knowledge that evolves with your code.

**Key Differentiator: Repeatability**
- Same codebase → Same documentation (not random AI outputs)
- Diverse teams get consistent information
- Changes are tracked and auditable

**Tech Stack:**
- Node.js 20+, pnpm, Biome
- AIGNE Framework, MCP integration
- Multi-LLM support (OpenAI, Anthropic, Google, AIGNE Hub)

**Key Features:**
- **Agentic Source Analysis** - Semantic understanding, not just parsing
- **Multi-Dimensional Output** - One source → multiple formats, languages, audiences
- **Source-Driven Updates** - Code changes trigger doc regeneration
- **12-language localization** - Professional-grade translation
- **Workspace isolation** - Doesn't pollute source repos

**Commands:**
```bash
pnpm install
npm install -g @aigne/cli
aigne doc --help          # CLI usage
aigne doc create --interactive
```

**Key Message:** "Your code changes, your docs follow"

**Business Model:** B2B hybrid pricing, 70-90% margin potential

*See /Users/robroyhobbs/work/docsmith/CLAUDE.md for full product guide*

---

#### AIGNE ImageSmith
> AI image service for creating AI image applications

- **Repo:** https://github.com/AIGNE-io/aigne-image-smith
- **Category:** Blocklet Service

**Tech Stack:**
- React 19, MUI, Vite
- Express, Sequelize, SQLite/MariaDB
- AIGNE Hub for AI model access
- DID Connect authentication
- PaymentKit credit-based billing

**Commands:**
```bash
npm install
blocklet dev              # Development
npm run bundle            # Production build
npm run deploy            # Deploy
```

---

#### AIGNE Studio
> AI Studio brings AI capabilities to other blocklets

- **Repo:** https://github.com/AIGNE-io/aigne-studio
- **Package:** Blocklet

**Tech Stack:**
- TypeScript 99.5%, pnpm, Lerna
- Playwright for testing
- Husky for git hooks

**Key Features:**
- Flexible prompt creation tool for AI Kit
- Blocklet-based modularity
- Developer-focused AI integration

---

### Upcoming (Q1 2026)

#### Agent Fleet
> Personal AI agent "fleet" - persistent, autonomous AI agents

- **Category:** Infrastructure
- **Concept:** Every user owns a fleet of long-running agents
- **Architecture:** New Blocklet type

---

### Developer Tools

#### ArcBlock Agent Skills
> Claude Code plugins for AI-Native Engineering workflows

- **Repo:** https://github.com/ArcBlock/agent-skills
- **Stack:** Shell 81%, JavaScript 19%
- **License:** MIT

**Key Features:**
- ALP (Active Loading Policy) - context on demand
- Three-tier customization (project → user → plugin)
- Interview-based content creation

**Available Skills:**
| Skill | Purpose |
|-------|---------|
| `arcblock-context` | Company knowledge base |
| `devflow` | Code review, PR automation |
| `blocklet` | Web-to-Blocklet conversion |
| `thinking-framework` | Technical review methodology |
| `content-creation` | Interview-based writing |
| `plugin-development` | Plugin scaffolding |

**Installation:**
```bash
claude
/plugin marketplace add https://github.com/ArcBlock/agent-skills.git
/plugin install arcblock-context@arcblock-agent-skills
```

---

### AIGNE Product Suite Summary

| Product | Status | Purpose |
|---------|--------|---------|
| **AIGNE Framework** | Released | Core AI agent SDK |
| **AIGNE Hub** | Released | Multi-provider AI gateway |
| **AIGNE Studio** | In Dev | AI capabilities for blocklets |
| **AIGNE CLI** | Released | Command-line tools |
| **AIGNE Observability** | Released | Monitoring and debugging |
| **AIGNE DocSmith** | In Dev | AI documentation tool |
| **AIGNE ImageSmith** | Released | AI image generation |
| **AIGNE CodeSmith** | Planned | Code generation |
| **AIGNE WebSmith** | Planned | Web development tools |
| **AIGNE Components** | Released | Reusable components |
| **AIGNE Runtime** | Released | Execution environment |

---

## 2026 Strategy

**Focus:** Resources are very limited - can only focus on 1-2 things.

### Core Funnel Model

```
Traffic Entry (流量入口)
  ArcSphere · MyVibe.so · DocSmith · AIStro
              ↓
Payment Trigger (充值触发)
  AIGNE Hub — "See AI service → Need Credit"
              ↓
Profit Source (利润来源)
  DID Spaces storage fees · Agent service fees · Launcher deployment fees
```

**Key Insight:** USD Credit is the unified value pool - get users to add credits first, the reason doesn't matter.

### Quarterly Priorities

**Q1: Launch + Payment Entry**
- Launch MyVibe.so (P0)
- Launch DocSmith
- AIGNE Hub payment flow
- Agent Fleet → Launcher integration

**Q2: Conversion + High-Margin Services**
- DID Spaces paid upgrades
- Launcher AI Tier
- Cross-product payment guidance

**Q3: Growth + Viral Expansion**
- MyVibe.so content sharing
- AIGNE open source community
- Increase ARPU

**Q4: Consolidation + Next Year Planning**
- PaymentKit external promotion
- Annual review
- 2027 planning

### What NOT to Focus On (2026)

| Item | Reason |
|------|--------|
| AIStro growth promotion | Organic growth only |
| Agent Fleet standalone promotion | Merge into Launcher |
| Blocklet Store new features | Keep free, no investment |

---

## Culture Notes

**Team Philosophy:** "Let team members feel like they're 'playing', not 'working'"

- **Mentor System:** Every new member gets a mentor during trial period
- **1:1 Meetings:** Anyone can request 1:1 with anyone, no hierarchy restrictions
- **Flexible Work:** Complete flexibility except scheduled meetings; trust + results-oriented
- **Bug Bash:** Everyone participates in testing - engineers, product, design, management

---

## Quick Reference

### Common Commands
```bash
# Blocklet development
blocklet dev          # Start local development
blocklet deploy       # Deploy to server
blocklet bundle       # Create deployable bundle

# Testing
npm test              # Run tests
npm run lint          # Check code style
```

### Key URLs

**Products:**
- ArcBlock: https://www.arcblock.io
- MyVibe.so: https://myvibe.so
- AIGNE: https://aigne.io

**Media & Brand:**
- ArcBlock Media Kit: https://www.arcblock.io/docs/arcblock-media-kit/en/media-kit
- ArcSphere Media Kit: https://www.arcblock.io/docs/arcblock-media-kit/en/arcsphere-media-kit
- AIGNE Media Kit: https://www.arcblock.io/docs/arcblock-media-kit/en/77GaHmpWeDm0sUccOF9k3K1c

**GitHub Repositories:**

| Product | Repository |
|---------|------------|
| AIGNE Framework | https://github.com/AIGNE-io/aigne-framework |
| AIGNE Hub | https://github.com/AIGNE-io/aigne-hub |
| AIGNE DocSmith | https://github.com/AIGNE-io/aigne-doc-smith |
| DocSmith Skill | https://github.com/AIGNE-io/doc-smith-skill |
| AIGNE ImageSmith | https://github.com/AIGNE-io/aigne-image-smith |
| AIGNE Studio | https://github.com/AIGNE-io/aigne-studio |
| AFS Research Paper | https://github.com/AIGNE-io/afs-paper |
| Agent Skills | https://github.com/ArcBlock/agent-skills |
| PaymentKit | https://github.com/blocklet/payment-kit |

**Documentation:**
- Blocklet Developer Docs: https://www.arcblock.io/docs/blocklet-developer
- Blocklet CLI: https://www.arcblock.io/docs/blocklet-developer/install-blocklet-cli

---

*Last updated: January 2026*
