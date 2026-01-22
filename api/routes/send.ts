import { Router } from 'express';
import { emailService } from '../services/email';

const router = Router();

// Send an email
router.post('/', async (req, res) => {
  const { brand, intent, to, data, slotOverrides, subject, scheduledFor } = req.body;

  // Validate required fields
  if (!brand || !intent || !to) {
    return res.status(400).json({
      error: 'Missing required fields: brand, intent, and to are required',
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

// Preview an email (render without sending)
router.post('/preview', async (req, res) => {
  const { brand, intent, data, slotOverrides, subject } = req.body;

  // Validate required fields
  if (!brand || !intent) {
    return res.status(400).json({
      error: 'Missing required fields: brand and intent are required',
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

// Send a test email
router.post('/test', async (req, res) => {
  const { brand, intent, to, data, slotOverrides, subject } = req.body;

  // Validate required fields
  if (!brand || !intent || !to) {
    return res.status(400).json({
      error: 'Missing required fields: brand, intent, and to are required',
    });
  }

  try {
    // For test emails, we add a prefix to the subject
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

export default router;
