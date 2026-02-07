# Daily Blog Content Engine — Agent Instructions

> This file is the ENTIRE engine. Claude reads this and knows exactly what to do for each session.
> No compiled code. No external scripts. Just these instructions + JSON data files.

## System Overview

You are generating **4 blog articles per day** — one for each ArcBlock product line:
- **ArcBlock** — blockchain platform, DID, infrastructure
- **ArcSphere** — AI-native browser, skill system, AFS
- **AIGNE** — open-source AI agent framework
- **MyVibe** — live documents, vibe coding, publishing platform

Articles publish to **https://www.arcblock.io/blog/** as drafts for human review.

## Critical Rules (READ FIRST)

1. **NEVER invent product features** not documented in `/arcblock-context`. If you're unsure about a capability, load the product context and verify.
2. **NEVER reference internal tools, automation, or AI generation** in article content. Articles read as if written by Matt McKinney personally.
3. **NEVER include internal file paths, system info, or automation details** in articles.
4. **ALL claims must be substantiated.** No "revolutionary," no "game-changing," no unverified statistics. If you can't back it up, don't say it.
5. **Load `/rob-writing` at the start of every writing session** to calibrate voice.
6. **Load `/arcblock-context {product}` before writing each product's article** for accurate product knowledge.
7. **Always read TASK.yaml before writing to it** to avoid overwriting state from another session.

## Project Paths

```
PROJECT: /Users/robroyhobbs/work/daily-blog
CONFIG:  config.yaml
DATA:    data/content-calendar.json, data/history.json, data/keyword-bank/{product}.json
DRAFTS:  drafts/{YYYY-MM-DD}/{product}-{content-type}.md
STATE:   intent/{YYYY-MM-DD}/TASK.yaml
LOGS:    logs/failures/{YYYY-MM-DD}.md
```

---

# SESSION 1: PLANNING (Phase 0)

## What You Do

Pick today's content type and keyword for each product, ensuring diversity. Write the plan to TASK.yaml.

## Step-by-Step

### 1. Read Current State

```
Read: config.yaml → products, content_types, rotation_rules
Read: data/content-calendar.json → what was generated in last 30 days
Read: data/keyword-bank/{product}.json → available keywords per product
```

### 2. Apply Weighted Rotation

Pick a content type for each product using these rules:

**Weights** (probability of selection):
| Type | Weight |
|------|--------|
| how-to | 20% |
| tutorial | 15% |
| guide | 15% |
| listicle | 15% |
| overview | 10% |
| product-update | 10% |
| industry | 10% |
| comparison | 5% |

**Constraints:**
- **No same-day collision**: Each product MUST get a different content type today
- **5-day cooldown**: A product cannot get the same content type it had within the last 5 days
- **product-update requires releases**: Only assign product-update if the product has GitHub releases in the last 14 days. Check repos listed in config.yaml.
- **industry requires research**: If assigned, you MUST do web research in this session and store findings to MCP memory.

**Algorithm:**
1. For each product, build a list of eligible content types (not used in last 5 days for this product)
2. Remove any type already assigned to another product today
3. From eligible types, pick one using weights as probability
4. If no eligible types remain (all used recently), pick the least-recently-used type

### 3. Select Keywords

For each product-article pair:
1. Read `data/keyword-bank/{product}.json`
2. Check `data/history.json` for recently used keywords (last 30 days)
3. Pick a keyword NOT used in the last 30 days
4. If all keywords were used recently, pick the one with the oldest usage date

### 4. Generate Topic Angles

For each article, create a specific, compelling topic angle that combines:
- The selected content type's format
- The selected keyword
- Current relevance (what makes this timely?)

**Good examples:**
- how-to + "decentralized identity" → "How to Add Passwordless Login with DIDs in 30 Minutes"
- listicle + "AI agent frameworks" → "5 Patterns Every AI Agent Developer Should Know in 2026"
- industry + "vibe coding" → "Why Low-Code is Dead: The Rise of Vibe Coding"

**Bad examples (too generic):**
- "Introduction to ArcBlock" ← no hook, no angle
- "Why AIGNE is Great" ← marketing fluff, not substantive

### 5. Industry Research (if assigned)

If any product got the "industry" content type:
1. Use WebSearch to research the topic area
2. Find 3-5 relevant recent developments, competitor moves, or industry trends
3. Store findings to MCP memory using claude-mem with tags: `blog-research`, `{product}`, `{topic}`
4. Record enough detail that the writing session can reference it without re-researching

### 6. Write TASK.yaml

```yaml
date: "{today}"
status: in_progress
phase: 1  # Ready for writing session
owner: planning-agent

articles:
  arcblock:
    content_type: "{selected type}"
    keyword: "{selected keyword}"
    topic: "{topic angle}"
    status: pending
    file: "drafts/{today}/arcblock-{type}.md"
    checklist_failures: []
  arcsphere:
    content_type: "{selected type}"
    keyword: "{selected keyword}"
    topic: "{topic angle}"
    status: pending
    file: "drafts/{today}/arcsphere-{type}.md"
    checklist_failures: []
  aigne:
    content_type: "{selected type}"
    keyword: "{selected keyword}"
    topic: "{topic angle}"
    status: pending
    file: "drafts/{today}/aigne-{type}.md"
    checklist_failures: []
  myvibe:
    content_type: "{selected type}"
    keyword: "{selected keyword}"
    topic: "{topic angle}"
    status: pending
    file: "drafts/{today}/myvibe-{type}.md"
    checklist_failures: []

updated: "{ISO timestamp}"
note: ""
```

### 7. Update Content Calendar

Append today's selections to `data/content-calendar.json`:
```json
{
  "date": "2026-02-07",
  "assignments": {
    "arcblock": {"content_type": "how-to", "keyword": "decentralized identity"},
    "arcsphere": {"content_type": "overview", "keyword": "AI browser"},
    "aigne": {"content_type": "tutorial", "keyword": "AI agent framework"},
    "myvibe": {"content_type": "listicle", "keyword": "vibe coding"}
  }
}
```

Keep only the last 30 days of entries. Trim older entries.

### 8. Handle Errors

- If `config.yaml` is missing: exit with error, log to `logs/failures/`
- If `keyword-bank/{product}.json` is empty or missing: skip that product, log warning, continue with others
- If `content-calendar.json` is missing: create it with empty array and proceed

---

# SESSION 2: WRITING + MEDIA (Phase 1)

## What You Do

Write 4 complete articles with frontmatter, diagrams, code blocks, and inner links.

## Step-by-Step

### 1. Read the Plan

```
Read: intent/{today}/TASK.yaml → article assignments
```

### 2. For Each Article (4 total)

#### a. Load Context

```
Load: /arcblock-context {product}     → product knowledge
Load: /rob-writing                    → voice profile
```

If content type is "industry": search MCP memory for research stored in planning session.
If content type is "product-update": check GitHub releases for the product's repos.

#### b. Write the Article

**Voice (from /rob-writing):**
- Direct, anti-fluff, problem-solver's voice
- Problem → Solution → Impact arc
- One strong conceptual anchor or metaphor per article
- Quantified claims only (back everything up)
- Active voice, short sentences, respect reader's time
- Open with a hook, not a generic intro ("In today's world..." ← NEVER)

**Structure:**

```markdown
---
title: "{SEO title, 50-60 chars, keyword included}"
slug: "{url-friendly-slug-with-keyword}"
description: "{Meta description, 150-160 chars, includes keyword}"
date: "{YYYY-MM-DD}"
product: "{arcblock|arcsphere|aigne|myvibe}"
content_type: "{type}"
tags:
  - arcblock
  - {product tag from config.yaml}
  - {1-2 topic-specific tags}
author: "Matt McKinney"
status: "draft"
seo_keyword: "{primary keyword}"
---

# {Title — hook-driven, compelling}

{Opening paragraph: Problem or pain point, quantified if possible. Why should the reader care RIGHT NOW?}

{Context paragraph: Industry framing. What's changing? Why does this matter?}

## {Section 1 heading — includes keyword variant if natural}

{Core content following Problem → Solution → Impact arc}

{Mermaid diagram — if content type warrants it (see rules below)}

## {Section 2 heading}

{Deep dive with concrete examples, use cases}

{Code block — if content type warrants it (see rules below)}

## {Section 3 heading — practical takeaway}

{What the reader should do next. Actionable, specific.}

## Key Takeaways

- {Takeaway 1 — most important insight}
- {Takeaway 2 — practical action}
- {Takeaway 3 — forward-looking perspective}

---

{Inner links: 2-3 contextual references to other ArcBlock products.
 Write these as natural mentions, not a "Related Products" section.
 Example: "If you're building agents with [AIGNE](https://aigne.io), you can deploy them instantly via [ArcBlock's Blocklet Server](https://www.arcblock.io)..."}
```

#### c. Content-Type Specific Notes

| Type | Diagram? | Code? | Special Notes |
|------|----------|-------|---------------|
| **how-to** | Yes (workflow/process flow) | Yes (real working example) | Numbered steps, clear prerequisites, expected outcome stated upfront |
| **tutorial** | Yes (architecture or data flow) | Yes (full walkthrough) | Step-by-step, beginner-friendly, show terminal/code output |
| **guide** | Yes (conceptual/architecture) | If naturally relevant | Comprehensive, covers multiple approaches, decision framework |
| **listicle** | Optional (comparison table ok) | No | Numbered items, each with clear value statement, scannable headers |
| **overview** | Yes (system architecture) | No | High-level, positioning-focused, "what and why" not "how" |
| **product-update** | Optional | Yes (new API/feature code) | Lead with user impact not technical changes, link to changelog |
| **industry** | Optional (market landscape ok) | No | Data-driven, cite sources, acknowledge competitors fairly |
| **comparison** | Yes (comparison table required) | If comparing technical approaches | Fair, balanced, let data speak, include "best for" recommendations |

#### d. Inner Linking Rules

Every article must include **2-3 contextual links** to other ArcBlock products:
- Links must feel natural, not forced
- Write them as part of the narrative, not a separate "Related" section
- At minimum, reference the parent brand (ArcBlock)
- Use actual product URLs from config.yaml

**Link URLs:**
- ArcBlock: https://www.arcblock.io
- ArcSphere: https://www.arcblock.io (product page)
- AIGNE: https://aigne.io
- AIGNE Framework: https://github.com/AIGNE-io/aigne-framework
- MyVibe: https://myvibe.so
- DocSmith: https://docsmith.aigne.io
- AIGNE Hub: https://github.com/AIGNE-io/aigne-hub

### 3. Write Article Files

Save each article to `drafts/{today}/{product}-{content-type}.md`

### 4. Update TASK.yaml

Set each article's status to `drafted` and update phase to `2`.

### 5. Handle Errors

- If /arcblock-context fails to load: use config.yaml product description as fallback, note in TASK.yaml
- If an article runs too long (>1500 words): trim, prioritize substance over padding
- If an article runs too short (<800 words): add another concrete example or use case

---

# SESSION 3: QUALITY ASSURANCE (Phase 2)

## What You Do

Review each article against the pass/fail checklist. Mark passing articles as ready for review. Flag failures.

## Step-by-Step

### 1. Read State

```
Read: intent/{today}/TASK.yaml → article list and files
```

### 2. For Each Article, Run Checklist

#### CRITICAL CHECKS (any failure → article flagged "needs-rework")

**Voice Match:**
- [ ] Opens with a hook, not a generic intro
- [ ] Customer angle clear within first 3 paragraphs
- [ ] One clear insight or takeaway
- [ ] At least one concrete example included
- [ ] At least one metaphor used effectively
- [ ] No jargon without explanation
- [ ] Active voice dominant (read-aloud test)
- [ ] No AI-sounding phrases ("In today's fast-paced world", "revolutionize", "game-changing", "delve into")
- [ ] No marketing fluff ("simply", "just", "easy")

**Factual Accuracy:**
- [ ] All product claims match /arcblock-context documentation
- [ ] No invented features or capabilities
- [ ] No unsubstantiated statistics or claims
- [ ] Technical details are correct (API names, package names, etc.)

**Word Count:**
- [ ] Article body (excluding frontmatter) is 800-1500 words

#### STANDARD CHECKS (noted but don't block)

**SEO:**
- [ ] Target keyword appears in title
- [ ] Target keyword appears in at least one H2
- [ ] Target keyword appears in meta description
- [ ] Slug is URL-friendly and includes keyword
- [ ] Slug is under 60 characters

**Inner Links:**
- [ ] 2-3 contextual links to other ArcBlock products present
- [ ] Links are natural, not forced "Related Products" section
- [ ] At least one link to arcblock.io

**Repetition:**
- [ ] Topic/angle not duplicated from content-calendar.json (last 30 days)

**Media:**
- [ ] Diagrams/code included per content-type rules
- [ ] Mermaid diagrams are syntactically valid
- [ ] Code blocks use correct language tags and are realistic

### 3. Record Results

Update TASK.yaml for each article:

```yaml
articles:
  {product}:
    status: passed          # or "needs-rework"
    checklist_failures: []  # or ["voice_match", "word_count"]
```

### 4. Update Data Files

**history.json** — Append all 4 articles:
```json
{
  "date": "2026-02-07",
  "product": "arcblock",
  "content_type": "how-to",
  "keyword": "decentralized identity",
  "topic": "How to Add Passwordless Login with DIDs",
  "file": "drafts/2026-02-07/arcblock-how-to.md",
  "status": "passed",
  "word_count": 1230,
  "checklist_failures": []
}
```

### 5. Finalize

Set TASK.yaml:
```yaml
status: done
phase: 3
```

### 6. Store Research

If any industry research was done during writing, store to MCP memory with tags for future retrieval.

### 7. Handle Errors

- If an article file is missing: mark as "needs-rework" with note "file not found"
- If content-calendar.json is missing: create it before updating
- If history.json is corrupted: recreate with just today's entries, log warning

---

# APPENDIX: Voice Quick Reference

From `/rob-writing` — Matt McKinney's voice profile:

**DO:**
- Business impact terms: efficiency loss, silent tax, documentation drift
- Action verbs and outcome-focused language
- Problem → Solution → Impact arc
- One strong conceptual anchor per article
- Quantify the pain before offering the solution
- Bridge technical capabilities to business outcomes

**DON'T:**
- Generic AI openings ("In today's fast-paced world...")
- Marketing fluff ("revolutionary," "game-changing," "transform your...")
- Verbose sentences — if you can say it in 10 words, don't use 20
- Features without the "so what"
- Vague claims without specifics
- Padding paragraphs — every sentence must earn its place

**Signature Metaphors:**
- LEGO blocks (modularity)
- Universal translator (integration)
- Superhighways (infrastructure)
- Fast food vs potluck (centralized vs decentralized)
- Genius locked out of the library (capability without access)

**Article Templates (choose based on content type):**
1. **Industry Insight**: Hook into news → pivot to relevance → explain problem → share insight → frame alternative → takeaway
2. **Product/Feature**: Problem-first → expand pain → introduce solution with anchor metaphor → explain mechanics → frame benefits → use cases → next steps
3. **Comparison/Analysis**: Set up stakes → present framework (table) → analyze by dimension → conclude with perspective
