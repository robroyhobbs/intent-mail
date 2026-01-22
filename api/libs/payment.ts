/**
 * PaymentKit Integration
 *
 * Wraps @blocklet/payment-js for credit-based billing in Email Kit.
 * Provides graceful degradation when PaymentKit is not available.
 */

import { Config } from './config';

// Dynamic import to handle optional PaymentKit
let payment: any = null;
let paymentEnabled = false;

// Meter configuration
const METER_NAME = 'email_kit_usage';
const METER_EVENT_NAME = 'email_usage';

/**
 * Initialize PaymentKit client
 */
export async function initPayment(): Promise<boolean> {
  // Skip if credit-based billing is disabled
  if (!Config.creditBasedBillingEnabled) {
    console.log('[Payment] Credit-based billing disabled via config');
    return false;
  }

  try {
    // Dynamic import of payment-js
    const paymentModule = await import('@blocklet/payment-js');
    payment = paymentModule.default || paymentModule;

    // Set environment mode based on config
    const isLiveMode = process.env.PAYMENT_LIVE_MODE === 'true';
    if (isLiveMode) {
      payment.environments?.setLiveMode?.(true);
    } else {
      payment.environments?.setTestMode?.(true);
    }

    paymentEnabled = true;
    console.log('[Payment] PaymentKit initialized', { mode: isLiveMode ? 'live' : 'test' });

    // Ensure meter exists
    await ensureMeterExists();

    return true;
  } catch (error) {
    console.log('[Payment] PaymentKit not available, credit-based billing disabled');
    console.log('[Payment] Error:', error instanceof Error ? error.message : 'Unknown error');
    paymentEnabled = false;
    return false;
  }
}

/**
 * Check if PaymentKit is enabled
 */
export function isPaymentEnabled(): boolean {
  return paymentEnabled && payment !== null;
}

/**
 * Ensure the email usage meter exists
 */
async function ensureMeterExists(): Promise<void> {
  if (!isPaymentEnabled()) return;

  try {
    // Check if meter already exists
    const meters = await payment.meters.list({ event_name: METER_EVENT_NAME });
    if (meters?.data?.length > 0) {
      console.log('[Payment] Meter already exists:', METER_EVENT_NAME);
      return;
    }

    // Create meter if it doesn't exist
    await payment.meters.create({
      name: METER_NAME,
      event_name: METER_EVENT_NAME,
      aggregation_method: 'sum',
      unit: 'credits',
      description: 'Email Kit usage tracking (emails sent, AI tokens)',
    });
    console.log('[Payment] Created usage meter:', METER_EVENT_NAME);
  } catch (error) {
    // Meter might already exist or we don't have permissions
    console.log('[Payment] Could not create meter:', error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Get customer by DID (creates if not exists)
 */
export async function getOrCreateCustomer(userDid: string): Promise<string | null> {
  if (!isPaymentEnabled()) return null;

  try {
    // Try to find existing customer
    const customers = await payment.customers.search({ query: userDid, pageSize: 1 });
    if (customers?.data?.length > 0) {
      return customers.data[0].id;
    }

    // Create new customer
    const customer = await payment.customers.create({
      metadata: { did: userDid },
      name: userDid,
    });
    return customer?.id || null;
  } catch (error) {
    console.error('[Payment] Failed to get/create customer:', error);
    return null;
  }
}

/**
 * Get credit balance for a user
 */
export async function getCreditBalance(userDid: string): Promise<{
  available: number;
  pending: number;
  total: number;
} | null> {
  if (!isPaymentEnabled()) return null;

  try {
    const customerId = await getOrCreateCustomer(userDid);
    if (!customerId) return null;

    const summary = await payment.creditGrants.summary({ customer_id: customerId });

    return {
      available: parseFloat(summary?.available || '0'),
      pending: parseFloat(summary?.pending || '0'),
      total: parseFloat(summary?.total || '0'),
    };
  } catch (error) {
    console.error('[Payment] Failed to get credit balance:', error);
    return null;
  }
}

/**
 * Check if user has sufficient credits for an operation
 */
export async function hasSufficientCredits(
  userDid: string,
  requiredCredits: number
): Promise<{
  sufficient: boolean;
  available: number;
  required: number;
  shortfall: number;
}> {
  const balance = await getCreditBalance(userDid);

  if (!balance) {
    // If payment is disabled, always allow
    return {
      sufficient: true,
      available: Infinity,
      required: requiredCredits,
      shortfall: 0,
    };
  }

  const sufficient = balance.available >= requiredCredits;
  return {
    sufficient,
    available: balance.available,
    required: requiredCredits,
    shortfall: sufficient ? 0 : requiredCredits - balance.available,
  };
}

/**
 * Report usage to PaymentKit
 */
export async function reportUsage(
  userDid: string,
  creditsUsed: number,
  metadata?: Record<string, unknown>
): Promise<boolean> {
  if (!isPaymentEnabled()) return true; // Succeed silently if disabled

  try {
    const customerId = await getOrCreateCustomer(userDid);
    if (!customerId) return false;

    await payment.meterEvents.create({
      event_name: METER_EVENT_NAME,
      payload: {
        customer_id: customerId,
        value: creditsUsed.toString(),
        ...metadata,
      },
      identifier: `ek_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Math.floor(Date.now() / 1000),
    });

    return true;
  } catch (error) {
    console.error('[Payment] Failed to report usage:', error);
    return false;
  }
}

/**
 * Create a checkout session for purchasing credits
 */
export async function createCreditPurchaseSession(
  userDid: string,
  creditAmount: number,
  successUrl: string,
  cancelUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  if (!isPaymentEnabled()) return null;

  try {
    const customerId = await getOrCreateCustomer(userDid);
    if (!customerId) return null;

    // Get credit product/price from environment or use default
    const creditPriceId = process.env.PAYMENT_CREDIT_PRICE_ID;
    if (!creditPriceId) {
      console.error('[Payment] No credit price ID configured');
      return null;
    }

    const session = await payment.checkout.sessions.create({
      success_url: successUrl,
      cancel_url: cancelUrl,
      mode: 'payment',
      customer_id: customerId,
      line_items: [
        {
          price_id: creditPriceId,
          quantity: creditAmount,
        },
      ],
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('[Payment] Failed to create checkout session:', error);
    return null;
  }
}

/**
 * Get payment link for adding credits
 */
export function getPaymentLink(userDid: string): string {
  // Return the payment page URL - this would be configured in the environment
  const baseUrl = process.env.PAYMENT_PAGE_URL || '/payment';
  return `${baseUrl}?did=${encodeURIComponent(userDid)}`;
}

/**
 * Get payment status
 */
export function getPaymentStatus(): {
  enabled: boolean;
  mode: 'live' | 'test' | 'disabled';
} {
  if (!paymentEnabled) {
    return { enabled: false, mode: 'disabled' };
  }

  const isLiveMode = process.env.PAYMENT_LIVE_MODE === 'true';
  return {
    enabled: true,
    mode: isLiveMode ? 'live' : 'test',
  };
}
