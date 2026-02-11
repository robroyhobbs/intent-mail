// =============================================================================
// EMAIL PROVIDER ABSTRACTIONS
// =============================================================================

import type {
  ProviderType,
  EmailProviderSendOptions,
  EmailProviderResult,
  DomainAddResult,
  DomainVerifyResult,
} from "../types";
import { ResendProvider } from "./resend";
import { SendGridProvider } from "./sendgrid";
import { PostmarkProvider } from "./postmark";
import { AwsSesProvider } from "./aws-ses";
import { MailgunProvider } from "./mailgun";

// =============================================================================
// PROVIDER INTERFACE
// =============================================================================

export interface EmailProvider {
  type: ProviderType;
  send(options: EmailProviderSendOptions): Promise<EmailProviderResult>;
  testConnection(): Promise<{ success: boolean; error?: string }>;
  // Optional domain management — providers that don't support it omit these
  addDomain?(domain: string): Promise<DomainAddResult>;
  verifyDomain?(providerDomainId: string): Promise<DomainVerifyResult>;
  removeDomain?(
    providerDomainId: string,
  ): Promise<{ success: boolean; error?: string }>;
}

// =============================================================================
// PROVIDER FACTORY
// =============================================================================

export function createProvider(
  type: ProviderType,
  apiKey: string,
  config?: Record<string, unknown>,
): EmailProvider {
  switch (type) {
    case "resend":
      return new ResendProvider(apiKey);
    case "sendgrid":
      return new SendGridProvider(apiKey);
    case "postmark":
      return new PostmarkProvider(apiKey);
    case "aws_ses":
      return new AwsSesProvider(apiKey, config);
    case "mailgun":
      return new MailgunProvider(apiKey, config);
    default:
      throw new Error(`Unsupported provider type: ${type}`);
  }
}

export { ResendProvider } from "./resend";
export { SendGridProvider } from "./sendgrid";
export { PostmarkProvider } from "./postmark";
export { AwsSesProvider } from "./aws-ses";
export { MailgunProvider } from "./mailgun";
