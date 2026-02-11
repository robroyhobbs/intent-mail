// =============================================================================
// RESEND EMAIL PROVIDER
// =============================================================================

import { Resend } from "resend";
import type { EmailProvider } from "./index";
import type {
  EmailProviderSendOptions,
  EmailProviderResult,
  DomainAddResult,
  DomainVerifyResult,
} from "../types";

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

  async addDomain(domain: string): Promise<DomainAddResult> {
    try {
      const result = await this.client.domains.create({ name: domain });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      const domainData = result.data;
      return {
        success: true,
        providerDomainId: domainData?.id,
        dnsRecords:
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          domainData?.records?.map((r: any) => ({
            type: r.type ?? r.record_type ?? "TXT",
            name: r.name ?? "",
            value: r.value ?? "",
          })) ?? [],
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
      // Trigger verification
      const verifyResult = await this.client.domains.verify(providerDomainId);
      if (verifyResult.error) {
        return {
          success: false,
          verified: false,
          error: verifyResult.error.message,
        };
      }
      // Check actual status via get
      const getResult = await this.client.domains.get(providerDomainId);
      if (getResult.error) {
        return { success: true, verified: false };
      }
      return { success: true, verified: getResult.data?.status === "verified" };
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
      const result = await this.client.domains.remove(providerDomainId);
      if (result.error) {
        return { success: false, error: result.error.message };
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
