import { Router } from 'express';
import { emailService } from '../services/email';

const router = Router();

// Get current settings/provider info
router.get('/', (req, res) => {
  const providerInfo = emailService.getProviderInfo();

  res.json({
    provider: providerInfo.provider,
    configured: providerInfo.configured,
    availableProviders: ['console', 'resend', 'sendgrid', 'smtp'],
    ai: {
      enabled: providerInfo.ai.enabled,
      provider: providerInfo.ai.provider,
    },
    environmentVariables: {
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'console',
      DEFAULT_FROM_EMAIL: process.env.DEFAULT_FROM_EMAIL || 'noreply@example.com',
      DEFAULT_FROM_NAME: process.env.DEFAULT_FROM_NAME || 'IntentMail',
      // Don't expose API keys, just show if they're set
      RESEND_API_KEY: process.env.RESEND_API_KEY ? '••••••••' : '(not set)',
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? '••••••••' : '(not set)',
      SMTP_HOST: process.env.SMTP_HOST || '(not set)',
      SMTP_PORT: process.env.SMTP_PORT || '587',
      SMTP_USER: process.env.SMTP_USER || '(not set)',
      SMTP_PASS: process.env.SMTP_PASS ? '••••••••' : '(not set)',
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '••••••••' : '(not set)',
    },
  });
});

// Test provider connection
router.post('/test-connection', async (req, res) => {
  const providerInfo = emailService.getProviderInfo();

  if (!providerInfo.configured) {
    return res.status(400).json({
      success: false,
      error: `Provider "${providerInfo.provider}" is not properly configured`,
    });
  }

  // For console provider, always success
  if (providerInfo.provider === 'console') {
    return res.json({
      success: true,
      message: 'Console provider is always available (logs emails instead of sending)',
    });
  }

  // For other providers, we'd need to implement actual connection tests
  // For now, just return that it appears configured
  res.json({
    success: true,
    message: `Provider "${providerInfo.provider}" appears to be configured`,
  });
});

export default router;
