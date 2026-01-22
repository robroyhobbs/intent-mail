/**
 * V1 API Routes
 *
 * Version 1 of the IntentMail API with:
 * - API key authentication
 * - Rate limiting
 * - Usage tracking
 */

import { Router } from 'express';
import sendRouter from './send';
import keysRouter from './keys';
import usageRouter from './usage';

// Import existing routes for read-only endpoints
import brandsRouter from '../brands';
import intentsRouter from '../intents';
import templatesRouter from '../templates';

const router = Router();

// Email sending (authenticated, rate limited, usage tracked)
router.use('/send', sendRouter);

// API key management (owner auth required)
router.use('/keys', keysRouter);

// Usage statistics
router.use('/usage', usageRouter);

// Read-only endpoints (existing routes, no auth required)
router.use('/brands', brandsRouter);
router.use('/intents', intentsRouter);
router.use('/templates', templatesRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    status: 'ok',
  });
});

export default router;
