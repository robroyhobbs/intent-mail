/**
 * V1 Send Routes
 *
 * Email sending endpoints with:
 * - API key or Blocklet SDK authentication
 * - Rate limiting
 * - Usage tracking
 */

import { Router, Request, Response } from 'express';
import { emailService } from '../../services/email';
import { recordUsage } from '../../services/usage';
import { hybridAuth } from '../../middlewares/hybridAuth';
import { requirePermission } from '../../middlewares/apiKeyAuth';
import { rateLimit } from '../../middlewares/rateLimit';
import { creditCheck } from '../../middlewares/creditCheck';
import { reportUsageImmediate } from '../../libs/usageReporting';
import { isPaymentEnabled } from '../../libs/payment';

const router = Router();

// Apply middleware stack to all routes
router.use(hybridAuth());
router.use(rateLimit());
// Credit check for send operations (skips preview)
router.use(creditCheck({ skipForPreview: true }));

/**
 * POST /api/v1/send
 * Send an email using intent-driven architecture
 */
router.post('/', requirePermission('send'), async (req: Request, res: Response) => {
  const { brand, intent, to, data, slotOverrides, subject, scheduledFor } = req.body;

  // Validate required fields
  if (!brand || !intent || !to) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'brand, intent, and to are required',
    });
  }

  try {
    const result = await emailService.send({
      brand,
      intent,
      to,
      data: data || {},
      slotOverrides,
      subject,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    });

    if (result.success) {
      const aiInputTokens = result.aiTokens?.input || 0;
      const aiOutputTokens = result.aiTokens?.output || 0;

      // Record usage in database
      if (req.user?.did) {
        await recordUsage({
          apiKeyId: req.apiKey?.id,
          userDid: req.user.did,
          type: 'email_sent',
          brand,
          intent,
          emailCount: 1,
          aiInputTokens,
          aiOutputTokens,
          metadata: {
            messageId: result.messageId,
            to: Array.isArray(to) ? to.length : 1,
          },
        });

        // Report to PaymentKit immediately for real-time deduction
        if (isPaymentEnabled()) {
          await reportUsageImmediate(req.user.did, 1, aiInputTokens, aiOutputTokens);
        }
      }

      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    });
  }
});

/**
 * POST /api/v1/send/preview
 * Preview an email without sending
 */
router.post('/preview', requirePermission('preview'), async (req: Request, res: Response) => {
  const { brand, intent, data, slotOverrides, subject } = req.body;

  if (!brand || !intent) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'brand and intent are required',
    });
  }

  try {
    const result = await emailService.preview({
      brand,
      intent,
      data: data || {},
      slotOverrides,
      subject,
    });

    // Record preview usage (free, but tracked)
    if (req.user?.did) {
      await recordUsage({
        apiKeyId: req.apiKey?.id,
        userDid: req.user.did,
        type: 'preview',
        brand,
        intent,
        emailCount: 0,
        aiInputTokens: result.aiTokens?.input || 0,
        aiOutputTokens: result.aiTokens?.output || 0,
      });
    }

    res.json({
      success: true,
      html: result.html,
      subject: result.subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to preview email',
    });
  }
});

/**
 * POST /api/v1/send/test
 * Send a test email (adds [TEST] prefix to subject)
 */
router.post('/test', requirePermission('send'), async (req: Request, res: Response) => {
  const { brand, intent, to, data, slotOverrides, subject } = req.body;

  if (!brand || !intent || !to) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'brand, intent, and to are required',
    });
  }

  try {
    const testSubject = subject ? `[TEST] ${subject}` : undefined;

    const result = await emailService.send({
      brand,
      intent,
      to,
      data: data || {},
      slotOverrides,
      subject: testSubject,
    });

    if (result.success) {
      const aiInputTokens = result.aiTokens?.input || 0;
      const aiOutputTokens = result.aiTokens?.output || 0;

      // Record usage (test emails still count)
      if (req.user?.did) {
        await recordUsage({
          apiKeyId: req.apiKey?.id,
          userDid: req.user.did,
          type: 'email_sent',
          brand,
          intent,
          emailCount: 1,
          aiInputTokens,
          aiOutputTokens,
          metadata: {
            messageId: result.messageId,
            isTest: true,
          },
        });

        // Report to PaymentKit immediately
        if (isPaymentEnabled()) {
          await reportUsageImmediate(req.user.did, 1, aiInputTokens, aiOutputTokens);
        }
      }

      res.json({
        success: true,
        messageId: result.messageId,
        message: 'Test email sent successfully',
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test email',
    });
  }
});

/**
 * POST /api/v1/send/batch
 * Send emails to multiple recipients
 */
router.post('/batch', requirePermission('send'), async (req: Request, res: Response) => {
  const { brand, intent, recipients, data: sharedData, slotOverrides, subject } = req.body;

  if (!brand || !intent || !recipients || !Array.isArray(recipients)) {
    return res.status(400).json({
      error: 'Missing required fields',
      message: 'brand, intent, and recipients (array) are required',
    });
  }

  if (recipients.length > 100) {
    return res.status(400).json({
      error: 'Too many recipients',
      message: 'Maximum 100 recipients per batch',
    });
  }

  try {
    const results: Array<{ to: string; success: boolean; messageId?: string; error?: string }> = [];
    let totalAiInputTokens = 0;
    let totalAiOutputTokens = 0;
    let successCount = 0;

    for (const recipient of recipients) {
      const to = typeof recipient === 'string' ? recipient : recipient.to;
      const recipientData = typeof recipient === 'object' ? { ...sharedData, ...recipient.data } : sharedData;

      const result = await emailService.send({
        brand,
        intent,
        to,
        data: recipientData || {},
        slotOverrides,
        subject,
      });

      results.push({
        to,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
      });

      if (result.success) {
        successCount++;
        totalAiInputTokens += result.aiTokens?.input || 0;
        totalAiOutputTokens += result.aiTokens?.output || 0;
      }
    }

    // Record batch usage
    if (req.user?.did && successCount > 0) {
      await recordUsage({
        apiKeyId: req.apiKey?.id,
        userDid: req.user.did,
        type: 'email_sent',
        brand,
        intent,
        emailCount: successCount,
        aiInputTokens: totalAiInputTokens,
        aiOutputTokens: totalAiOutputTokens,
        metadata: {
          batchSize: recipients.length,
          successCount,
        },
      });

      // Report to PaymentKit immediately
      if (isPaymentEnabled()) {
        await reportUsageImmediate(req.user.did, successCount, totalAiInputTokens, totalAiOutputTokens);
      }
    }

    res.json({
      success: true,
      sent: successCount,
      failed: recipients.length - successCount,
      results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send batch emails',
    });
  }
});

export default router;
