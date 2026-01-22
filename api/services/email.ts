import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { v4 as uuid } from 'uuid';
import { getBrand } from '../../lib/brands';
import { getIntent } from '../../lib/intents';
import { getTemplate, renderFullEmail } from '../../lib/templates';
import type { EmailSlotContent } from '../../lib/templates';
import { logEmail } from './logs';
import { aiContentService, type ContentGenerationRequest } from './ai';

export interface SendEmailParams {
  brand: string;
  intent: string;
  to: string | string[];
  data: Record<string, unknown>;
  slotOverrides?: Partial<EmailSlotContent>;
  subject?: string;
  scheduledFor?: Date;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  aiTokens?: {
    input: number;
    output: number;
  };
}

type EmailProvider = 'resend' | 'sendgrid' | 'smtp' | 'console';

class EmailService {
  private provider: EmailProvider;
  private resendClient?: Resend;
  private smtpTransport?: nodemailer.Transporter;

  constructor() {
    this.provider = (process.env.EMAIL_PROVIDER as EmailProvider) || 'console';
    this.initProvider();
  }

  private initProvider() {
    switch (this.provider) {
      case 'resend':
        if (process.env.RESEND_API_KEY) {
          this.resendClient = new Resend(process.env.RESEND_API_KEY);
        }
        break;
      case 'smtp':
        if (process.env.SMTP_HOST) {
          this.smtpTransport = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });
        }
        break;
      case 'console':
      default:
        // Console provider logs emails, doesn't send
        break;
    }
  }

  async send(params: SendEmailParams): Promise<SendEmailResult> {
    const { brand: brandId, intent: intentId, to, data, slotOverrides, subject: subjectOverride } = params;

    try {
      // Get brand configuration
      const brand = getBrand(brandId);
      if (!brand) {
        throw new Error(`Brand not found: ${brandId}`);
      }

      // Get intent definition
      const intent = getIntent(brandId, intentId);
      if (!intent) {
        throw new Error(`Intent not found: ${intentId}`);
      }

      // Get template (handle both simple and full intent formats)
      const templateId = 'template' in intent ? intent.template : intent.structure?.template;
      const template = getTemplate(templateId);
      if (!template) {
        throw new Error(`Template not found: ${templateId}`);
      }

      // Generate slot content from intent + data (with AI when available)
      const { content: slotContent, tokens: aiTokens } = await this.generateSlotContentWithAI(intent, template, brand, data, slotOverrides);

      // Determine subject
      const subject = subjectOverride || this.resolveSubject(intent, data);

      // Render full email HTML
      const previewText = 'purpose' in intent ? intent.purpose : intent.description;
      const html = renderFullEmail(template, slotContent, brand, {
        subject,
        previewText,
      });

      // Generate plain text version
      const text = this.htmlToText(html);

      // Get from address
      const from = this.getFromAddress(brand);

      // Send via provider
      const result = await this.sendViaProvider({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        scheduledFor: params.scheduledFor,
      });

      // Log the email
      await logEmail({
        id: uuid(),
        brand: brandId,
        intent: intentId,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        error: result.error,
        sentAt: new Date(),
      });

      // Include AI token usage in result for billing
      return {
        ...result,
        aiTokens: aiTokens.input > 0 || aiTokens.output > 0 ? aiTokens : undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed email
      await logEmail({
        id: uuid(),
        brand: brandId,
        intent: intentId,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject: subjectOverride || '',
        status: 'failed',
        error: errorMessage,
        sentAt: new Date(),
      });

      return { success: false, error: errorMessage };
    }
  }

  private async generateSlotContentWithAI(
    intent: any,
    template: any,
    brand: any,
    data: Record<string, unknown>,
    overrides?: Partial<EmailSlotContent>
  ): Promise<{ content: EmailSlotContent; tokens: { input: number; output: number } }> {
    const content: EmailSlotContent = {};
    const aiRequests: ContentGenerationRequest[] = [];

    // Build list of slots that need AI generation
    for (const templateSlot of template.slots) {
      const slotId = templateSlot.id;

      // Use override if provided
      if (overrides && overrides[slotId]) {
        content[slotId] = overrides[slotId];
        continue;
      }

      // Get intent-specific slot config
      const intentSlot = intent.slots?.[slotId] || {};

      // Handle static content slots
      switch (slotId) {
        case 'greeting':
          // AI can generate personalized greetings
          if (aiContentService.isEnabled() && (data.userName || data.firstName)) {
            aiRequests.push({
              slotId: 'greeting',
              slotType: 'greeting',
              prompt: intentSlot.prompt || 'Write a warm greeting using their name',
              brandVoice: brand.voice,
              brandName: brand.name,
              intentName: intent.name || intent.id,
              intentDescription: intent.description || intent.purpose || '',
              data,
            });
          } else {
            content.greeting = data.userName
              ? `Hi ${data.userName},`
              : data.firstName
                ? `Hi ${data.firstName},`
                : 'Hello,';
          }
          break;
        case 'signoff':
          content.signoff = templateSlot.staticContent || `The ${brand.name} Team`;
          break;
        case 'cta':
          content.cta = {
            text: intentSlot.text || 'Learn More',
            url: this.interpolate(intentSlot.url || '#', data),
          };
          break;
        default:
          // For content slots, prepare AI generation request
          const prompt = intentSlot.prompt || templateSlot.prompt;
          if (prompt) {
            if (aiContentService.isEnabled()) {
              aiRequests.push({
                slotId,
                slotType: templateSlot.type || 'paragraph',
                prompt,
                brandVoice: brand.voice,
                brandName: brand.name,
                intentName: intent.name || intent.id,
                intentDescription: intent.description || intent.purpose || '',
                data,
                maxLength: intentSlot.maxLength || templateSlot.maxLength,
                itemCount: intentSlot.items || templateSlot.maxItems,
              });
            } else {
              // Fallback to interpolation when AI is not available
              content[slotId] = this.interpolate(prompt, data);
            }
          }
      }
    }

    // Generate AI content in parallel
    let tokens = { input: 0, output: 0 };
    if (aiRequests.length > 0) {
      try {
        const aiResult = await aiContentService.generateAllSlots(aiRequests);
        Object.assign(content, aiResult.content);
        tokens = aiResult.tokens;
      } catch (error) {
        console.error('[Email Service] AI generation failed, using fallback:', error);
        // Fallback to interpolation for failed AI slots
        for (const req of aiRequests) {
          if (!content[req.slotId]) {
            content[req.slotId] = this.interpolate(req.prompt, data);
          }
        }
      }
    }

    return { content, tokens };
  }

  // Keep synchronous version for backwards compatibility (used when AI is disabled)
  private generateSlotContent(
    intent: any,
    template: any,
    brand: any,
    data: Record<string, unknown>,
    overrides?: Partial<EmailSlotContent>
  ): EmailSlotContent {
    const content: EmailSlotContent = {};

    // Use template slots as the structure
    for (const templateSlot of template.slots) {
      const slotId = templateSlot.id;

      // Use override if provided
      if (overrides && overrides[slotId]) {
        content[slotId] = overrides[slotId];
        continue;
      }

      // Get intent-specific slot config (for SimpleEmailIntent format)
      const intentSlot = intent.slots?.[slotId] || {};

      // Generate based on slot type
      switch (slotId) {
        case 'greeting':
          content.greeting = data.userName
            ? `Hi ${data.userName},`
            : data.firstName
              ? `Hi ${data.firstName},`
              : 'Hello,';
          break;
        case 'signoff':
          content.signoff = templateSlot.staticContent || `The ${brand.name} Team`;
          break;
        case 'cta':
          content.cta = {
            text: intentSlot.text || 'Learn More',
            url: this.interpolate(intentSlot.url || '#', data),
          };
          break;
        default:
          // For other slots, interpolate the prompt as placeholder content
          const prompt = intentSlot.prompt || templateSlot.prompt;
          if (prompt) {
            content[slotId] = this.interpolate(prompt, data);
          }
      }
    }

    return content;
  }

  private interpolate(template: string, data: Record<string, unknown>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : `{{${key}}}`;
    });
  }

  private resolveSubject(intent: any, data: Record<string, unknown>): string {
    // Handle both simple (string subject) and full (IntentSubject object) formats
    const subject = typeof intent.subject === 'string'
      ? intent.subject
      : intent.subject?.default || 'No Subject';
    return this.interpolate(subject, data);
  }

  private getFromAddress(brand: any): string {
    const name = process.env.DEFAULT_FROM_NAME || brand.name || 'Email Kit';
    const email = process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com';
    return `${name} <${email}>`;
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&mdash;/g, '—')
      .replace(/&rarr;/g, '→')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async sendViaProvider(params: {
    from: string;
    to: string[];
    subject: string;
    html: string;
    text: string;
    scheduledFor?: Date;
  }): Promise<SendEmailResult> {
    switch (this.provider) {
      case 'resend':
        return this.sendViaResend(params);
      case 'smtp':
        return this.sendViaSMTP(params);
      case 'console':
      default:
        return this.sendViaConsole(params);
    }
  }

  private async sendViaResend(params: any): Promise<SendEmailResult> {
    if (!this.resendClient) {
      return { success: false, error: 'Resend client not configured' };
    }

    try {
      const result = await this.resendClient.emails.send({
        from: params.from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return { success: true, messageId: result.data?.id };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async sendViaSMTP(params: any): Promise<SendEmailResult> {
    if (!this.smtpTransport) {
      return { success: false, error: 'SMTP transport not configured' };
    }

    try {
      const result = await this.smtpTransport.sendMail({
        from: params.from,
        to: params.to.join(', '),
        subject: params.subject,
        html: params.html,
        text: params.text,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async sendViaConsole(params: any): Promise<SendEmailResult> {
    console.log('\n========== EMAIL (Console Provider) ==========');
    console.log('From:', params.from);
    console.log('To:', params.to.join(', '));
    console.log('Subject:', params.subject);
    console.log('--- HTML Preview (first 500 chars) ---');
    console.log(params.html.substring(0, 500) + '...');
    console.log('==============================================\n');

    return { success: true, messageId: `console-${Date.now()}` };
  }

  async preview(params: Omit<SendEmailParams, 'to'> & { useAI?: boolean }): Promise<{
    html: string;
    subject: string;
    aiGenerated: boolean;
    aiTokens?: { input: number; output: number };
  }> {
    const { brand: brandId, intent: intentId, data, slotOverrides, subject: subjectOverride, useAI = true } = params;

    const brand = getBrand(brandId);
    if (!brand) throw new Error(`Brand not found: ${brandId}`);

    const intent = getIntent(brandId, intentId);
    if (!intent) throw new Error(`Intent not found: ${intentId}`);

    const templateId = 'template' in intent ? intent.template : intent.structure?.template;
    const template = getTemplate(templateId);
    if (!template) throw new Error(`Template not found: ${templateId}`);

    // Use AI generation for preview when enabled and API key is configured
    const aiEnabled = useAI && aiContentService.isEnabled();
    let slotContent: EmailSlotContent;
    let aiTokens: { input: number; output: number } | undefined;

    if (aiEnabled) {
      const result = await this.generateSlotContentWithAI(intent, template, brand, data, slotOverrides);
      slotContent = result.content;
      aiTokens = result.tokens.input > 0 || result.tokens.output > 0 ? result.tokens : undefined;
    } else {
      slotContent = this.generateSlotContent(intent, template, brand, data, slotOverrides);
    }

    const subject = subjectOverride || this.resolveSubject(intent, data);

    const previewText = 'purpose' in intent ? intent.purpose : intent.description;
    const html = renderFullEmail(template, slotContent, brand, {
      subject,
      previewText,
    });

    return { html, subject, aiGenerated: aiEnabled, aiTokens };
  }

  getProviderInfo() {
    return {
      provider: this.provider,
      configured: this.isConfigured(),
      ai: aiContentService.getStatus(),
    };
  }

  private isConfigured(): boolean {
    switch (this.provider) {
      case 'resend':
        return !!this.resendClient;
      case 'smtp':
        return !!this.smtpTransport;
      case 'console':
        return true;
      default:
        return false;
    }
  }
}

export const emailService = new EmailService();
