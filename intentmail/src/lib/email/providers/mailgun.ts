// =============================================================================
// MAILGUN EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type {
  EmailProviderSendOptions,
  EmailProviderResult,
  DomainAddResult,
  DomainVerifyResult,
} from "../types";

export class MailgunProvider implements EmailProvider {
  type = "mailgun" as const;
  private apiKey: string;
  private domain: string;
  private baseUrl: string;

  constructor(apiKey: string, config?: Record<string, unknown>) {
    this.apiKey = apiKey;
    this.domain = (config?.domain as string) ?? "";
    const region = (config?.region as string) ?? "us";
    this.baseUrl =
      region === "eu"
        ? "https://api.eu.mailgun.net/v3"
        : "https://api.mailgun.net/v3";
  }

  async send(options: EmailProviderSendOptions): Promise<EmailProviderResult> {
    try {
      const form = new FormData();
      form.append(
        "from",
        options.from.name
          ? `${options.from.name} <${options.from.email}>`
          : options.from.email,
      );
      form.append("to", options.to);
      form.append("subject", options.subject);
      form.append("html", options.html);
      form.append("text", options.text);
      if (options.replyTo) form.append("h:Reply-To", options.replyTo);
      if (options.tags) {
        for (const tag of options.tags) form.append("o:tag", tag);
      }
      if (options.scheduledAt) {
        form.append("o:deliverytime", options.scheduledAt.toUTCString());
      }
      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          form.append(`h:${key}`, value);
        }
      }

      const response = await fetch(`${this.baseUrl}/${this.domain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
        },
        body: form,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message ?? "Mailgun API error",
        };
      }

      return {
        success: true,
        messageId: data.id?.replace(/[<>]/g, ""),
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
      const response = await fetch(
        `${this.baseUrl}/${this.domain}/stats/total?event=delivered&duration=1h`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`,
          },
        },
      );

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid Mailgun API key or domain",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to Mailgun",
      };
    }
  }

  private get authHeader(): string {
    return `Basic ${Buffer.from(`api:${this.apiKey}`).toString("base64")}`;
  }

  async addDomain(domain: string): Promise<DomainAddResult> {
    try {
      const form = new FormData();
      form.append("name", domain);
      const response = await fetch(`${this.baseUrl}/domains`, {
        method: "POST",
        headers: { Authorization: this.authHeader },
        body: form,
      });
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data.message ?? "Failed to add domain",
        };
      }
      const records: { type: string; name: string; value: string }[] = [];
      for (const rec of data.sending_dns_records ?? []) {
        records.push({
          type: rec.record_type ?? "TXT",
          name: rec.name ?? "",
          value: rec.value ?? "",
        });
      }
      return {
        success: true,
        providerDomainId: data.domain?.name ?? domain,
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
        `${this.baseUrl}/domains/${providerDomainId}/verify`,
        {
          method: "PUT",
          headers: { Authorization: this.authHeader },
        },
      );
      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          verified: false,
          error: data.message ?? "Verification failed",
        };
      }
      const allActive = (data.sending_dns_records ?? []).every(
        (r: { valid: string }) => r.valid === "valid",
      );
      return { success: true, verified: allActive };
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
        `${this.baseUrl}/domains/${providerDomainId}`,
        {
          method: "DELETE",
          headers: { Authorization: this.authHeader },
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
