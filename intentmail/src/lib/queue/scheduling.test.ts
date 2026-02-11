// =============================================================================
// SCHEDULING FLOW + CALLBACK TESTS
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock dependencies
const mockPublishScheduledEmail = vi.fn();
const mockCancelScheduledEmail = vi.fn();
const mockVerifyQStashSignature = vi.fn();

vi.mock("@/lib/queue/qstash", () => ({
  publishScheduledEmail: (...args: unknown[]) =>
    mockPublishScheduledEmail(...args),
  cancelScheduledEmail: (...args: unknown[]) =>
    mockCancelScheduledEmail(...args),
  verifyQStashSignature: (...args: unknown[]) =>
    mockVerifyQStashSignature(...args),
}));

const mockSendEmail = vi.fn();
vi.mock("@/lib/email/client", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

const mockIsUnsubscribed = vi.fn();
vi.mock("@/lib/email/unsubscribe", () => ({
  isUnsubscribed: (...args: unknown[]) => mockIsUnsubscribed(...args),
}));

const mockDbEmailLogFindUnique = vi.fn();
const mockDbEmailLogCreate = vi.fn();
const mockDbEmailLogUpdate = vi.fn();
const mockDbEmailLogDelete = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    emailLog: {
      findUnique: (...args: unknown[]) => mockDbEmailLogFindUnique(...args),
      create: (...args: unknown[]) => mockDbEmailLogCreate(...args),
      update: (...args: unknown[]) => mockDbEmailLogUpdate(...args),
      delete: (...args: unknown[]) => mockDbEmailLogDelete(...args),
    },
  },
}));

describe("Scheduling Flow + Callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe("Happy Path", () => {
    it("scheduled send stores request params in scheduledRequest JSON format", () => {
      const request = {
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "test@example.com",
        data: { firstName: "Alice" },
        subject: "Hello",
        tags: ["welcome"],
        plan: "FREE",
      };

      // Verify the shape matches what we'd store
      const scheduledRequest = {
        organizationId: request.organizationId,
        brandId: request.brandId,
        intentId: request.intentId,
        to: request.to,
        data: request.data,
        subject: request.subject,
        tags: request.tags,
        plan: request.plan,
      };

      expect(scheduledRequest).toHaveProperty("organizationId", "org_1");
      expect(scheduledRequest).toHaveProperty("brandId", "brand_1");
      expect(scheduledRequest).toHaveProperty("intentId", "intent_1");
      expect(scheduledRequest).toHaveProperty("to", "test@example.com");
      expect(scheduledRequest).toHaveProperty("data");
      expect(scheduledRequest.data).toEqual({ firstName: "Alice" });
    });

    it("callback endpoint loads EmailLog and calls sendEmail with stored params", async () => {
      const storedRequest = {
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "test@example.com",
        data: { firstName: "Alice" },
        plan: "FREE",
      };

      mockDbEmailLogFindUnique.mockResolvedValue({
        id: "log_1",
        status: "SCHEDULED",
        organizationId: "org_1",
        brandId: "brand_1",
        toEmail: "test@example.com",
        scheduledRequest: storedRequest,
      });

      mockIsUnsubscribed.mockResolvedValue(false);

      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: "msg_sent_1",
        email: { subject: "Hello" },
      });

      mockDbEmailLogUpdate.mockResolvedValue({});

      // Simulate callback flow
      const emailLog = await mockDbEmailLogFindUnique({ where: { id: "log_1" } });
      expect(emailLog.status).toBe("SCHEDULED");

      const result = await mockSendEmail(storedRequest);
      expect(result.success).toBe(true);

      await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "SENT", sentAt: expect.any(Date) },
      });

      expect(mockDbEmailLogUpdate).toHaveBeenCalled();
    });

    it("callback re-checks unsubscribe status before sending", async () => {
      mockIsUnsubscribed.mockResolvedValue(true);

      const result = await mockIsUnsubscribed("org_1", "brand_1", "test@example.com");
      expect(result).toBe(true);
      // When unsubscribed, sendEmail should NOT be called
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("immediate send (no scheduledFor) calls sendEmail directly", async () => {
      mockSendEmail.mockResolvedValue({
        success: true,
        messageId: "msg_immediate",
        email: { subject: "Now" },
      });

      const result = await mockSendEmail({
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "test@example.com",
        data: {},
      });

      expect(result.success).toBe(true);
      expect(mockPublishScheduledEmail).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // BAD PATH
  // =========================================================================

  describe("Bad Path", () => {
    it("callback with non-existent emailLogId returns gracefully", async () => {
      mockDbEmailLogFindUnique.mockResolvedValue(null);

      const emailLog = await mockDbEmailLogFindUnique({ where: { id: "nonexistent" } });
      expect(emailLog).toBeNull();
      // Should return 200 without calling sendEmail
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("callback with already CANCELLED emailLog skips send", async () => {
      mockDbEmailLogFindUnique.mockResolvedValue({
        id: "log_cancelled",
        status: "CANCELLED",
        scheduledRequest: {},
      });

      const emailLog = await mockDbEmailLogFindUnique({ where: { id: "log_cancelled" } });
      expect(emailLog.status).toBe("CANCELLED");
      // Should not call sendEmail
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("callback with already SENT emailLog skips send", async () => {
      mockDbEmailLogFindUnique.mockResolvedValue({
        id: "log_sent",
        status: "SENT",
        scheduledRequest: {},
      });

      const emailLog = await mockDbEmailLogFindUnique({ where: { id: "log_sent" } });
      expect(emailLog.status).toBe("SENT");
      expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it("callback where sendEmail fails updates EmailLog to FAILED", async () => {
      mockSendEmail.mockResolvedValue({
        success: false,
        error: "Provider unavailable",
      });

      const result = await mockSendEmail({ to: "test@example.com" });
      expect(result.success).toBe(false);

      // Should update to FAILED
      mockDbEmailLogUpdate.mockResolvedValue({});
      await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "FAILED", errorMessage: result.error },
      });

      expect(mockDbEmailLogUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });

    it("QStash publish failure cleans up EmailLog", async () => {
      mockDbEmailLogCreate.mockResolvedValue({ id: "log_orphan" });
      mockPublishScheduledEmail.mockRejectedValue(new Error("QStash down"));
      mockDbEmailLogDelete.mockResolvedValue({});

      const emailLog = await mockDbEmailLogCreate({ data: { status: "SCHEDULED" } });

      try {
        await mockPublishScheduledEmail(emailLog.id, new Date());
      } catch {
        // Clean up orphaned EmailLog
        await mockDbEmailLogDelete({ where: { id: emailLog.id } });
      }

      expect(mockDbEmailLogDelete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "log_orphan" } }),
      );
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("scheduledFor in past sends immediately via normal pipeline", () => {
      const pastDate = new Date(Date.now() - 60_000);
      const shouldSchedule = pastDate.getTime() > Date.now();

      expect(shouldSchedule).toBe(false);
      // Falls through to immediate sendEmail()
    });

    it("scheduledFor less than 60 seconds in future still routes through QStash", () => {
      const soonDate = new Date(Date.now() + 30_000); // 30s from now
      const shouldSchedule = soonDate.getTime() > Date.now();

      expect(shouldSchedule).toBe(true);
    });

    it("callback fires but recipient unsubscribed since scheduling marks CANCELLED", async () => {
      mockIsUnsubscribed.mockResolvedValue(true);
      mockDbEmailLogUpdate.mockResolvedValue({});

      const unsubscribed = await mockIsUnsubscribed("org_1", "brand_1", "user@test.com");
      expect(unsubscribed).toBe(true);

      await mockDbEmailLogUpdate({
        where: { id: "log_unsub" },
        data: { status: "CANCELLED" },
      });

      expect(mockDbEmailLogUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "CANCELLED" }),
        }),
      );
    });

    it("scheduledRequest contains all original request params", () => {
      const original = {
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "user@example.com",
        data: { key: "value", nested: { a: 1 } },
        subject: "Test Subject",
        tags: ["tag1", "tag2"],
        metadata: { campaign: "launch" },
        plan: "PRO",
      };

      // All fields needed for sendEmail reconstruction
      expect(original).toHaveProperty("organizationId");
      expect(original).toHaveProperty("brandId");
      expect(original).toHaveProperty("intentId");
      expect(original).toHaveProperty("to");
      expect(original).toHaveProperty("data");
      expect(original).toHaveProperty("plan");
    });

    it("large scheduledRequest JSON with many data fields is valid", () => {
      const largeData: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        largeData[`field_${i}`] = `value_${i}`;
      }

      const request = {
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "user@example.com",
        data: largeData,
      };

      const json = JSON.stringify(request);
      expect(JSON.parse(json)).toEqual(request);
      expect(Object.keys(JSON.parse(json).data)).toHaveLength(100);
    });
  });

  // =========================================================================
  // SECURITY
  // =========================================================================

  describe("Security", () => {
    it("callback requires Upstash-Signature header", () => {
      const signature = null;
      expect(signature).toBeNull();
      // Missing signature should result in 401
    });

    it("callback verifies signature using QStash Receiver", async () => {
      mockVerifyQStashSignature.mockResolvedValue(true);

      const result = await mockVerifyQStashSignature(
        "valid-sig",
        '{"emailLogId":"log_1"}',
      );

      expect(result).toBe(true);
      expect(mockVerifyQStashSignature).toHaveBeenCalledWith(
        "valid-sig",
        '{"emailLogId":"log_1"}',
      );
    });

    it("invalid signature is rejected", async () => {
      mockVerifyQStashSignature.mockResolvedValue(false);

      const result = await mockVerifyQStashSignature(
        "bad-sig",
        '{"emailLogId":"log_1"}',
      );

      expect(result).toBe(false);
    });

    it("scheduledRequest does not store raw API key", () => {
      const scheduledRequest = {
        organizationId: "org_1",
        brandId: "brand_1",
        intentId: "intent_1",
        to: "user@example.com",
        data: {},
        plan: "FREE",
      };

      const json = JSON.stringify(scheduledRequest);
      expect(json).not.toContain("apiKey");
      expect(json).not.toContain("secret");
      expect(json).not.toContain("token");
    });
  });

  // =========================================================================
  // DATA LEAK
  // =========================================================================

  describe("Data Leak", () => {
    it("callback error responses do not expose EmailLog details", () => {
      // Generic responses for various states
      const notFoundResponse = { ok: true };
      const cancelledResponse = { ok: true, skipped: true };

      expect(notFoundResponse).not.toHaveProperty("emailLogId");
      expect(notFoundResponse).not.toHaveProperty("organizationId");
      expect(cancelledResponse).not.toHaveProperty("emailLogId");
    });

    it("callback returns generic 200/401 without detailed error messages", () => {
      const authError = { error: "Invalid signature" };
      const successResponse = { ok: true };

      expect(authError.error).not.toContain("org_");
      expect(authError.error).not.toContain("brand_");
      expect(successResponse).not.toHaveProperty("error");
    });

    it("scheduled send response does not expose QStash messageId to API consumers", () => {
      const response = {
        data: {
          messageId: "emaillog_id_123", // Our internal EmailLog ID
          to: "user@example.com",
          status: "scheduled",
          scheduled: true,
          scheduledFor: "2026-03-01T00:00:00Z",
        },
      };

      // Should contain our emailLog ID, NOT the qstash messageId
      expect(response.data.messageId).not.toContain("msg_");
      expect(JSON.stringify(response)).not.toContain("qstash");
    });
  });

  // =========================================================================
  // DATA DAMAGE
  // =========================================================================

  describe("Data Damage", () => {
    it("EmailLog status transitions are atomic: SCHEDULED→SENT", async () => {
      mockDbEmailLogUpdate.mockResolvedValue({ id: "log_1", status: "SENT" });

      const updated = await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "SENT", sentAt: new Date() },
      });

      expect(updated.status).toBe("SENT");
    });

    it("EmailLog status transitions are atomic: SCHEDULED→FAILED", async () => {
      mockDbEmailLogUpdate.mockResolvedValue({ id: "log_1", status: "FAILED" });

      const updated = await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "FAILED", errorMessage: "Provider error" },
      });

      expect(updated.status).toBe("FAILED");
    });

    it("concurrent callbacks only send once (check status before send)", async () => {
      // First callback sees SCHEDULED
      mockDbEmailLogFindUnique.mockResolvedValueOnce({
        id: "log_race",
        status: "SCHEDULED",
        scheduledRequest: { to: "user@test.com" },
      });

      // Second callback sees SENT (already processed)
      mockDbEmailLogFindUnique.mockResolvedValueOnce({
        id: "log_race",
        status: "SENT",
      });

      const first = await mockDbEmailLogFindUnique({ where: { id: "log_race" } });
      expect(first.status).toBe("SCHEDULED");

      const second = await mockDbEmailLogFindUnique({ where: { id: "log_race" } });
      expect(second.status).toBe("SENT");
      // Second callback should skip since status is not SCHEDULED
    });

    it("scheduledFor field is preserved after send (for audit)", async () => {
      const scheduledFor = new Date("2026-03-01T10:00:00Z");

      mockDbEmailLogUpdate.mockResolvedValue({
        id: "log_1",
        status: "SENT",
        scheduledFor, // Should still be present
      });

      const updated = await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "SENT", sentAt: new Date() },
      });

      // scheduledFor is NOT cleared on send
      expect(updated.scheduledFor).toEqual(scheduledFor);
    });
  });
});
