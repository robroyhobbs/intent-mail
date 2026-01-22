# Intents Guide

Intents are the core concept in IntentMail. They define **what you want to say** without specifying the exact words. AI then generates contextually appropriate content based on the intent, brand voice, and provided data.

## What is an Intent?

An intent represents a specific email purpose:
- **welcome** - Greet new users
- **password-reset** - Help users reset passwords
- **order-confirmation** - Confirm purchases
- **low-balance** - Alert users about account balance

Each intent includes:
- A template defining the structure
- Content slots with AI prompts
- Required data fields
- Default subject line

## Built-in Intents

IntentMail comes with several pre-configured intents:

### Transactional Intents

| Intent | Purpose | Required Data |
|--------|---------|---------------|
| `welcome` | New user onboarding | userName, companyName |
| `password-reset` | Password reset links | userName, resetLink, expiryTime |
| `email-verification` | Verify email address | userName, verificationLink |
| `order-confirmation` | Purchase confirmation | userName, orderNumber, items |
| `shipping-notification` | Shipping updates | userName, trackingNumber, carrier |

### Engagement Intents

| Intent | Purpose | Required Data |
|--------|---------|---------------|
| `low-balance` | Balance warnings | userName, currentBalance, minBalance |
| `trial-ending` | Trial expiration notice | userName, daysRemaining, upgradeLink |
| `feature-announcement` | New feature promotion | userName, featureName |
| `feedback-request` | Request user feedback | userName, feedbackLink |

## How AI Generation Works

When you send an email, AI generates content for each slot:

```
Intent: welcome
Data: { userName: "Sarah", companyName: "Acme" }
Brand Voice: Friendly, professional

↓ AI generates ↓

Subject: "Welcome to Acme, Sarah!"
Greeting: "Hi Sarah,"
Intro: "We're thrilled to have you join the Acme family..."
Body: "Here's what you can do to get started..."
CTA: "Explore Your Dashboard"
Signoff: "The Acme Team"
```

The AI uses:
1. **Intent prompts** - What each slot should convey
2. **Brand voice** - Tone and word preferences
3. **Data variables** - Personalization values
4. **Quality guidelines** - Email best practices

## Customizing Intents

### Via the UI (Marketers)

1. Go to Settings → Intents
2. Select a brand and intent
3. Modify the prompts for each slot
4. Click Save

Changes are stored in the database and persist through deployments.

### Via Code (Developers)

Create custom intents in `lib/intents/your-brand/`:

```typescript
// lib/intents/acme/custom-intent.ts
export const customIntent: SimpleEmailIntent = {
  id: 'account-suspended',
  name: 'Account Suspended',
  description: 'Notify user their account has been suspended',
  template: 'transactional',
  subject: 'Your {{companyName}} account has been suspended',
  slots: {
    greeting: {
      prompt: 'Write a neutral greeting using their name'
    },
    intro: {
      prompt: 'Explain that the account has been suspended due to {{suspensionReason}}. Be direct but empathetic.'
    },
    body: {
      prompt: 'Explain what steps they can take to restore their account. Include the appeal process.'
    },
    cta: {
      text: 'Contact Support',
      url: '{{supportLink}}'
    }
  },
  requiredData: ['userName', 'suspensionReason', 'supportLink']
};
```

## Intent Structure

### SimpleEmailIntent

The standard intent format:

```typescript
interface SimpleEmailIntent {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // What this intent does
  template: string;              // Template to use
  subject: string;               // Subject line (supports {{variables}})
  slots: {
    [slotId: string]: {
      prompt: string;            // AI generation prompt
      maxLength?: number;        // Max characters
      text?: string;             // Static text (for CTAs)
      url?: string;              // Link URL (for CTAs)
    }
  };
  requiredData?: string[];       // Required variables
}
```

### Slot Types

| Type | Description | Example |
|------|-------------|---------|
| greeting | Opening salutation | "Hi Sarah," |
| intro | Opening paragraph | "Welcome to..." |
| body | Main content | Detailed information |
| highlight | Emphasized info box | Key details |
| warning | Alert/warning box | Important notices |
| bullet-list | List of items | Feature lists |
| cta | Call-to-action button | "Get Started" |
| signoff | Closing signature | "The Team" |

## Writing Effective Prompts

### Good Prompts

```
✓ "Write a warm, excited greeting for {{userName}} who just signed up"
✓ "Explain the password reset process in 2-3 sentences. Mention the link expires in {{expiryTime}}."
✓ "List 3 key benefits of upgrading, focusing on what they'll gain"
```

### Poor Prompts

```
✗ "Write greeting" (too vague)
✗ "Welcome the user to our amazing revolutionary platform!" (marketing speak)
✗ "Explain everything about the reset process" (too broad)
```

### Prompt Tips

1. **Be specific** - "2-3 sentences about X" is better than "explain X"
2. **Reference data** - Use `{{variable}}` to remind AI what data is available
3. **Set tone** - "warm and encouraging" vs "direct and professional"
4. **Avoid superlatives** - AI follows brand voice, not prompt hype

## Override Hierarchy

Content can come from multiple sources (in priority order):

1. **API slotOverrides** - Highest priority, per-request
2. **Database overrides** - Marketer customizations via UI
3. **Code defaults** - Developer-defined in intent files
4. **AI generation** - Falls back to AI if no override

```javascript
// API call with slotOverrides
await client.send({
  brand: 'acme',
  intent: 'welcome',
  to: 'user@example.com',
  data: { userName: 'Sarah' },
  slotOverrides: {
    intro: 'Special welcome message for VIP users!'
  }
});
```

## Creating New Intents

### Step 1: Define the Intent

```typescript
// lib/intents/your-brand/new-intent.ts
export const newIntent: SimpleEmailIntent = {
  id: 'subscription-renewed',
  name: 'Subscription Renewed',
  description: 'Confirm subscription renewal',
  template: 'transactional',
  subject: 'Your {{planName}} subscription has been renewed',
  slots: {
    greeting: {
      prompt: 'Friendly greeting using {{userName}}'
    },
    intro: {
      prompt: 'Thank them for continuing with {{planName}}. Confirm the renewal amount of {{amount}}.'
    },
    body: {
      prompt: 'Summarize what they get with their plan. Mention next billing date {{nextBillingDate}}.'
    },
    cta: {
      text: 'Manage Subscription',
      url: '{{manageLink}}'
    }
  },
  requiredData: ['userName', 'planName', 'amount', 'nextBillingDate', 'manageLink']
};
```

### Step 2: Register the Intent

```typescript
// lib/intents/your-brand/index.ts
import { newIntent } from './new-intent';

export const intents = {
  'subscription-renewed': newIntent,
  // ... other intents
};
```

### Step 3: Use the Intent

```javascript
await client.send({
  brand: 'your-brand',
  intent: 'subscription-renewed',
  to: 'user@example.com',
  data: {
    userName: 'Sarah',
    planName: 'Pro',
    amount: '$29.99',
    nextBillingDate: 'February 15, 2024',
    manageLink: 'https://example.com/account'
  }
});
```

## Best Practices

1. **Keep intents focused** - One purpose per intent
2. **Use descriptive IDs** - `order-shipped` not `email-3`
3. **Document required data** - List all needed variables
4. **Test with preview** - Always preview before sending
5. **Let AI do its job** - Don't over-specify content in prompts
