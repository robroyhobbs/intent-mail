// =============================================================================
// POSTMARK EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type { EmailProviderSendOptions, EmailProviderResult } from "../types";

export class PostmarkProvider implements EmailProvider {
  type = "postmark" as const;
  private apiKey: string;
  private baseUrl = "https://api.postmarkapp.com";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async send(options: EmailProviderSendOptions): Promise<EmailProviderResult> {
    try {
      const payload = {
        From: options.from.name
          ? `${options.from.name} <${options.from.email}>`
          : options.from.email,
        To: options.to,
        Subject: options.subject,
        HtmlBody: options.html,
        TextBody: options.text,
        ...(options.replyTo && { ReplyTo: options.replyTo }),
        ...(options.tags && { Tag: options.tags[0] }), // Postmark supports single tag
        MessageStream: "outbound",
        ...(options.headers && {
          Headers: Object.entries(options.headers).map(([Name, Value]) => ({
            Name,
            Value,
          })),
        }),
      };

      const response = await fetch(`${this.baseUrl}/email`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": this.apiKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || data.ErrorCode) {
        return {
          success: false,
          error: data.Message ?? "Postmark API error",
        };
      }

      return {
        success: true,
        messageId: data.MessageID,
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
      const response = await fetch(`${this.baseUrl}/server`, {
        headers: {
          Accept: "application/json",
          "X-Postmark-Server-Token": this.apiKey,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid Postmark API key",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to Postmark",
      };
    }
  }
}
