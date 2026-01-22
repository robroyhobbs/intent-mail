/**
 * API Key Authentication Middleware
 *
 * Validates API keys from:
 * - x-api-key header
 * - Authorization: Bearer <key>
 * - Query param ?api_key=
 *
 * Attaches validated key info to request for downstream use.
 */

import { Request, Response, NextFunction } from 'express';
import { validateApiKey, ApiKeyAttributes } from '../services/apiKey';

// Extend Express Request to include API key info
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyAttributes;
      user?: { did: string };
    }
  }
}

/**
 * Extract API key from request
 */
function extractApiKey(req: Request): string | null {
  // 1. Check x-api-key header
  const headerKey = req.headers['x-api-key'];
  if (headerKey && typeof headerKey === 'string') {
    return headerKey;
  }

  // 2. Check Authorization: Bearer <key>
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }

  // 3. Check query param
  const queryKey = req.query.api_key;
  if (queryKey && typeof queryKey === 'string') {
    return queryKey;
  }

  return null;
}

/**
 * Middleware that requires a valid API key
 * Returns 401 if no key or invalid key
 */
export function requireApiKey() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = extractApiKey(req);

    if (!key) {
      return res.status(401).json({
        error: 'API key required',
        message: 'Provide API key via x-api-key header, Authorization: Bearer, or api_key query param',
      });
    }

    const apiKeyRecord = await validateApiKey(key);

    if (!apiKeyRecord) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or revoked',
      });
    }

    // Attach to request
    req.apiKey = apiKeyRecord;
    req.user = { did: apiKeyRecord.userDid };

    next();
  };
}

/**
 * Middleware that optionally validates an API key
 * Does not fail if no key provided (for public endpoints)
 */
export function optionalApiKey() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = extractApiKey(req);

    if (key) {
      const apiKeyRecord = await validateApiKey(key);
      if (apiKeyRecord) {
        req.apiKey = apiKeyRecord;
        req.user = { did: apiKeyRecord.userDid };
      }
    }

    next();
  };
}

/**
 * Middleware that checks for specific permissions
 * Must be used after requireApiKey()
 */
export function requirePermission(permission: 'send' | 'preview' | 'logs' | 'manage') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    if (!req.apiKey.permissions[permission]) {
      return res.status(403).json({
        error: 'Permission denied',
        message: `This API key does not have '${permission}' permission`,
      });
    }

    next();
  };
}

export { extractApiKey };
