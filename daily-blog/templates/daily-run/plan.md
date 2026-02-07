# Execution Plan: Daily Blog — {{DATE}}

> **IMPORTANT**: This is a content generation task, NOT a code development task.
> Do NOT attempt TDD or write test files. Execute each step and check it off.
> Read `/Users/robroyhobbs/work/daily-blog/CLAUDE.md` for full instructions.

---

## Phase 0: Planning

### Description

Pick today's content type and keyword for each product. Apply weighted rotation to ensure diversity. Write the assignments to the daily TASK.yaml.

### Steps

- [ ] Read config.yaml (products, content types, weights, rotation rules)
- [ ] Read data/content-calendar.json (last 30 days of history)
- [ ] Read data/keyword-bank/{product}.json for all 4 products
- [ ] Apply weighted rotation: select content type per product (no same-day collision, 5-day cooldown)
- [ ] Select unused keyword per product from keyword bank (not used in last 30 days)
- [ ] Generate compelling topic angles for each article
- [ ] If any product got "industry" type: do web research, store to MCP memory
- [ ] If any product got "product-update" type: check GitHub releases
- [ ] Write article assignments to intent/{{DATE}}/TASK.yaml (articles section)
- [ ] Update data/content-calendar.json with today's selections
- [ ] Update TASK.yaml phase to 1

### E2E Gate

```bash
TASK="/Users/robroyhobbs/work/daily-blog/intent/{{DATE}}/TASK.yaml"
grep -q "phase: 1" "$TASK" && echo "PASS: Phase updated to 1" || echo "FAIL: Phase not updated"
for p in arcblock arcsphere aigne myvibe; do
  grep -q "$p:" "$TASK" && echo "PASS: $p assignment found" || echo "FAIL: $p assignment missing"
done
```

---

## Phase 1: Writing

### Description

Write 4 complete articles with frontmatter, diagrams, code blocks, and inner links. Use parallel Task agents for speed.

### Steps

- [ ] Load /rob-writing voice profile
- [ ] Write ArcBlock article (load /arcblock-context arcblock, follow CLAUDE.md Session 2 instructions)
- [ ] Write ArcSphere article (load /arcblock-context arcsphere, follow CLAUDE.md Session 2 instructions)
- [ ] Write AIGNE article (load /arcblock-context aigne, follow CLAUDE.md Session 2 instructions)
- [ ] Write MyVibe article (load /arcblock-context myvibe, follow CLAUDE.md Session 2 instructions)
- [ ] Verify all 4 article files exist in drafts/{{DATE}}/
- [ ] Update TASK.yaml: set each article status to "drafted", update phase to 2

### Writing Guidance

For each article:
1. Load the product's context via `/arcblock-context {product}`
2. Load `/rob-writing` for voice calibration
3. Follow the article structure template in CLAUDE.md Session 2
4. Include Mermaid diagrams and code blocks per content-type rules
5. Include 2-3 inner links to other ArcBlock products
6. Save to `drafts/{{DATE}}/{product}-{content-type}.md`

**Parallel execution recommended**: Use Task tool to write all 4 articles simultaneously.

### E2E Gate

```bash
DRAFTS="/Users/robroyhobbs/work/daily-blog/drafts/{{DATE}}"
ARTICLE_COUNT=$(ls "$DRAFTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
test "$ARTICLE_COUNT" -eq 4 && echo "PASS: 4 articles" || echo "FAIL: $ARTICLE_COUNT articles"
for f in "$DRAFTS"/*.md; do
  WC=$(wc -w < "$f" | tr -d ' ')
  echo "$(basename $f): $WC words"
done
```

---

## Phase 2: Quality Assurance

### Description

Review each article against the pass/fail checklist. Mark passing articles as ready. Update history.

### Steps

- [ ] QA ArcBlock article: voice match, factual accuracy, word count (800-1500), SEO, inner links
- [ ] QA ArcSphere article: voice match, factual accuracy, word count (800-1500), SEO, inner links
- [ ] QA AIGNE article: voice match, factual accuracy, word count (800-1500), SEO, inner links
- [ ] QA MyVibe article: voice match, factual accuracy, word count (800-1500), SEO, inner links
- [ ] Update TASK.yaml: set each article status to "passed" or "needs-rework" with checklist_failures
- [ ] Update data/history.json with all 4 articles
- [ ] Set TASK.yaml status to done, phase to 3

### QA Checklist (per article)

**Critical (any failure blocks):**
- Voice match: opens with hook, customer angle, concrete example, active voice, no AI phrases
- Factual accuracy: all claims from /arcblock-context, no invented features
- Word count: 800-1500 words

**Standard (noted but don't block):**
- SEO: keyword in title, H2, meta description
- Inner links: 2-3 product links present
- Not repetitive: topic not duplicated from last 30 days
- Media appropriate: diagrams/code per content-type rules

### E2E Gate

```bash
DATE="{{DATE}}"
DRAFTS="/Users/robroyhobbs/work/daily-blog/drafts/$DATE"

# Word counts
for f in "$DRAFTS"/*.md; do
  WC=$(wc -w < "$f" | tr -d ' ')
  if [ "$WC" -ge 800 ] && [ "$WC" -le 1800 ]; then
    echo "PASS $(basename $f): $WC words"
  else
    echo "FAIL $(basename $f): $WC words"
  fi
done

# arcblock tag
for f in "$DRAFTS"/*.md; do
  grep -q "arcblock" "$f" && echo "PASS $(basename $f): arcblock tag" || echo "FAIL $(basename $f): missing arcblock tag"
done

# No banned phrases
for f in "$DRAFTS"/*.md; do
  if grep -qi "in today's fast-paced\|revolutionize\|game-changing\|delve into" "$f"; then
    echo "FAIL $(basename $f): banned phrases found"
  else
    echo "PASS $(basename $f): no banned phrases"
  fi
done

# TASK.yaml done
TASK="/Users/robroyhobbs/work/daily-blog/intent/$DATE/TASK.yaml"
grep -q "status: done" "$TASK" && echo "PASS: status done" || echo "FAIL: not done"

# History updated
python3 -c "import json; h=json.load(open('/Users/robroyhobbs/work/daily-blog/data/history.json')); today=[x for x in h if x['date']=='$DATE']; print(f'PASS: {len(today)} entries for $DATE') if len(today)==4 else print(f'FAIL: {len(today)} entries')"
```

### Acceptance Criteria

- [ ] All 4 articles pass critical quality checks
- [ ] history.json has 4 entries for today
- [ ] TASK.yaml status is done
