"use client";

import { useMemo } from "react";
import { TEMPLATES } from "@/lib/email/templates/slots";
import type { SlotDefinition } from "@/lib/email/types";

interface SlotConfig {
  id: string;
  prompt?: string;
  static?: string;
  url?: string;
  buttonText?: string;
  maxLength?: number;
}

interface LivePreviewProps {
  templateId: string;
  slots: SlotConfig[];
  subjectDefault: string;
  subjectVariants: string[];
  ctaText: string;
  ctaStyle: "SOFT" | "MEDIUM" | "STRONG";
  brandColor?: string;
  intentName?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getCtaStyles(style: "SOFT" | "MEDIUM" | "STRONG", color: string): string {
  switch (style) {
    case "SOFT":
      return `color:${color};border:1px solid ${color};background:transparent;padding:10px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:500;font-size:14px;`;
    case "STRONG":
      return `color:#fff;background:${color};padding:12px 28px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;font-size:15px;border:none;box-shadow:0 2px 4px rgba(0,0,0,0.1);`;
    default: // MEDIUM
      return `color:#fff;background:${color};padding:10px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:500;font-size:14px;border:none;`;
  }
}

function renderSlotHtml(
  slotDef: SlotDefinition,
  slotConfig: SlotConfig | undefined,
  color: string,
  ctaText: string,
  ctaStyle: "SOFT" | "MEDIUM" | "STRONG",
): string {
  const prompt = slotConfig?.prompt || slotDef.prompt || "";
  const staticContent = slotConfig?.static || slotDef.staticContent || "";
  const displayText = staticContent || prompt;

  switch (slotDef.type) {
    case "greeting":
      return `<p style="font-size:16px;color:#1f2937;margin:0 0 16px;"><strong>[${escapeHtml(slotDef.id)}]</strong> ${escapeHtml(displayText)}</p>`;

    case "headline":
      return `<h2 style="font-size:20px;color:#1f2937;margin:0 0 12px;font-weight:600;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</h2>`;

    case "paragraph":
      return `<p style="font-size:14px;color:#4b5563;margin:0 0 16px;line-height:1.6;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</p>`;

    case "bullet-list":
      return `<div style="margin:0 0 16px;padding:12px 16px;background:#f9fafb;border-radius:6px;"><p style="font-size:13px;color:#6b7280;margin:0 0 8px;font-style:italic;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</p><ul style="margin:0;padding-left:20px;"><li style="font-size:14px;color:#4b5563;margin-bottom:4px;">Item 1</li><li style="font-size:14px;color:#4b5563;margin-bottom:4px;">Item 2</li><li style="font-size:14px;color:#4b5563;">Item 3</li></ul></div>`;

    case "info-box": {
      const boxColors: Record<string, { bg: string; border: string; text: string }> = {
        info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1e40af" },
        success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#166534" },
        warning: { bg: "#fffbeb", border: "#fde68a", text: "#92400e" },
        error: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" },
      };
      const style = (typeof slotDef.style === "string" ? boxColors[slotDef.style] : null) ?? boxColors.info;
      return `<div style="margin:0 0 16px;padding:14px 16px;background:${style.bg};border:1px solid ${style.border};border-radius:8px;"><p style="font-size:14px;color:${style.text};margin:0;line-height:1.5;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</p></div>`;
    }

    case "testimonial":
      return `<blockquote style="margin:0 0 16px;padding:14px 16px;border-left:3px solid ${color};background:#f9fafb;border-radius:0 8px 8px 0;"><p style="font-size:14px;color:#4b5563;margin:0 0 8px;font-style:italic;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</p><cite style="font-size:12px;color:#9ca3af;">${escapeHtml(slotConfig?.static || "— Customer Name")}</cite></blockquote>`;

    case "cta-button":
      return `<div style="margin:16px 0;text-align:center;"><a style="${getCtaStyles(ctaStyle, color)}">${escapeHtml(slotConfig?.buttonText || ctaText || "Get Started")}</a></div>`;

    case "signature":
      return `<p style="font-size:13px;color:#9ca3af;margin:16px 0 0;">${escapeHtml(staticContent || "The Team")}</p>`;

    case "ps-line":
      return `<p style="font-size:12px;color:#9ca3af;margin:12px 0 0;font-style:italic;">P.S. ${escapeHtml(displayText)}</p>`;

    case "divider":
      return `<hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />`;

    default:
      return `<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">[${escapeHtml(slotDef.id)}] ${escapeHtml(displayText)}</p>`;
  }
}

export function LivePreview({
  templateId,
  slots,
  subjectDefault,
  subjectVariants,
  ctaText,
  ctaStyle,
  brandColor = "#4598fa",
  intentName,
}: LivePreviewProps) {
  const srcDoc = useMemo(() => {
    const template = TEMPLATES[templateId];
    const slotMap = new Map(slots.map((s) => [s.id, s]));

    const slotHtml = template
      ? template.slots
          .map((slotDef) =>
            renderSlotHtml(slotDef, slotMap.get(slotDef.id), brandColor, ctaText, ctaStyle),
          )
          .join("\n")
      : `<p style="color:#9ca3af;font-style:italic;">No template selected</p>`;

    const variantsHtml =
      subjectVariants.length > 0
        ? `<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">
            <p style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">Subject Variants</p>
            ${subjectVariants
              .map(
                (v) =>
                  `<p style="font-size:13px;color:#6b7280;margin:0 0 4px;">&#8226; ${escapeHtml(v)}</p>`,
              )
              .join("")}
          </div>`
        : "";

    return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f5;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="background:${escapeHtml(brandColor)};padding:16px 20px;">
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.7);text-transform:uppercase;letter-spacing:0.05em;">Subject</p>
      <p style="margin:4px 0 0;font-size:15px;color:#fff;font-weight:500;">${escapeHtml(subjectDefault || "Email subject line")}</p>
    </div>
    <div style="padding:24px 20px;">
      ${slotHtml}
    </div>
  </div>
  ${variantsHtml}
</body>
</html>`;
  }, [templateId, slots, subjectDefault, subjectVariants, ctaText, ctaStyle, brandColor]);

  return (
    <div className="flex flex-col gap-3">
      {intentName && (
        <p className="text-xs font-medium text-muted-foreground">
          Preview: {intentName}
        </p>
      )}
      <iframe
        srcDoc={srcDoc}
        sandbox="allow-same-origin"
        title="Email preview"
        className="w-full rounded-lg border bg-muted/30"
        style={{ minHeight: 400, height: "100%" }}
      />
    </div>
  );
}
