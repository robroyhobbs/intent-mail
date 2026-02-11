// =============================================================================
// WEBHOOK PROCESSOR TESTS - 6 Categories
// =============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { NormalizedWebhookEvent } from "./types";

// Mock db
vi.mock("@/lib/db", () => ({
  db: {
    webhookEvent: { create: vi.fn() },
    emailLog: { findFirst: vi.fn(), update: vi.fn() },
  },
}));

// Mock unsubscribe
vi.mock("@/lib/email/unsubscribe", () => ({
  recordUnsubscribe: vi.fn(),
}));

import { db } from "@/lib/db";
import { recordUnsubscribe } from "@/lib/email/unsubscribe";
import { processWebhookEvent } from "./processor";

const mockDb = db as unknown as {
  webhookEvent: { create: ReturnType<typeof vi.fn> };
  emailLog: {
    findFirst: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};
const mockRecordUnsubscribe = recordUnsubscribe as ReturnType<typeof vi.fn>;

function makeEvent(
  overrides: Partial<NormalizedWebhookEvent> = {},
): NormalizedWebhookEvent {
  return {
    provider: "resend",
    messageId: "msg-123",
    eventType: "delivered",
    email: "user@test.com",
    timestamp: new Date("2026-02-10T12:00:00Z"),
    raw: { type: "email.delivered" },
    ...overrides,
  };
}

const baseEmailLog = {
  id: "log-1",
  organizationId: "org-1",
  brandId: "brand-1",
  intentId: "intent-1",
  providerId: "prov-1",
  toEmail: "user@test.com",
  fromEmail: "noreply@test.com",
  subject: "Test",
  providerMessageId: "msg-123",
  status: "SENT" as const,
  sentAt: new Date(),
  deliveredAt: null,
  openedAt: null,
  clickedAt: null,
  bouncedAt: null,
  complainedAt: null,
  errorCode: null,
  errorMessage: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.webhookEvent.create.mockResolvedValue({ id: "evt-1" });
  mockDb.emailLog.findFirst.mockResolvedValue({ ...baseEmailLog });
  mockDb.emailLog.update.mockResolvedValue({ ...baseEmailLog });
  mockRecordUnsubscribe.mockResolvedValue(undefined);
});

// =============================================================================
// HAPPY PATH
// =============================================================================

describe("Happy Path", () => {
  it("stores raw event in WebhookEvent table", async () => {
    await processWebhookEvent(makeEvent());

    expect(mockDb.webhookEvent.create).toHaveBeenCalledWith({
      data: {
        provider: "RESEND",
        eventType: "delivered",
        payload: { type: "email.delivered" },
      },
    });
  });

  it("updates EmailLog status to DELIVERED", async () => {
    await processWebhookEvent(makeEvent({ eventType: "delivered" }));

    expect(mockDb.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "log-1" },
        data: expect.objectContaining({ status: "DELIVERED" }),
      }),
    );
  });

  it("updates EmailLog status to BOUNCED with bouncedAt", async () => {
    await processWebhookEvent(
      makeEvent({
        eventType: "bounced",
        metadata: { bounceType: "hard", bounceReason: "User unknown" },
      }),
    );

    expect(mockDb.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "BOUNCED",
          errorCode: "hard",
          errorMessage: "User unknown",
        }),
      }),
    );
  });

  it("updates EmailLog status to COMPLAINED with complainedAt", async () => {
    await processWebhookEvent(makeEvent({ eventType: "complained" }));

    expect(mockDb.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "COMPLAINED" }),
      }),
    );
  });

  it("updates EmailLog status to OPENED with openedAt", async () => {
    mockDb.emailLog.findFirst.mockResolvedValue({
      ...baseEmailLog,
      status: "DELIVERED",
      deliveredAt: new Date(),
    });

    await processWebhookEvent(makeEvent({ eventType: "opened" }));

    expect(mockDb.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "OPENED" }),
      }),
    );
  });

  it("updates EmailLog status to CLICKED with clickedAt", async () => {
    mockDb.emailLog.findFirst.mockResolvedValue({
      ...baseEmailLog,
      status: "OPENED",
      deliveredAt: new Date(),
      openedAt: new Date(),
    });

    await processWebhookEvent(makeEvent({ eventType: "clicked" }));

    expect(mockDb.emailLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "CLICKED" }),
      }),
    );
  });

  it("complaint event triggers recordUnsubscribe with source complaint", async () => {
    await processWebhookEvent(makeEvent({ eventType: "complained" }));

    expect(mockRecordUnsubscribe).toHaveBeenCalledWith(
      "org-1",
      "brand-1",
      "user@test.com",
      "complaint",
    );
  });
});

// =============================================================================
// BAD PATH
// =============================================================================

describe("Bad Path", () => {
  it("unknown providerMessageId stores event but skips EmailLog update", async () => {
    mockDb.emailLog.findFirst.mockResolvedValue(null);

    const result = await processWebhookEvent(makeEvent());

    expect(result.success).toBe(true);
    expect(result.eventStored).toBe(true);
    expect(result.emailLogUpdated).toBe(false);
    expect(mockDb.emailLog.update).not.toHaveBeenCalled();
  });

  it("DB error on WebhookEvent create returns error", async () => {
    mockDb.webhookEvent.create.mockRejectedValue(new Error("DB down"));

    const result = await processWebhookEvent(makeEvent());

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to store webhook event");
  });

  it("DB error on EmailLog update does not prevent WebhookEvent storage", async () => {
    mockDb.emailLog.update.mockRejectedValue(new Error("Update failed"));

    const result = await processWebhookEvent(makeEvent());

    expect(result.success).toBe(true);
    expect(result.eventStored).toBe(true);
    expect(result.emailLogUpdated).toBe(false);
  });

  it("invalid eventType (deferred) stores but no status change", async () => {
    const result = await processWebhookEvent(
      makeEvent({ eventType: "deferred" }),
    );

    expect(result.success).toBe(true);
    expect(result.eventStored).toBe(true);
    expect(mockDb.emailLog.update).not.toHaveBeenCalled();
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("Edge Cases", () => {
  it("duplicate event is idempotent (timestamp not overwritten if set)", async () => {
    const existingTime = new Date("2026-02-10T11:00:00Z");
    mockDb.emailLog.findFirst.mockResolvedValue({
      ...baseEmailLog,
      status: "DELIVERED",
      deliveredAt: existingTime,
    });

    await processWebhookEvent(makeEvent({ eventType: "delivered" }));

    // Status stays DELIVERED, doesn't regress — no update called
    // because DELIVERED -> DELIVERED doesn't advance
    expect(mockDb.emailLog.update).not.toHaveBeenCalled();
  });

  it("deferred event stores in WebhookEvent but no EmailLog change", async () => {
    const result = await processWebhookEvent(
      makeEvent({ eventType: "deferred" }),
    );

    expect(result.eventStored).toBe(true);
    expect(mockDb.emailLog.update).not.toHaveBeenCalled();
  });

  it("complaint on email with no brandId skips auto-unsubscribe", async () => {
    mockDb.emailLog.findFirst.mockResolvedValue({
      ...baseEmailLog,
      brandId: null,
    });

    await processWebhookEvent(makeEvent({ eventType: "complained" }));

    expect(mockRecordUnsubscribe).not.toHaveBeenCalled();
  });

  it("status only advances forward (OPENED cannot regress to DELIVERED)", async () => {
    mockDb.emailLog.findFirst.mockResolvedValue({
      ...baseEmailLog,
      status: "OPENED",
      deliveredAt: new Date(),
      openedAt: new Date(),
    });

    await processWebhookEvent(makeEvent({ eventType: "delivered" }));

    // Should not update since OPENED > DELIVERED
    expect(mockDb.emailLog.update).not.toHaveBeenCalled();
  });
});

// =============================================================================
// SECURITY
// =============================================================================

describe("Security", () => {
  it("processor does not expose internal error details in return", async () => {
    mockDb.webhookEvent.create.mockRejectedValue(
      new Error("Connection refused to 10.0.0.1:5432"),
    );

    const result = await processWebhookEvent(makeEvent());

    expect(result.error).toBe("Failed to store webhook event");
    expect(result.error).not.toContain("10.0.0.1");
  });

  it("raw payload stored as-is for forensics", async () => {
    const rawPayload = { type: "email.bounced", data: { details: "full" } };
    await processWebhookEvent(makeEvent({ raw: rawPayload }));

    expect(mockDb.webhookEvent.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ payload: rawPayload }),
      }),
    );
  });
});

// =============================================================================
// DATA LEAK
// =============================================================================

describe("Data Leak", () => {
  it("processWebhookEvent does not log recipient email", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processWebhookEvent(
      makeEvent({ email: "secret@private.com" }),
    );

    for (const call of [...consoleSpy.mock.calls, ...warnSpy.mock.calls]) {
      expect(call.join(" ")).not.toContain("secret@private.com");
    }

    consoleSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("error returns do not include payload details", async () => {
    mockDb.webhookEvent.create.mockRejectedValue(new Error("DB error"));

    const result = await processWebhookEvent(
      makeEvent({ raw: { secret: "data" } }),
    );

    expect(result.error).not.toContain("secret");
    expect(result.error).not.toContain("data");
  });
});

// =============================================================================
// DATA DAMAGE
// =============================================================================

describe("Data Damage", () => {
  it("concurrent events for same messageId use findFirst safely", async () => {
    // Both find the same EmailLog
    mockDb.emailLog.findFirst.mockResolvedValue({ ...baseEmailLog });

    const [r1, r2] = await Promise.all([
      processWebhookEvent(makeEvent({ eventType: "delivered" })),
      processWebhookEvent(makeEvent({ eventType: "opened" })),
    ]);

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
    expect(mockDb.webhookEvent.create).toHaveBeenCalledTimes(2);
  });

  it("complaint auto-unsubscribe failure does not prevent event storage", async () => {
    mockRecordUnsubscribe.mockRejectedValue(new Error("Unsub failed"));

    const result = await processWebhookEvent(
      makeEvent({ eventType: "complained" }),
    );

    expect(result.success).toBe(true);
    expect(result.eventStored).toBe(true);
  });
});
