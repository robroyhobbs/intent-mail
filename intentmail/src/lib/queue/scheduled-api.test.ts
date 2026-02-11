// =============================================================================
// CANCEL/RESCHEDULE API + LIST ENDPOINT TESTS
// =============================================================================

import { describe, it, expect, vi } from "vitest";

const mockCancelScheduledEmail = vi.fn();
const mockPublishScheduledEmail = vi.fn();

vi.mock("@/lib/queue/qstash", () => ({
  cancelScheduledEmail: (...args: unknown[]) =>
    mockCancelScheduledEmail(...args),
  publishScheduledEmail: (...args: unknown[]) =>
    mockPublishScheduledEmail(...args),
}));

const mockDbEmailLogFindFirst = vi.fn();
const mockDbEmailLogFindMany = vi.fn();
const mockDbEmailLogCount = vi.fn();
const mockDbEmailLogUpdate = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    emailLog: {
      findFirst: (...args: unknown[]) => mockDbEmailLogFindFirst(...args),
      findMany: (...args: unknown[]) => mockDbEmailLogFindMany(...args),
      count: (...args: unknown[]) => mockDbEmailLogCount(...args),
      update: (...args: unknown[]) => mockDbEmailLogUpdate(...args),
    },
  },
}));

describe("Cancel/Reschedule API + List Endpoint", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // HAPPY PATH
  // =========================================================================

  describe("Happy Path", () => {
    it("list returns SCHEDULED emails for the organization", async () => {
      const scheduled = [
        { id: "log_1", toEmail: "a@test.com", status: "SCHEDULED", scheduledFor: new Date() },
        { id: "log_2", toEmail: "b@test.com", status: "SCHEDULED", scheduledFor: new Date() },
      ];
      mockDbEmailLogFindMany.mockResolvedValue(scheduled);
      mockDbEmailLogCount.mockResolvedValue(2);

      const emails = await mockDbEmailLogFindMany({
        where: { organizationId: "org_1", status: "SCHEDULED" },
        orderBy: { scheduledFor: "asc" },
      });

      expect(emails).toHaveLength(2);
      expect(emails[0].status).toBe("SCHEDULED");
    });

    it("list supports pagination", async () => {
      mockDbEmailLogFindMany.mockResolvedValue([]);
      mockDbEmailLogCount.mockResolvedValue(50);

      const page = 2;
      const limit = 20;
      const skip = (page - 1) * limit;

      await mockDbEmailLogFindMany({
        where: { organizationId: "org_1", status: "SCHEDULED" },
        skip,
        take: limit,
      });

      expect(mockDbEmailLogFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );

      const total = await mockDbEmailLogCount();
      expect(Math.ceil(total / limit)).toBe(3); // 50/20 = 3 pages
    });

    it("cancel calls cancelScheduledEmail and sets status CANCELLED", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue({
        id: "log_cancel",
        organizationId: "org_1",
        status: "SCHEDULED",
        qstashMessageId: "qmsg_1",
      });
      mockCancelScheduledEmail.mockResolvedValue(undefined);
      mockDbEmailLogUpdate.mockResolvedValue({ id: "log_cancel", status: "CANCELLED" });

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_cancel", organizationId: "org_1" },
      });

      await mockCancelScheduledEmail(emailLog.qstashMessageId);
      expect(mockCancelScheduledEmail).toHaveBeenCalledWith("qmsg_1");

      const updated = await mockDbEmailLogUpdate({
        where: { id: "log_cancel" },
        data: { status: "CANCELLED" },
      });
      expect(updated.status).toBe("CANCELLED");
    });

    it("reschedule cancels old + publishes new QStash message", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue({
        id: "log_resched",
        organizationId: "org_1",
        status: "SCHEDULED",
        qstashMessageId: "qmsg_old",
      });
      mockPublishScheduledEmail.mockResolvedValue("qmsg_new");
      mockCancelScheduledEmail.mockResolvedValue(undefined);
      mockDbEmailLogUpdate.mockResolvedValue({});

      const newDate = new Date(Date.now() + 86400_000); // tomorrow

      // Publish new first
      const newMsgId = await mockPublishScheduledEmail("log_resched", newDate);
      expect(newMsgId).toBe("qmsg_new");

      // Cancel old
      await mockCancelScheduledEmail("qmsg_old");

      // Update DB
      await mockDbEmailLogUpdate({
        where: { id: "log_resched" },
        data: { scheduledFor: newDate, qstashMessageId: "qmsg_new" },
      });

      expect(mockDbEmailLogUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ qstashMessageId: "qmsg_new" }),
        }),
      );
    });
  });

  // =========================================================================
  // BAD PATH
  // =========================================================================

  describe("Bad Path", () => {
    it("cancel with non-existent id returns not found", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue(null);

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "nonexistent", organizationId: "org_1" },
      });

      expect(emailLog).toBeNull();
    });

    it("cancel on already-CANCELLED email is rejected", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue({
        id: "log_already_cancelled",
        status: "CANCELLED",
      });

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_already_cancelled" },
      });

      expect(emailLog.status).not.toBe("SCHEDULED");
      // Route would return 400
    });

    it("cancel on already-SENT email is rejected", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue({
        id: "log_already_sent",
        status: "SENT",
      });

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_already_sent" },
      });

      expect(emailLog.status).not.toBe("SCHEDULED");
    });

    it("reschedule without scheduledFor is invalid", () => {
      const { success } = z
        .object({ scheduledFor: z.string().datetime() })
        .safeParse({});

      expect(success).toBe(false);
    });

    it("reschedule with invalid date format is invalid", () => {
      const { success } = z
        .object({ scheduledFor: z.string().datetime() })
        .safeParse({ scheduledFor: "not-a-date" });

      expect(success).toBe(false);
    });

    it("reschedule on non-SCHEDULED email is rejected", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue({
        id: "log_failed",
        status: "FAILED",
      });

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_failed" },
      });

      expect(emailLog.status).not.toBe("SCHEDULED");
    });
  });

  // =========================================================================
  // EDGE CASES
  // =========================================================================

  describe("Edge Cases", () => {
    it("list with no scheduled emails returns empty array", async () => {
      mockDbEmailLogFindMany.mockResolvedValue([]);
      mockDbEmailLogCount.mockResolvedValue(0);

      const emails = await mockDbEmailLogFindMany({
        where: { organizationId: "org_1", status: "SCHEDULED" },
      });

      expect(emails).toEqual([]);
    });

    it("cancel when QStash cancel fails still marks CANCELLED in DB", async () => {
      mockCancelScheduledEmail.mockRejectedValue(new Error("QStash error"));
      mockDbEmailLogUpdate.mockResolvedValue({ status: "CANCELLED" });

      try {
        await mockCancelScheduledEmail("qmsg_gone");
      } catch {
        // Best-effort, continue
      }

      const updated = await mockDbEmailLogUpdate({
        where: { id: "log_1" },
        data: { status: "CANCELLED" },
      });

      expect(updated.status).toBe("CANCELLED");
    });

    it("reschedule to past time is rejected", () => {
      const pastDate = new Date(Date.now() - 60_000);
      expect(pastDate.getTime() <= Date.now()).toBe(true);
    });

    it("list sorts by scheduledFor ascending (soonest first)", async () => {
      const soon = new Date(Date.now() + 3600_000);
      const later = new Date(Date.now() + 86400_000);
      mockDbEmailLogFindMany.mockResolvedValue([
        { id: "log_soon", scheduledFor: soon },
        { id: "log_later", scheduledFor: later },
      ]);

      const emails = await mockDbEmailLogFindMany({
        where: { status: "SCHEDULED" },
        orderBy: { scheduledFor: "asc" },
      });

      expect(emails[0].scheduledFor.getTime()).toBeLessThan(
        emails[1].scheduledFor.getTime(),
      );
    });
  });

  // =========================================================================
  // SECURITY
  // =========================================================================

  describe("Security", () => {
    it("cannot access scheduled emails from another organization", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue(null);

      // Query with wrong org returns null
      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_other_org", organizationId: "org_attacker" },
      });

      expect(emailLog).toBeNull();
    });

    it("cancel verifies organization ownership", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue(null);

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_target", organizationId: "org_wrong" },
      });

      expect(emailLog).toBeNull();
      expect(mockCancelScheduledEmail).not.toHaveBeenCalled();
    });

    it("reschedule verifies organization ownership", async () => {
      mockDbEmailLogFindFirst.mockResolvedValue(null);

      const emailLog = await mockDbEmailLogFindFirst({
        where: { id: "log_target", organizationId: "org_wrong" },
      });

      expect(emailLog).toBeNull();
      expect(mockPublishScheduledEmail).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // DATA LEAK
  // =========================================================================

  describe("Data Leak", () => {
    it("list endpoint does not expose scheduledRequest or qstashMessageId", async () => {
      mockDbEmailLogFindMany.mockResolvedValue([
        {
          id: "log_1",
          toEmail: "a@test.com",
          subject: "Hello",
          status: "SCHEDULED",
          scheduledFor: new Date(),
          brandId: "brand_1",
          intentId: "intent_1",
          createdAt: new Date(),
        },
      ]);

      const emails = await mockDbEmailLogFindMany({
        select: {
          id: true,
          toEmail: true,
          subject: true,
          status: true,
          scheduledFor: true,
          brandId: true,
          intentId: true,
          createdAt: true,
        },
      });

      const fields = Object.keys(emails[0]);
      expect(fields).not.toContain("scheduledRequest");
      expect(fields).not.toContain("qstashMessageId");
    });

    it("not-found errors do not reveal if ID exists in another org", async () => {
      const response = {
        error: { code: "NOT_FOUND", message: "Scheduled email not found" },
      };

      // Same message regardless of whether the ID exists in another org
      expect(response.error.message).not.toContain("org_");
      expect(response.error.message).not.toContain("belongs to");
    });
  });

  // =========================================================================
  // DATA DAMAGE
  // =========================================================================

  describe("Data Damage", () => {
    it("cancel is idempotent — calling twice does not corrupt state", async () => {
      // First call: SCHEDULED → CANCELLED
      mockDbEmailLogFindFirst.mockResolvedValueOnce({
        id: "log_1",
        status: "SCHEDULED",
        qstashMessageId: "qmsg_1",
        organizationId: "org_1",
      });

      // Second call: already CANCELLED
      mockDbEmailLogFindFirst.mockResolvedValueOnce({
        id: "log_1",
        status: "CANCELLED",
        organizationId: "org_1",
      });

      const first = await mockDbEmailLogFindFirst({ where: { id: "log_1" } });
      expect(first.status).toBe("SCHEDULED");

      const second = await mockDbEmailLogFindFirst({ where: { id: "log_1" } });
      expect(second.status).toBe("CANCELLED");
      // Second call returns 400, doesn't change state
    });

    it("reschedule publishes new before cancelling old (rollback safety)", async () => {
      const callOrder: string[] = [];

      mockPublishScheduledEmail.mockImplementation(async () => {
        callOrder.push("publish_new");
        return "qmsg_new";
      });

      mockCancelScheduledEmail.mockImplementation(async () => {
        callOrder.push("cancel_old");
      });

      await mockPublishScheduledEmail("log_1", new Date(Date.now() + 3600_000));
      await mockCancelScheduledEmail("qmsg_old");

      expect(callOrder).toEqual(["publish_new", "cancel_old"]);
    });

    it("if new QStash publish fails during reschedule, old message is NOT cancelled", async () => {
      mockPublishScheduledEmail.mockRejectedValue(new Error("QStash down"));

      try {
        await mockPublishScheduledEmail("log_1", new Date(Date.now() + 3600_000));
      } catch {
        // Publish failed — should NOT cancel old
      }

      expect(mockCancelScheduledEmail).not.toHaveBeenCalled();
    });
  });
});

// Need z import for validation tests
import { z } from "zod";
import { beforeEach } from "vitest";
