/**
 * V1 API Key Management Routes
 *
 * Allows users to manage their API keys.
 * Requires owner authentication (Blocklet SDK, not API key).
 */

import { Router, Request, Response } from 'express';
import {
  createApiKey,
  listApiKeys,
  getApiKey,
  revokeApiKey,
  updateApiKey,
  rotateApiKey,
  ApiKeyTier,
} from '../../services/apiKey';
import { requireOwnerAuth } from '../../middlewares/hybridAuth';
import { rateLimit } from '../../middlewares/rateLimit';

const router = Router();

// All key management routes require owner authentication
router.use(requireOwnerAuth());
router.use(rateLimit({ windowMs: 60000 })); // 60 requests per minute for management

/**
 * GET /api/v1/keys
 * List all API keys for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const keys = await listApiKeys(req.user.did);

    // Don't return the full hash, just metadata
    const safeKeys = keys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      tier: key.tier,
      status: key.status,
      permissions: key.permissions,
      rateLimit: key.rateLimit,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
    }));

    res.json({
      success: true,
      keys: safeKeys,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list API keys',
    });
  }
});

/**
 * POST /api/v1/keys
 * Create a new API key
 */
router.post('/', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { name, tier, permissions, expiresAt } = req.body;

  if (!name || typeof name !== 'string' || name.length < 1 || name.length > 100) {
    return res.status(400).json({
      error: 'Invalid name',
      message: 'Name must be between 1 and 100 characters',
    });
  }

  // Validate tier if provided
  const validTiers: ApiKeyTier[] = ['free', 'starter', 'pro', 'enterprise'];
  if (tier && !validTiers.includes(tier)) {
    return res.status(400).json({
      error: 'Invalid tier',
      message: `Tier must be one of: ${validTiers.join(', ')}`,
    });
  }

  try {
    const result = await createApiKey({
      name,
      userDid: req.user.did,
      tier: tier || 'free',
      permissions,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({
      success: true,
      message: 'API key created. Save this key securely - it will not be shown again.',
      key: result.key, // Full key, only shown once!
      keyPrefix: result.record.keyPrefix,
      id: result.record.id,
      tier: result.record.tier,
      permissions: result.record.permissions,
      rateLimit: result.record.rateLimit,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create API key',
    });
  }
});

/**
 * GET /api/v1/keys/:id
 * Get details of a specific API key
 */
router.get('/:id', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const key = await getApiKey(req.params.id, req.user.did);

    if (!key) {
      return res.status(404).json({
        error: 'API key not found',
      });
    }

    res.json({
      success: true,
      key: {
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        tier: key.tier,
        status: key.status,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        lastUsedAt: key.lastUsedAt,
        expiresAt: key.expiresAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get API key',
    });
  }
});

/**
 * PATCH /api/v1/keys/:id
 * Update an API key's settings
 */
router.patch('/:id', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { name, tier, permissions, rateLimit: rateLimitValue } = req.body;

  // Validate tier if provided
  const validTiers: ApiKeyTier[] = ['free', 'starter', 'pro', 'enterprise'];
  if (tier && !validTiers.includes(tier)) {
    return res.status(400).json({
      error: 'Invalid tier',
      message: `Tier must be one of: ${validTiers.join(', ')}`,
    });
  }

  try {
    const updated = await updateApiKey(req.params.id, req.user.did, {
      name,
      tier,
      permissions,
      rateLimit: rateLimitValue,
    });

    if (!updated) {
      return res.status(404).json({
        error: 'API key not found',
      });
    }

    res.json({
      success: true,
      key: {
        id: updated.id,
        name: updated.name,
        keyPrefix: updated.keyPrefix,
        tier: updated.tier,
        status: updated.status,
        permissions: updated.permissions,
        rateLimit: updated.rateLimit,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update API key',
    });
  }
});

/**
 * DELETE /api/v1/keys/:id
 * Revoke an API key
 */
router.delete('/:id', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const revoked = await revokeApiKey(req.params.id, req.user.did);

    if (!revoked) {
      return res.status(404).json({
        error: 'API key not found or already revoked',
      });
    }

    res.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke API key',
    });
  }
});

/**
 * POST /api/v1/keys/:id/rotate
 * Rotate an API key (creates new key, revokes old)
 */
router.post('/:id/rotate', async (req: Request, res: Response) => {
  if (!req.user?.did) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const result = await rotateApiKey(req.params.id, req.user.did);

    if (!result) {
      return res.status(404).json({
        error: 'API key not found or already revoked',
      });
    }

    res.json({
      success: true,
      message: 'API key rotated. Save the new key securely - it will not be shown again.',
      key: result.key, // New full key, only shown once!
      keyPrefix: result.record.keyPrefix,
      id: result.record.id,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to rotate API key',
    });
  }
});

export default router;
