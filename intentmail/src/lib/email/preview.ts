// =============================================================================
// EMAIL PREVIEW - Generate preview HTML without sending
// =============================================================================

import { db } from "@/lib/db";
import { getTemplate } from "./templates/slots";
import { renderFullEmail, htmlToText } from "./templates/renderer";
import type { BrandConfig, IntentConfig, EmailSlotContent } from "./types";
import Handlebars from "handlebars";

function resolveTemplate(
  template: string,
  data: Record<string, unknown>,
): string {
  const compiled = Handlebars.compile(template, { noEscape: false });
  return compiled(data);
}

function dbBrandToBrandConfig(brand: {
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
    id: "",
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

function generateSlotContentSync(
  intent: IntentConfig,
  brand: BrandConfig,
  data: Record<string, unknown>,
): EmailSlotContent {
  const slotContent: EmailSlotContent = {};
  const template = getTemplate(intent.structure.template);

  if (!template) return slotContent;

  for (const slotDef of template.slots) {
    const slotConfig = intent.structure.slots.find((s) => s.id === slotDef.id);

    if (slotDef.type === "cta-button") {
      slotContent[slotDef.id] = {
        url: slotConfig?.url
          ? resolveTemplate(slotConfig.url, data)
          : intent.content.cta?.url ?? "#",
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
    } else if (slotConfig?.prompt) {
      // Use prompt as static fallback in preview (no AI generation)
      slotContent[slotDef.id] = { text: slotConfig.prompt };
    } else {
      // Provide placeholder content based on slot type
      if (slotDef.type === "paragraph") {
        slotContent[slotDef.id] = {
          text: "[Preview placeholder — configure slot content or enable AI generation]",
        };
      } else if (slotDef.type === "bullet-list") {
        slotContent[slotDef.id] = {
          items: ["Item one", "Item two", "Item three"],
        };
      } else if (slotDef.type === "headline") {
        slotContent[slotDef.id] = { text: "Headline" };
      } else if (slotDef.type === "info-box") {
        slotContent[slotDef.id] = {
          text: "[Info box content — configure in slot settings]",
        };
      } else if (slotDef.type === "testimonial") {
        slotContent[slotDef.id] = {
          text: "This product changed everything for our team.",
          attribution: "— Sample Customer, Acme Corp",
        };
      }
    }
  }

  return slotContent;
}

/**
 * Generate preview HTML for an intent + brand combination.
 * Uses static slot content only (no AI generation).
 */
export async function generatePreviewHtml(
  intentId: string,
  brandId: string | null,
  organizationId: string,
  sampleData: Record<string, unknown> = {},
): Promise<{ html: string; subject: string } | { error: string }> {
  const intentRecord = await db.intent.findFirst({
    where: { id: intentId, organizationId },
  });

  if (!intentRecord) {
    return { error: "Intent not found" };
  }

  // Use specified brand, intent's brand, or first brand
  const brand = await db.brand.findFirst({
    where: {
      organizationId,
      ...(brandId
        ? { id: brandId }
        : intentRecord.brandId
          ? { id: intentRecord.brandId }
          : {}),
    },
  });

  if (!brand) {
    return { error: "No brand configured. Create a brand first." };
  }

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
      enabled: false, // Always disabled for preview
      constraints: [],
    },
  };

  const brandConfig = dbBrandToBrandConfig(brand);
  const template = getTemplate(intent.structure.template);

  if (!template) {
    return { error: `Template "${intent.structure.template}" not found` };
  }

  const data = {
    firstName: "Alice",
    productName: brand.name,
    ...sampleData,
    organizationId,
  };

  const subject = resolveTemplate(intent.subject.default, data);
  const slotContent = generateSlotContentSync(intent, brandConfig, data);
  const html = renderFullEmail(template, slotContent, brandConfig, {
    subject,
    previewText: `Preview of ${intent.name}`,
  });

  return { html, subject };
}
