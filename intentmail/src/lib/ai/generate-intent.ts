import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { TEMPLATES } from "@/lib/email/templates/slots";

// =============================================================================
// TYPES
// =============================================================================

export interface GenerateIntentInput {
  description: string;
  brandContext?: {
    name: string;
    tone: string;
    doSay: string[];
    dontSay: string[];
  };
}

export interface GeneratedIntent {
  name: string;
  slug: string;
  purpose: string;
  tone: string;
  urgency: "NONE" | "LOW" | "MEDIUM" | "HIGH";
  subjectDefault: string;
  subjectVariants: string[];
  templateId: string;
  slots: {
    id: string;
    prompt?: string;
    static?: string;
    url?: string;
    buttonText?: string;
    maxLength?: number;
  }[];
  contentGoal: string;
  contentMustInclude: string[];
  contentMustNotInclude: string[];
  ctaText: string;
  ctaUrl: string;
  ctaStyle: "SOFT" | "MEDIUM" | "STRONG";
}

// =============================================================================
// VALIDATION SCHEMA
// =============================================================================

const generatedIntentSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(200)
    .transform((s) => s.replace(/[^a-z0-9.-]/g, "").slice(0, 200)),
  purpose: z.string().min(1).max(500),
  tone: z.string().min(1).max(200),
  urgency: z.enum(["NONE", "LOW", "MEDIUM", "HIGH"]),
  subjectDefault: z.string().min(1).max(200),
  subjectVariants: z.array(z.string()).default([]),
  templateId: z.string().default("simple"),
  slots: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string().optional(),
        static: z.string().optional(),
        url: z.string().optional(),
        buttonText: z.string().optional(),
        maxLength: z.number().optional(),
      }),
    )
    .default([]),
  contentGoal: z.string().default(""),
  contentMustInclude: z.array(z.string()).default([]),
  contentMustNotInclude: z.array(z.string()).default([]),
  ctaText: z.string().default("Get Started"),
  ctaUrl: z.string().default("{{dashboardUrl}}"),
  ctaStyle: z.enum(["SOFT", "MEDIUM", "STRONG"]).default("MEDIUM"),
});

// =============================================================================
// DEFAULTS
// =============================================================================

export function getDefaultIntent(description: string): GeneratedIntent {
  const name =
    description.length > 50
      ? description.slice(0, 50).trim()
      : description.trim();

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);

  const template = TEMPLATES["simple"];
  const slots = template.slots.map((slot) => ({
    id: slot.id,
    prompt: slot.prompt ?? "",
    static: slot.staticContent ?? "",
    maxLength: slot.maxLength,
  }));

  return {
    name: name || "New Email",
    slug: slug || "new-email",
    purpose: description || "Send an email",
    tone: "Warm, professional, helpful",
    urgency: "NONE",
    subjectDefault: `{{productName}} — ${name || "New Email"}`,
    subjectVariants: [],
    templateId: "simple",
    slots,
    contentGoal: "",
    contentMustInclude: [],
    contentMustNotInclude: [],
    ctaText: "Get Started",
    ctaUrl: "{{dashboardUrl}}",
    ctaStyle: "MEDIUM",
  };
}

// =============================================================================
// GEMINI GENERATION
// =============================================================================

function buildGeneratePrompt(input: GenerateIntentInput): string {
  const templateIds = Object.keys(TEMPLATES);
  const templateDescriptions = Object.values(TEMPLATES)
    .map(
      (t) =>
        `- "${t.id}": ${t.name} — ${t.description} (slots: ${t.slots.map((s) => s.id).join(", ")})`,
    )
    .join("\n");

  let brandContext = "";
  if (input.brandContext) {
    brandContext = `
Brand context:
- Name: ${input.brandContext.name}
- Tone: ${input.brandContext.tone}
${input.brandContext.doSay.length > 0 ? `- Do say: ${input.brandContext.doSay.join(", ")}` : ""}
${input.brandContext.dontSay.length > 0 ? `- Don't say: ${input.brandContext.dontSay.join(", ")}` : ""}
`;
  }

  return `You are an email marketing expert. Given a description of an email intent, generate a complete intent configuration as JSON.

Available templates:
${templateDescriptions}

Valid templateId values: ${JSON.stringify(templateIds)}
Valid urgency values: "NONE", "LOW", "MEDIUM", "HIGH"
Valid ctaStyle values: "SOFT", "MEDIUM", "STRONG"

The slug must be lowercase letters, numbers, and hyphens only.
The slots array must match the slots of the chosen template. Each slot needs an "id" matching the template slot id, and a "prompt" describing what AI should generate for that slot. For signature/static slots, use "static" instead of "prompt".

${brandContext}

User description: "${input.description}"

Respond with ONLY a JSON object (no markdown, no code fences) with these exact fields:
{
  "name": "Human-readable intent name",
  "slug": "url-safe-slug",
  "purpose": "What this email achieves",
  "tone": "Tone description for AI generation",
  "urgency": "NONE|LOW|MEDIUM|HIGH",
  "subjectDefault": "Default subject line with {{productName}} and {{firstName}} variables",
  "subjectVariants": ["variant 1", "variant 2"],
  "templateId": "one of the valid template IDs",
  "slots": [{"id": "slot_id", "prompt": "what to generate"}, ...],
  "contentGoal": "What user action this email drives",
  "contentMustInclude": ["required element 1"],
  "contentMustNotInclude": ["excluded element 1"],
  "ctaText": "Button text",
  "ctaUrl": "{{variableName}} or URL",
  "ctaStyle": "SOFT|MEDIUM|STRONG"
}`;
}

export async function generateIntentFromDescription(
  input: GenerateIntentInput,
): Promise<GeneratedIntent> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return getDefaultIntent(input.description);
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: process.env.GOOGLE_AI_MODEL ?? "gemini-2.0-flash",
  });

  const prompt = buildGeneratePrompt(input);

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.7,
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text().trim();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }

  const parsed = JSON.parse(text);
  return validateAndMerge(parsed, input.description);
}

export function validateAndMerge(
  raw: unknown,
  description: string,
): GeneratedIntent {
  const defaults = getDefaultIntent(description);

  try {
    const validated = generatedIntentSchema.parse(raw);

    // Ensure templateId is valid
    if (!TEMPLATES[validated.templateId]) {
      validated.templateId = "simple";
    }

    // Ensure slots match the chosen template
    const template = TEMPLATES[validated.templateId];
    if (template) {
      const templateSlotIds = new Set(template.slots.map((s) => s.id));
      const validSlots = validated.slots.filter((s) =>
        templateSlotIds.has(s.id),
      );

      // Fill in missing slots from template defaults
      for (const templateSlot of template.slots) {
        if (!validSlots.find((s) => s.id === templateSlot.id)) {
          validSlots.push({
            id: templateSlot.id,
            prompt: templateSlot.prompt ?? "",
            static: templateSlot.staticContent ?? "",
            maxLength: templateSlot.maxLength,
          });
        }
      }

      validated.slots = validSlots;
    }

    return validated as GeneratedIntent;
  } catch {
    // If validation fails, merge what we can with defaults
    if (raw && typeof raw === "object") {
      const obj = raw as Record<string, unknown>;
      return {
        ...defaults,
        name:
          typeof obj.name === "string" ? obj.name.slice(0, 200) : defaults.name,
        slug:
          typeof obj.slug === "string"
            ? obj.slug.replace(/[^a-z0-9.-]/g, "").slice(0, 200)
            : defaults.slug,
        purpose:
          typeof obj.purpose === "string"
            ? obj.purpose.slice(0, 500)
            : defaults.purpose,
        tone:
          typeof obj.tone === "string" ? obj.tone.slice(0, 200) : defaults.tone,
      };
    }
    return defaults;
  }
}

export async function generateIntentWithRetry(
  input: GenerateIntentInput,
  maxAttempts = 2,
): Promise<GeneratedIntent> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateIntentFromDescription(input);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  // All retries failed — return defaults
  console.error("Intent generation failed after retries:", lastError?.message);
  return getDefaultIntent(input.description);
}
