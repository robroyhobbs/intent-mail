/**
 * AI Content Generation Service
 *
 * Uses Claude to generate high-quality email copy based on intent prompts and brand voice.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { BrandVoice } from '../../lib/types';

export interface ContentGenerationRequest {
  slotId: string;
  slotType: string;
  prompt: string;
  brandVoice: BrandVoice;
  brandName: string;
  intentName: string;
  intentDescription: string;
  data: Record<string, unknown>;
  maxLength?: number;
  itemCount?: number; // For bullet lists
}

export interface ContentGenerationResult {
  content: string | string[];
  success: boolean;
  error?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

// Content quality guidelines that are always included in AI prompts
const CONTENT_QUALITY_GUIDELINES = `
## Email Copy Quality Guidelines

You are writing email copy that must be:

1. **Human and Natural**: Write like a helpful colleague, not a robot. Use conversational language.

2. **Clear and Scannable**:
   - Use short paragraphs (2-3 sentences max)
   - Lead with the most important information
   - Make the action obvious

3. **Empathetic and Respectful**:
   - Acknowledge the user's situation
   - Be honest about what's happening
   - Don't blame the user

4. **Action-Oriented**:
   - Make it clear what the user should do next
   - Remove any barriers to taking action
   - Be specific about outcomes

5. **Trust-Building**:
   - Be transparent about what's happening
   - Provide context when needed
   - Never use manipulative tactics

## What to Avoid

- Generic phrases like "We hope this email finds you well"
- Excessive exclamation marks or fake enthusiasm
- Marketing buzzwords (revolutionary, game-changing, amazing)
- Passive voice when active is clearer
- Vague language when specific is possible
- Unnecessary apologies or hedging
`;

class AIContentService {
  private client: Anthropic | null = null;
  private enabled: boolean = false;

  constructor() {
    this.initClient();
  }

  private initClient() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
      this.enabled = true;
      console.log('[AI Service] Initialized with Anthropic API');
    } else {
      console.log('[AI Service] No API key found - AI generation disabled');
    }
  }

  isEnabled(): boolean {
    return this.enabled && this.client !== null;
  }

  async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    if (!this.isEnabled()) {
      return {
        content: '',
        success: false,
        error: 'AI service not configured',
      };
    }

    try {
      const systemPrompt = this.buildSystemPrompt(request);
      const userPrompt = this.buildUserPrompt(request);

      const response = await this.client!.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: request.maxLength || 500,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt },
        ],
      });

      // Extract token counts for billing
      const tokens = {
        input: response.usage?.input_tokens || 0,
        output: response.usage?.output_tokens || 0,
      };

      const textContent = response.content.find((c) => c.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        return { content: '', success: false, error: 'No text content in response', tokens };
      }

      const rawContent = textContent.text.trim();

      // Parse bullet list if needed
      if (request.slotType === 'bullet-list' || request.itemCount) {
        const items = this.parseBulletList(rawContent, request.itemCount || 4);
        return { content: items, success: true, tokens };
      }

      return { content: rawContent, success: true, tokens };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI Service] Generation failed:', errorMessage);
      return { content: '', success: false, error: errorMessage };
    }
  }

  async generateAllSlots(
    slots: Array<ContentGenerationRequest>
  ): Promise<{
    content: Record<string, string | string[]>;
    tokens: { input: number; output: number };
  }> {
    const content: Record<string, string | string[]> = {};
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Process slots in parallel for speed
    const promises = slots.map(async (slot) => {
      const result = await this.generateContent(slot);
      return { slotId: slot.slotId, result };
    });

    const completed = await Promise.all(promises);

    for (const { slotId, result } of completed) {
      if (result.success) {
        content[slotId] = result.content;
      }
      if (result.tokens) {
        totalInputTokens += result.tokens.input;
        totalOutputTokens += result.tokens.output;
      }
    }

    return {
      content,
      tokens: { input: totalInputTokens, output: totalOutputTokens },
    };
  }

  private buildSystemPrompt(request: ContentGenerationRequest): string {
    const { brandVoice, brandName } = request;

    return `You are an expert email copywriter for ${brandName}.

## Brand Voice
Tone: ${brandVoice.tone}

Preferred phrases and concepts:
${brandVoice.doSay.map((s) => `- "${s}"`).join('\n')}

Avoid these words/phrases:
${brandVoice.dontSay.map((s) => `- "${s}"`).join('\n')}

${CONTENT_QUALITY_GUIDELINES}

## CRITICAL Output Rules
- Write ONLY the specific content requested - nothing more
- NEVER include subject lines, headers, or section titles
- NEVER use markdown formatting (no **bold**, no bullet points unless specifically requested)
- Keep responses SHORT: 1-3 sentences maximum for paragraphs
- Use the exact variable values provided in the data - substitute them directly into your text
- Do NOT add placeholder brackets like [value] or {{value}} - use the actual values given`;
  }

  private buildUserPrompt(request: ContentGenerationRequest): string {
    const { slotId, slotType, prompt, intentName, intentDescription, data, maxLength, itemCount } =
      request;

    // Interpolate data into prompt
    const interpolatedPrompt = this.interpolatePrompt(prompt, data);

    // Add available data context first so AI knows what values to use
    const dataKeys = Object.keys(data);
    let dataContext = '';
    if (dataKeys.length > 0) {
      dataContext = `\nDATA VALUES TO USE (substitute these directly into your text):
${dataKeys.map((k) => `- ${k} = "${data[k]}"`).join('\n')}`;
    }

    let output = `Generate the "${slotId}" content for this email.
${dataContext}

Email Purpose: ${intentName}

What to write: ${interpolatedPrompt}`;

    // Add slot-type specific instructions with strict length limits
    switch (slotType) {
      case 'greeting':
        output += `\n\nFORMAT: A simple greeting like "Hi Sarah," or "Hello,"\nMAX LENGTH: 10 words. Just the greeting, nothing else.`;
        break;
      case 'paragraph':
      case 'intro':
        output += `\n\nFORMAT: Plain text, 1-2 sentences only.\nMAX LENGTH: ${maxLength || 150} characters.\nDo NOT include any headers or formatting.`;
        break;
      case 'bullet-list':
        output += `\n\nFORMAT: Exactly ${itemCount || 4} items, one per line, starting with "- "\nKeep each item under 15 words.`;
        break;
      case 'info-box':
      case 'highlight':
        output += `\n\nFORMAT: Plain text, 1-2 sentences.\nMAX LENGTH: 100 characters.\nJust the key information, no headers.`;
        break;
      case 'warning-box':
      case 'warning':
        output += `\n\nFORMAT: Plain text, 1-2 sentences maximum.\nMAX LENGTH: 120 characters.\nBe direct and clear. No headers, no bullet points, no formatting.`;
        break;
      case 'cta-button':
        output += `\n\nFORMAT: Button text only, 2-4 words.\nExample: "Add Credits" or "View Dashboard"`;
        break;
      case 'signature':
        output += `\n\nFORMAT: Simple sign-off like "Best regards," or "Thanks,"\nMAX LENGTH: 3 words.`;
        break;
      default:
        output += `\n\nFORMAT: Plain text, 1-3 sentences.\nMAX LENGTH: ${maxLength || 200} characters.\nNo headers, no formatting.`;
    }

    return output;
  }

  private interpolatePrompt(prompt: string, data: Record<string, unknown>): string {
    return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return data[key] !== undefined ? String(data[key]) : `[${key}]`;
    });
  }

  private parseBulletList(content: string, targetCount: number): string[] {
    // Parse bullet points from various formats
    const lines = content.split('\n').filter((line) => line.trim());
    const items: string[] = [];

    for (const line of lines) {
      // Remove common bullet prefixes
      const cleaned = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
      if (cleaned) {
        items.push(cleaned);
      }
    }

    // Limit to target count
    return items.slice(0, targetCount);
  }

  // Get service status
  getStatus(): { enabled: boolean; provider: string } {
    return {
      enabled: this.enabled,
      provider: this.enabled ? 'anthropic' : 'none',
    };
  }
}

// Export singleton instance
export const aiContentService = new AIContentService();
