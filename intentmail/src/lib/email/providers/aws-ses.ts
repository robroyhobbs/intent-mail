// =============================================================================
// AWS SES EMAIL PROVIDER
// =============================================================================

import type { EmailProvider } from "./index";
import type { EmailProviderSendOptions, EmailProviderResult } from "../types";
import { createHmac, createHash } from "crypto";

export class AwsSesProvider implements EmailProvider {
  type = "aws_ses" as const;
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(apiKey: string, config?: Record<string, unknown>) {
    // API key format: "accessKeyId:secretAccessKey"
    const [accessKeyId, secretAccessKey] = apiKey.split(":");
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "AWS SES API key must be in format: accessKeyId:secretAccessKey",
      );
    }
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = (config?.region as string) || "us-east-1";
  }

  private getSignatureKey(
    key: string,
    dateStamp: string,
    regionName: string,
    serviceName: string,
  ): Buffer {
    const kDate = createHmac("sha256", `AWS4${key}`).update(dateStamp).digest();
    const kRegion = createHmac("sha256", kDate).update(regionName).digest();
    const kService = createHmac("sha256", kRegion).update(serviceName).digest();
    const kSigning = createHmac("sha256", kService)
      .update("aws4_request")
      .digest();
    return kSigning;
  }

  private sign(
    method: string,
    host: string,
    uri: string,
    queryString: string,
    headers: Record<string, string>,
    body: string,
    service: string,
  ): Record<string, string> {
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    const signedHeaders = Object.keys(headers)
      .map((k) => k.toLowerCase())
      .sort()
      .join(";");
    const canonicalHeaders = Object.entries(headers)
      .map(([k, v]) => `${k.toLowerCase()}:${v.trim()}`)
      .sort()
      .join("\n");

    const payloadHash = createHash("sha256").update(body).digest("hex");

    const canonicalRequest = [
      method,
      uri,
      queryString,
      canonicalHeaders + "\n",
      signedHeaders,
      payloadHash,
    ].join("\n");

    const credentialScope = `${dateStamp}/${this.region}/${service}/aws4_request`;
    const stringToSign = [
      "AWS4-HMAC-SHA256",
      amzDate,
      credentialScope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");

    const signingKey = this.getSignatureKey(
      this.secretAccessKey,
      dateStamp,
      this.region,
      service,
    );
    const signature = createHmac("sha256", signingKey)
      .update(stringToSign)
      .digest("hex");

    const authorization = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      ...headers,
      "x-amz-date": amzDate,
      Authorization: authorization,
    };
  }

  async send(options: EmailProviderSendOptions): Promise<EmailProviderResult> {
    try {
      const host = `email.${this.region}.amazonaws.com`;
      const endpoint = `https://${host}/v2/email/outbound-emails`;

      const body = JSON.stringify({
        Content: {
          Simple: {
            Subject: {
              Data: options.subject,
              Charset: "UTF-8",
            },
            Body: {
              Html: {
                Data: options.html,
                Charset: "UTF-8",
              },
              Text: {
                Data: options.text,
                Charset: "UTF-8",
              },
            },
            ...(options.headers && {
              Headers: Object.entries(options.headers).map(([Name, Value]) => ({
                Name,
                Value,
              })),
            }),
          },
        },
        Destination: {
          ToAddresses: [options.to],
        },
        FromEmailAddress: options.from.name
          ? `${options.from.name} <${options.from.email}>`
          : options.from.email,
        ...(options.replyTo && { ReplyToAddresses: [options.replyTo] }),
      });

      const headers = this.sign(
        "POST",
        host,
        "/v2/email/outbound-emails",
        "",
        {
          host,
          "content-type": "application/json",
        },
        body,
        "ses",
      );

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message ?? "AWS SES API error",
        };
      }

      return {
        success: true,
        messageId: data.MessageId,
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
      const host = `email.${this.region}.amazonaws.com`;
      const endpoint = `https://${host}/v2/email/account`;

      const headers = this.sign(
        "GET",
        host,
        "/v2/email/account",
        "",
        { host },
        "",
        "ses",
      );

      const response = await fetch(endpoint, {
        method: "GET",
        headers,
      });

      if (!response.ok) {
        return {
          success: false,
          error: "Invalid AWS SES credentials or region",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to AWS SES",
      };
    }
  }
}
