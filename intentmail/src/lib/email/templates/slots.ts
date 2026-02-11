// =============================================================================
// SLOT-BASED EMAIL TEMPLATES - Ported from email-system
// =============================================================================

import type { SlotDefinition, TemplateStructure } from '../types'

// =============================================================================
// TEMPLATE DEFINITIONS
// =============================================================================

export const TEMPLATE_SIMPLE: TemplateStructure = {
  id: 'simple',
  name: 'Simple Email',
  description: 'Clean email with greeting, body, and CTA',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      prompt: 'Warm, personalized greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'main_copy',
      type: 'paragraph',
      prompt: 'Main message content',
      maxLength: 300,
      required: true,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'medium',
      required: true,
    },
    {
      id: 'signoff',
      type: 'signature',
      staticContent: 'The {{productName}} Team',
    },
  ],
}

export const TEMPLATE_WITH_INFO_BOX: TemplateStructure = {
  id: 'info-box',
  name: 'Marketing with Info Box',
  description: 'Email with highlighted information section',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      prompt: 'Warm greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'intro',
      type: 'paragraph',
      prompt: 'Introduction paragraph',
      maxLength: 200,
      required: true,
    },
    {
      id: 'info_box',
      type: 'info-box',
      style: 'info',
      prompt: 'Key information to highlight',
      maxLength: 150,
      required: true,
    },
    {
      id: 'closing',
      type: 'paragraph',
      prompt: 'Closing paragraph with next steps',
      maxLength: 150,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'medium',
      required: true,
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

export const TEMPLATE_WITH_WARNING: TemplateStructure = {
  id: 'warning',
  name: 'Warning/Alert Email',
  description: 'Email with warning or alert box',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'warning_box',
      type: 'info-box',
      style: 'warning',
      prompt: 'Warning or alert message',
      maxLength: 200,
      required: true,
    },
    {
      id: 'explanation',
      type: 'paragraph',
      prompt: 'Explanation of the situation',
      maxLength: 250,
      required: true,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'strong',
      required: true,
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

export const TEMPLATE_WITH_BULLETS: TemplateStructure = {
  id: 'bullets',
  name: 'Bulleted List Email',
  description: 'Email with bulleted list of points',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'intro',
      type: 'paragraph',
      prompt: 'Introduction before the list',
      maxLength: 150,
      required: true,
    },
    {
      id: 'bullet_list',
      type: 'bullet-list',
      prompt: 'Key points as bullet items',
      required: true,
    },
    {
      id: 'closing',
      type: 'paragraph',
      prompt: 'Closing after the list',
      maxLength: 150,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'medium',
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

export const TEMPLATE_WITH_PROOF: TemplateStructure = {
  id: 'social-proof',
  name: 'Social Proof Email',
  description: 'Email with testimonial or social proof',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'intro',
      type: 'paragraph',
      prompt: 'Introduction paragraph',
      maxLength: 200,
      required: true,
    },
    {
      id: 'divider_1',
      type: 'divider',
    },
    {
      id: 'testimonial',
      type: 'testimonial',
      prompt: 'Customer testimonial',
      maxLength: 200,
      required: true,
    },
    {
      id: 'divider_2',
      type: 'divider',
    },
    {
      id: 'closing',
      type: 'paragraph',
      prompt: 'Closing with call to action',
      maxLength: 150,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'medium',
      required: true,
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

export const TEMPLATE_TRANSACTIONAL: TemplateStructure = {
  id: 'transactional',
  name: 'Transactional Email',
  description: 'Simple confirmation or notification',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'confirmation',
      type: 'info-box',
      style: 'success',
      prompt: 'Confirmation message',
      maxLength: 150,
      required: true,
    },
    {
      id: 'details',
      type: 'paragraph',
      prompt: 'Transaction details',
      maxLength: 250,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'soft',
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

export const TEMPLATE_SECURITY: TemplateStructure = {
  id: 'security',
  name: 'Security Notification',
  description: 'Security-related notification email',
  slots: [
    {
      id: 'greeting',
      type: 'greeting',
      maxLength: 50,
      required: true,
    },
    {
      id: 'alert',
      type: 'info-box',
      style: 'warning',
      prompt: 'Security alert message',
      maxLength: 150,
      required: true,
    },
    {
      id: 'details',
      type: 'paragraph',
      prompt: 'Details about the security event',
      maxLength: 200,
      required: true,
    },
    {
      id: 'action_needed',
      type: 'paragraph',
      prompt: 'What action the user should take',
      maxLength: 150,
    },
    {
      id: 'cta',
      type: 'cta-button',
      style: 'strong',
      required: true,
    },
    {
      id: 'ps_line',
      type: 'ps-line',
      staticContent: "If you didn't request this, please contact support immediately.",
    },
    {
      id: 'signoff',
      type: 'signature',
    },
  ],
}

// =============================================================================
// TEMPLATE REGISTRY
// =============================================================================

export const TEMPLATES: Record<string, TemplateStructure> = {
  simple: TEMPLATE_SIMPLE,
  'info-box': TEMPLATE_WITH_INFO_BOX,
  warning: TEMPLATE_WITH_WARNING,
  bullets: TEMPLATE_WITH_BULLETS,
  'social-proof': TEMPLATE_WITH_PROOF,
  transactional: TEMPLATE_TRANSACTIONAL,
  security: TEMPLATE_SECURITY,
}

export function getTemplate(templateId: string): TemplateStructure | undefined {
  return TEMPLATES[templateId]
}

export function listTemplates(): string[] {
  return Object.keys(TEMPLATES)
}

export function getTemplateSlots(templateId: string): SlotDefinition[] {
  const template = getTemplate(templateId)
  return template?.slots ?? []
}
