import { Router } from 'express';
import { getEmailLogs, getEmailLog, getEmailStats } from '../services/logs';

const router = Router();

// Get email logs with pagination and filters
router.get('/', async (req, res) => {
  const { page, limit, brand, intent, status } = req.query;

  try {
    const result = await getEmailLogs({
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 20,
      brand: brand as string | undefined,
      intent: intent as string | undefined,
      status: status as 'sent' | 'failed' | 'pending' | undefined,
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get logs',
    });
  }
});

// Get email stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await getEmailStats();
    res.json({ stats });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get stats',
    });
  }
});

// Get a specific email log
router.get('/:id', async (req, res) => {
  try {
    const log = await getEmailLog(req.params.id);
    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }
    res.json({ log });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get log',
    });
  }
});

export default router;
