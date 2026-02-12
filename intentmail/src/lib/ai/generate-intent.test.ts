import { describe, it, expect } from "vitest";
import {
  getDefaultIntent,
  validateAndMerge,
  type GeneratedIntent,
} from "./generate-intent";

// =============================================================================
// HAPPY PATH
// =============================================================================

describe("getDefaultIntent", () => {
  it("generates valid default intent from description", () => {
    const result = getDefaultIntent("Welcome email for new trial signups");

    expect(result.name).toBe("Welcome email for new trial signups");
    expect(result.slug).toBe("welcome-email-for-new-trial-signups");
    expect(result.purpose).toBe("Welcome email for new trial signups");
    expect(result.tone).toBe("Warm, professional, helpful");
    expect(result.urgency).toBe("NONE");
    expect(result.templateId).toBe("simple");
    expect(result.ctaStyle).toBe("MEDIUM");
    expect(result.ctaText).toBe("Get Started");
    expect(result.slots).toHaveLength(4); // simple template has 4 slots
  });

  it("generates slug as lowercase hyphenated", () => {
    const result = getDefaultIntent("My Welcome Email");
    expect(result.slug).toBe("my-welcome-email");
  });

  it("includes all required fields", () => {
    const result = getDefaultIntent("Test email");
    const requiredFields: (keyof GeneratedIntent)[] = [
      "name",
      "slug",
      "purpose",
      "tone",
      "urgency",
      "subjectDefault",
      "subjectVariants",
      "templateId",
      "slots",
      "contentGoal",
      "contentMustInclude",
      "contentMustNotInclude",
      "ctaText",
      "ctaUrl",
      "ctaStyle",
    ];
    for (const field of requiredFields) {
      expect(result).toHaveProperty(field);
    }
  });

  it("slots match simple template structure", () => {
    const result = getDefaultIntent("Test");
    const slotIds = result.slots.map((s) => s.id);
    expect(slotIds).toContain("greeting");
    expect(slotIds).toContain("main_copy");
    expect(slotIds).toContain("cta");
    expect(slotIds).toContain("signoff");
  });
});

describe("validateAndMerge", () => {
  it("validates and returns complete Gemini output", () => {
    const raw = {
      name: "Welcome Email",
      slug: "welcome-email",
      purpose: "Welcome new trial users",
      tone: "Warm, professional, helpful",
      urgency: "NONE",
      subjectDefault: "Welcome to {{productName}}, {{firstName}}!",
      subjectVariants: ["Your account is ready"],
      templateId: "simple",
      slots: [
        { id: "greeting", prompt: "Warm welcome" },
        { id: "main_copy", prompt: "Brief welcome message" },
        { id: "cta", buttonText: "Get Started" },
        { id: "signoff", static: "The Team" },
      ],
      contentGoal: "Get user to dashboard",
      contentMustInclude: ["Confirmation"],
      contentMustNotInclude: ["Pricing"],
      ctaText: "Go to Dashboard",
      ctaUrl: "{{dashboardUrl}}",
      ctaStyle: "STRONG",
    };

    const result = validateAndMerge(raw, "Welcome email");
    expect(result.name).toBe("Welcome Email");
    expect(result.urgency).toBe("NONE");
    expect(result.ctaStyle).toBe("STRONG");
    expect(result.slots).toHaveLength(4);
  });

  it("urgency is valid enum value", () => {
    for (const urgency of ["NONE", "LOW", "MEDIUM", "HIGH"]) {
      const result = validateAndMerge(
        {
          urgency,
          name: "Test",
          slug: "test",
          purpose: "Test",
          tone: "Test",
          subjectDefault: "Test",
        },
        "Test",
      );
      expect(result.urgency).toBe(urgency);
    }
  });

  it("ctaStyle is valid enum value", () => {
    for (const ctaStyle of ["SOFT", "MEDIUM", "STRONG"]) {
      const result = validateAndMerge(
        {
          ctaStyle,
          name: "Test",
          slug: "test",
          purpose: "Test",
          tone: "Test",
          urgency: "NONE",
          subjectDefault: "Test",
        },
        "Test",
      );
      expect(result.ctaStyle).toBe(ctaStyle);
    }
  });
});

// =============================================================================
// BAD PATH
// =============================================================================

describe("validateAndMerge - bad input", () => {
  it("returns defaults when Gemini returns malformed JSON (null)", () => {
    const result = validateAndMerge(null, "Welcome email");
    expect(result.name).toBeTruthy();
    expect(result.slug).toBeTruthy();
    expect(result.templateId).toBe("simple");
  });

  it("returns defaults when Gemini returns empty object", () => {
    const result = validateAndMerge({}, "Welcome email");
    expect(result.name).toBe("Welcome email");
    expect(result.slug).toBe("welcome-email");
  });

  it("returns defaults when Gemini returns array instead of object", () => {
    const result = validateAndMerge([], "Welcome email");
    expect(result.name).toBe("Welcome email");
  });

  it("returns defaults for invalid urgency value", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "CRITICAL",
        subjectDefault: "s",
      },
      "Test",
    );
    expect(["NONE", "LOW", "MEDIUM", "HIGH"]).toContain(result.urgency);
  });

  it("returns defaults for invalid ctaStyle value", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        ctaStyle: "EXTREME",
      },
      "Test",
    );
    expect(["SOFT", "MEDIUM", "STRONG"]).toContain(result.ctaStyle);
  });

  it("handles extra/unknown fields gracefully", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        unknownField: "hello",
        anotherField: 42,
      },
      "Test",
    );
    expect(result.name).toBe("Test");
    expect(
      (result as unknown as Record<string, unknown>).unknownField,
    ).toBeUndefined();
  });
});

// =============================================================================
// EDGE CASES
// =============================================================================

describe("getDefaultIntent - edge cases", () => {
  it("handles empty description", () => {
    const result = getDefaultIntent("");
    expect(result.name).toBe("New Email");
    expect(result.slug).toBe("new-email");
  });

  it("handles whitespace-only description", () => {
    const result = getDefaultIntent("   ");
    expect(result.name).toBe("New Email");
    expect(result.slug).toBe("new-email");
  });

  it("handles very long description (truncates name)", () => {
    const longDesc = "A".repeat(200);
    const result = getDefaultIntent(longDesc);
    expect(result.name.length).toBeLessThanOrEqual(50);
  });

  it("handles special characters in description", () => {
    const result = getDefaultIntent("Hello & Welcome — New User! (日本語)");
    expect(result.slug).toMatch(/^[a-z0-9.-]+$/);
  });

  it("handles unicode in description", () => {
    const result = getDefaultIntent("Bienvenue à notre service");
    expect(result.name).toBe("Bienvenue à notre service");
    // Slug strips non-ascii
    expect(result.slug).toMatch(/^[a-z0-9.-]+$/);
  });
});

describe("validateAndMerge - edge cases", () => {
  it("fixes invalid templateId by falling back to simple", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        templateId: "nonexistent",
      },
      "Test",
    );
    expect(result.templateId).toBe("simple");
  });

  it("fills missing template slots from template defaults", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        templateId: "simple",
        slots: [{ id: "greeting", prompt: "Hi" }],
      },
      "Test",
    );
    // Should have all 4 slots from simple template
    expect(result.slots.length).toBe(4);
    const slotIds = result.slots.map((s) => s.id);
    expect(slotIds).toContain("greeting");
    expect(slotIds).toContain("main_copy");
    expect(slotIds).toContain("cta");
    expect(slotIds).toContain("signoff");
  });

  it("strips slots not in the chosen template", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        templateId: "simple",
        slots: [
          { id: "greeting", prompt: "Hi" },
          { id: "fake_slot", prompt: "Not real" },
        ],
      },
      "Test",
    );
    const slotIds = result.slots.map((s) => s.id);
    expect(slotIds).not.toContain("fake_slot");
  });
});

// =============================================================================
// SECURITY
// =============================================================================

describe("security", () => {
  it("slug is sanitized from Gemini output", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test<script>alert(1)</script>",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
      },
      "Test",
    );
    // slug should not contain < > or other special chars
    expect(result.slug).toMatch(/^[a-z0-9.-]*$/);
  });

  it("name is truncated to prevent overflow", () => {
    const result = validateAndMerge(
      {
        name: "A".repeat(500),
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
      },
      "Test",
    );
    expect(result.name.length).toBeLessThanOrEqual(200);
  });

  it("purpose is truncated to prevent overflow", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "P".repeat(1000),
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
      },
      "Test",
    );
    expect(result.purpose.length).toBeLessThanOrEqual(500);
  });
});

// =============================================================================
// DATA LEAK
// =============================================================================

describe("data leak prevention", () => {
  it("default intent does not expose internal IDs or keys", () => {
    const result = getDefaultIntent("Test");
    const json = JSON.stringify(result);
    expect(json).not.toContain("GOOGLE_AI_API_KEY");
    expect(json).not.toContain("UPSTASH");
    expect(json).not.toContain("sk-");
  });

  it("validateAndMerge strips unknown fields that could leak data", () => {
    const result = validateAndMerge(
      {
        name: "Test",
        slug: "test",
        purpose: "p",
        tone: "t",
        urgency: "NONE",
        subjectDefault: "s",
        apiKey: "sk-secret123",
        internalId: "org_123",
      },
      "Test",
    );
    const json = JSON.stringify(result);
    expect(json).not.toContain("sk-secret123");
    expect(json).not.toContain("org_123");
  });
});

// =============================================================================
// DATA DAMAGE
// =============================================================================

describe("data damage prevention", () => {
  it("endpoint is read-only — getDefaultIntent does not mutate anything", () => {
    const result1 = getDefaultIntent("Test 1");
    const result2 = getDefaultIntent("Test 2");
    // Each call produces independent results
    expect(result1.name).not.toBe(result2.name);
    expect(result1.slug).not.toBe(result2.slug);
  });

  it("malformed Gemini output does not corrupt defaults", () => {
    // Pass something that will fail validation
    const result = validateAndMerge({ name: 42, slug: true }, "Fallback test");
    // Should get clean defaults, not corrupted data
    expect(typeof result.name).toBe("string");
    expect(typeof result.slug).toBe("string");
    expect(result.templateId).toBe("simple");
    expect(Array.isArray(result.slots)).toBe(true);
  });
});
