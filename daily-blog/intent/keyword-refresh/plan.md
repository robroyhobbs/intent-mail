# Execution Plan: Keyword Bank Refresh

> **IMPORTANT**: This is a keyword research task, NOT a code development task.
> Use the `/keyword-research` skill for each product. Do NOT attempt TDD.

---

## Phase 0: ArcBlock Keywords

### Steps

- [ ] Load /arcblock-context arcblock for product knowledge
- [ ] Run /keyword-research for ArcBlock (platform, blockchain, DID, infrastructure)
- [ ] Save results to data/keyword-bank/arcblock.json (50+ keywords)
- [ ] Verify JSON is valid and has required fields (term, estimated_volume, difficulty, content_angle)

### E2E Gate

```bash
FILE="/Users/robroyhobbs/work/daily-blog/data/keyword-bank/arcblock.json"
python3 -c "import json; kw=json.load(open('$FILE')); print(f'PASS: {len(kw)} keywords') if len(kw) >= 50 else print(f'FAIL: only {len(kw)} keywords')"
```

---

## Phase 1: ArcSphere Keywords

### Steps

- [ ] Load /arcblock-context arcsphere for product knowledge
- [ ] Run /keyword-research for ArcSphere (AI browser, skill system, AFS)
- [ ] Save results to data/keyword-bank/arcsphere.json (50+ keywords)
- [ ] Verify JSON is valid and has required fields

### E2E Gate

```bash
FILE="/Users/robroyhobbs/work/daily-blog/data/keyword-bank/arcsphere.json"
python3 -c "import json; kw=json.load(open('$FILE')); print(f'PASS: {len(kw)} keywords') if len(kw) >= 50 else print(f'FAIL: only {len(kw)} keywords')"
```

---

## Phase 2: AIGNE Keywords

### Steps

- [ ] Load /arcblock-context aigne for product knowledge
- [ ] Run /keyword-research for AIGNE (AI framework, agent engineering, TypeScript)
- [ ] Save results to data/keyword-bank/aigne.json (50+ keywords)
- [ ] Verify JSON is valid and has required fields

### E2E Gate

```bash
FILE="/Users/robroyhobbs/work/daily-blog/data/keyword-bank/aigne.json"
python3 -c "import json; kw=json.load(open('$FILE')); print(f'PASS: {len(kw)} keywords') if len(kw) >= 50 else print(f'FAIL: only {len(kw)} keywords')"
```

---

## Phase 3: MyVibe Keywords

### Steps

- [ ] Load /arcblock-context myvibe for product knowledge
- [ ] Run /keyword-research for MyVibe (live documents, vibe coding, publishing)
- [ ] Save results to data/keyword-bank/myvibe.json (50+ keywords)
- [ ] Verify JSON is valid and has required fields

### E2E Gate

```bash
FILE="/Users/robroyhobbs/work/daily-blog/data/keyword-bank/myvibe.json"
python3 -c "import json; kw=json.load(open('$FILE')); print(f'PASS: {len(kw)} keywords') if len(kw) >= 50 else print(f'FAIL: only {len(kw)} keywords')"
```
