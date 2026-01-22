/**
 * Runtime configuration for Email Kit
 *
 * Centralizes environment variables and default values for:
 * - Credit-based billing
 * - Pricing rates
 * - Rate limiting
 * - Usage reporting
 */

export const Config = {
  // Credit-based billing
  creditBasedBillingEnabled: process.env.EMAIL_REQUIRE_CREDITS !== 'false',

  // Pricing (in credits)
  pricing: {
    emailSent: parseFloat(process.env.EMAIL_CREDIT_RATE || '0.01'),
    aiInputRate: parseFloat(process.env.AI_INPUT_TOKEN_RATE || '0.001'),
    aiOutputRate: parseFloat(process.env.AI_OUTPUT_TOKEN_RATE || '0.003'),
    preview: 0, // Previews are free
  },

  // Rate limiting defaults
  defaultRateLimit: parseInt(process.env.DEFAULT_RATE_LIMIT || '60', 10),

  // Tier-based rate limits (requests per minute)
  tierLimits: {
    free: { rateLimit: 10, dailyLimit: 50 },
    starter: { rateLimit: 60, dailyLimit: 1000 },
    pro: { rateLimit: 300, dailyLimit: 10000 },
    enterprise: { rateLimit: 1000, dailyLimit: 0 }, // 0 = unlimited
  } as Record<string, { rateLimit: number; dailyLimit: number }>,

  // Usage reporting
  usageReportThrottleMs: parseInt(process.env.USAGE_REPORT_THROTTLE_MS || '5000', 10),

  // PaymentKit integration
  meterName: 'email-kit-usage',
  meterUnit: 'Email Credits',

  // API key settings
  apiKeyPrefix: 'ek_live_',
  apiKeyLength: 32,
};

/**
 * Calculate credits for an email send operation
 */
export function calculateEmailCredits(options: {
  emailCount?: number;
  aiInputTokens?: number;
  aiOutputTokens?: number;
}): number {
  const { emailCount = 1, aiInputTokens = 0, aiOutputTokens = 0 } = options;

  let credits = 0;

  // Base email cost
  credits += emailCount * Config.pricing.emailSent;

  // AI token costs (per 1K tokens)
  if (aiInputTokens > 0) {
    credits += (aiInputTokens / 1000) * Config.pricing.aiInputRate;
  }
  if (aiOutputTokens > 0) {
    credits += (aiOutputTokens / 1000) * Config.pricing.aiOutputRate;
  }

  // Round to 10 decimal places to avoid floating point issues
  return Math.round(credits * 1e10) / 1e10;
}

/**
 * Get rate limit for a given tier
 */
export function getTierRateLimit(tier: string): number {
  return Config.tierLimits[tier]?.rateLimit || Config.defaultRateLimit;
}

/**
 * Get daily limit for a given tier
 */
export function getTierDailyLimit(tier: string): number {
  return Config.tierLimits[tier]?.dailyLimit || 50;
}

export default Config;
