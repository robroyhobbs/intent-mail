/**
 * V1 Usage Routes
 *
 * Usage statistics and history endpoints.
 * Works with both API key and Blocklet SDK authentication.
 */

import { Router, Request, Response } from 'express';
import { getUserUsageStats, getUserUsageHistory, UsageType } from '../../services/usage';
import { hybridAuth } from '../../middlewares/hybridAuth';
import { rateLimit } from '../../middlewares/rateLimit';

const router = Router();

// All usage routes require authentication
router.use(hybridAuth());
router.use(rateLimit({ windowMs: 60000 }));

/**
 * GET /api/v1/usage
 * Get usage statistics for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Parse date range from query params
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;

    // Validate dates
    if (startDate && isNaN(startDate.getTime())) {
      return res.status(400).json({ error: 'Invalid start_date format' });
    }
    if (endDate && isNaN(endDate.getTime())) {
      return res.status(400).json({ error: 'Invalid end_date format' });
    }

    const stats = await getUserUsageStats(req.user.did, { startDate, endDate });

    res.json({
      success: true,
      period: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null,
      },
      stats: {
        totalEmails: stats.totalEmails,
        totalAiTokens: stats.totalAiTokens,
        totalCredits: Math.round(stats.totalCredits * 1e6) / 1e6, // Round for display
        byType: stats.byType,
        byBrand: stats.byBrand,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage stats',
    });
  }
});

/**
 * GET /api/v1/usage/history
 * Get usage history for the authenticated user
 */
router.get('/history', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Parse pagination
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Parse filters
    const startDate = req.query.start_date ? new Date(req.query.start_date as string) : undefined;
    const endDate = req.query.end_date ? new Date(req.query.end_date as string) : undefined;
    const type = req.query.type as UsageType | undefined;

    // Validate type if provided
    const validTypes: UsageType[] = ['email_sent', 'ai_generation', 'preview'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type',
        message: `Type must be one of: ${validTypes.join(', ')}`,
      });
    }

    const { records, total } = await getUserUsageHistory(req.user.did, {
      limit,
      offset,
      startDate,
      endDate,
      type,
    });

    res.json({
      success: true,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + records.length < total,
      },
      records: records.map((record) => ({
        id: record.id,
        type: record.type,
        brand: record.brand,
        intent: record.intent,
        emailCount: record.emailCount,
        aiInputTokens: record.aiInputTokens,
        aiOutputTokens: record.aiOutputTokens,
        usedCredits: Math.round(Number(record.usedCredits) * 1e6) / 1e6,
        createdAt: record.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage history',
    });
  }
});

/**
 * GET /api/v1/usage/summary
 * Get a quick summary of usage (for dashboards)
 */
router.get('/summary', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    // Get stats for different time periods
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayStats, monthStats, allTimeStats] = await Promise.all([
      getUserUsageStats(req.user.did, { startDate: todayStart }),
      getUserUsageStats(req.user.did, { startDate: monthStart }),
      getUserUsageStats(req.user.did, {}),
    ]);

    res.json({
      success: true,
      summary: {
        today: {
          emails: todayStats.totalEmails,
          credits: Math.round(todayStats.totalCredits * 1e6) / 1e6,
        },
        thisMonth: {
          emails: monthStats.totalEmails,
          credits: Math.round(monthStats.totalCredits * 1e6) / 1e6,
        },
        allTime: {
          emails: allTimeStats.totalEmails,
          credits: Math.round(allTimeStats.totalCredits * 1e6) / 1e6,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get usage summary',
    });
  }
});

export default router;
