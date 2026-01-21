# MyVibe Onboarding Email Sequence

Email templates for new user onboarding. Goal: Get users to their first "wait, it's live already?" moment within the first week.

## Sequence Overview

| Email | File | Send Day | Subject | Goal |
|-------|------|----------|---------|------|
| 1 | `onboarding-01-welcome.html` | Day 1 (immediate) | You're in. Ship your first vibe in 60 seconds. | Create first vibe |
| 2 | `onboarding-02-checkin.html` | Day 3 | Your first vibe | Celebrate or unstick |
| 3 | `onboarding-03-golive.html` | Day 7 | Your vibe is ready for an audience | Publish to real URL |

## Template Variables

Replace these placeholders in your email service:

| Variable | Description | Example |
|----------|-------------|---------|
| `{{first_name}}` | User's first name | Sarah |
| `{{username}}` | User's MyVibe username | sarahcreates |
| `{{dashboard_url}}` | Link to user dashboard | https://myvibe.so/dashboard |
| `{{new_vibe_url}}` | Direct link to create new vibe | https://myvibe.so/new |
| `{{gallery_url}}` | Link to vibe gallery | https://myvibe.so/gallery |
| `{{unsubscribe_url}}` | Unsubscribe link | (from email service) |

## Subject Line A/B Variants

### Email 1 (Welcome)
- **A:** "You're in. Ship your first vibe in 60 seconds." (default)
- **B:** "Your MyVibe account is ready"
- **C:** "Describe something. Watch it deploy."

### Email 2 (Check-in)
- **A:** "Your first vibe" (default)
- **B:** "Did you ship?"
- **C:** "Quick question about your vibe"

### Email 3 (Go Live)
- **A:** "Your vibe is ready for an audience" (default)
- **B:** "One click to live"
- **C:** "Your vibe needs a URL"

## Success Metrics

| Email | Primary Metric | Target |
|-------|----------------|--------|
| 1 | Vibe created within 24h of signup | 40%+ |
| 2 | Vibe created (cumulative by Day 3) | 60%+ |
| 3 | Vibe published (by Day 7) | 30%+ |

## Testing

1. **Litmus/Email on Acid**: Test rendering across clients
2. **Key clients to verify**: Gmail, Apple Mail, Outlook 365, iOS Mail
3. **Check**: Dark mode rendering, mobile responsiveness, link tracking

## Brand Notes

- **Colors**: Primary `#4598fa`, Secondary `#00b8db`, Success `#10b981`
- **Fonts**: Playfair Display (headings), Inter (body)
- **Voice**: Creative, empowering, not corporate
- **Logo**: Update `src` in header to actual hosted logo URL

## Email Service Setup

### SendGrid / Mailchimp / Customer.io

1. Create automation triggered on user signup
2. Import HTML templates
3. Map template variables to your user properties
4. Set delays: Email 1 = immediate, Email 2 = 3 days, Email 3 = 7 days

### Behavioral Branching (Optional)

If your email service supports it:

```
After Email 1:
├── User created vibe? → Tag as "activated"
└── No vibe by Day 3? → Send Email 2 (re-engage path)

After Email 3:
├── User published? → Move to engagement sequence
└── No publish by Day 10? → Send re-engagement email
```

## Files

```
emails/
├── README.md                      # This file
├── onboarding-01-welcome.html     # Day 1: Welcome + first vibe
├── onboarding-02-checkin.html     # Day 3: Check-in
└── onboarding-03-golive.html      # Day 7: Publish
```
