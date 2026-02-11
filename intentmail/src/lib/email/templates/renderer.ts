// =============================================================================
// EMAIL TEMPLATE RENDERER - Ported from email-system
// =============================================================================

import type {
  BrandConfig,
  SlotDefinition,
  SlotContent,
  EmailSlotContent,
  TemplateStructure,
  BoxStyle,
  CTAStyle,
} from "../types";

// =============================================================================
// HTML ESCAPING — prevents XSS via user-controlled content
// =============================================================================

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(str: string): string {
  return escapeHtml(str);
}

// =============================================================================
// SLOT RENDERERS
// =============================================================================

function getBoxColor(
  style: BoxStyle,
  colors: BrandConfig["colors"],
): { bg: string; border: string } {
  switch (style) {
    case "success":
      return { bg: colors.success + "15", border: colors.success };
    case "warning":
      return { bg: colors.warning + "15", border: colors.warning };
    case "error":
      return { bg: colors.error + "15", border: colors.error };
    case "info":
    default:
      return { bg: colors.primary + "15", border: colors.primary };
  }
}

function getButtonStyle(
  style: CTAStyle,
  colors: BrandConfig["colors"],
): { bg: string; text: string } {
  switch (style) {
    case "soft":
      return { bg: colors.background, text: colors.primary };
    case "strong":
      return { bg: colors.primary, text: "#ffffff" };
    case "medium":
    default:
      return { bg: colors.primary, text: "#ffffff" };
  }
}

export function renderGreeting(text: string, brand: BrandConfig): string {
  return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.5; color: ${brand.colors.text}; font-family: ${brand.typography.body};">${escapeHtml(text)}</p>`;
}

export function renderHeadline(text: string, brand: BrandConfig): string {
  return `<h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: 700; line-height: 1.2; color: ${brand.colors.text}; font-family: ${brand.typography.headings};">${escapeHtml(text)}</h1>`;
}

export function renderParagraph(text: string, brand: BrandConfig): string {
  return `<p style="margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; color: ${brand.colors.text}; font-family: ${brand.typography.body};">${escapeHtml(text)}</p>`;
}

export function renderBulletList(items: string[], brand: BrandConfig): string {
  const listItems = items
    .map((item) => `<li style="margin-bottom: 8px;">${escapeHtml(item)}</li>`)
    .join("\n");
  return `<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 16px; line-height: 1.6; color: ${brand.colors.text}; font-family: ${brand.typography.body};">\n${listItems}\n</ul>`;
}

export function renderInfoBox(
  text: string,
  style: BoxStyle,
  brand: BrandConfig,
): string {
  const { bg, border } = getBoxColor(style, brand.colors);
  return `<div style="margin: 0 0 16px 0; padding: 16px 20px; background-color: ${bg}; border-left: 4px solid ${border}; border-radius: 4px;">
  <p style="margin: 0; font-size: 15px; line-height: 1.5; color: ${brand.colors.text}; font-family: ${brand.typography.body};">${escapeHtml(text)}</p>
</div>`;
}

export function renderStatsBox(text: string, brand: BrandConfig): string {
  return `<div style="margin: 0 0 16px 0; padding: 20px; background-color: ${brand.colors.background}; border-radius: 8px; text-align: center;">
  <p style="margin: 0; font-size: 15px; line-height: 1.5; color: ${brand.colors.text}; font-family: ${brand.typography.body};">${escapeHtml(text)}</p>
</div>`;
}

export function renderTestimonial(
  text: string,
  attribution: string,
  brand: BrandConfig,
): string {
  return `<div style="margin: 0 0 16px 0; padding: 20px; background-color: ${brand.colors.background}; border-radius: 8px;">
  <p style="margin: 0 0 12px 0; font-size: 16px; font-style: italic; line-height: 1.6; color: ${brand.colors.text}; font-family: ${brand.typography.body};">"${escapeHtml(text)}"</p>
  <p style="margin: 0; font-size: 14px; color: ${brand.colors.textMuted}; font-family: ${brand.typography.body};">— ${escapeHtml(attribution)}</p>
</div>`;
}

export function renderCTAButton(
  url: string,
  text: string,
  style: CTAStyle,
  brand: BrandConfig,
): string {
  const { bg, text: textColor } = getButtonStyle(style, brand.colors);
  const padding = style === "strong" ? "16px 32px" : "12px 24px";
  const fontSize = style === "strong" ? "16px" : "15px";

  return `<div style="margin: 24px 0; text-align: center;">
  <a href="${escapeAttr(url)}" style="display: inline-block; padding: ${padding}; background-color: ${bg}; color: ${textColor}; font-size: ${fontSize}; font-weight: 600; text-decoration: none; border-radius: 6px; font-family: ${brand.typography.body};">${escapeHtml(text)}</a>
</div>`;
}

export function renderPSLine(text: string, brand: BrandConfig): string {
  return `<p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.5; color: ${brand.colors.textMuted}; font-family: ${brand.typography.body};"><strong>P.S.</strong> ${escapeHtml(text)}</p>`;
}

export function renderSignature(text: string, brand: BrandConfig): string {
  return `<p style="margin: 24px 0 0 0; font-size: 16px; line-height: 1.5; color: ${brand.colors.text}; font-family: ${brand.typography.body};">${escapeHtml(text)}</p>`;
}

export function renderDivider(brand: BrandConfig): string {
  return `<hr style="margin: 24px 0; border: none; border-top: 1px solid ${brand.colors.border};" />`;
}

// =============================================================================
// MAIN RENDERER
// =============================================================================

export function renderSlot(
  slot: SlotDefinition,
  content: SlotContent,
  brand: BrandConfig,
): string {
  const text = content.text ?? slot.staticContent ?? "";

  switch (slot.type) {
    case "greeting":
      return renderGreeting(text, brand);
    case "headline":
      return renderHeadline(text, brand);
    case "paragraph":
      return renderParagraph(text, brand);
    case "bullet-list":
      return renderBulletList(content.items ?? [], brand);
    case "info-box":
      return renderInfoBox(text, (slot.style as BoxStyle) ?? "info", brand);
    case "stats-box":
      return renderStatsBox(text, brand);
    case "testimonial":
      return renderTestimonial(text, content.attribution ?? "Anonymous", brand);
    case "cta-button":
      return renderCTAButton(
        content.url ?? "#",
        content.buttonText ?? "Learn More",
        (slot.style as CTAStyle) ?? "medium",
        brand,
      );
    case "ps-line":
      return renderPSLine(text, brand);
    case "signature":
      return renderSignature(text, brand);
    case "divider":
      return renderDivider(brand);
    default:
      return "";
  }
}

export function renderTemplate(
  template: TemplateStructure,
  slotContent: EmailSlotContent,
  brand: BrandConfig,
): string {
  return template.slots
    .map((slot) => {
      const content = slotContent[slot.id] ?? {};
      return renderSlot(slot, content, brand);
    })
    .join("\n");
}

// =============================================================================
// FULL EMAIL WRAPPER
// =============================================================================

interface RenderOptions {
  subject: string;
  previewText?: string;
  unsubscribeUrl?: string;
}

export function renderFullEmail(
  template: TemplateStructure,
  slotContent: EmailSlotContent,
  brand: BrandConfig,
  options: RenderOptions,
): string {
  const bodyContent = renderTemplate(template, slotContent, brand);
  const previewText = options.previewText ?? "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(options.subject)}</title>
  ${brand.typography.fontImportUrl ? `<link href="${escapeAttr(brand.typography.fontImportUrl)}" rel="stylesheet">` : ""}
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table { border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a { color: ${brand.colors.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 16px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${brand.colors.background}; font-family: ${brand.typography.body};">
  ${previewText ? `<div style="display: none; max-height: 0; overflow: hidden;">${escapeHtml(previewText)}</div>` : ""}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: ${brand.colors.background};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" style="background-color: ${brand.colors.surface}; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header with Logo -->
          ${
            brand.logo?.url
              ? `
          <tr>
            <td style="padding: 32px 40px 24px;">
              <img src="${escapeAttr(brand.logo.url)}" alt="${escapeAttr(brand.logo.altText ?? brand.name)}" width="${brand.logo.width}" style="display: block;">
            </td>
          </tr>
          `
              : ""
          }
          <!-- Body Content -->
          <tr>
            <td style="padding: ${brand.logo?.url ? "0" : "32px"} 40px 32px;">
              ${bodyContent}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; border-top: 1px solid ${brand.colors.border};">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: ${brand.colors.textMuted}; font-family: ${brand.typography.body};">
                ${brand.tagline ? `${escapeHtml(brand.name)} — ${escapeHtml(brand.tagline)}` : escapeHtml(brand.name)}
              </p>
              <p style="margin: 0; font-size: 13px; color: ${brand.colors.textMuted}; font-family: ${brand.typography.body};">
                ${brand.links.home ? `<a href="${escapeAttr(brand.links.home)}" style="color: ${brand.colors.textMuted};">Website</a>` : ""}
                ${brand.links.privacy ? ` · <a href="${escapeAttr(brand.links.privacy)}" style="color: ${brand.colors.textMuted};">Privacy</a>` : ""}
                ${options.unsubscribeUrl ? ` · <a href="${escapeAttr(options.unsubscribeUrl)}" style="color: ${brand.colors.textMuted};">Unsubscribe</a>` : ""}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// =============================================================================
// PLAIN TEXT CONVERSION
// =============================================================================

export function htmlToText(html: string): string {
  return (
    html
      // Remove style and script tags
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      // Convert block elements to newlines
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<hr\s*\/?>/gi, "\n---\n")
      // Convert list items
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<\/li>/gi, "\n")
      // Convert links to [text](url) format
      .replace(/<a[^>]*href=["']([^"']*)["'][^>]*>([^<]*)<\/a>/gi, "$2 ($1)")
      // Remove remaining tags
      .replace(/<[^>]+>/g, "")
      // Decode HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\n{3,}/g, "\n\n")
      .trim()
  );
}
