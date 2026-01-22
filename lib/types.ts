/**
 * IntentMail Type Definitions
 */

// =============================================================================
// BRAND TYPES
// =============================================================================

export interface BrandColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface BrandTypography {
  headings: string;
  body: string;
  fontImportUrl?: string;
}

export interface BrandVoice {
  tone: string;
  doSay: string[];
  dontSay: string[];
}

export interface BrandLogo {
  url: string;
  width: number;
  altText: string;
}

export interface BrandLinks {
  home: string;
  privacy?: string;
  terms?: string;
  documentation?: string;
  support?: string;
  unsubscribe?: string;
  github?: string;
  appStore?: string;
  playStore?: string;
}

export interface BrandConfig {
  id: string;
  name: string;
  tagline?: string;
  colors: BrandColors;
  typography: BrandTypography;
  voice: BrandVoice;
  logo?: BrandLogo;
  links: BrandLinks;
  isCustom?: boolean;
}

// =============================================================================
// INTENT TYPES
// =============================================================================

export interface IntentSubject {
  default: string;
  variants?: string[];
  maxLength?: number;
}

export interface IntentSlotConfig {
  id: string;
  slot?: string; // alias for id
  prompt?: string;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  url?: string;
  buttonText?: string;
  static?: string;
  staticContent?: string;
  constraints?: string[];
}

export interface IntentStructure {
  template: string;
  slots: IntentSlotConfig[];
}

export interface IntentContent {
  goal: string;
  mustInclude?: string[];
  mustNotInclude?: string[];
  cta: {
    text: string;
    url: string;
    style: 'strong' | 'medium' | 'soft';
  };
}

export interface IntentGeneration {
  technique?: string;
  constraints?: string[];
  examples?: string[];
}

// Simple intent format (used for built-in intents)
export interface SimpleEmailIntent {
  id: string;
  brand?: string;
  name: string;
  description: string;
  template: string;
  subject: string;
  slots: Record<string, { prompt?: string; text?: string; url?: string; items?: number }>;
  variables?: string[];
  isCustom?: boolean;
}

// Full intent format (for advanced use cases)
export interface FullEmailIntent {
  id: string;
  brand: string;
  purpose: string;
  tone: string;
  urgency: 'high' | 'medium' | 'low' | 'none';
  subject: IntentSubject;
  structure: IntentStructure;
  content: IntentContent;
  generation?: IntentGeneration;
  isCustom?: boolean;
}

// Union type that accepts both formats
export type EmailIntent = SimpleEmailIntent | FullEmailIntent;

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

export type SlotType =
  | 'greeting'
  | 'paragraph'
  | 'bullet-list'
  | 'info-box'
  | 'warning-box'
  | 'highlight-box'
  | 'cta-button'
  | 'signature'
  | 'receipt-details'
  | 'security-alert';

export type BoxStyle = 'info' | 'warning' | 'success' | 'neutral';
export type CTAStyle = 'strong' | 'medium' | 'soft';

export interface SlotDefinition {
  id: string;
  type: SlotType;
  prompt?: string;
  required?: boolean;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  style?: BoxStyle | CTAStyle;
  staticContent?: string;
}

export interface TemplateStructure {
  id: string;
  name: string;
  description: string;
  slots: SlotDefinition[];
}

// =============================================================================
// EMAIL SLOT CONTENT
// =============================================================================

export interface CTAContent {
  text: string;
  url: string;
}

export interface EmailSlotContent {
  greeting?: string;
  intro?: string;
  highlight?: string;
  explanation?: string;
  warning?: string;
  next_steps?: string;
  points?: string[];
  bullets?: string[];
  closing?: string;
  details?: string;
  confirmation?: string;
  cta?: CTAContent;
  signoff?: string;
  [key: string]: string | string[] | CTAContent | undefined;
}

// =============================================================================
// API TYPES
// =============================================================================

export interface SendEmailParams {
  brand: string;
  intent: string;
  to: string | string[];
  data: Record<string, unknown>;
  slotOverrides?: Partial<EmailSlotContent>;
  subject?: string;
  scheduledFor?: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailLog {
  id: string;
  brand: string;
  intent: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt: Date;
}
