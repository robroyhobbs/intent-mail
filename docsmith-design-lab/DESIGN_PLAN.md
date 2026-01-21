# DocSmith Showcase Page - Design Plan

## Design Lab URL
```bash
cd /Users/robroyhobbs/work/docsmith-design-lab && python3 -m http.server 8080
# Open http://localhost:8080
```

---

## Best Method to Find the Best Version

### 1. Quick Scan (2 min)
Click through each variation (V1-V5) to get a gut feel. Note which ones immediately feel right.

### 2. Side-by-Side Compare
Use the **"Side-by-Side"** button to compare your top 2 picks directly. Look at:
- Hero section impact
- AI search box implementation
- Gallery/project display
- Next steps clarity
- CTA prominence

### 3. Evaluate Against Goals

| Goal | Which Variation Handles It Best? |
|------|----------------------------------|
| **Show scope/breadth** | V2 (masonry), V5 (table + sidebar) |
| **AI search personality** | V3 (chat-first), V6 (synthesized) |
| **Clear next steps** | V1 (numbered), V4 (journey scroll) |
| **Deploy CTA** | All have prominent CTAs |

### 4. View V6: Synthesized
This combines the best elements from your feedback:
- AI chat interface from V3
- Masonry gallery from V2
- Numbered steps from V1
- Pill filters from V2
- Input hints from V3

---

## Synthesized Design (V6) Summary

Based on your feedback, V6 combines:

### Hero Section
- **AI chat interface** as primary interaction (from V3)
- Friendly greeting: "Hey, I'm your docs buddy"
- Smart colleague tone
- Example cards embedded in AI response

### Gallery Section
- **Masonry layout** with varying card heights (from V2)
- **Pill-style filters** with counts (from V2)
- Quick framework filtering

### Input Area
- **Suggested prompts/hints** below input (from V3)
- Prominent send button
- Focus state with subtle glow

### Next Steps
- **Numbered step cards** (from V1)
- Three clear actions: Connect Repo, Generate Docs, Deploy
- Each card has its own CTA button

### CTAs
- Primary: "Connect Your Repo" (most prominent)
- Secondary: "Deploy Your Own"
- Both appear in nav, chat actions, and footer

---

## Implementation Plan

### Phase 1: Component Structure
```
src/components/showcase/
├── ShowcaseHero/
│   ├── index.tsx
│   ├── AIAvatar.tsx
│   ├── ChatMessage.tsx
│   └── SearchInput.tsx
├── ProjectGallery/
│   ├── index.tsx
│   ├── FilterPills.tsx
│   ├── MasonryGrid.tsx
│   └── ProjectCard.tsx
├── NextSteps/
│   ├── index.tsx
│   └── StepCard.tsx
└── FooterCTA/
    └── index.tsx
```

### Phase 2: Core Components

#### 1. AI Search Box Component
```tsx
// Features:
// - Focus state reveals AI greeting
// - Suggested prompts below input
// - Smart colleague personality
// - Keyboard shortcut hint (⌘K)
```

#### 2. Masonry Gallery Component
```tsx
// Features:
// - CSS columns-based masonry (no JS needed)
// - Responsive breakpoints (3 → 2 → 1 columns)
// - Varying card heights (tall/medium/short)
// - Hover state with lift effect
```

#### 3. Filter Pills Component
```tsx
// Features:
// - Horizontal scrollable on mobile
// - Count badges for each category
// - Active state styling
// - Framework icons (React, Python, etc.)
```

#### 4. Next Steps Cards
```tsx
// Features:
// - Numbered steps (01, 02, 03)
// - Icon with gradient background
// - Individual CTA per card
// - Hover lift effect
```

### Phase 3: Styling

#### Design Tokens (already in ArcBlock brand)
```css
--primary: #4598fa;
--secondary: #00b8db;
--success: #28A948;
--bg-dark: #0a0a0f;
--bg-card: #12121a;
--text-primary: #ffffff;
--text-secondary: #a0a0b0;
```

#### Typography
- Headings: `Bai Jamjuree`
- Body: `Inter`
- UI elements: `Lexend`
- Logo: `Audiowide`

### Phase 4: Interactions

1. **AI Search Focus**
   - Border color transition to primary
   - Box shadow glow effect
   - AI greeting reveal (slide down)

2. **Gallery Card Hover**
   - Border color change
   - translateY(-4px) lift
   - Enhanced shadow

3. **Filter Pills**
   - Click toggles active state
   - Smooth background transition

4. **Input Hints**
   - Click fills input with suggestion
   - Hover highlights hint

### Phase 5: Accessibility

- [ ] All interactive elements keyboard accessible
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader announcements for AI responses
- [ ] Reduced motion support

---

## Files Created

| File | Purpose |
|------|---------|
| `index.html` | Design Lab hub with navigation |
| `variations/v1-command-center.html` | Terminal-inspired design |
| `variations/v2-gallery-flow.html` | Pinterest masonry design |
| `variations/v3-ai-first.html` | Chat-based interface |
| `variations/v4-story-journey.html` | Narrative scroll design |
| `variations/v5-dashboard-grid.html` | Notion/Linear inspired |
| `variations/v6-synthesized.html` | **Final synthesized design** |

---

## Recommended Next Steps

1. **View V6 in Design Lab** - Start the server and review the synthesized design
2. **Side-by-Side Compare** - Compare V6 with V3 (most similar in approach)
3. **Identify Refinements** - Note any specific elements to adjust
4. **Begin Implementation** - Use component structure above

---

## Quick Commands

```bash
# Start Design Lab
cd /Users/robroyhobbs/work/docsmith-design-lab && python3 -m http.server 8080

# View in browser
open http://localhost:8080
```

---

*Generated by Design and Refine - January 2026*
