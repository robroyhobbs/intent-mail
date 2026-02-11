// =============================================================================
// UNSUBSCRIBE ENDPOINT TESTS
// Tests for POST /api/v1/unsubscribe and GET /unsubscribe page behavior
// =============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from "./unsubscribe";

// Mock db for endpoint-level testing
vi.mock("@/lib/db", () => {
  const mockDb = {
    unsubscribe: {
      upsert: vi.fn(),
      findUnique: vi.fn(),
    },
  };
  return { db: mockDb };
});

import { db } from "@/lib/db";
const mockDb = db as unknown as {
  unsubscribe: {
    upsert: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
};

const TEST_KEY = "test-encryption-key-for-unsubscribe-endpoint!!";

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
// POST ENDPOINT BEHAVIOR (tested via module functions, not HTTP)
// =============================================================================

describe("POST /api/v1/unsubscribe behavior", () => {
  it("valid token verifies and can record unsubscribe", async () => {
    const token = generateUnsubscribeToken("org1", "brand1", "user@test.com");
    const data = verifyUnsubscribeToken(token);
    expect(data).toBeTruthy();
    expect(data!.orgId).toBe("org1");
    expect(data!.brandId).toBe("brand1");
    expect(data!.email).toBe("user@test.com");

    mockDb.unsubscribe.upsert.mockResolvedValue({ id: "1" });
    // Simulate what endpoint does
    const { recordUnsubscribe } = await import("./unsubscribe");
    await recordUnsubscribe(data!.orgId, data!.brandId, data!.email, "one-click");
    expect(mockDb.unsubscribe.upsert).toHaveBeenCalled();
  });

  it("invalid token returns null (endpoint would return 400)", () => {
    const data = verifyUnsubscribeToken("invalid.token");
    expect(data).toBeNull();
  });

  it("missing token returns null (endpoint would return 400)", () => {
    const data = verifyUnsubscribeToken("");
    expect(data).toBeNull();
  });

  it("already-unsubscribed email handles idempotently (upsert update is no-op)", async () => {
    mockDb.unsubscribe.upsert.mockResolvedValue({
      id: "existing-1",
      organizationId: "org1",
      brandId: "brand1",
      email: "user@test.com",
    });

    const { recordUnsubscribe } = await import("./unsubscribe");
    // Should not throw
    await recordUnsubscribe("org1", "brand1", "user@test.com");
    expect(mockDb.unsubscribe.upsert).toHaveBeenCalled();

    // The upsert update:{} means it's a no-op if exists
    const call = mockDb.unsubscribe.upsert.mock.calls[0][0];
    expect(call.update).toEqual({});
  });

  it("DB failure on recordUnsubscribe propagates (endpoint returns 500)", async () => {
    mockDb.unsubscribe.upsert.mockRejectedValue(new Error("DB down"));

    const { recordUnsubscribe } = await import("./unsubscribe");
    await expect(
      recordUnsubscribe("org1", "brand1", "user@test.com"),
    ).rejects.toThrow("DB down");
  });
});

// =============================================================================
// GET /unsubscribe PAGE BEHAVIOR
// =============================================================================

describe("GET /unsubscribe page behavior", () => {
  it("valid token renders data for confirmation page", () => {
    const token = generateUnsubscribeToken("org1", "brand1", "user@example.com");
    const data = verifyUnsubscribeToken(token);
    expect(data).toBeTruthy();
    // Page uses this data to show masked email and form
  });

  it("invalid token renders error state", () => {
    const data = verifyUnsubscribeToken("invalid.token");
    expect(data).toBeNull();
    // Page shows "Invalid Link" message
  });
});

// =============================================================================
// URL GENERATION
// =============================================================================

describe("Unsubscribe URL", () => {
  it("buildUnsubscribeUrl produces HTTPS URL", () => {
    const token = generateUnsubscribeToken("org1", "brand1", "u@t.com");
    const url = buildUnsubscribeUrl(token);
    expect(url).toMatch(/^https:\/\//);
  });

  it("URL contains the token as query parameter", () => {
    const token = generateUnsubscribeToken("org1", "brand1", "u@t.com");
    const url = buildUnsubscribeUrl(token);
    expect(url).toContain(`token=${encodeURIComponent(token)}`);
  });

  it("URL encodes special characters in token", () => {
    // Tokens contain base64url chars which are URL-safe, but verify encoding works
    const token = "abc.def+ghi";
    const url = buildUnsubscribeUrl(token);
    expect(url).toContain("token=abc.def%2Bghi");
  });
});

// =============================================================================
// EMAIL MASKING (tested inline since page is server component)
// =============================================================================

describe("Email masking", () => {
  function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!local || !domain) return "***@***";
    const masked =
      local.length <= 2
        ? "*".repeat(local.length)
        : local[0] + "*".repeat(local.length - 2) + local[local.length - 1];
    return `${masked}@${domain}`;
  }

  it("masks middle characters of email", () => {
    expect(maskEmail("john@example.com")).toBe("j**n@example.com");
  });

  it("masks very short local part", () => {
    expect(maskEmail("ab@example.com")).toBe("**@example.com");
  });

  it("masks single character local part", () => {
    expect(maskEmail("a@example.com")).toBe("*@example.com");
  });

  it("masks long email correctly", () => {
    expect(maskEmail("username@example.com")).toBe("u******e@example.com");
  });

  it("handles invalid email format", () => {
    expect(maskEmail("noemail")).toBe("***@***");
  });

  it("does not reveal full email in confirmation page", () => {
    const email = "secret.user@private.org";
    const masked = maskEmail(email);
    expect(masked).not.toBe(email);
    expect(masked).not.toContain("secret");
    expect(masked).toContain("@private.org");
  });
});
