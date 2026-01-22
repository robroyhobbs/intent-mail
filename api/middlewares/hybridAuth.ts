/**
 * Hybrid Authentication Middleware
 *
 * Supports multiple authentication methods:
 * 1. API Key (for external developers)
 * 2. Blocklet SDK Auth (for blocklet users)
 *
 * This allows both external API access and native blocklet integration.
 */

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validateApiKey, ApiKeyAttributes } from '../services/apiKey';
import { extractApiKey } from './apiKeyAuth';

// Try to import Blocklet SDK auth (may not be available)
let BlockletAuth: { ensure: () => RequestHandler } | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BlockletAuth = require('@blocklet/sdk/lib/middlewares/auth');
} catch {
  // Not running in blocklet environment
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyAttributes;
      user?: { did: string };
      authMethod?: 'api_key' | 'blocklet' | 'none';
    }
  }
}

/**
 * Hybrid auth middleware that accepts either API key or Blocklet SDK auth
 *
 * Priority:
 * 1. Check for API key first (x-api-key header, Bearer token, query param)
 * 2. Fall back to Blocklet SDK auth if available
 * 3. Return 401 if neither succeeds
 */
export function hybridAuth(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // 1. Try API key authentication
    const apiKey = extractApiKey(req);
    if (apiKey) {
      const apiKeyRecord = await validateApiKey(apiKey);
      if (apiKeyRecord) {
        req.apiKey = apiKeyRecord;
        req.user = { did: apiKeyRecord.userDid };
        req.authMethod = 'api_key';
        return next();
      }
      // Invalid API key - return error immediately
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid, expired, or revoked',
      });
    }

    // 2. Try Blocklet SDK auth if available
    if (BlockletAuth) {
      const blockletMiddleware = BlockletAuth.ensure();
      return blockletMiddleware(req, res, (err?: unknown) => {
        if (err) {
          // Blocklet auth failed
          return res.status(401).json({
            error: 'Authentication required',
            message: 'Provide a valid API key or authenticate via Blocklet SDK',
          });
        }
        // Blocklet auth succeeded - req.user should be set by the middleware
        req.authMethod = 'blocklet';
        next();
      });
    }

    // 3. No authentication method succeeded
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Provide a valid API key via x-api-key header',
    });
  };
}

/**
 * Optional hybrid auth - allows unauthenticated access but attaches user info if available
 */
export function optionalHybridAuth(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    req.authMethod = 'none';

    // 1. Try API key authentication
    const apiKey = extractApiKey(req);
    if (apiKey) {
      const apiKeyRecord = await validateApiKey(apiKey);
      if (apiKeyRecord) {
        req.apiKey = apiKeyRecord;
        req.user = { did: apiKeyRecord.userDid };
        req.authMethod = 'api_key';
      }
      return next();
    }

    // 2. Try Blocklet SDK auth if available (non-blocking)
    if (BlockletAuth) {
      try {
        const blockletMiddleware = BlockletAuth.ensure();
        return blockletMiddleware(req, res, () => {
          if (req.user) {
            req.authMethod = 'blocklet';
          }
          next();
        });
      } catch {
        // Blocklet auth failed silently
      }
    }

    next();
  };
}

/**
 * Middleware that requires owner authentication (for managing own API keys)
 * Must be authenticated via Blocklet SDK (not API key)
 */
export function requireOwnerAuth(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only allow Blocklet SDK auth for owner operations
    if (!BlockletAuth) {
      return res.status(501).json({
        error: 'Owner authentication not available',
        message: 'This endpoint requires Blocklet SDK authentication',
      });
    }

    const blockletMiddleware = BlockletAuth.ensure();
    return blockletMiddleware(req, res, (err?: unknown) => {
      if (err || !req.user) {
        return res.status(401).json({
          error: 'Owner authentication required',
          message: 'Sign in with your Blocklet wallet to manage API keys',
        });
      }
      req.authMethod = 'blocklet';
      next();
    });
  };
}

export { BlockletAuth };
