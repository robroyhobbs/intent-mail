# MyVibe Free → Creator Upgrade Sequence

Email sequence for engaged free users who are ready to upgrade.

## Trigger Conditions

Send this sequence when ALL are true:
- User on Free plan for 14+ days
- User has created 2+ vibes
- User has NOT upgraded
- User has NOT received this sequence before

## Sequence Overview

| Email | File | Send Day | Subject | Goal |
|-------|------|----------|---------|------|
| 1 | `upgrade-01-limits.html` | Day 14 | You're running out of vibes | Awareness of limits |
| 2 | `upgrade-02-unlock.html` | Day 17 | What 2,000 credits looks like | Show value of Creator |
| 3 | `upgrade-03-proof.html` | Day 20 | "I shipped 12 landing pages last month" | Social proof |
| 4 | `upgrade-04-direct.html` | Day 24 | Quick question about your vibes | Direct ask |

## AI-Native Protocol Notes

**This is an EXECUTION sequence.** Brief was clear:
- Product: MyVibe Creator ($19/mo)
- Audience: Engaged free users (2+ vibes created)
- Bridge: Hit limits → unlock power
- Voice: Creative, empowering, not corporate

**Acceptance Criteria Validation:**
- [x] Each email has single purpose
- [x] Proof points in pitch emails (testimonials, specific numbers)
- [x] CTAs clear (one per email)
- [x] Doesn't feel like "content, content, BUY NOW BUY NOW"
- [x] Natural progression: awareness → value → proof → direct ask

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{first_name}}` | User's first name | Sarah |
| `{{vibes_created}}` | Number of vibes user has created | 3 |
| `{{vibes_remaining}}` | Remaining vibes on free plan | 0 |
| `{{dashboard_url}}` | Link to user dashboard | https://myvibe.so/dashboard |
| `{{upgrade_url}}` | Direct link to upgrade page | https://myvibe.so/upgrade |
| `{{unsubscribe_url}}` | Unsubscribe link | (from email service) |

## Subject Line A/B Variants

### Email 1 (Limits)
- **A:** "You're running out of vibes" (default)
- **B:** "1 vibe left on your free plan"
- **C:** "Your next vibe needs a decision"

### Email 2 (Value)
- **A:** "What 2,000 credits looks like" (default)
- **B:** "100x the vibes. Same simplicity."
- **C:** "The math on Creator"

### Email 3 (Proof)
- **A:** "I shipped 12 landing pages last month" (default)
- **B:** "What creators are building"
- **C:** "From 3 vibes to unlimited"

### Email 4 (Direct)
- **A:** "Quick question about your vibes" (default)
- **B:** "Still thinking about it?"
- **C:** "Your call"

## Success Metrics

| Email | Primary Metric | Target |
|-------|----------------|--------|
| 1 | Open rate | 35%+ |
| 2 | Click to upgrade page | 15%+ |
| 3 | Click to upgrade page | 12%+ |
| 4 | Conversion to Creator | 8%+ overall |

## Behavioral Branching

If your email service supports it:

```
After Email 1:
├── User upgraded? → Exit sequence, move to Creator onboarding
└── No upgrade → Continue to Email 2

After Email 2:
├── User clicked upgrade link? → Tag "upgrade-interested"
├── User upgraded? → Exit sequence
└── No action → Continue to Email 3

After Email 4:
├── User upgraded? → Move to Creator onboarding
└── No upgrade by Day 30? → Move to re-engagement sequence
```

## Files

```
emails/
├── upgrade-sequence-README.md           # This file
├── upgrade-01-limits.html               # Day 14: Awareness
├── upgrade-02-unlock.html               # Day 17: Value
├── upgrade-03-proof.html                # Day 20: Social proof
└── upgrade-04-direct.html               # Day 24: Direct ask
```
