// =============================================================================
// CORE EMAIL TYPES - Ported from email-system with multi-tenant additions
// =============================================================================

export interface EmailRequest {
  organizationId: string;
  brandId: string;
  intentId: string;
  to: string;
  data: Record<string, unknown>;
  subject?: string; // Override subject
  scheduledFor?: Date;
  tags?: string[];
  metadata?: Record<string, unknown>;
  plan?: string; // Org plan for AI generation limits
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  email: GeneratedEmail;
}

export interface GeneratedEmail {
  subject: string;
  text: string;
  html: string;
  metadata: EmailMetadata;
}

export interface EmailMetadata {
  intentId: string;
  brandId: string;
  organizationId: string;
  generatedAt: Date;
  validation?: ValidationResult;
}

// =============================================================================
// BRAND CONFIGURATION
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
  home?: string;
  privacy?: string;
  unsubscribe?: string;
  [key: string]: string | undefined;
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
  fromEmail?: string;
  fromName?: string;
}

// =============================================================================
// INTENT CONFIGURATION
// =============================================================================

export type Urgency = "none" | "low" | "medium" | "high";
export type CTAStyle = "soft" | "medium" | "strong";

export interface SubjectConfig {
  default: string;
  variants: string[];
  maxLength: number;
}

export interface CTAConfig {
  text: string;
  url: string;
  style: CTAStyle;
}

export interface ContentConfig {
  goal?: string;
  mustInclude: string[];
  mustNotInclude: string[];
  cta?: CTAConfig;
}

export interface IntentSlotConfig {
  id: string;
  prompt?: string; // For AI generation
  static?: string; // Static content
  url?: string; // For CTA buttons
  buttonText?: string;
  attribution?: string; // For testimonials
  maxLength?: number;
}

export interface IntentStructure {
  template: string;
  slots: IntentSlotConfig[];
}

export interface GenerationConfig {
  enabled: boolean;
  constraints: string[];
}

export interface IntentConfig {
  id: string;
  slug: string;
  name: string;
  description?: string;
  purpose: string;
  tone: string;
  urgency: Urgency;
  subject: SubjectConfig;
  structure: IntentStructure;
  content: ContentConfig;
  generation: GenerationConfig;
}

// =============================================================================
// VALIDATION
// =============================================================================

export type IssueSeverity = "blocking" | "warning" | "suggestion";

export interface ValidationIssue {
  severity: IssueSeverity;
  message: string;
  field?: string;
  suggestion?: string;
}

export interface ValidationResult {
  passed: boolean;
  blocking: ValidationIssue[];
  warnings: ValidationIssue[];
  suggestions: ValidationIssue[];
  score: number;
}

// =============================================================================
// EMAIL PROVIDERS
// =============================================================================

export type ProviderType =
  | "resend"
  | "sendgrid"
  | "postmark"
  | "aws_ses"
  | "mailgun";

export interface EmailProviderConfig {
  type: ProviderType;
  apiKey: string;
  config?: Record<string, unknown>;
}

export interface EmailProviderSendOptions {
  from: { email: string; name?: string };
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  tags?: string[];
  scheduledAt?: Date;
  headers?: Record<string, string>;
}

export interface EmailProviderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// =============================================================================
// SLOTS & TEMPLATES
// =============================================================================

export type SlotType =
  | "greeting"
  | "headline"
  | "paragraph"
  | "bullet-list"
  | "info-box"
  | "stats-box"
  | "testimonial"
  | "cta-button"
  | "ps-line"
  | "signature"
  | "divider";

export type BoxStyle = "info" | "success" | "warning" | "error";

export interface SlotDefinition {
  id: string;
  type: SlotType;
  prompt?: string;
  style?: BoxStyle | CTAStyle;
  maxLength?: number;
  required?: boolean;
  staticContent?: string;
}

export interface TemplateStructure {
  id: string;
  name: string;
  description: string;
  slots: SlotDefinition[];
}

export interface SlotContent {
  text?: string;
  items?: string[];
  url?: string;
  buttonText?: string;
  attribution?: string;
}

export type EmailSlotContent = Record<string, SlotContent>;

// =============================================================================
// API TYPES
// =============================================================================

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// Helper type guard
export function isApiError<T>(
  response: ApiResponse<T>,
): response is ApiErrorResponse {
  return "error" in response;
}
