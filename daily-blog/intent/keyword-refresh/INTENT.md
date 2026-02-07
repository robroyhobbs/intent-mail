# Monthly Keyword Bank Refresh

## Goal

Refresh the SEO keyword banks for all 4 ArcBlock product lines. Run `/keyword-research` for each product to update `data/keyword-bank/{product}.json` with current, high-value keywords.

## Context

The daily blog engine draws from keyword banks each day. Keywords get stale over time as search trends shift. This task refreshes them monthly.

**This is NOT a code development task.** This is a research and data generation task. Execute the keyword research skill for each product and save results.

## Acceptance Criteria

- [ ] arcblock.json refreshed with 50+ keywords
- [ ] arcsphere.json refreshed with 50+ keywords
- [ ] aigne.json refreshed with 50+ keywords
- [ ] myvibe.json refreshed with 50+ keywords
- [ ] All JSON files are valid and well-structured
- [ ] Keywords are distinct per product (minimal overlap)

## Product Focus Areas

- **ArcBlock**: Platform, blockchain, DID, infrastructure, self-hosted, decentralized identity
- **ArcSphere**: AI browser, skill system, AFS, agentic file system, AI-native browsing
- **AIGNE**: AI framework, agent engineering, open-source, TypeScript AI agents, functional composition
- **MyVibe**: Live documents, publishing, vibe coding, AI-native publishing, natural language to UI

## Out of Scope

- Article generation (that's the daily task)
- Content calendar management
- Publishing
