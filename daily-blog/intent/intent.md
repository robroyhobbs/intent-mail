# Daily Blog Content Engine — Specification

## 1. Overview

**Product positioning:** Automated daily blog content generation system for ArcBlock's 4 product lines, producing professional, SEO-optimized articles in the founder's authentic voice.

**Core concept:** A TeamSwarm-powered automation pipeline that generates 4 draft blog articles per day (1 per product line: ArcBlock, ArcSphere, AIGNE, MyVibe), with quality scoring, inner linking, and automated diagram/code generation — ready for human final review and publish.

**Priority:** High — daily content engine directly drives organic traffic and SEO authority.

**Target user:** Matt McKinney (CEO AIGNE, Head of Growth ArcBlock) as final reviewer and publisher.

**Project scope:** Build + deploy a fully autonomous daily content pipeline at `/Users/robroyhobbs/work/daily-blog/`.

---

## 2. Architecture

> [!SYNCED] Last synced: 2026-02-07 — TeamSwarm conversion complete

### System Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    DAILY BLOG ENGINE                          │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  TRIGGERS                                                    │
│  ┌──────────┐    ┌──────────┐                                │
│  │ launchd  │───▶│ run.sh   │──┐                             │
│  │ 9:30 AM  │    │          │  │  Creates task from          │
│  └──────────┘    └──────────┘  │  templates/daily-run/       │
│                                │                             │
│  ┌──────────┐                  │                             │
│  │ Manual   │──────────────────┤                             │
│  │ ./run.sh │                  │                             │
│  └──────────┘                  │                             │
│                                ▼                             │
│  TASK LAYER (TeamSwarm-compatible)                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  intent/{date}/                                      │    │
│  │    TASK.yaml   ← status: ready → in_progress → done │    │
│  │    INTENT.md   ← generated from template             │    │
│  │    plan.md     ← 3-phase plan with checkboxes        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                │                             │
│  EXECUTION (single Claude session, all phases)               │
│       ┌───────────────┬───────────────┐                      │
│       ▼               ▼               ▼                      │
│  ┌──────────┐  ┌───────────────┐  ┌──────────┐             │
│  │Phase 0   │  │  Phase 1      │  │Phase 2   │             │
│  │PLANNING  │  │  WRITING      │  │QA        │             │
│  │          │  │               │  │          │             │
│  │-Calendar │  │-4 Articles    │  │-Checklist│             │
│  │-Keywords │  │  (parallel)   │  │-Links    │             │
│  │-Topics   │  │-SEO/Tags      │  │-History  │             │
│  │-Research │  │-Diagrams/Code │  │          │             │
│  └────┬─────┘  └──────┬────────┘  └────┬─────┘             │
│       │                │                │                    │
│       ▼                ▼                ▼                    │
│  ┌──────────────────────────────────────────────┐           │
│  │         OUTPUT: drafts/{date}/                │           │
│  │  arcblock-{type}.md  │  arcsphere-{type}.md  │           │
│  │  aigne-{type}.md     │  myvibe-{type}.md     │           │
│  └──────────────────────────────────────────────┘           │
│                                                              │
│  RECURRING TASKS                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  intent/keyword-refresh/                             │    │
│  │    TASK.yaml  ← status: ready (set monthly)          │    │
│  │    4 phases: one /keyword-research per product       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  DATA LAYER                                                  │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │keyword-bank│ │content-cal   │ │industry-     │           │
│  │ /data/     │ │ /data/       │ │research (MCP)│           │
│  └────────────┘ └──────────────┘ └──────────────┘           │
│                                                              │
│  KNOWLEDGE LAYER                                             │
│  ┌────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │/arcblock-  │ │/rob-writing  │ │GitHub Releases│           │
│  │ context    │ │ voice profile│ │ (changelogs) │           │
│  └────────────┘ └──────────────┘ └──────────────┘           │
└──────────────────────────────────────────────────────────────┘
```

### Data Layer

| Component         | Storage                            | Purpose                                                                         |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| Keyword Bank      | `data/keyword-bank/{product}.json` | Pre-researched SEO keywords per product (50-100 per product, refreshed monthly) |
| Content Calendar  | `data/content-calendar.json`       | Tracks what type/topic was used for each product each day to prevent repetition |
| Industry Research | MCP claude-mem                     | Stored via MCP memory for cross-agent reusability; searchable by topic/product  |
| Article History   | `data/history.json`                | All generated articles with dates, topics — prevents duplicate topics           |

### Rendering Layer

| Component        | Tool                                 | Usage                                     |
| ---------------- | ------------------------------------ | ----------------------------------------- |
| Article Body     | Claude + /rob-writing voice          | Markdown with frontmatter                 |
| Mermaid Diagrams | Mermaid code blocks                  | Architecture, flow, comparison diagrams   |
| Code Blocks      | From arcblock-context + product docs | Real, working code examples               |
| SEO Metadata     | Generated frontmatter                | title, description, slug, tags, canonical |

---

## 3. Product Lines

### Product-to-Content Mapping

| Product       | Focus Areas                                  | Primary Keywords                                         | Content Angle                              |
| ------------- | -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| **ArcBlock**  | Platform, blockchain, DID, infrastructure    | blockchain platform, decentralized identity, self-hosted | Enterprise infrastructure, Web3 enablement |
| **ArcSphere** | AI browser, skill system, AFS                | AI browser, agentic file system, skill browser           | AI-native computing, user empowerment      |
| **AIGNE**     | AI framework, agent engineering, open-source | AI framework, agentic AI, functional programming         | Developer productivity, AI app building    |
| **MyVibe**    | Live documents, publishing, vibe coding      | live documents, AI publishing, vibe coding               | Creator tools, modern publishing           |

### Content Types with Weights

| Content Type      | Weight | Frequency            | Diagram?    | Code?     | Length    |
| ----------------- | ------ | -------------------- | ----------- | --------- | --------- |
| How-to            | 20%    | ~6/month             | Yes         | Yes       | 1000-1500 |
| Tutorial          | 15%    | ~4/month             | Yes         | Yes       | 1200-1500 |
| Guide             | 15%    | ~4/month             | Yes         | Sometimes | 1000-1500 |
| Listicle          | 15%    | ~4/month             | Optional    | No        | 800-1200  |
| Overview          | 10%    | ~3/month             | Yes         | No        | 800-1200  |
| Product Update    | 10%    | ~2/month (bi-weekly) | Optional    | Yes       | 800-1200  |
| Industry Analysis | 10%    | ~3/month             | Optional    | No        | 1000-1500 |
| Comparison        | 5%     | ~1/month             | Yes (table) | Sometimes | 1000-1500 |

### Rotation Rules

1. **No two products get the same content type on the same day**
2. **No product gets the same content type within 5 days**
3. **Product updates only when new GitHub releases exist (checked bi-weekly)**
4. **Industry analysis requires fresh web research** (stored to MCP memory)
5. **Content calendar tracks 30 days of history** to prevent recent repetition (history.json keeps all articles forever for audit)

---

## 4. Article Specification

### Frontmatter Schema

```yaml
---
title: "SEO-optimized title (50-60 chars)"
slug: "seo-url-friendly-slug"
description: "Meta description (150-160 chars)"
date: "2026-02-07"
product: "arcblock|arcsphere|aigne|myvibe"
content_type: "how-to|tutorial|guide|listicle|overview|product-update|industry|comparison"
tags:
  - arcblock # Always included
  - [product-specific]
  - [topic-specific]
author: "Matt McKinney"
status: "draft"
seo_keyword: "primary target keyword"
---
```

### Article Structure Template

```markdown
# {Title — Hook-driven, not generic}

{Opening paragraph — Problem or pain point, quantified if possible}

{Context paragraph — Why this matters now, industry framing}

## {Section 1 — Core content}

{Problem → Solution → Impact arc per rob-writing voice}

{Mermaid diagram if content-type warrants it}

## {Section 2 — Deep dive / Examples}

{Concrete examples, use cases, code blocks where relevant}

## {Section 3 — Practical takeaway}

{What the reader should do next}

## Key Takeaways

- {Bullet 1}
- {Bullet 2}
- {Bullet 3}

---

_{Inner linking — contextual links woven into narrative, 2-3 other ArcBlock products}_
```

### Quality Gate: Pass/Fail Checklist

_(Post-critique: Replaced weighted numeric scoring with honest pass/fail. Claude scoring its own work with "8.5/10" is false precision.)_

**Critical checks (any failure → article flagged for rework):**

- [x] **Voice match** — Passes rob-writing quality checklist (opens with hook, not generic; customer angle in first 3 paragraphs; one clear insight; concrete example; active voice; no AI-sounding phrases)
- [x] **Factual accuracy** — All product claims sourced from /arcblock-context. No invented features or capabilities. No unsubstantiated claims.
- [x] **Word count** — 800-1500 words

**Standard checks (failures noted but don't block):**

- [x] **SEO** — Target keyword in title, at least one H2, and meta description. Slug is URL-friendly.
- [x] **Inner links** — 2-3 contextual product links present
- [x] **Not repetitive** — Topic/angle not duplicated from last 30 days (checked against content-calendar.json)
- [x] **Media appropriate** — Diagrams/code included per content-type rules (not forced where unnecessary)

**Result:** All critical checks pass → "passed" in TASK.yaml. Any critical failure → "needs-rework" with specific note.

---

## 5. Technical Implementation Guide

> [!SYNCED] Last synced: 2026-02-07 — TeamSwarm conversion

### Project Structure

_(Claude IS the engine. All logic lives in CLAUDE.md instructions. No compiled code.)_

```
/Users/robroyhobbs/work/daily-blog/
├── run.sh                    # Entry point: creates task + runs all ready tasks
├── config.yaml               # Product lines, weights, rotation rules
├── CLAUDE.md                 # All agent instructions (voice, calendar, QA)
│
├── templates/
│   └── daily-run/
│       ├── INTENT.md         # Template for daily task intent ({{DATE}} substituted)
│       └── plan.md           # Template for daily plan (3 phases with checkboxes)
│
├── taskswarm/
│   └── config.yaml           # Swarm config (no git, 2h max, local locks)
│
├── data/
│   ├── keyword-bank/
│   │   ├── arcblock.json     # 84 keywords
│   │   ├── arcsphere.json    # 85 keywords
│   │   ├── aigne.json        # 87 keywords
│   │   └── myvibe.json       # 85 keywords
│   ├── content-calendar.json # 30-day rolling history
│   └── history.json          # All articles ever (audit trail)
│
├── drafts/
│   └── {YYYY-MM-DD}/
│       ├── arcblock-{content-type}.md
│       ├── arcsphere-{content-type}.md
│       ├── aigne-{content-type}.md
│       └── myvibe-{content-type}.md
│
├── intent/
│   ├── {date}/               # Daily tasks (generated from templates)
│   │   ├── TASK.yaml         # Swarm-compatible: status, phase, assignee, heartbeat
│   │   ├── INTENT.md         # What to generate today
│   │   └── plan.md           # 3-phase plan with checkboxes
│   ├── keyword-refresh/      # Monthly recurring task
│   │   ├── TASK.yaml         # Set to "ready" monthly
│   │   ├── INTENT.md
│   │   └── plan.md           # 4 phases (one per product)
│   ├── intent.md             # This file
│   ├── overview.md
│   ├── plan.md               # Build plan (5 phases, all done)
│   └── TASK.yaml             # Build status: done 5/5
│
├── io.dailyblog.automation.plist  # launchd schedule (9:30 AM daily)
│
└── logs/
    ├── failures/             # Error logs
    ├── launchd-stdout.log
    └── launchd-stderr.log
```

### Execution Model: TeamSwarm

> [!SYNCED] Changed from 3-session serial model to TeamSwarm single-session execution

**Entry point:** `./run.sh` (called by launchd or manually)

```
./run.sh
    │
    ├── Creates intent/{date}/ from templates/daily-run/ (if not exists)
    │   ├── INTENT.md  ({{DATE}} → actual date)
    │   ├── plan.md    ({{DATE}} → actual date)
    │   └── TASK.yaml  (status: ready, phase: 0/3)
    │
    ├── Lists all pending tasks (daily + keyword-refresh + future)
    │
    └── Launches single Claude session that executes ALL ready tasks:
        ├── Phase 0: Planning (content types, keywords, topics)
        ├── Phase 1: Writing (4 parallel articles via Task agents)
        └── Phase 2: QA (checklist, history update)
```

**Manual use from Claude Code:**
```
cd ~/work/daily-blog
./run.sh --create        # Create today's task only
/swarm run               # Execute via swarm
```

### TASK.yaml State Machine (Swarm-Compatible)

```yaml
# Daily task: intent/{date}/TASK.yaml
status: ready|in_progress|done|review
owner: null
assignee: null|"hostname (tty)"
phase: 0/3
updated: "2026-02-07T09:30:00Z"
heartbeat: "2026-02-07T09:35:00Z"
note: "Daily blog generation for 2026-02-07"

# After planning completes, articles section is added:
articles:
  arcblock:
    content_type: "how-to"
    keyword: "DID wallet for business"
    topic: "How to Replace Password Databases with DID Wallets"
    status: pending|drafted|passed|needs-rework
    file: "drafts/2026-02-07/arcblock-how-to.md"
    checklist_failures: []
    word_count: 1278
```

### Session Workflow (3 Phases, Single Session)

#### Phase 0: Planning

```
Input: config.yaml, content-calendar.json, keyword-bank/
Output: TASK.yaml articles section + content-calendar.json update

Steps:
1. Read content-calendar.json — what was generated in last 30 days?
2. Apply weighted rotation — pick content type per product
   (no two products get same type today, 5-day cooldown per product/type)
3. Select keyword from keyword-bank for each article
4. For industry-type articles: web research → store to MCP memory
5. For product-update articles: check GitHub releases for new content
6. Write articles section to TASK.yaml
7. Update content-calendar.json with today's selections
```

#### Phase 1: Writing + Media

```
Input: TASK.yaml plan, arcblock-context, rob-writing voice
Output: 4 complete draft articles in drafts/{date}/

Steps (parallel via Task agents — 4 simultaneous):
1. Load /arcblock-context {product} for product knowledge
2. Load /rob-writing voice profile
3. Generate complete article following rob-writing patterns
4. Include Mermaid diagrams + code blocks per content-type rules
5. Generate SEO-optimized frontmatter
6. Insert 2-3 contextual inner links
7. Write to drafts/{date}/{product}-{type}.md
```

#### Phase 2: Quality Assurance

```
Input: Complete articles from Phase 1
Output: Checked articles, history updated

Steps (per article):
1. Run pass/fail checklist (3 critical + 4 standard checks)
2. Mark each article as "passed" or "needs-rework"
3. Update history.json with all articles
4. Set TASK.yaml status to done
```

### Discuss Kit API Integration (Deferred)

```
Status: Research incomplete. Deferred to future scope.
URL: https://www.arcblock.io/blog/blog/new

Strategy when implemented:
1. Investigate Discuss Kit API at /.well-known/service/
2. If API available: create draft posts automatically
3. If not: continue with local markdown output
```

---

## 6. Decisions Summary

> [!SYNCED] Last synced: 2026-02-07

| Decision          | Choice                                            | Rationale                                                   |
| ----------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| Execution model   | TeamSwarm + launchd (9:30 AM daily)               | Single command runs everything; swarm-compatible tasks       |
| Trigger           | Both: launchd automatic + manual `./run.sh`       | Automation daily + on-demand flexibility                     |
| Voice             | /rob-writing skill profile                        | Already captured Matt's voice with detailed guidelines      |
| Product knowledge | /arcblock-context skill                           | 19 products documented with positioning and architecture    |
| Content calendar  | Weighted rotation                                 | Ensures diversity, prevents same-day type collision         |
| Keywords          | Pre-built bank, monthly refresh via swarm task    | Stable SEO targets, avoids daily API overhead               |
| Quality gate      | Pass/fail checklist (3 critical + 4 standard)     | Honest assessment over false-precision numeric scores       |
| Draft storage     | Local markdown files                              | Human review before publish; CMS API deferred               |
| Industry research | MCP memory (claude-mem)                           | Reusable by any agent, searchable, persistent               |
| Inner linking     | 2-3 contextually relevant products                | Organic feel, focused link equity                           |
| Media             | Content-type driven                               | Not every article needs diagrams; match format to type      |
| Article length    | 800-1500 words                                    | Matches rob-writing quality checklist, respects reader time |
| Blog platform     | ArcBlock Discuss Kit at arcblock.io/blog          | Automated draft creation deferred, manual publishing for now|
| Sessions          | Single session, 3 phases (plan → write → QA)     | TeamSwarm runs all phases; writing parallelized via agents  |
| Code              | Zero (Claude IS the engine)                       | No TypeScript src/. CLAUDE.md has all logic. JSON for data. |
| Task format       | Swarm-compatible TASK.yaml + INTENT.md + plan.md  | Works with `/swarm run`, `/swarm list`, launchd             |

---

## 7. MVP Scope

### Included (Phase 1) — COMPLETE

- [x] Project scaffolding (directories, config.yaml, CLAUDE.md)
- [x] CLAUDE.md with all agent instructions (calendar rules, voice, QA checklist, content-type notes)
- [x] Keyword bank initialization (341 keywords across 4 products)
- [x] run.sh orchestrator with TeamSwarm integration
- [x] launchd plist for 9:30 AM daily trigger
- [x] TASK.yaml state machine for recovery (swarm-compatible format)
- [x] Local markdown draft output with frontmatter
- [x] data/content-calendar.json (30-day rolling)
- [x] data/history.json (all articles, forever)
- [x] Failure logging (logs/failures/)
- [x] Templates for daily task generation (templates/daily-run/)
- [x] TaskSwarm config (taskswarm/config.yaml)
- [x] Integration test: 4 articles generated and QA-passed for 2026-02-07

### Included (Phase 2 — partially done)

- [ ] Discuss Kit API integration for automated draft creation
- [ ] GitHub changelog auto-fetcher (bi-weekly refresh)
- [ ] Industry research pipeline with web search → MCP memory
- [x] Monthly keyword bank refresh automation (intent/keyword-refresh/)
- [ ] Quality score trend reporting

### Excluded

- Cover image generation (Matt handles this)
- Social media distribution (future enhancement)
- Auto-publishing (Matt does final review and publish)
- Multi-language article translation
- Email newsletter integration

---

## 8. Risks

| Risk                                  | Impact | Mitigation                                                                              |
| ------------------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Content sounds repetitive across days | Medium | Weighted rotation + 30-day history check + 5-day same-type cooldown                     |
| Factual hallucination about products  | High   | All product claims sourced exclusively from /arcblock-context. No invented features.    |
| SEO keyword cannibalization           | Medium | Keyword bank assigns distinct terms per product. Calendar prevents overlap.             |
| Context overflow in writing session   | Medium | Parallel Task agents for 4 articles. Each agent loads only its product context.         |
| Discuss Kit API unavailable           | Low    | Deferred. Local markdown files with manual publishing for now.                          |
| Voice drift from Matt's style         | Medium | rob-writing quality checklist as automated check. Feedback loop after reviews.          |
| Changelog data gaps                   | Low    | Graceful degradation: skip product-update type if no new releases.                      |

---

## 9. Open Items

1. ~~**Discuss Kit API investigation**~~ — Deferred. Research incomplete. URL confirmed: https://www.arcblock.io/blog/blog/new
2. ~~**GitHub repo URLs for changelogs**~~ — Resolved. Configured in config.yaml: ArcBlock/blocklet-server, ArcBlock/agent-skills, AIGNE-io/aigne-framework, AIGNE-io/aigne-hub, AIGNE-io/aigne-doc-smith
3. ~~**Keyword bank seeding**~~ — Resolved. 341 keywords: arcblock=84, arcsphere=85, aigne=87, myvibe=85
4. ~~**Blog URL for published URL**~~ — Resolved. https://www.arcblock.io/blog/

**Remaining:**
5. **Discuss Kit automated publishing** — Research and implement API integration when ready
6. **GitHub changelog auto-fetcher** — Automate bi-weekly release checking

---

## 10. Finalized Implementation Details

> Synced on: 2026-02-07
> Status: MVP complete + TeamSwarm conversion

### Integration Test Results (2026-02-07)

| Product | Content Type | Keyword | Words | Status |
|---------|-------------|---------|-------|--------|
| ArcBlock | how-to | DID wallet for business | 1,278 | passed |
| ArcSphere | overview | AI native browser | 1,220 | passed |
| AIGNE | tutorial | TypeScript AI agent framework | 1,522 | passed |
| MyVibe | listicle | vibe coding for marketers | 1,237 | passed |

All 4 articles passed critical quality checks (voice, accuracy, word count). No banned phrases. All have arcblock tag, 2-3 inner links, SEO keywords in frontmatter.

### Keyword Bank Summary

| Product | Keywords | Top Clusters |
|---------|----------|-------------|
| ArcBlock (84) | DID, blockchain platform, self-hosted, decentralized identity |
| ArcSphere (85) | AI browser, skill system, agentic file system, AI-native |
| AIGNE (87) | AI agent framework, TypeScript AI, functional composition |
| MyVibe (85) | vibe coding, live documents, AI publishing, natural language UI |

### Key Files

| File | Lines | Purpose |
|------|-------|---------|
| `CLAUDE.md` | ~456 | Complete engine instructions for all 3 phases |
| `config.yaml` | 105 | Products, content types, weights, rotation rules |
| `run.sh` | ~120 | Entry point: task creation + swarm execution |
| `templates/daily-run/INTENT.md` | ~45 | Daily task intent template |
| `templates/daily-run/plan.md` | ~130 | Daily task plan template (3 phases) |
| `taskswarm/config.yaml` | ~25 | Swarm config (no git, 2h max) |
