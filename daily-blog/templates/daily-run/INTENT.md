# Daily Blog Content Generation — {{DATE}}

## Goal

Generate 4 draft blog articles (one per ArcBlock product line) for {{DATE}}, following the full Daily Blog Content Engine pipeline.

## Context

This is an automated daily content generation task. All instructions are in `/Users/robroyhobbs/work/daily-blog/CLAUDE.md`. Read that file first — it contains the complete engine logic.

**This is NOT a code development task.** This is a content generation pipeline. Do not attempt TDD or test-first development. Instead, execute each phase's steps sequentially and check off items as you complete them.

## Products

- **ArcBlock** — blockchain platform, DID, infrastructure
- **ArcSphere** — AI-native browser, skill system, AFS
- **AIGNE** — open-source AI agent framework
- **MyVibe** — live documents, vibe coding, publishing platform

## Acceptance Criteria

- [ ] 4 draft articles generated in `drafts/{{DATE}}/`
- [ ] Each article passes critical quality checks (voice, accuracy, word count 800-1500)
- [ ] Content calendar and history.json updated
- [ ] No two products share the same content type today
- [ ] All articles have `arcblock` tag and 2-3 inner links

## Key Paths

- **Instructions**: `/Users/robroyhobbs/work/daily-blog/CLAUDE.md`
- **Config**: `/Users/robroyhobbs/work/daily-blog/config.yaml`
- **Task state**: `/Users/robroyhobbs/work/daily-blog/intent/{{DATE}}/TASK.yaml`
- **Drafts output**: `/Users/robroyhobbs/work/daily-blog/drafts/{{DATE}}/`
- **Data files**: `/Users/robroyhobbs/work/daily-blog/data/`

## Out of Scope

- Publishing to Discuss Kit (manual for now)
- Cover image generation
- Social media distribution
- Translation
