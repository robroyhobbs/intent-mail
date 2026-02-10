// =============================================================================
// EMAIL CLIENT - Multi-tenant email sending
// =============================================================================

import { db } from "@/lib/db";
import { decryptWithRotation } from "@/lib/encryption";
import {
  buildSystemPrompt,
  buildUserPrompt,
  generateWithRetry,
} from "@/lib/ai/gemini";
import {
  checkGenerationLimit,
  incrementGenerationCount,
} from "@/lib/ai/limits";
import { createProvider } from "./providers";
import { getTemplate } from "./templates/slots";
import { renderFullEmail, htmlToText } from "./templates/renderer";
import { validateEmail } from "./generation/validator";
import type {
  BrandConfig,
  IntentConfig,
  EmailRequest,
  SendResult,
  GeneratedEmail,
  EmailSlotContent,
} from "./types";
import type { Plan } from "@prisma/client";
import Handlebars from "handlebars";

// =============================================================================
// BRAND CONVERSION
// =============================================================================

function dbBrandToBrandConfig(brand: {
  id: string;
  name: string;
  tagline: string | null;
  colorPrimary: string;
  colorSecondary: string;
  colorSuccess: string;
  colorWarning: string;
  colorError: string;
  colorBackground: string;
  colorSurface: string;
  colorText: string;
  colorTextMuted: string;
  colorBorder: string;
  fontHeadings: string;
  fontBody: string;
  fontImportUrl: string | null;
  voiceTone: string;
  voiceDoSay: unknown;
  voiceDontSay: unknown;
  logoUrl: string | null;
  logoWidth: number;
  logoAlt: string | null;
  linkHome: string | null;
  linkPrivacy: string | null;
  linkUnsubscribe: string | null;
  fromEmail: string | null;
  fromName: string | null;
}): BrandConfig {
  return {
    id: brand.id,
    name: brand.name,
    tagline: brand.tagline ?? undefined,
    colors: {
      primary: brand.colorPrimary,
      secondary: brand.colorSecondary,
      success: brand.colorSuccess,
      warning: brand.colorWarning,
      error: brand.colorError,
      background: brand.colorBackground,
      surface: brand.colorSurface,
      text: brand.colorText,
      textMuted: brand.colorTextMuted,
      border: brand.colorBorder,
    },
    typography: {
      headings: brand.fontHeadings,
      body: brand.fontBody,
      fontImportUrl: brand.fontImportUrl ?? undefined,
    },
    voice: {
      tone: brand.voiceTone,
      doSay: (brand.voiceDoSay as string[]) ?? [],
      dontSay: (brand.voiceDontSay as string[]) ?? [],
    },
    logo: brand.logoUrl
      ? {
          url: brand.logoUrl,
          width: brand.logoWidth,
          altText: brand.logoAlt ?? brand.name,
        }
      : undefined,
    links: {
      home: brand.linkHome ?? undefined,
      privacy: brand.linkPrivacy ?? undefined,
      unsubscribe: brand.linkUnsubscribe ?? undefined,
    },
    fromEmail: brand.fromEmail ?? undefined,
    fromName: brand.fromName ?? undefined,
  };
}

// =============================================================================
// TEMPLATE RENDERING
// =============================================================================

function resolveTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: false });
  return compiled(data);
}

async function generateSlotContent(
  intent: IntentConfig,
  brand: BrandConfig,
  data: Record<string, unknown>,
  plan?: Plan,
): Promise<EmailSlotContent> {
  const slotContent: EmailSlotContent = {};
  const template = getTemplate(intent.structure.template);

  if (!template) {
    return slotContent;
  }

  // Check if AI generation is enabled and within limits
  let canGenerate = intent.generation.enabled;
  if (canGenerate && plan) {
    canGenerate = await checkGenerationLimit(
      data.organizationId as string,
      plan,
    );
  }

  for (const slotDef of template.slots) {
    const slotConfig = intent.structure.slots.find((s) => s.id === slotDef.id);

    if (slotDef.type === "cta-button") {
      slotContent[slotDef.id] = {
        url: slotConfig?.url
          ? resolveTemplate(slotConfig.url, data)
          : intent.content.cta?.url,
        buttonText:
          slotConfig?.buttonText ?? intent.content.cta?.text ?? "Learn More",
      };
    } else if (slotDef.type === "greeting") {
      const firstName = data.firstName as string;
      slotContent[slotDef.id] = {
        text: firstName ? `Hey ${firstName},` : "Hey there,",
      };
    } else if (slotDef.type === "signature") {
      slotContent[slotDef.id] = {
        text: slotConfig?.static
          ? resolveTemplate(slotConfig.static, {
              ...data,
              productName: brand.name,
            })
          : `The ${brand.name} Team`,
      };
    } else if (slotDef.staticContent) {
      slotContent[slotDef.id] = {
        text: resolveTemplate(slotDef.staticContent, {
          ...data,
          productName: brand.name,
        }),
      };
    } else if (slotConfig?.static) {
      slotContent[slotDef.id] = {
        text: resolveTemplate(slotConfig.static, data),
      };
    } else if (slotConfig?.prompt && canGenerate) {
      // AI generation for prompt slots
      try {
        const systemPrompt = buildSystemPrompt(intent, brand);
        const userPrompt = buildUserPrompt(slotDef, slotConfig, data);
        const text = await generateWithRetry(systemPrompt, userPrompt);

        if (slotDef.type === "bullet-list") {
          slotContent[slotDef.id] = {
            items: text
              .split("\n")
              .filter(Boolean)
              .map((l) => l.replace(/^[-•]\s*/, "")),
          };
        } else {
          slotContent[slotDef.id] = { text };
        }

        // Increment generation counter
        await incrementGenerationCount(data.organizationId as string);
      } catch {
        // AI failed — fall back to static content
        slotContent[slotDef.id] = {
          text: slotConfig.static ?? slotConfig.prompt ?? "",
        };
      }
    } else if (slotConfig?.prompt) {
      // generationEnabled is false or limit exceeded — use prompt as static fallback
      slotContent[slotDef.id] = { text: slotConfig.prompt };
    }
  }

  return slotContent;
}

// =============================================================================
// EMAIL GENERATION
// =============================================================================

export async function generateEmail(
  intent: IntentConfig,
  brand: BrandConfig,
  data: Record<string, unknown>,
  plan?: Plan,
): Promise<GeneratedEmail> {
  // Resolve subject
  const subject = resolveTemplate(intent.subject.default, data);

  // Get template
  const template = getTemplate(intent.structure.template);
  if (!template) {
    throw new Error(`Template not found: ${intent.structure.template}`);
  }

  // Generate slot content (async for AI generation)
  const slotContent = await generateSlotContent(intent, brand, data, plan);

  // Render HTML
  const html = renderFullEmail(template, slotContent, brand, {
    subject,
    unsubscribeUrl: brand.links.unsubscribe,
  });

  // Generate plain text
  const text = htmlToText(html);

  return {
    subject,
    html,
    text,
    metadata: {
      intentId: intent.id,
      brandId: brand.id,
      organizationId: data.organizationId as string,
      generatedAt: new Date(),
    },
  };
}

// =============================================================================
// EMAIL SENDING
// =============================================================================

export async function sendEmail(request: EmailRequest): Promise<SendResult> {
  const { organizationId, brandId, intentId, to, data } = request;

  // Load brand
  const brand = await db.brand.findFirst({
    where: { id: brandId, organizationId },
  });

  if (!brand) {
    return {
      success: false,
      error: "Brand not found",
      email: {} as GeneratedEmail,
    };
  }

  // Load intent
  const intentRecord = await db.intent.findFirst({
    where: { id: intentId, organizationId },
  });

  if (!intentRecord) {
    return {
      success: false,
      error: "Intent not found",
      email: {} as GeneratedEmail,
    };
  }

  // Convert to IntentConfig
  const intent: IntentConfig = {
    id: intentRecord.id,
    slug: intentRecord.slug,
    name: intentRecord.name,
    description: intentRecord.description ?? undefined,
    purpose: intentRecord.purpose,
    tone: intentRecord.tone,
    urgency: intentRecord.urgency.toLowerCase() as
      | "none"
      | "low"
      | "medium"
      | "high",
    subject: {
      default: intentRecord.subjectDefault,
      variants: intentRecord.subjectVariants as string[],
      maxLength: intentRecord.subjectMaxLength,
    },
    structure: {
      template: intentRecord.templateId,
      slots:
        intentRecord.slots as unknown as IntentConfig["structure"]["slots"],
    },
    content: {
      goal: intentRecord.contentGoal ?? undefined,
      mustInclude: intentRecord.contentMustInclude as string[],
      mustNotInclude: intentRecord.contentMustNotInclude as string[],
      cta: intentRecord.ctaText
        ? {
            text: intentRecord.ctaText,
            url: intentRecord.ctaUrl ?? "",
            style: intentRecord.ctaStyle.toLowerCase() as
              | "soft"
              | "medium"
              | "strong",
          }
        : undefined,
    },
    generation: {
      enabled: intentRecord.generationEnabled,
      constraints: intentRecord.generationConstraints as string[],
    },
  };

  const brandConfig = dbBrandToBrandConfig(brand);

  // Generate email (pass plan for AI generation limits)
  const email = await generateEmail(
    intent,
    brandConfig,
    { ...data, organizationId },
    request.plan as Plan | undefined,
  );

  // Validate email
  const validation = validateEmail(email, intent, brandConfig);
  email.metadata.validation = validation;

  if (!validation.passed) {
    // Log the failed validation but still allow sending if only warnings
    console.warn("Email validation issues:", validation.blocking);
  }

  // Get default provider
  const provider = await db.emailProvider.findFirst({
    where: { organizationId, isDefault: true, isActive: true },
  });

  if (!provider) {
    return {
      success: false,
      error: "No active email provider configured",
      email,
    };
  }

  // Decrypt API key (with lazy re-encryption on key rotation)
  const decryptResult = decryptWithRotation(
    provider.apiKeyEncrypted,
    provider.apiKeyIv,
  );
  const apiKey = decryptResult.decrypted;

  // Lazy re-encrypt if provider credential was on an old key
  if (decryptResult.rotated) {
    try {
      await db.emailProvider.update({
        where: { id: provider.id },
        data: {
          apiKeyEncrypted: decryptResult.newEncrypted,
          apiKeyIv: decryptResult.newIv,
        },
      });
    } catch {
      // Non-blocking: re-encryption failure doesn't prevent sending
      // Will re-encrypt on next access
    }
  }

  // Create provider instance
  const providerInstance = createProvider(
    provider.type.toLowerCase() as
      | "resend"
      | "sendgrid"
      | "postmark"
      | "aws_ses",
    apiKey,
    provider.config as Record<string, unknown>,
  );

  // Determine from address
  const fromEmail = brandConfig.fromEmail ?? `noreply@${to.split("@")[1]}`;
  const fromName = brandConfig.fromName ?? brandConfig.name;

  // Send email
  const result = await providerInstance.send({
    from: { email: fromEmail, name: fromName },
    to,
    subject: request.subject ?? email.subject,
    html: email.html,
    text: email.text,
    tags: request.tags,
    scheduledAt: request.scheduledFor,
  });

  // Log email
  await db.emailLog.create({
    data: {
      organizationId,
      brandId,
      intentId,
      providerId: provider.id,
      toEmail: to,
      fromEmail,
      subject: email.subject,
      providerMessageId: result.messageId,
      status: result.success ? "SENT" : "FAILED",
      sentAt: result.success ? new Date() : null,
      errorCode: result.success ? null : "SEND_FAILED",
      errorMessage: result.error ?? null,
      tags: request.tags ?? [],
      metadata: (request.metadata ?? {}) as Record<string, string>,
    },
  });

  // Update provider stats
  if (result.success) {
    await db.emailProvider.update({
      where: { id: provider.id },
      data: {
        emailsSent: { increment: 1 },
        lastUsedAt: new Date(),
      },
    });

    // Update organization email count
    await db.organization.update({
      where: { id: organizationId },
      data: {
        emailsUsedThisMonth: { increment: 1 },
      },
    });
  } else {
    await db.emailProvider.update({
      where: { id: provider.id },
      data: {
        lastErrorAt: new Date(),
        lastErrorMsg: result.error,
      },
    });
  }

  return {
    success: result.success,
    messageId: result.messageId,
    error: result.error,
    email,
  };
}
