// =============================================================================
// QSTASH CLIENT - Scheduled email queue management
// =============================================================================

import { Client, Receiver } from "@upstash/qstash";

// Lazy-initialized clients (avoid crash if env vars missing at import time)
let _client: Client | null = null;
let _receiver: Receiver | null = null;

function getClient(): Client {
  if (!_client) {
    const token = process.env.QSTASH_TOKEN;
    if (!token) {
      throw new Error("QSTASH_TOKEN environment variable is not set");
    }
    _client = new Client({ token });
  }
  return _client;
}

function getReceiver(): Receiver {
  if (!_receiver) {
    const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
    const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
    if (!currentSigningKey || !nextSigningKey) {
      throw new Error(
        "QSTASH_CURRENT_SIGNING_KEY and QSTASH_NEXT_SIGNING_KEY must be set",
      );
    }
    _receiver = new Receiver({ currentSigningKey, nextSigningKey });
  }
  return _receiver;
}

/**
 * Publish a scheduled email to QStash.
 * Returns the QStash messageId for tracking/cancellation.
 */
export async function publishScheduledEmail(
  emailLogId: string,
  scheduledFor: Date,
): Promise<string> {
  const delay = Math.max(
    0,
    Math.floor((scheduledFor.getTime() - Date.now()) / 1000),
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL environment variable is not set");
  }

  const callbackUrl = `${appUrl}/api/internal/scheduled-send`;

  const client = getClient();
  const result = await client.publishJSON({
    url: callbackUrl,
    body: { emailLogId },
    delay,
  });

  return result.messageId;
}

/**
 * Cancel a scheduled email in QStash.
 * Silently succeeds if the message was already delivered or deleted.
 */
export async function cancelScheduledEmail(
  qstashMessageId: string,
): Promise<void> {
  const client = getClient();
  try {
    await client.messages.delete(qstashMessageId);
  } catch (error: unknown) {
    // If the message is already gone (delivered or deleted), log and continue
    const message =
      error instanceof Error ? error.message : "Unknown QStash error";
    if (message.includes("not found") || message.includes("404")) {
      console.warn(
        `QStash message ${qstashMessageId} already gone: ${message}`,
      );
      return;
    }
    throw error;
  }
}

/**
 * Verify a QStash callback signature.
 * Returns true if the signature is valid.
 */
export async function verifyQStashSignature(
  signature: string,
  body: string,
): Promise<boolean> {
  const receiver = getReceiver();
  try {
    const isValid = await receiver.verify({
      signature,
      body,
    });
    return !!isValid;
  } catch {
    return false;
  }
}
