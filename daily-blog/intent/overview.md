# Daily Blog Content Engine: 4 articles/day across ArcBlock product lines

## One sentence
Automated pipeline that generates 4 SEO-optimized draft blog posts daily (one per product line) in Matt McKinney's authentic voice, with quality scoring, diagrams, and inner linking.

## Why?
ArcBlock has 4 distinct product lines but inconsistent blog cadence. 120 articles/month builds an organic SEO moat, establishes thought leadership, and keeps each product visible — but manual writing at that volume is unsustainable. This engine solves the volume problem without sacrificing quality.

## Core experience

```
9:30 AM daily (launchd trigger)
        │
        ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Session 1   │────▶│  Session 2   │────▶│  Session 3   │────▶│  Session 4   │
│  PLANNING    │     │  WRITING     │     │  MEDIA       │     │  QA + STAGE  │
│              │     │              │     │              │     │              │
│ Pick types   │     │ 4 articles   │     │ Diagrams     │     │ Score 8+/10  │
│ Pick keywords│     │ Rob's voice  │     │ Code blocks  │     │ Inner links  │
│ Check history│     │ SEO optimize │     │ Real examples│     │ Stage drafts │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
                                                              Matt reviews &
                                                              publishes to
                                                              arcblock.io/blog
```

## Architecture

```
┌─────────────────────────────────────────┐
│           /work/daily-blog/             │
├──────────┬──────────┬───────┬───────────┤
│ src/     │ data/    │drafts/│ intent/   │
│          │          │       │           │
│calendar  │keyword-  │{date}/│TASK.yaml  │
│keywords  │bank/     │ 4x.md │(state)    │
│changelog │calendar  │       │           │
│scorer    │history   │       │           │
│publisher │changelogs│       │           │
└──────────┴──────────┴───────┴───────────┘
        │          │            │
        ▼          ▼            ▼
   /arcblock-  /rob-writing   MCP memory
    context     voice         (industry
   (products)  (tone)         research)
```

## Key decisions

| Question | Choice | Why |
|----------|--------|-----|
| How many articles/day? | 4 (1 per product) | Full coverage without overwhelming review |
| Content diversity? | Weighted rotation + 5-day cooldown | Prevents repetition, ensures all types get coverage |
| Quality bar? | 8+/10 strict scoring | Less editing for Matt, higher publish rate |
| Voice source? | /rob-writing skill | Already captured with metaphors, patterns, checklist |
| SEO approach? | Pre-built keyword bank | Stable targets, monthly refresh, no daily API cost |
| Media? | Content-type driven | Tutorials get code+diagrams, listicles may not |
| Publishing? | API with local fallback | Try automated drafts, fall back to markdown |
| Research storage? | MCP memory | Reusable by any agent in any session |

## Scope

**In:** Content calendar, article generation, quality scoring, SEO, diagrams, code blocks, inner linking, local drafts, launchd automation

**Out:** Cover images (Matt handles), social distribution, auto-publish, translations, newsletter

## Risk + Mitigation

| Risk | Fix |
|------|-----|
| Repetitive content | 90-day history + weighted rotation + 5-day cooldown |
| Hallucinated claims | Source ALL facts from /arcblock-context only |
| Voice drift | Automated rob-writing checklist scoring |
| Context overflow | 4-session split, independent articles |

## Next steps

1. `/intent-critique` — Check for over-engineering
2. `/intent-plan` — Generate phased TDD execution plan
3. Build Phase 1 (MVP): scaffolding → calendar → writing → scoring → orchestrator
4. Seed keyword banks with `/keyword-research` per product
5. Test with 1 day of generation, review quality, tune scoring
6. Deploy launchd for daily automation
