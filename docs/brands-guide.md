# Brands Guide

Brands define **who you are** when sending emails. Each brand includes visual identity, voice characteristics, and messaging preferences that AI uses to generate consistent content.

## What is a Brand?

A brand in Email Kit contains:
- **Identity** - Name, logo, colors
- **Voice** - Tone, personality, communication style
- **Preferences** - Words to use, words to avoid
- **Settings** - Email sender address, defaults

## Brand Structure

```typescript
interface Brand {
  id: string;              // Unique identifier
  name: string;            // Display name
  description: string;     // Brand description

  // Visual identity
  logo?: string;           // Logo URL
  colors: {
    primary: string;       // Main brand color
    secondary: string;     // Accent color
    background: string;    // Email background
    text: string;          // Text color
  };

  // Brand voice
  voice: {
    tone: string;          // Overall tone description
    doSay: string[];       // Preferred phrases/concepts
    dontSay: string[];     // Words/phrases to avoid
  };

  // Email settings
  defaultFromName?: string;
  defaultFromEmail?: string;
}
```

## Built-in Brands

Email Kit includes example brands you can customize:

### Default Brand

A neutral, professional brand suitable for most applications:

```typescript
{
  id: 'default',
  name: 'Default',
  voice: {
    tone: 'Professional, friendly, and helpful',
    doSay: [
      'We appreciate your business',
      'Happy to help',
      'Let us know if you have questions'
    ],
    dontSay: [
      'ASAP',
      'Per my last email',
      'Please advise'
    ]
  }
}
```

### AIGNE Brand

An AI-focused, technical brand:

```typescript
{
  id: 'aigne',
  name: 'AIGNE',
  voice: {
    tone: 'Technical but approachable, innovative, clear',
    doSay: [
      'AI-native',
      'Build with confidence',
      'Your intelligent assistant'
    ],
    dontSay: [
      'Revolutionary',
      'Game-changing',
      'Synergy'
    ]
  }
}
```

## Creating a Brand

### Step 1: Define Brand Identity

Create a new file in `lib/brands/`:

```typescript
// lib/brands/your-brand.ts
import { Brand } from '../types';

export const yourBrand: Brand = {
  id: 'your-brand',
  name: 'Your Company',
  description: 'Your company description',

  colors: {
    primary: '#007bff',      // Your brand blue
    secondary: '#28a745',    // Accent green
    background: '#ffffff',   // White background
    text: '#333333'          // Dark gray text
  },

  voice: {
    tone: 'Warm, encouraging, and straightforward',
    doSay: [
      'We\'re here to help',
      'Your success matters',
      'Simple and transparent'
    ],
    dontSay: [
      'Please be advised',
      'At your earliest convenience',
      'Best in class'
    ]
  },

  defaultFromName: 'Your Company',
  defaultFromEmail: 'hello@yourcompany.com'
};
```

### Step 2: Register the Brand

```typescript
// lib/brands/index.ts
import { yourBrand } from './your-brand';

export const brands = {
  'your-brand': yourBrand,
  // ... other brands
};
```

### Step 3: Create Brand-Specific Intents (Optional)

```
lib/intents/your-brand/
├── index.ts
├── welcome.ts
├── password-reset.ts
└── ...
```

## Brand Voice Guidelines

### Tone Description

Be specific about your communication style:

```typescript
// Good
tone: 'Friendly and casual, like talking to a knowledgeable colleague. Uses simple language, avoids jargon unless necessary.'

// Too vague
tone: 'Nice and helpful'
```

### Do Say (Preferred Phrases)

Include phrases that embody your brand:

```typescript
doSay: [
  'Let\'s get you sorted',           // Casual helpfulness
  'Here\'s what happened',           // Transparency
  'We\'ve got your back',            // Supportive
  'Quick update for you',            // Direct
  'Thanks for being with us'         // Appreciative
]
```

### Don't Say (Phrases to Avoid)

List corporate speak, clichés, and off-brand language:

```typescript
dontSay: [
  'Please do not hesitate',          // Formal/stuffy
  'We apologize for any inconvenience', // Overused
  'Exciting news!',                   // Fake enthusiasm
  'Circle back',                      // Corporate jargon
  'Leverage',                         // Business speak
  'Revolutionary'                     // Marketing hype
]
```

## Multi-Brand Setup

For companies with multiple products or sub-brands:

```
lib/brands/
├── index.ts              # Exports all brands
├── main-brand.ts         # Parent company
├── product-a.ts          # Product A brand
├── product-b.ts          # Product B brand
└── enterprise.ts         # Enterprise/B2B variant
```

### Shared Voice with Variations

```typescript
// Base voice (shared)
const baseVoice = {
  doSay: ['Here to help', 'Let us know'],
  dontSay: ['ASAP', 'Please advise']
};

// Consumer product
export const consumerBrand: Brand = {
  ...baseConfig,
  voice: {
    ...baseVoice,
    tone: 'Friendly, casual, encouraging'
  }
};

// Enterprise product
export const enterpriseBrand: Brand = {
  ...baseConfig,
  voice: {
    ...baseVoice,
    tone: 'Professional, confident, solution-focused'
  }
};
```

## Customizing via UI

Marketers can adjust brand settings without code:

1. Navigate to Settings → Brands
2. Select a brand to edit
3. Modify voice settings, colors, or defaults
4. Click Save

UI changes are stored in the database and take precedence over code defaults.

## Best Practices

### 1. Be Authentic

Your brand voice should match how your team actually talks to customers. If your support team is casual, your emails should be too.

### 2. Be Consistent

Use the same tone across all intents. A friendly welcome email followed by a cold support response feels jarring.

### 3. Test with Real Content

Generate sample emails for each intent and review them. Does it sound like your company?

### 4. Update Regularly

As your brand evolves, update your voice guidelines. Add new phrases that resonate, remove ones that feel dated.

### 5. Consider Context

Some intents need different tones:
- **Welcome emails**: Extra warm and encouraging
- **Security alerts**: Direct and serious
- **Marketing**: Engaging but not pushy

You can adjust this per-intent via slot prompts while maintaining overall brand consistency.

## Testing Brand Voice

Use the preview feature to test how your brand sounds:

```bash
curl -X POST https://your-server/api/v1/send/preview \
  -H "x-api-key: your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "your-brand",
    "intent": "welcome",
    "data": { "userName": "Test User" }
  }'
```

Review the generated content:
- Does it sound like your company?
- Would your team write something similar?
- Are there any off-brand phrases?
