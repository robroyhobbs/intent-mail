import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandConfig, IntentConfig, SlotDefinition } from "../email/types";

// =============================================================================
// GEMINI CLIENT
// =============================================================================

function getClient() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY environment variable is required for AI generation",
    );
  }
  return new GoogleGenerativeAI(apiKey);
}

function getModel() {
  const client = getClient();
  return client.getGenerativeModel({
    model: process.env.GOOGLE_AI_MODEL ?? "gemini-3-flash-preview",
  });
}

// =============================================================================
// PROMPT BUILDERS
// =============================================================================

export function buildSystemPrompt(
  intent: IntentConfig,
  brand: BrandConfig,
): string {
  const lines: string[] = [
    `You are an email copywriter for ${brand.name}.`,
    `Tone: ${brand.voice.tone}`,
  ];

  const doSay = brand.voice.doSay as string[];
  const dontSay = brand.voice.dontSay as string[];

  if (doSay.length > 0) {
    lines.push(`Do say: ${doSay.join(", ")}`);
  }
  if (dontSay.length > 0) {
    lines.push(`Don't say: ${dontSay.join(", ")}`);
  }

  lines.push("");
  lines.push(`Email purpose: ${intent.purpose}`);
  lines.push(`Urgency: ${intent.urgency}`);

  if (intent.generation.constraints.length > 0) {
    lines.push(`Constraints:`);
    for (const c of intent.generation.constraints) {
      lines.push(`- ${c}`);
    }
  }

  lines.push("");
  lines.push("Rules:");
  lines.push("- Write ONLY the requested content, no preamble or explanation");
  lines.push(
    "- Match the requested format exactly (headline, paragraph, bullet list, etc.)",
  );
  lines.push("- Keep it concise and actionable");

  return lines.join("\n");
}

interface SlotConfig {
  prompt?: string;
  maxLength?: number;
}

export function sanitizeRecipientData(
  data: Record<string, unknown>,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(data)) {
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      safe[key] = value;
    }
  }
  return safe;
}

export function buildUserPrompt(
  slot: SlotDefinition,
  slotConfig: SlotConfig,
  data: Record<string, unknown>,
): string {
  const lines: string[] = [
    `Write a ${slot.type} for this email.`,
    `Prompt: ${slotConfig.prompt ?? ""}`,
  ];

  if (slotConfig.maxLength) {
    lines.push(`Max length: ${slotConfig.maxLength} characters`);
  }

  const safeData = sanitizeRecipientData(data);
  if (Object.keys(safeData).length > 0) {
    lines.push(`Recipient context: ${JSON.stringify(safeData)}`);
  }

  return lines.join("\n");
}

// =============================================================================
// GENERATION
// =============================================================================

export async function generateSlotText(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const model = getModel();

  const result = await model.generateContent({
    systemInstruction: systemPrompt,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 500,
      temperature: 0.7,
    },
  });

  const text = result.response.text().trim();
  if (!text) {
    throw new Error("Gemini returned empty response");
  }
  return text;
}

export async function generateWithRetry(
  systemPrompt: string,
  userPrompt: string,
  maxAttempts = 2,
): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await generateSlotText(systemPrompt, userPrompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }

  throw lastError ?? new Error("AI generation failed");
}
