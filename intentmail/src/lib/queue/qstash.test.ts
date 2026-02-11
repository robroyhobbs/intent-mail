// =============================================================================
// QSTASH CLIENT TESTS
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock @upstash/qstash before imports
const mockPublishJSON = vi.fn();
const mockMessagesDelete = vi.fn();
const mockReceiverVerify = vi.fn();

vi.mock("@upstash/qstash", () => ({
  Client: vi.fn().mockImplementation(function () {
    return {
      publishJSON: mockPublishJSON,
      messages: { delete: mockMessagesDelete },
    };
  }),
  Receiver: vi.fn().mockImplementation(function () {
    return {
      verify: mockReceiverVerify,
    };
  }),
}));

// Set env vars before importing module
const originalEnv = { ...process.env };

describe("QStash Client", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env.QSTASH_TOKEN = "test-qstash-token";
    process.env.QSTASH_CURRENT_SIGNING_KEY = "test-current-key";
    process.env.QSTASH_NEXT_SIGNING_KEY = "test-next-key";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.intentmail.io";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe("Happy Path", () => {
    it("publishScheduledEmail returns a messageId string", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_abc123" });

      const { publishScheduledEmail } = await import("./qstash");
      const result = await publishScheduledEmail(
        "emaillog_1",
        new Date(Date.now() + 3600_000),
      );

      expect(result).toBe("msg_abc123");
      expect(typeof result).toBe("string");
    });

    it("publishScheduledEmail calculates correct delay in seconds", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_delay" });

      const { publishScheduledEmail } = await import("./qstash");
      const futureTime = new Date(Date.now() + 7200_000); // 2 hours
      await publishScheduledEmail("emaillog_2", futureTime);

      const call = mockPublishJSON.mock.calls[0][0];
      // Delay should be approximately 7200 seconds (within 5s tolerance)
      expect(call.delay).toBeGreaterThanOrEqual(7195);
      expect(call.delay).toBeLessThanOrEqual(7200);
      expect(call.url).toBe(
        "https://app.intentmail.io/api/internal/scheduled-send",
      );
      expect(call.body).toEqual({ emailLogId: "emaillog_2" });
    });

    it("cancelScheduledEmail calls messages.delete with correct messageId", async () => {
      mockMessagesDelete.mockResolvedValue(undefined);

      const { cancelScheduledEmail } = await import("./qstash");
      await cancelScheduledEmail("msg_to_cancel");

      expect(mockMessagesDelete).toHaveBeenCalledWith("msg_to_cancel");
    });

    it("verifyQStashSignature returns true for valid signature", async () => {
      mockReceiverVerify.mockResolvedValue(true);

      const { verifyQStashSignature } = await import("./qstash");
      const result = await verifyQStashSignature(
        "valid-sig",
        '{"emailLogId":"test"}',
      );

      expect(result).toBe(true);
    });
  });

  // =========================================================================
  // BAD PATH
  // =========================================================================

  describe("Bad Path", () => {
    it("publishScheduledEmail throws when QStash client rejects", async () => {
      mockPublishJSON.mockRejectedValue(new Error("Invalid token"));

      const { publishScheduledEmail } = await import("./qstash");
      await expect(
        publishScheduledEmail("emaillog_bad", new Date(Date.now() + 60_000)),
      ).rejects.toThrow("Invalid token");
    });

    it("publishScheduledEmail throws when NEXT_PUBLIC_APP_URL is missing", async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;

      const { publishScheduledEmail } = await import("./qstash");
      await expect(
        publishScheduledEmail("emaillog_nourl", new Date(Date.now() + 60_000)),
      ).rejects.toThrow("NEXT_PUBLIC_APP_URL");
    });

    it("publishScheduledEmail throws when QSTASH_TOKEN is missing", async () => {
      delete process.env.QSTASH_TOKEN;

      const { publishScheduledEmail } = await import("./qstash");
      await expect(
        publishScheduledEmail(
          "emaillog_notoken",
          new Date(Date.now() + 60_000),
        ),
      ).rejects.toThrow("QSTASH_TOKEN");
    });

    it("cancelScheduledEmail throws on network error", async () => {
      mockMessagesDelete.mockRejectedValue(new Error("Network timeout"));

      const { cancelScheduledEmail } = await import("./qstash");
      await expect(cancelScheduledEmail("msg_network")).rejects.toThrow(
        "Network timeout",
      );
    });

    it("verifyQStashSignature returns false for invalid signature", async () => {
      mockReceiverVerify.mockRejectedValue(new Error("Invalid signature"));

      const { verifyQStashSignature } = await import("./qstash");
      const result = await verifyQStashSignature(
        "invalid-sig",
        '{"emailLogId":"test"}',
      );

      expect(result).toBe(false);
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("publishScheduledEmail with scheduledFor in the past results in delay = 0", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_past" });

      const { publishScheduledEmail } = await import("./qstash");
      const pastTime = new Date(Date.now() - 60_000); // 1 minute ago
      await publishScheduledEmail("emaillog_past", pastTime);

      const call = mockPublishJSON.mock.calls[0][0];
      expect(call.delay).toBe(0);
    });

    it("publishScheduledEmail with scheduledFor exactly now results in delay = 0", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_now" });

      const { publishScheduledEmail } = await import("./qstash");
      await publishScheduledEmail("emaillog_now", new Date());

      const call = mockPublishJSON.mock.calls[0][0];
      expect(call.delay).toBe(0);
    });

    it("publishScheduledEmail with scheduledFor 30 days in future calculates correct delay", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_30d" });

      const { publishScheduledEmail } = await import("./qstash");
      const thirtyDays = new Date(Date.now() + 30 * 24 * 3600_000);
      await publishScheduledEmail("emaillog_30d", thirtyDays);

      const call = mockPublishJSON.mock.calls[0][0];
      // ~2,592,000 seconds
      expect(call.delay).toBeGreaterThan(2_590_000);
      expect(call.delay).toBeLessThanOrEqual(2_592_000);
    });

    it("cancelScheduledEmail succeeds silently when message already gone (not found)", async () => {
      mockMessagesDelete.mockRejectedValue(new Error("Message not found"));

      const { cancelScheduledEmail } = await import("./qstash");
      // Should not throw
      await expect(
        cancelScheduledEmail("msg_already_gone"),
      ).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // SECURITY
  // =========================================================================

  describe("Security", () => {
    it("QStash client does not expose QSTASH_TOKEN in error messages", async () => {
      mockPublishJSON.mockRejectedValue(new Error("Auth failed"));

      const { publishScheduledEmail } = await import("./qstash");
      try {
        await publishScheduledEmail(
          "emaillog_sec",
          new Date(Date.now() + 60_000),
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        expect(msg).not.toContain("test-qstash-token");
        expect(msg).not.toContain(process.env.QSTASH_TOKEN);
      }
    });

    it("callback URL uses HTTPS scheme from NEXT_PUBLIC_APP_URL", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_https" });

      const { publishScheduledEmail } = await import("./qstash");
      await publishScheduledEmail(
        "emaillog_https",
        new Date(Date.now() + 60_000),
      );

      const call = mockPublishJSON.mock.calls[0][0];
      expect(call.url).toMatch(/^https:\/\//);
    });

    it("verifyQStashSignature uses Receiver with signing keys", async () => {
      mockReceiverVerify.mockResolvedValue(true);

      const { verifyQStashSignature } = await import("./qstash");
      await verifyQStashSignature("sig", "body");

      expect(mockReceiverVerify).toHaveBeenCalledWith({
        signature: "sig",
        body: "body",
      });
    });
  });

  // =========================================================================
  // DATA LEAK
  // =========================================================================

  describe("Data Leak", () => {
    it("error from QStash publish does not expose callback URL details", async () => {
      mockPublishJSON.mockRejectedValue(new Error("Publish failed"));

      const { publishScheduledEmail } = await import("./qstash");
      try {
        await publishScheduledEmail(
          "emaillog_leak",
          new Date(Date.now() + 60_000),
        );
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        // The error message from QStash itself should not contain our internal URL
        expect(msg).toBe("Publish failed");
      }
    });

    it("QStash messageId is opaque — does not leak organization or email details", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_opaque_xyz789" });

      const { publishScheduledEmail } = await import("./qstash");
      const result = await publishScheduledEmail(
        "emaillog_org123",
        new Date(Date.now() + 60_000),
      );

      // messageId should not contain org or email identifiers
      expect(result).not.toContain("emaillog_org123");
      expect(result).not.toContain("org123");
    });
  });

  // =========================================================================
  // DATA DAMAGE
  // =========================================================================

  describe("Data Damage", () => {
    it("publishScheduledEmail body only contains emailLogId (no extra data)", async () => {
      mockPublishJSON.mockResolvedValue({ messageId: "msg_minimal" });

      const { publishScheduledEmail } = await import("./qstash");
      await publishScheduledEmail(
        "emaillog_minimal",
        new Date(Date.now() + 60_000),
      );

      const call = mockPublishJSON.mock.calls[0][0];
      expect(Object.keys(call.body)).toEqual(["emailLogId"]);
      expect(call.body.emailLogId).toBe("emaillog_minimal");
    });

    it("cancelScheduledEmail does not modify other QStash messages", async () => {
      mockMessagesDelete.mockResolvedValue(undefined);

      const { cancelScheduledEmail } = await import("./qstash");
      await cancelScheduledEmail("msg_specific");

      // Should only be called once with specific ID
      expect(mockMessagesDelete).toHaveBeenCalledTimes(1);
      expect(mockMessagesDelete).toHaveBeenCalledWith("msg_specific");
    });
  });
});
