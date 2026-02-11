// =============================================================================
// UNSUBSCRIBE MODULE - RFC 8058 One-Click Unsubscribe
// =============================================================================

import { createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";

// =============================================================================
// TOKEN GENERATION & VERIFICATION (HMAC-SHA256 stateless)
// =============================================================================

function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  return key;
}

export function generateUnsubscribeToken(
  orgId: string,
  brandId: string,
  email: string,
): string {
  const payload = `${orgId}:${brandId}:${email}`;
  const hmac = createHmac("sha256", getEncryptionKey())
    .update(payload)
    .digest("base64url");
  return Buffer.from(payload).toString("base64url") + "." + hmac;
}

export function verifyUnsubscribeToken(
  token: string,
): { orgId: string; brandId: string; email: string } | null {
  if (!token || typeof token !== "string") return null;

  const dotIndex = token.indexOf(".");
  if (dotIndex === -1) return null;

  const payloadB64 = token.slice(0, dotIndex);
  const hmac = token.slice(dotIndex + 1);
  if (!payloadB64 || !hmac) return null;

  let payload: string;
  try {
    payload = Buffer.from(payloadB64, "base64url").toString();
  } catch {
    return null;
  }

  const expected = createHmac("sha256", getEncryptionKey())
    .update(payload)
    .digest("base64url");

  // Timing-safe comparison to prevent timing attacks
  try {
    const hmacBuf = Buffer.from(hmac, "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");
    if (hmacBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(hmacBuf, expectedBuf)) return null;
  } catch {
    return null;
  }

  // Parse payload: orgId:brandId:email
  // email can contain colons (unlikely but spec-safe), so split carefully
  const firstColon = payload.indexOf(":");
  if (firstColon === -1) return null;
  const secondColon = payload.indexOf(":", firstColon + 1);
  if (secondColon === -1) return null;

  const orgId = payload.slice(0, firstColon);
  const brandId = payload.slice(firstColon + 1, secondColon);
  const email = payload.slice(secondColon + 1);

  if (!orgId || !brandId || !email) return null;

  return { orgId, brandId, email };
}

// =============================================================================
// DATABASE OPERATIONS
// =============================================================================

export async function recordUnsubscribe(
  organizationId: string,
  brandId: string,
  email: string,
  source: string = "one-click",
): Promise<void> {
  await db.unsubscribe.upsert({
    where: {
      organizationId_brandId_email: {
        organizationId,
        brandId,
        email,
      },
    },
    update: {},
    create: {
      organizationId,
      brandId,
      email,
      source,
    },
  });
}

export async function isUnsubscribed(
  organizationId: string,
  brandId: string,
  email: string,
): Promise<boolean> {
  const record = await db.unsubscribe.findUnique({
    where: {
      organizationId_brandId_email: {
        organizationId,
        brandId,
        email,
      },
    },
  });
  return record !== null;
}

// =============================================================================
// URL BUILDER
// =============================================================================

export function buildUnsubscribeUrl(token: string): string {
  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${appUrl}/api/v1/unsubscribe?token=${encodeURIComponent(token)}`;
}
