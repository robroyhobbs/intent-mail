/**
 * Credit Check Middleware
 *
 * Verifies user has sufficient credits before processing requests.
 * Returns 402 Payment Required with payment link if insufficient.
 */

import { RequestHandler, Request, Response, NextFunction } from 'express';
import { hasSufficientCredits, getPaymentLink, isPaymentEnabled } from '../libs/payment';
import { Config, calculateEmailCredits } from '../libs/config';

// Extend Request to include estimated credits
declare global {
  namespace Express {
    interface Request {
      estimatedCredits?: number;
    }
  }
}

/**
 * Estimate credits required for a request
 */
function estimateCreditsForRequest(req: Request): number {
  const { brand, intent, to, recipients } = req.body;

  // Count recipients
  let recipientCount = 1;
  if (Array.isArray(to)) {
    recipientCount = to.length;
  } else if (Array.isArray(recipients)) {
    recipientCount = recipients.length;
  }

  // Estimate ~500 input tokens and ~200 output tokens per email for AI content
  const estimatedInputTokens = 500 * recipientCount;
  const estimatedOutputTokens = 200 * recipientCount;

  // Calculate total credits (email + AI)
  const credits = calculateEmailCredits({
    emailCount: recipientCount,
    aiInputTokens: estimatedInputTokens,
    aiOutputTokens: estimatedOutputTokens,
  });

  return credits;
}

/**
 * Middleware to check credit balance before processing
 *
 * Options:
 * - estimator: Custom function to estimate credits for the request
 * - skipForPreview: Don't require credits for preview requests (default: true)
 */
export function creditCheck(options: {
  estimator?: (req: Request) => number;
  skipForPreview?: boolean;
} = {}): RequestHandler {
  const { estimator = estimateCreditsForRequest, skipForPreview = true } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip if payment is not enabled
    if (!isPaymentEnabled()) {
      return next();
    }

    // Skip for preview requests if configured
    if (skipForPreview && req.path.includes('/preview')) {
      return next();
    }

    // Must have authenticated user
    if (!req.user?.did) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'You must be authenticated to use this endpoint',
      });
    }

    try {
      // Estimate credits required
      const estimatedCredits = estimator(req);
      req.estimatedCredits = estimatedCredits;

      // Check balance
      const result = await hasSufficientCredits(req.user.did, estimatedCredits);

      if (!result.sufficient) {
        return res.status(402).json({
          error: 'Insufficient credits',
          message: `This operation requires ${estimatedCredits.toFixed(4)} credits, but you only have ${result.available.toFixed(4)} available.`,
          required: result.required,
          available: result.available,
          shortfall: result.shortfall,
          paymentLink: getPaymentLink(req.user.did),
        });
      }

      next();
    } catch (error) {
      console.error('[Credit Check] Error:', error);
      // On error, allow the request (fail open for payment checks)
      next();
    }
  };
}

/**
 * Middleware that only checks credits without blocking
 * Attaches credit info to request for downstream use
 */
export function creditInfo(): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isPaymentEnabled() || !req.user?.did) {
      return next();
    }

    try {
      const estimatedCredits = estimateCreditsForRequest(req);
      req.estimatedCredits = estimatedCredits;

      const result = await hasSufficientCredits(req.user.did, estimatedCredits);

      // Attach to response locals for use in response
      res.locals.creditInfo = {
        estimated: estimatedCredits,
        available: result.available,
        sufficient: result.sufficient,
      };
    } catch (error) {
      // Ignore errors, just don't attach info
    }

    next();
  };
}
