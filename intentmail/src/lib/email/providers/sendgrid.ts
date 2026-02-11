// =============================================================================
// SENDGRID EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type { EmailProviderSendOptions, EmailProviderResult } from "../types";

export class SendGridProvider implements EmailProvider {
  type = "sendgrid" as const;
  private apiKey: string;
  private baseUrl = "https://api.sendgrid.com/v3";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailProviderSendOptions): Promise<EmailProviderResult> {
    try {
      const payload = {
        personalizations: [
          {
            to: [{ email: options.to }],
          },
        ],
        from: {
          email: options.from.email,
          name: options.from.name,
        },
        subject: options.subject,
        content: [
          { type: "text/plain", value: options.text },
          { type: "text/html", value: options.html },
        ],
        ...(options.replyTo && { reply_to: { email: options.replyTo } }),
        ...(options.scheduledAt && {
          send_at: Math.floor(options.scheduledAt.getTime() / 1000),
        }),
        ...(options.headers && { headers: options.headers }),
      };

      const response = await fetch(`${this.baseUrl}/mail/send`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        return {
          success: false,
          error:
            error.errors?.[0]?.message ?? error.message ?? "SendGrid API error",
        };
      }

      // SendGrid returns messageId in x-message-id header
      const messageId = response.headers.get("x-message-id") ?? undefined;

      return {
        success: true,
        messageId,
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
      const response = await fetch(`${this.baseUrl}/user/profile`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid SendGrid API key",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to SendGrid",
      };
    }
  }
}
