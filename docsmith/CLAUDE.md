# DocSmith

> AI-Native DocOps Platform - Documentation as accelerator, not burden

## Vision

DocSmith transforms documentation from a static burden into **living documentation**—dynamic knowledge that evolves with your code, serves both humans and AI, and stays perpetually current. One source of truth generates multiple formats, languages, and audience-specific versions - automatically.

**Core belief:** Documentation should be an accelerator, not a burden.

**Living Documentation means:**
- Docs that breathe with your codebase
- Never outdated, never stale
- Evolves automatically as code changes
- Always reflects what's actually built

### Part of the New Web

DocSmith embodies the shift from the traditional web ("design first, build, publish") to the New Web ("run first, explore, solidify"):

| Traditional Docs | Living Docs (DocSmith) |
|------------------|------------------------|
| Write once, update manually | Evolves with code changes |
| Static snapshots | Dynamic, always current |
| Human-only audience | Serves humans AND AI |
| Separate from code | Breathes with codebase |
| Published then forgotten | Continuously regenerated |

Documentation is no longer a deliverable—it's a **living system** that grows alongside your software.

---

## Product Overview

**Category:** B2B DocOps Platform
**Priority:** High
**Status:** In Development
**Repos:**
- Main: https://github.com/AIGNE-io/aigne-doc-smith
- Claude Skill: https://github.com/AIGNE-io/doc-smith-skill

### What It Is
DocSmith is an **AI-Native DocOps platform** - continuous documentation operations powered by agentic AI that understands your code, synthesizes knowledge, and keeps docs in sync automatically.

### What It's NOT
- Not a static site generator
- Not AI-assisted writing (AI is the foundation, not a feature)
- Not a wiki or knowledge base
- Not template-based doc generation

---

## Core Concepts

### DocOps
Like DevOps transformed deployment, DocOps transforms documentation:
- **Continuous** - Code changes trigger doc updates
- **Automated** - No manual sync required
- **Observable** - Track what's documented, what's stale
- **Collaborative** - Teams work from single source of truth

### AI-Native (Not AI-Assisted)
- **Agentic understanding** - Semantic comprehension of code and context
- **Autonomous synthesis** - Pulls from code, meetings, feedback, design docs
- **Context-aware adaptation** - Adjusts content for audience and format
- **Not templates** - Genuine understanding, not fill-in-the-blank

### Repeatable & Reliable
- **Consistent results** - Same input produces same output, not random AI
- **Source-aligned** - Outputs always match what's actually being built
- **Diverse team confidence** - Engineering, product, and support all trust the same docs
- **Auditable** - Track exactly what generated what, and when

### Single Source of Truth (SSOT)
One knowledge base generates:
- Multiple **formats** (online help, API docs, manuals, PDFs, presentations)
- Multiple **languages** (12 supported)
- Multiple **audiences** (developers, end-users, admins)
- **Consistency guaranteed** across all outputs

---

## Target Audience

**Primary:** Engineering teams, DevRel, technical writers
**Secondary:** Product managers, technical leaders, compliance teams

### User Personas

| Persona | Pain Point | DocSmith Value |
|---------|-----------|----------------|
| **Engineering Lead** | Docs always outdated, team hates writing them | Source-driven updates, automatic sync |
| **DevRel Professional** | Manual translation is slow, inconsistent | 12 languages, one command, SSOT |
| **Product Manager** | Release delays due to doc bottlenecks | Accelerate releases, reduce maintenance |
| **Technical Leader** | No standardization, audit nightmares | Version control, DID/VC compliance |
| **OSS Maintainer** | No time for docs | Professional output, minimal overhead |

---

## Brand Voice & Tone

- **Transformation-focused** - From X to Y language
- **Technical credibility** - Developers will verify claims
- **Operations mindset** - This is infrastructure, not a toy
- **Not salesy** - Let the capability speak

### Key Transformation Messages

| From | To |
|------|-----|
| Static docs | Dynamic knowledge carriers |
| Manual updates | Source-driven automation |
| Isolated silos | Collaborative SSOT |
| Doc burden | Doc accelerator |
| AI-assisted | AI-native |
| Random AI outputs | Repeatable, consistent results |
| Docs vs reality mismatch | Source-aligned accuracy |

### Do Say
- "DocOps for the AI era"
- "Documentation as accelerator, not burden"
- "Single source of truth, infinite outputs"
- "Your code changes, your docs follow"
- "AI-native, not AI-assisted"
- "Repeatable results, not random AI"
- "Every team, same truth"
- "Docs that match reality"
- "Full control and visibility"

### Don't Say
- "AI-powered" (too generic, we're AI-native)
- "Easy documentation" (respect the complexity)
- "Auto-generated" (implies low quality)
- "Replace your tech writers" (augment, not replace)
- "Simple" (it's powerful)
- "Magic" or "automatic" without context (implies unpredictability)

---

## Tech Stack

```
Runtime:  Node.js 20+
Package:  pnpm
Linting:  Biome
AI:       AIGNE Framework, MCP integration
LLMs:     OpenAI, Anthropic, Google, AIGNE Hub
Trust:    DID/Verifiable Credentials for compliance
```

---

## Development

### Commands
```bash
# Installation
pnpm install
npm install -g @aigne/cli

# Usage
aigne doc --help                    # CLI help
aigne doc create --interactive      # Interactive mode

# Code Quality
pnpm run lint                       # Check style
pnpm run lint:fix                   # Auto-fix
pnpm test                           # Run tests
```

### Key Directories
```
agents/                   # AI agent implementations
prompts/                  # LLM prompt templates
types/                    # TypeScript definitions
utils/                    # Utility functions
docs-mcp/                 # MCP integration
```

---

## Key Features

### 1. Agentic Source Analysis
Not just parsing - semantic understanding of:
- Code structure and patterns
- API signatures and behaviors
- Dependencies and relationships
- Existing documentation gaps

### 2. Multi-Dimensional Output
One source generates content tailored by:
- **Format:** Online help, API docs, PDFs, presentations
- **Language:** 12 languages with professional-grade translation
- **Audience:** Developers, admins, end-users, executives

### 3. Source-Driven Updates
Code changes → automatic doc regeneration
- Git integration for version control
- Change detection and targeted updates
- No synchronization lag

### 4. Trusted Documentation System
Enterprise-grade compliance:
- Version history and audit trails
- DID/Verifiable Credentials integration
- Git-native workflows

### 5. Extensible Skill System
Add AI capabilities for new document types:
- Custom output formats
- Domain-specific adaptations
- Integration with existing tools

### 6. Workspace Isolation
Independent projects without source pollution:
- Clean separation from codebase
- Portable documentation workspaces
- Team-friendly collaboration

---

## Business Model

- **B2B Hybrid Pricing**
- **Target Margin:** 70-90%
- Credits via AIGNE Hub
- Enterprise tiers for compliance features

---

## Key Messaging

### Primary Positioning
**"AI-Native DocOps Platform"**

### Tagline
**"Documentation as accelerator, not burden"**

### Core Emotion: **Control**
B2B buyers want confidence and visibility - not AI randomness. DocSmith delivers:
- One source of truth they can trust
- Outputs that always match what's actually being built
- Full visibility into what's documented and what's stale
- Repeatable results, not random generation

### Supporting Messages
- "Living documentation that evolves with your code"
- "Single source of truth, infinite outputs"
- "Your code changes, your docs follow"
- "Repeatable results, not random AI"
- "DocOps for the AI era"
- "Every team, same truth"
- "Never outdated, never stale"

### Elevator Pitch
> DocSmith is the AI-native DocOps platform that gives you control over documentation. One source of truth generates docs in any format, any language, for any audience - with repeatable, consistent results. Your code changes, your docs follow. Every team works from the same truth.

### Value Proposition by Persona

| Persona | Pain Point | DocSmith Message |
|---------|-----------|------------------|
| **Engineering Lead** | "Docs are always wrong" | "Docs that match reality - automatically synced with your code" |
| **DevRel** | "Manual translation is inconsistent" | "12 languages, one source. Consistent across every version." |
| **Product Manager** | "Can't trust the docs" | "Single source of truth your whole team can rely on" |
| **Technical Leader** | "Audit nightmare" | "Full traceability - know exactly what generated what, when" |
| **Diverse Teams** | "Different teams, different docs" | "Engineering, support, and sales all work from the same truth" |

### Key Differentiator: Repeatability
Unlike general AI tools, DocSmith is **designed for repeatability**:
- Same codebase → Same documentation (not random outputs)
- Diverse teams get consistent information
- Changes are tracked and auditable
- Trust that docs reflect what's actually built

### Proof Points (to develop)
- **Consistency:** Repeatable results across runs
- **Accuracy:** Source-aligned outputs
- **Coverage:** 12 languages, multiple formats
- **Compliance:** DID/VC, full audit trail
- **Time savings:** Hours → Minutes

---

## Competitive Positioning

| Competitor | Their Approach | DocSmith Difference |
|------------|---------------|---------------------|
| **ReadMe** | Hosted API docs | Generation, not just hosting; SSOT |
| **GitBook** | Manual editing | Agentic generation from code |
| **Mintlify** | Pretty templates | AI-native understanding, not templates |
| **Notion AI** | General writing | Code-aware, developer-first, DocOps |
| **Swagger/OpenAPI** | API spec → docs | Full codebase understanding, all doc types |

### Why DocSmith Wins
1. **AI-Native vs AI-Assisted** - Others bolt on AI; we're built on it
2. **DocOps vs Doc Tools** - Continuous operations, not point solutions
3. **SSOT vs Fragmentation** - One source, infinite outputs
4. **Agentic vs Template** - Understanding, not fill-in-the-blank

---

## Q1 2026 Goals

- [ ] Public launch
- [ ] Multi-language GA (12 languages)
- [ ] Enterprise compliance features
- [ ] AIGNE Hub credit integration

---

## Related Products

- **AIGNE Framework** - Powers the agentic capabilities
- **AIGNE Hub** - AI gateway, credit management
- **DocSmith Skill** - Claude Code integration

---

## Content Ideas

### Blog Posts
- "What is DocOps? The DevOps revolution comes to documentation"
- "AI-Native vs AI-Assisted: Why the distinction matters"
- "Single Source of Truth: How to end documentation drift"

### Case Studies (to develop)
- Engineering team reduces doc maintenance by X%
- OSS project achieves professional docs with zero dedicated writers
- Enterprise passes audit with DocSmith compliance features

---

*Parent guide: See /Users/robroyhobbs/work/CLAUDE.md for company context*
