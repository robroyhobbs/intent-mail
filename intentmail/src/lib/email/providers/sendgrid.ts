// =============================================================================
// SENDGRID EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type {
  EmailProviderSendOptions,
  EmailProviderResult,
  DomainAddResult,
  DomainVerifyResult,
} from "../types";

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

  async addDomain(domain: string): Promise<DomainAddResult> {
    try {
      const response = await fetch(`${this.baseUrl}/whitelabel/domains`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain, automatic_security: true }),
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.errors?.[0]?.message ?? "Failed to add domain",
        };
      }
      const records: { type: string; name: string; value: string }[] = [];
      for (const key of ["dns", "dkim1", "dkim2", "mail_cname"] as const) {
        const rec = data[key];
        if (rec?.host && rec?.data) {
          records.push({
            type: rec.type ?? "CNAME",
            name: rec.host,
            value: rec.data,
          });
        }
      }
      return {
        success: true,
        providerDomainId: String(data.id),
        dnsRecords: records,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to add domain",
      };
    }
  }

  async verifyDomain(providerDomainId: string): Promise<DomainVerifyResult> {
    try {
      const response = await fetch(
        `${this.baseUrl}/whitelabel/domains/${providerDomainId}/validate`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          verified: false,
          error: data.errors?.[0]?.message ?? "Validation failed",
        };
      }
      const allValid = Object.values(data.validation_results ?? {}).every(
        (r: unknown) => (r as { valid: boolean })?.valid,
      );
      return { success: true, verified: allValid };
    } catch (error) {
      return {
        success: false,
        verified: false,
        error:
          error instanceof Error ? error.message : "Failed to verify domain",
      };
    }
  }

  async removeDomain(
    providerDomainId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${this.baseUrl}/whitelabel/domains/${providerDomainId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${this.apiKey}` },
        },
      );
      if (!response.ok) {
        return { success: false, error: "Failed to remove domain" };
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to remove domain",
      };
    }
  }
}
