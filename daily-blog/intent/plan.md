# Execution Plan: Daily Blog Content Engine

## Overview

Build an automated daily blog content generation pipeline that produces 4 draft articles per day (one per ArcBlock product line) using Claude as the engine. No compiled code — just `run.sh`, `CLAUDE.md`, `config.yaml`, and JSON data files.

## Prerequisites

- Claude CLI installed and working (`claude -p` supported)
- Skills installed: `/arcblock-context`, `/rob-writing`, `/keyword-research`
- MCP server `claude-mem` available for industry research storage
- Internet access for web research and GitHub release checking

---

## Phase 0: Project Scaffolding + Configuration

### Description

Create the project directory structure, config.yaml with product lines and content type weights, and empty data files with correct schema. This is the foundation everything else builds on.

### Tests

#### Happy Path

- [x] All required directories exist: `data/keyword-bank/`, `drafts/`, `intent/`, `logs/failures/`
- [x] config.yaml is valid YAML and parseable
- [x] config.yaml contains all 4 product lines with correct names
- [x] config.yaml contains all 8 content types with weights summing to 100%
- [x] Empty data files have correct JSON schema: `content-calendar.json` (empty array), `history.json` (empty array)

#### Bad Path

- [x] config.yaml rejects unknown product names (only arcblock, arcsphere, aigne, myvibe)
- [x] config.yaml weights that don't sum to 100% are documented as error condition in CLAUDE.md
- [x] Missing config.yaml causes run.sh to exit with clear error message

#### Edge Cases

- [x] Running scaffolding twice doesn't overwrite existing data files (idempotent)
- [x] Directories with existing content are preserved

#### Security

- [x] No credentials or API keys stored in config.yaml or any committed file
- [x] .gitignore excludes sensitive files if git is initialized

#### Data Leak

- [x] No personal information in scaffolding files
- [x] Config file doesn't contain absolute paths that expose system structure (use relative paths where possible)

#### Data Damage

- [x] Existing drafts/ content not deleted by scaffolding
- [x] Existing data/ JSON files not overwritten

### E2E Gate

```bash
# Verify all directories exist
ls -d /Users/robroyhobbs/work/daily-blog/{data/keyword-bank,drafts,intent,logs/failures}

# Verify config.yaml is valid
python3 -c "import yaml; yaml.safe_load(open('/Users/robroyhobbs/work/daily-blog/config.yaml'))"

# Verify data files are valid JSON
python3 -c "import json; json.load(open('/Users/robroyhobbs/work/daily-blog/data/content-calendar.json'))"
python3 -c "import json; json.load(open('/Users/robroyhobbs/work/daily-blog/data/history.json'))"

# Verify config has 4 products
python3 -c "
import yaml
c = yaml.safe_load(open('/Users/robroyhobbs/work/daily-blog/config.yaml'))
products = [p['name'] for p in c['products']]
assert set(products) == {'arcblock', 'arcsphere', 'aigne', 'myvibe'}, f'Missing products: {products}'
print('✓ All 4 products configured')
"
```

### Acceptance Criteria

- [ ] Directory structure matches intent spec
- [ ] config.yaml has products, content types, weights, rotation rules
- [ ] Empty data files initialized with correct schema
- [ ] E2E Gate passes

---

## Phase 1: CLAUDE.md Agent Instructions

### Description

Write the CLAUDE.md file — the brain of the entire system. This single file contains ALL agent instructions: content calendar rotation logic, rob-writing voice integration, quality checklist, content-type-specific notes, SEO rules, inner linking rules, and per-session instructions. This is the most critical file in the project.

### Tests

#### Happy Path

- [x] CLAUDE.md contains Session 1 (Planning) instructions with weighted rotation algorithm
- [x] CLAUDE.md contains Session 2 (Writing + Media) instructions with rob-writing voice reference
- [x] CLAUDE.md contains Session 3 (QA) instructions with pass/fail checklist
- [x] CLAUDE.md references /arcblock-context skill for product knowledge loading
- [x] CLAUDE.md references /rob-writing skill for voice profile loading
- [x] CLAUDE.md includes content-type-specific notes for all 8 types
- [x] CLAUDE.md includes SEO frontmatter schema with all required fields
- [x] CLAUDE.md includes inner linking rules (2-3 contextual products, always include arcblock tag)
- [x] CLAUDE.md includes article structure template

#### Bad Path

- [x] CLAUDE.md explicitly instructs: "Never invent product features not in /arcblock-context"
- [x] CLAUDE.md instructs: "If keyword-bank is empty for a product, skip that product and log error"
- [x] CLAUDE.md instructs: "If content-calendar.json is missing, create it with empty array"
- [x] CLAUDE.md instructs error handling: what to do when a session fails mid-execution

#### Edge Cases

- [x] CLAUDE.md handles first-ever run (no history, no calendar data)
- [x] CLAUDE.md handles case where all content types were used in last 5 days for a product
- [x] CLAUDE.md handles product-update type when no GitHub releases exist

#### Security

- [x] CLAUDE.md does not contain any credentials or tokens
- [x] CLAUDE.md instructs agents not to expose internal file paths in article content

#### Data Leak

- [x] CLAUDE.md instructs: article content must not reference internal tools, skills, or automation
- [x] CLAUDE.md instructs: no mention of "AI-generated" in article output

#### Data Damage

- [x] CLAUDE.md instructs: always read TASK.yaml before writing to avoid overwriting parallel work
- [x] CLAUDE.md instructs: update content-calendar.json atomically (read → modify → write)

### E2E Gate

```bash
# Verify CLAUDE.md exists and has substantial content
wc -l /Users/robroyhobbs/work/daily-blog/CLAUDE.md | awk '{if ($1 > 100) print "✓ CLAUDE.md has", $1, "lines"; else print "✗ CLAUDE.md too short:", $1, "lines"}'

# Verify key sections exist
for section in "Session 1" "Session 2" "Session 3" "Quality" "Checklist" "Rotation" "SEO" "Inner Link" "rob-writing" "arcblock-context"; do
  grep -qi "$section" /Users/robroyhobbs/work/daily-blog/CLAUDE.md && echo "✓ Found: $section" || echo "✗ Missing: $section"
done

# Verify all 8 content types mentioned
for type in "how-to" "tutorial" "guide" "listicle" "overview" "product-update" "industry" "comparison"; do
  grep -qi "$type" /Users/robroyhobbs/work/daily-blog/CLAUDE.md && echo "✓ Content type: $type" || echo "✗ Missing type: $type"
done
```

### Acceptance Criteria

- [ ] CLAUDE.md is comprehensive (200+ lines)
- [ ] All 3 session instructions clearly documented
- [ ] Quality pass/fail checklist is complete
- [ ] Content-type notes cover all 8 types
- [ ] Error handling for all edge cases documented
- [ ] E2E Gate passes

---

## Phase 2: Keyword Bank Seeding

### Description

Run `/keyword-research` for each of the 4 product lines to populate `data/keyword-bank/{product}.json` with 50-100 SEO target keywords per product. These keyword banks are what the planning session draws from daily.

### Tests

#### Happy Path

- [x] arcblock.json has 50+ keywords with search volume estimates
- [x] arcsphere.json has 50+ keywords with search volume estimates
- [x] aigne.json has 50+ keywords with search volume estimates
- [x] myvibe.json has 50+ keywords with search volume estimates
- [x] Each keyword entry has: term, estimated_volume, difficulty, content_angle
- [x] Keywords are distinct per product (no significant overlap)

#### Bad Path

- [x] If /keyword-research fails for one product, others still complete
- [x] If fewer than 50 keywords found, file still created with available keywords + warning logged
- [x] Invalid/empty keyword research results don't create empty files

#### Edge Cases

- [x] Keywords with special characters are properly escaped in JSON
- [x] Very long-tail keywords (5+ words) are included
- [x] Product-specific terms don't bleed across products

#### Security

- [x] Keyword files don't contain competitor trademarks in ways that could cause issues
- [x] No API keys or search tool credentials stored in output files

#### Data Leak

- [x] Keyword research data doesn't expose internal product roadmap beyond public info

#### Data Damage

- [x] Running keyword research twice doesn't corrupt existing keyword bank (overwrites cleanly)
- [x] Each product file is written independently (one failure doesn't affect others)

### E2E Gate

```bash
# Verify all 4 keyword bank files exist and have content
for product in arcblock arcsphere aigne myvibe; do
  FILE="/Users/robroyhobbs/work/daily-blog/data/keyword-bank/${product}.json"
  if [ -f "$FILE" ]; then
    COUNT=$(python3 -c "import json; print(len(json.load(open('$FILE'))))")
    echo "✓ ${product}.json: ${COUNT} keywords"
  else
    echo "✗ ${product}.json: MISSING"
  fi
done

# Verify JSON validity
for product in arcblock arcsphere aigne myvibe; do
  python3 -c "import json; json.load(open('/Users/robroyhobbs/work/daily-blog/data/keyword-bank/${product}.json'))" && echo "✓ ${product}.json valid JSON" || echo "✗ ${product}.json invalid"
done
```

### Acceptance Criteria

- [x] All 4 keyword bank files populated with 50+ keywords each
- [x] Keywords are relevant to each product's focus areas
- [x] JSON files are valid and well-structured
- [x] E2E Gate passes

---

## Phase 3: run.sh Orchestrator + launchd Plist

### Description

Create the `run.sh` shell orchestrator that routes to the correct Claude session based on TASK.yaml phase, and the macOS launchd plist for 9:30 AM daily automation. This is the execution backbone.

### Tests

#### Happy Path

- [x] run.sh creates today's intent/ and drafts/ directories
- [x] run.sh reads TASK.yaml phase correctly and routes to right session
- [x] run.sh handles phase 0 → Session 1 (Planning)
- [x] run.sh handles phase 1 → Session 2 (Writing + Media)
- [x] run.sh handles phase 2 → Session 3 (QA)
- [x] run.sh handles phase 3 → prints "complete" message with drafts path
- [x] launchd plist has correct schedule (9:30 AM daily)
- [x] launchd plist points to correct run.sh path

#### Bad Path

- [x] run.sh with no TASK.yaml defaults to phase 0 (fresh start)
- [x] run.sh with invalid TASK.yaml content exits with error
- [x] run.sh with corrupted phase value defaults to phase 0
- [x] Claude session failure (non-zero exit) is caught and logged to logs/failures/
- [x] run.sh exits cleanly if already at phase 3 (done)

#### Edge Cases

- [x] Running run.sh multiple times on same day resumes from correct phase (idempotent)
- [x] Running at midnight (date boundary) uses correct date
- [x] run.sh works when drafts/ directory already has files from a previous partial run

#### Security

- [x] run.sh doesn't expose environment variables to Claude sessions unnecessarily
- [x] launchd plist runs with user permissions, not root
- [x] No hardcoded credentials in run.sh

#### Data Leak

- [x] Failure logs don't include full Claude session output (could contain product context)
- [x] launchd stdout/stderr logs are in project directory, not system-wide

#### Data Damage

- [x] run.sh doesn't delete existing drafts when resuming
- [x] run.sh doesn't reset TASK.yaml when resuming a failed session
- [x] Concurrent run.sh invocations are prevented (lockfile or launchd ThrottleInterval)

### E2E Gate

```bash
# Verify run.sh is executable
test -x /Users/robroyhobbs/work/daily-blog/run.sh && echo "✓ run.sh is executable" || echo "✗ run.sh not executable"

# Verify run.sh syntax
bash -n /Users/robroyhobbs/work/daily-blog/run.sh && echo "✓ run.sh syntax OK" || echo "✗ run.sh syntax error"

# Verify launchd plist is valid XML
plutil -lint /Users/robroyhobbs/work/daily-blog/io.dailyblog.automation.plist && echo "✓ plist valid" || echo "✗ plist invalid"

# Verify run.sh phase routing (dry run - just check routing logic)
# Create a test TASK.yaml and verify correct session would be selected
mkdir -p /tmp/daily-blog-test/intent/2026-01-01
echo "phase: 0" > /tmp/daily-blog-test/intent/2026-01-01/TASK.yaml
PHASE=$(grep "^phase:" /tmp/daily-blog-test/intent/2026-01-01/TASK.yaml | awk '{print $2}')
test "$PHASE" = "0" && echo "✓ Phase read correctly: $PHASE" || echo "✗ Phase read failed: $PHASE"
rm -rf /tmp/daily-blog-test
```

### Acceptance Criteria

- [x] run.sh routes to correct session for each phase (0-3)
- [x] run.sh handles missing/corrupt TASK.yaml gracefully
- [x] run.sh logs failures properly
- [x] launchd plist is valid and configured for 9:30 AM
- [x] E2E Gate passes

---

## Phase 4: Integration Test — Full Day Dry Run

### Description

Execute one complete daily cycle: run all 3 sessions end-to-end for a single day to produce 4 draft articles. Verify the entire pipeline works: planning selects topics, writing produces articles, and QA validates them. This is the "it actually works" proof.

### Tests

#### Happy Path

- [x] Session 1 (Planning) creates TASK.yaml with 4 article assignments
- [x] Each article has unique content_type (no same-day collision)
- [x] Each article has a keyword from the product's keyword bank
- [x] Session 2 (Writing) produces 4 markdown files in drafts/{date}/
- [x] Each article has complete frontmatter (title, slug, description, date, product, content_type, tags)
- [x] Each article has "arcblock" in tags
- [x] Each article has 2-3 inner links to other products
- [x] Each article is 800-1500 words
- [x] Articles with how-to/tutorial type include Mermaid diagram and code block
- [x] Session 3 (QA) runs pass/fail checklist on each article
- [x] Passing articles marked "ready-for-review" in TASK.yaml
- [x] content-calendar.json updated with today's selections
- [x] history.json updated with all 4 articles

#### Bad Path

- [x] If writing session produces an article under 800 words, QA flags it
- [x] If an article contains claims not in /arcblock-context, QA flags it
- [x] If inner links are missing, QA notes it as standard check failure

#### Edge Cases

- [x] First-ever run with empty content-calendar.json works correctly
- [x] All 4 articles use different content types
- [x] No product's keyword is reused from a recent run

#### Security

- [x] Generated articles don't contain internal file paths or system information
- [x] Articles don't reference Claude, AI generation, or automation tools
- [x] No credentials appear in any generated content

#### Data Leak

- [x] Article frontmatter doesn't include quality scores or internal metadata beyond what's needed for publishing
- [x] TASK.yaml checklist_failures don't appear in article output

#### Data Damage

- [x] Running integration test doesn't corrupt keyword bank
- [x] Running integration test twice on same day resumes rather than overwriting

### E2E Gate

```bash
DATE=$(date +%Y-%m-%d)
DRAFTS="/Users/robroyhobbs/work/daily-blog/drafts/$DATE"

# Verify 4 articles exist
ARTICLE_COUNT=$(ls "$DRAFTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
test "$ARTICLE_COUNT" -eq 4 && echo "✓ 4 articles generated" || echo "✗ Expected 4, found $ARTICLE_COUNT"

# Verify each article has frontmatter
for f in "$DRAFTS"/*.md; do
  head -1 "$f" | grep -q "^---" && echo "✓ $(basename $f): has frontmatter" || echo "✗ $(basename $f): missing frontmatter"
done

# Verify word counts
for f in "$DRAFTS"/*.md; do
  WC=$(wc -w < "$f" | tr -d ' ')
  if [ "$WC" -ge 800 ] && [ "$WC" -le 1800 ]; then
    echo "✓ $(basename $f): $WC words"
  else
    echo "✗ $(basename $f): $WC words (expected 800-1500)"
  fi
done

# Verify arcblock tag in all articles
for f in "$DRAFTS"/*.md; do
  grep -q "arcblock" "$f" && echo "✓ $(basename $f): arcblock tag" || echo "✗ $(basename $f): missing arcblock tag"
done

# Verify TASK.yaml completed
TASK="/Users/robroyhobbs/work/daily-blog/intent/$DATE/TASK.yaml"
grep -q "phase: 3" "$TASK" && echo "✓ TASK.yaml phase 3 (done)" || echo "✗ TASK.yaml not at phase 3"

# Verify data files updated
python3 -c "
import json
cal = json.load(open('/Users/robroyhobbs/work/daily-blog/data/content-calendar.json'))
hist = json.load(open('/Users/robroyhobbs/work/daily-blog/data/history.json'))
print(f'✓ Calendar entries: {len(cal)}')
print(f'✓ History entries: {len(hist)}')
"
```

### Acceptance Criteria

- [x] 4 draft articles generated for today's date
- [x] All articles pass critical quality checks (voice, accuracy, word count)
- [x] Content calendar and history updated correctly
- [x] TASK.yaml shows phase 3 (complete)
- [x] Articles are publication-worthy quality (human review)
- [x] E2E Gate passes

---

## Final E2E Verification

```bash
#!/bin/bash
# Full system verification after all phases complete
echo "=== Daily Blog Engine — Full Verification ==="

PROJECT="/Users/robroyhobbs/work/daily-blog"
DATE=$(date +%Y-%m-%d)

# 1. Structure
echo ""
echo "--- Structure ---"
for dir in data/keyword-bank drafts intent logs/failures; do
  test -d "$PROJECT/$dir" && echo "✓ $dir/" || echo "✗ $dir/ missing"
done
for file in run.sh config.yaml CLAUDE.md; do
  test -f "$PROJECT/$file" && echo "✓ $file" || echo "✗ $file missing"
done

# 2. Config
echo ""
echo "--- Config ---"
python3 -c "import yaml; c=yaml.safe_load(open('$PROJECT/config.yaml')); print(f'✓ {len(c[\"products\"])} products, {len(c[\"content_types\"])} content types')"

# 3. Keyword Banks
echo ""
echo "--- Keyword Banks ---"
for p in arcblock arcsphere aigne myvibe; do
  F="$PROJECT/data/keyword-bank/${p}.json"
  if [ -f "$F" ]; then
    python3 -c "import json; kw=json.load(open('$F')); print(f'✓ {p}: {len(kw)} keywords')"
  else
    echo "✗ $p: no keyword bank"
  fi
done

# 4. Orchestrator
echo ""
echo "--- Orchestrator ---"
test -x "$PROJECT/run.sh" && echo "✓ run.sh executable" || echo "✗ run.sh not executable"
bash -n "$PROJECT/run.sh" && echo "✓ run.sh syntax OK" || echo "✗ run.sh syntax error"

# 5. Today's Output (if integration test ran)
echo ""
echo "--- Today's Output ---"
DRAFTS="$PROJECT/drafts/$DATE"
if [ -d "$DRAFTS" ]; then
  ARTICLE_COUNT=$(ls "$DRAFTS"/*.md 2>/dev/null | wc -l | tr -d ' ')
  echo "✓ $ARTICLE_COUNT articles in $DRAFTS"
  for f in "$DRAFTS"/*.md; do
    WC=$(wc -w < "$f" | tr -d ' ')
    echo "  - $(basename $f): $WC words"
  done
else
  echo "⊘ No drafts yet (integration test not run)"
fi

# 6. launchd
echo ""
echo "--- Automation ---"
PLIST="$PROJECT/io.dailyblog.automation.plist"
test -f "$PLIST" && echo "✓ launchd plist exists" || echo "✗ launchd plist missing"

echo ""
echo "=== Verification Complete ==="
```

## Risk Mitigation

| Risk                                                         | Mitigation                                                       | Contingency                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| CLAUDE.md instructions too vague → inconsistent output       | Include concrete examples for each content type                  | Iterate on CLAUDE.md after first week of articles          |
| Keyword research produces low-quality terms                  | Manual review of keyword banks before first run                  | Re-run /keyword-research with refined product descriptions |
| Writing session context overflow with 4 articles             | Use subagents (Task tool) for parallel article writing           | Fall back to sequential writing if subagents fail          |
| QA session rates everything as "pass" (self-assessment bias) | Quality checklist is pass/fail, not numeric; you do final review | Add specific "red flag" patterns to check for              |
| launchd fails silently                                       | Logs to project directory; check with `launchctl list`           | Add notification script that alerts on no-output days      |

## References

- [Intent Specification](./intent.md)
- [Overview](./overview.md)
- [Rob-Writing Voice Profile](/Users/robroyhobbs/.claude/skills/rob-writing/SKILL.md)
- [ArcBlock Context Plugin](/Users/robroyhobbs/.claude/plugins/cache/arcblock-agent-skills/arcblock-context/)
- [DocSmith Daily Architecture](/Users/robroyhobbs/work/docsmith-daily/) (reference pattern)
