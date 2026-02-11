// =============================================================================
// POSTMARK EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type {
  EmailProviderSendOptions,
  EmailProviderResult,
  DomainAddResult,
  DomainVerifyResult,
} from "../types";

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

  private get pmHeaders(): Record<string, string> {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Postmark-Account-Token": this.apiKey,
    };
  }

  async addDomain(domain: string): Promise<DomainAddResult> {
    try {
      const response = await fetch(`${this.baseUrl}/domains`, {
        method: "POST",
        headers: this.pmHeaders,
        body: JSON.stringify({ Name: domain }),
      });
      const data = await response.json();
      if (!response.ok || data.ErrorCode) {
        return {
          success: false,
          error: data.Message ?? "Failed to add domain",
        };
      }
      const records: { type: string; name: string; value: string }[] = [];
      if (data.DKIMHost) {
        records.push({
          type: "TXT",
          name: data.DKIMHost,
          value: data.DKIMTextValue ?? "",
        });
      }
      if (data.ReturnPathDomainCNAMEValue) {
        records.push({
          type: "CNAME",
          name: data.ReturnPathDomain ?? `pm-bounces.${domain}`,
          value: data.ReturnPathDomainCNAMEValue,
        });
      }
      return {
        success: true,
        providerDomainId: String(data.ID),
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
      // Postmark requires verifying DKIM and return-path separately
      const [dkimRes, rpRes] = await Promise.all([
        fetch(`${this.baseUrl}/domains/${providerDomainId}/verifyDkim`, {
          method: "PUT",
          headers: this.pmHeaders,
        }),
        fetch(`${this.baseUrl}/domains/${providerDomainId}/verifyReturnPath`, {
          method: "PUT",
          headers: this.pmHeaders,
        }),
      ]);
      const dkimData = await dkimRes.json();
      const rpData = await rpRes.json();
      const dkimVerified = dkimData.DKIMVerified === true;
      const rpVerified = rpData.ReturnPathDomainVerified === true;
      return {
        success: true,
        verified: dkimVerified && rpVerified,
      };
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
          headers: this.pmHeaders,
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
