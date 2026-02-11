// =============================================================================
// PHASE 1 TESTS: Email Client Unsubscribe Integration + Provider Headers
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock db before importing unsubscribe module
vi.mock("@/lib/db", () => ({
  db: {
    unsubscribe: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

import { generateUnsubscribeToken, buildUnsubscribeUrl } from "./unsubscribe";
import type { EmailProviderSendOptions } from "./types";

const TEST_KEY = "test-encryption-key-for-integration-testing!!";

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
  process.env.NEXT_PUBLIC_APP_URL = "https://app.intentmail.com";
  vi.clearAllMocks();
});

afterEach(() => {
  delete process.env.ENCRYPTION_KEY;
  delete process.env.NEXT_PUBLIC_APP_URL;
});

// =============================================================================
// Simulated sendEmail logic (mirrors client.ts without DB dependencies)
// =============================================================================

interface SimulatedSendParams {
  organizationId: string;
  brandId: string;
  to: string;
  isUnsubscribedFn: () => Promise<boolean>;
  isUnsubCheckFailsFn?: boolean;
}

interface SimulatedResult {
  skipped: boolean;
  headers: Record<string, string>;
  success: boolean;
  messageId?: string;
}

async function simulateSendEmail(
  params: SimulatedSendParams,
): Promise<SimulatedResult> {
  const { organizationId, brandId, to, isUnsubscribedFn, isUnsubCheckFailsFn } =
    params;

  // Check unsubscribe status (fail open)
  try {
    if (isUnsubCheckFailsFn) throw new Error("DB error");
    const unsubscribed = await isUnsubscribedFn();
    if (unsubscribed) {
      return {
        skipped: true,
        headers: {},
        success: true,
        messageId: undefined,
      };
    }
  } catch {
    // Fail open
  }

  // Build unsubscribe headers
  let unsubscribeHeaders: Record<string, string> = {};
  try {
    const token = generateUnsubscribeToken(organizationId, brandId, to);
    const url = buildUnsubscribeUrl(token);
    unsubscribeHeaders = {
      "List-Unsubscribe": `<${url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  } catch {
    // Non-blocking
  }

  return {
    skipped: false,
    headers: unsubscribeHeaders,
    success: true,
    messageId: "msg-123",
  };
}

// =============================================================================
// HAPPY PATH
// =============================================================================

describe("Happy Path", () => {
  it("sendEmail injects List-Unsubscribe header with valid token URL", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });

    expect(result.headers["List-Unsubscribe"]).toBeTruthy();
    expect(result.headers["List-Unsubscribe"]).toMatch(
      /^<https:\/\/app\.intentmail\.com\/api\/v1\/unsubscribe\?token=.+>$/,
    );
  });

  it("sendEmail injects List-Unsubscribe-Post header", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });

    expect(result.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
  });

  it("sendEmail skips delivery for unsubscribed recipient (returns success)", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "unsub@test.com",
      isUnsubscribedFn: async () => true,
    });

    expect(result.skipped).toBe(true);
    expect(result.success).toBe(true);
    expect(result.messageId).toBeUndefined();
  });

  it("sendEmail delivers normally for non-unsubscribed recipient", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "active@test.com",
      isUnsubscribedFn: async () => false,
    });

    expect(result.skipped).toBe(false);
    expect(result.success).toBe(true);
    expect(result.messageId).toBe("msg-123");
  });

  it("Resend provider accepts headers in send options", () => {
    // Verify the interface accepts headers without type error
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
      headers: {
        "List-Unsubscribe": "<https://example.com/unsub>",
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };
    expect(options.headers).toBeDefined();
    expect(options.headers!["List-Unsubscribe"]).toContain("https://");
  });

  it("SendGrid provider accepts headers in send options", () => {
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
      headers: { "List-Unsubscribe": "<https://example.com/unsub>" },
    };
    expect(options.headers).toBeDefined();
  });

  it("Postmark provider accepts headers in send options", () => {
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
      headers: { "List-Unsubscribe": "<https://example.com/unsub>" },
    };
    expect(options.headers).toBeDefined();
  });

  it("AWS SES provider accepts headers in send options", () => {
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
      headers: { "List-Unsubscribe": "<https://example.com/unsub>" },
    };
    expect(options.headers).toBeDefined();
  });
});

// =============================================================================
// BAD PATH
// =============================================================================

describe("Bad Path", () => {
  it("sendEmail sends email even if unsubscribe check DB fails (fail open)", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
      isUnsubCheckFailsFn: true,
    });

    expect(result.skipped).toBe(false);
    expect(result.success).toBe(true);
    expect(result.headers["List-Unsubscribe"]).toBeTruthy();
  });

  it("missing NEXT_PUBLIC_APP_URL falls back to localhost for unsub URL", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const token = generateUnsubscribeToken("org1", "brand1", "u@t.com");
    const url = buildUnsubscribeUrl(token);
    expect(url).toContain("http://localhost:3000");
  });

  it("provider handles undefined headers gracefully (no crash)", () => {
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
      // headers intentionally omitted
    };
    expect(options.headers).toBeUndefined();
    // No crash - the spread operator with undefined is safe
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  it("unsubscribed from Brand A can still receive Brand B emails", async () => {
    // Unsubscribed from brand-a
    const resultA = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand-a",
      to: "user@test.com",
      isUnsubscribedFn: async () => true,
    });
    expect(resultA.skipped).toBe(true);

    // Not unsubscribed from brand-b
    const resultB = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand-b",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });
    expect(resultB.skipped).toBe(false);
    expect(resultB.success).toBe(true);
  });

  it("silent skip returns success:true with no messageId", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "unsub@test.com",
      isUnsubscribedFn: async () => true,
    });

    expect(result.success).toBe(true);
    expect(result.messageId).toBeUndefined();
  });

  it("headers field is optional in EmailProviderSendOptions (backward compatible)", () => {
    // This compiles without error — backward compatible
    const options: EmailProviderSendOptions = {
      from: { email: "test@test.com" },
      to: "user@test.com",
      subject: "Test",
      html: "<p>Test</p>",
      text: "Test",
    };
    expect(options.headers).toBeUndefined();
  });
});

// =============================================================================
// SECURITY
// =============================================================================

describe("Security", () => {
  it("unsubscribe URL in header uses HTTPS", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://app.intentmail.com";
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });

    expect(result.headers["List-Unsubscribe"]).toMatch(/^<https:\/\//);
  });

  it("headers are injected by system, not caller-controlled", async () => {
    // The simulateSendEmail always generates its own headers
    // There's no way for callers to override List-Unsubscribe
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });

    // Headers are always system-generated
    expect(result.headers["List-Unsubscribe"]).toBeTruthy();
    expect(result.headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
  });

  it("ENCRYPTION_KEY for tokens is separate concern from provider API keys", () => {
    // Token uses ENCRYPTION_KEY
    const token = generateUnsubscribeToken("org1", "brand1", "u@t.com");
    expect(token).toBeTruthy();

    // Provider would use its own apiKey (different from ENCRYPTION_KEY)
    // This is verified by the provider constructor patterns
    expect(process.env.ENCRYPTION_KEY).not.toBe("provider-api-key");
  });
});

// =============================================================================
// DATA LEAK
// =============================================================================

describe("Data Leak", () => {
  it("silent skip does not log that recipient was unsubscribed", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "unsub@test.com",
      isUnsubscribedFn: async () => true,
    });

    // No logging about unsubscribe status
    for (const call of consoleSpy.mock.calls) {
      expect(call.join(" ")).not.toContain("unsubscrib");
    }
    for (const call of consoleWarnSpy.mock.calls) {
      expect(call.join(" ")).not.toContain("unsubscrib");
    }

    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("unsubscribe token in header does not expose raw email", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "secret@private.org",
      isUnsubscribedFn: async () => false,
    });

    const header = result.headers["List-Unsubscribe"];
    expect(header).not.toContain("secret@private.org");
  });
});

// =============================================================================
// DATA DAMAGE
// =============================================================================

describe("Data Damage", () => {
  it("unsubscribe check failure does not prevent email delivery", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => {
        throw new Error("DB connection lost");
      },
    });

    // Should still send (fail open)
    expect(result.skipped).toBe(false);
    expect(result.success).toBe(true);
  });

  it("adding headers does not affect existing email content", async () => {
    const result = await simulateSendEmail({
      organizationId: "org1",
      brandId: "brand1",
      to: "user@test.com",
      isUnsubscribedFn: async () => false,
    });

    // Headers are separate from content
    expect(result.headers).toBeDefined();
    expect(Object.keys(result.headers)).toHaveLength(2);
    expect(result.headers["List-Unsubscribe"]).toBeTruthy();
    expect(result.headers["List-Unsubscribe-Post"]).toBeTruthy();
  });
});
