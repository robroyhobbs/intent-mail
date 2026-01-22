/**
 * Email Templates (V2 - Slots-Based)
 *
 * Pre-defined HTML structures with slots for AI-generated content.
 * This separates STRUCTURE (fixed, tested HTML) from CONTENT (AI-generated text).
 */

import type { TemplateStructure, SlotDefinition, BrandConfig, EmailSlotContent } from '../types';

// Re-export types for use by other modules
export type { EmailSlotContent } from '../types';

// =============================================================================
// TEMPLATE: Simple
// =============================================================================

export const TEMPLATE_SIMPLE: TemplateStructure = {
  id: 'simple',
  name: 'Simple',
  description: 'Basic email with greeting, body, CTA, and signoff',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Personalized greeting', maxLength: 50, required: true },
    { id: 'intro', type: 'paragraph', prompt: 'Main message body', maxLength: 300, required: true },
    { id: 'cta', type: 'cta-button', style: 'medium', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Team' },
  ],
};

// =============================================================================
// TEMPLATE: With Info Box
// =============================================================================

export const TEMPLATE_WITH_INFO_BOX: TemplateStructure = {
  id: 'with-info-box',
  name: 'With Info Box',
  description: 'Email with highlighted information box',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Personalized greeting', maxLength: 50, required: true },
    { id: 'intro', type: 'paragraph', prompt: 'Introduction paragraph', maxLength: 150, required: true },
    { id: 'highlight', type: 'info-box', prompt: 'Key information to highlight', maxLength: 200, required: true, style: 'info' },
    { id: 'explanation', type: 'paragraph', prompt: 'Additional explanation', maxLength: 150 },
    { id: 'cta', type: 'cta-button', style: 'medium', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Team' },
  ],
};

// =============================================================================
// TEMPLATE: With Warning
// =============================================================================

export const TEMPLATE_WITH_WARNING: TemplateStructure = {
  id: 'with-warning',
  name: 'With Warning',
  description: 'Email with warning/alert box',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Personalized greeting', maxLength: 50, required: true },
    { id: 'intro', type: 'paragraph', prompt: 'Introduction paragraph', maxLength: 150, required: true },
    { id: 'warning', type: 'warning-box', prompt: 'Warning or alert message', maxLength: 200, required: true, style: 'warning' },
    { id: 'next_steps', type: 'paragraph', prompt: 'What to do next', maxLength: 150 },
    { id: 'cta', type: 'cta-button', style: 'strong', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Team' },
  ],
};

// =============================================================================
// TEMPLATE: With Bullets
// =============================================================================

export const TEMPLATE_WITH_BULLETS: TemplateStructure = {
  id: 'with-bullets',
  name: 'With Bullets',
  description: 'Marketing email with bulleted list',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Warm, personalized greeting', maxLength: 50, required: true },
    { id: 'intro', type: 'paragraph', prompt: 'Brief intro setting up the list', maxLength: 150, required: true },
    { id: 'points', type: 'bullet-list', prompt: 'Key points to highlight', minItems: 2, maxItems: 5, required: true },
    { id: 'closing', type: 'paragraph', prompt: 'Brief closing that ties to CTA', maxLength: 150 },
    { id: 'cta', type: 'cta-button', style: 'medium', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Team' },
  ],
};

// =============================================================================
// TEMPLATE: Transactional
// =============================================================================

export const TEMPLATE_TRANSACTIONAL: TemplateStructure = {
  id: 'transactional',
  name: 'Transactional',
  description: 'Receipt/confirmation style email',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Brief greeting', maxLength: 40, required: true },
    { id: 'confirmation', type: 'paragraph', prompt: 'Confirmation headline', maxLength: 100, required: true },
    { id: 'details', type: 'receipt-details', prompt: 'Transaction details', maxLength: 300, required: true },
    { id: 'next_steps', type: 'paragraph', prompt: 'What happens next', maxLength: 150 },
    { id: 'cta', type: 'cta-button', style: 'soft', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Team' },
  ],
};

// =============================================================================
// TEMPLATE: Security Alert
// =============================================================================

export const TEMPLATE_SECURITY: TemplateStructure = {
  id: 'security',
  name: 'Security Alert',
  description: 'Security notification email',
  slots: [
    { id: 'greeting', type: 'greeting', prompt: 'Brief greeting', maxLength: 40, required: true },
    { id: 'alert', type: 'security-alert', prompt: 'Security alert message', maxLength: 150, required: true },
    { id: 'details', type: 'info-box', prompt: 'What happened (time, location, device)', maxLength: 200, required: true },
    { id: 'action', type: 'paragraph', prompt: 'What they should do if this wasn\'t them', maxLength: 150, required: true },
    { id: 'cta', type: 'cta-button', style: 'strong', required: true },
    { id: 'signoff', type: 'signature', staticContent: 'The {{productName}} Security Team' },
  ],
};

// =============================================================================
// TEMPLATES REGISTRY
// =============================================================================

export const TEMPLATES: Record<string, TemplateStructure> = {
  simple: TEMPLATE_SIMPLE,
  'with-info-box': TEMPLATE_WITH_INFO_BOX,
  'with-warning': TEMPLATE_WITH_WARNING,
  'with-bullets': TEMPLATE_WITH_BULLETS,
  transactional: TEMPLATE_TRANSACTIONAL,
  security: TEMPLATE_SECURITY,
};

/**
 * Get template by ID
 */
export function getTemplate(templateId: string): TemplateStructure | undefined {
  return TEMPLATES[templateId];
}

/**
 * List all templates
 */
export function listTemplates(): TemplateStructure[] {
  return Object.values(TEMPLATES);
}

/**
 * Get all templates (alias for listTemplates, used by API)
 */
export function getTemplates(): TemplateStructure[] {
  return Object.values(TEMPLATES);
}

// =============================================================================
// RENDERING
// =============================================================================

/**
 * Render a slot to HTML
 */
export function renderSlot(slot: SlotDefinition, content: any, brand: BrandConfig): string {
  if (!content) return '';

  switch (slot.type) {
    case 'greeting':
      return `<p style="margin: 0 0 24px 0; font-size: 18px;">${content}</p>`;

    case 'paragraph':
      return `<p style="margin: 0 0 24px 0;">${content}</p>`;

    case 'bullet-list':
      if (!Array.isArray(content)) return '';
      const items = content.map((item) => `<li style="margin-bottom: 8px;">${item}</li>`).join('');
      return `<ul style="margin: 0 0 24px 0; padding-left: 24px;">${items}</ul>`;

    case 'info-box':
      return `
        <div style="margin: 0 0 24px 0; padding: 16px 20px; background-color: #EFF6FF; border-left: 4px solid ${brand.colors.primary}; border-radius: 4px;">
          <p style="margin: 0; color: ${brand.colors.text};">${content}</p>
        </div>
      `;

    case 'warning-box':
      return `
        <div style="margin: 0 0 24px 0; padding: 16px 20px; background-color: #FEF3C7; border-left: 4px solid ${brand.colors.warning}; border-radius: 4px;">
          <p style="margin: 0; color: ${brand.colors.text};">${content}</p>
        </div>
      `;

    case 'highlight-box':
      return `
        <div style="margin: 0 0 24px 0; padding: 16px 20px; background-color: #F0FDF4; border-left: 4px solid ${brand.colors.success}; border-radius: 4px;">
          <p style="margin: 0; color: ${brand.colors.text};">${content}</p>
        </div>
      `;

    case 'security-alert':
      return `
        <div style="margin: 0 0 24px 0; padding: 16px 20px; background-color: #FEF2F2; border-left: 4px solid ${brand.colors.error}; border-radius: 4px;">
          <p style="margin: 0; color: ${brand.colors.text}; font-weight: 600;">${content}</p>
        </div>
      `;

    case 'receipt-details':
      return `
        <div style="margin: 0 0 24px 0; padding: 16px 20px; background-color: #F9FAFB; border: 1px solid ${brand.colors.border}; border-radius: 8px;">
          <p style="margin: 0; font-family: monospace; white-space: pre-wrap;">${content}</p>
        </div>
      `;

    case 'cta-button':
      if (!content || !content.url) return '';
      const style = slot.style || 'medium';
      const bgColor = style === 'strong' ? brand.colors.primary : style === 'soft' ? 'transparent' : brand.colors.primary;
      const textColor = style === 'soft' ? brand.colors.primary : '#ffffff';
      const border = style === 'soft' ? `2px solid ${brand.colors.primary}` : 'none';

      return `
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 24px;">
          <tr>
            <td>
              <a href="${content.url}" style="
                display: inline-block;
                padding: 14px 28px;
                background-color: ${bgColor};
                color: ${textColor};
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                border: ${border};
              ">${content.text}</a>
            </td>
          </tr>
        </table>
      `;

    case 'signature':
      const signoffText = content || slot.staticContent || '';
      return `<p style="margin: 24px 0 0 0; color: ${brand.colors.textMuted};">${signoffText}</p>`;

    default:
      return `<p style="margin: 0 0 24px 0;">${content}</p>`;
  }
}

/**
 * Render a complete template with slot content
 */
export function renderTemplate(template: TemplateStructure, content: EmailSlotContent, brand: BrandConfig): string {
  const parts: string[] = [];

  for (const slot of template.slots) {
    const slotContent = content[slot.id];

    // Check required slots
    if (slot.required && !slotContent) {
      throw new Error(`Missing required content for slot: ${slot.id} in template: ${template.id}`);
    }

    if (slotContent) {
      parts.push(renderSlot(slot, slotContent, brand));
    }
  }

  return parts.join('\n');
}

/**
 * Render full email HTML with wrapper
 */
export function renderFullEmail(
  template: TemplateStructure,
  content: EmailSlotContent,
  brand: BrandConfig,
  options: { subject: string; previewText?: string }
): string {
  const bodyHtml = renderTemplate(template, content, brand);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${options.subject}</title>
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
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; background-color: ${brand.colors.background}; }
    ${brand.typography.fontImportUrl ? `@import url('${brand.typography.fontImportUrl}');` : ''}
    .body-text { font-family: ${brand.typography.body}; }
    .heading { font-family: ${brand.typography.headings}; }
    a { color: ${brand.colors.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${brand.colors.background};">
  ${options.previewText ? `
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${options.previewText}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  ` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${brand.colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="container" style="background-color: ${brand.colors.surface}; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          ${brand.logo?.url ? `
          <tr>
            <td style="padding: 32px 40px 24px 40px; border-bottom: 1px solid ${brand.colors.border};">
              <img src="${brand.logo.url}" alt="${brand.logo.altText}" width="${brand.logo.width}" style="display: block;">
            </td>
          </tr>
          ` : ''}
          <tr>
            <td class="content body-text" style="padding: 40px; color: ${brand.colors.text}; font-size: 16px; line-height: 1.7;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 12px 12px; border-top: 1px solid ${brand.colors.border};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td class="body-text" style="font-size: 13px; color: ${brand.colors.textMuted}; line-height: 1.5;">
                    <p style="margin: 0 0 8px 0;">${brand.name}${brand.tagline ? ` &mdash; ${brand.tagline}` : ''}</p>
                    <p style="margin: 0;">
                      ${brand.links.privacy ? `<a href="${brand.links.privacy}" style="color: ${brand.colors.textMuted}; text-decoration: underline;">Privacy</a> &nbsp;|&nbsp;` : ''}
                      <a href="${brand.links.home}" style="color: ${brand.colors.textMuted}; text-decoration: underline;">${brand.links.home}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
