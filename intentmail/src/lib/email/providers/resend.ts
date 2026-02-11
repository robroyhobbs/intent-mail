// =============================================================================
// RESEND EMAIL PROVIDER
// =============================================================================

import { Resend } from "resend";
import type { EmailProvider } from "./index";
import type { EmailProviderSendOptions, EmailProviderResult } from "../types";

export class ResendProvider implements EmailProvider {
  type = "resend" as const;
  private client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(options: EmailProviderSendOptions): Promise<EmailProviderResult> {
    try {
      const result = await this.client.emails.send({
        from: options.from.name
          ? `${options.from.name} <${options.from.email}>`
          : options.from.email,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        tags: options.tags?.map((tag) => ({ name: tag, value: "true" })),
        scheduledAt: options.scheduledAt?.toISOString(),
        headers: options.headers,
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Resend doesn't have a direct "test" endpoint, so we'll try to list domains
      // This will fail if the API key is invalid
      await this.client.domains.list();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to Resend",
      };
    }
  }
}
