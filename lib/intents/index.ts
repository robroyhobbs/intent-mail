/**
 * Email Intent Management
 *
 * Handles built-in and custom email intents with database-backed overrides.
 *
 * Architecture:
 * - Built-in intents: Defined in code by developers (structure, variables)
 * - Overrides: Stored in database, allow marketers to customize copy/CTAs
 * - Custom intents: Fully custom intents created by marketers in UI
 */

import type { EmailIntent, SimpleEmailIntent } from '../types';
import { aigneIntents } from './aigne';
import { myvibeIntents } from './myvibe';
import { arcsphereIntents } from './arcsphere';
import { arcblockIntents } from './arcblock';

// Built-in intents organized by product
const BUILT_IN_INTENTS: Record<string, Record<string, SimpleEmailIntent>> = {
  'aigne-hub': aigneIntents,
  myvibe: myvibeIntents,
  arcsphere: arcsphereIntents,
  arcblock: arcblockIntents,
};

// In-memory cache for overrides (populated from database)
let overridesCache: Record<string, Record<string, any>> = {};
let customIntentsCache: Record<string, Record<string, SimpleEmailIntent>> = {};

/**
 * Load overrides from database into cache
 */
export async function loadOverridesFromDB(): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { getAllOverrides, getAllCustomIntents, customIntentToSimple } = await import(
      '../../api/services/intentOverrides'
    );

    // Load overrides
    const overrides = await getAllOverrides();
    overridesCache = {};
    for (const override of overrides) {
      if (!overridesCache[override.brandId]) {
        overridesCache[override.brandId] = {};
      }
      overridesCache[override.brandId][override.intentId] = override;
    }

    // Load custom intents
    const customIntents = await getAllCustomIntents();
    customIntentsCache = {};
    for (const custom of customIntents) {
      if (!customIntentsCache[custom.brandId]) {
        customIntentsCache[custom.brandId] = {};
      }
      customIntentsCache[custom.brandId][custom.intentId] = customIntentToSimple(custom);
    }

    console.log(
      `Loaded ${overrides.length} intent overrides and ${customIntents.length} custom intents`
    );
  } catch (error) {
    console.error('Failed to load intent overrides from database:', error);
  }
}

/**
 * Get the base (unmodified) intent
 */
export function getBaseIntent(brand: string, id: string): SimpleEmailIntent | undefined {
  return BUILT_IN_INTENTS[brand]?.[id];
}

/**
 * Get an intent by brand and ID (with overrides applied)
 */
export function getIntent(brand: string, id: string): EmailIntent | undefined {
  // Check custom intents first
  if (customIntentsCache[brand]?.[id]) {
    return customIntentsCache[brand][id];
  }

  // Get base intent
  const baseIntent = BUILT_IN_INTENTS[brand]?.[id];
  if (!baseIntent) return undefined;

  // Apply override if exists
  const override = overridesCache[brand]?.[id];
  if (override) {
    return mergeIntentWithOverride(baseIntent, override);
  }

  return baseIntent;
}

/**
 * Merge a base intent with its override
 */
function mergeIntentWithOverride(baseIntent: SimpleEmailIntent, override: any): SimpleEmailIntent {
  const merged = { ...baseIntent };

  // Override subject if provided
  if (override.subject) {
    merged.subject = override.subject;
  }

  // Merge slots
  if (override.slots) {
    merged.slots = { ...merged.slots };
    for (const [slotId, slotOverride] of Object.entries(override.slots as Record<string, any>)) {
      if (merged.slots[slotId]) {
        merged.slots[slotId] = { ...merged.slots[slotId], ...slotOverride };
      } else {
        merged.slots[slotId] = slotOverride;
      }
    }
  }

  // Mark as customized
  (merged as any)._hasOverride = true;
  (merged as any)._overrideId = override.id;

  return merged;
}

/**
 * List all intents (with overrides applied)
 */
export function listIntents(): EmailIntent[] {
  const allIntents: EmailIntent[] = [];

  // Add built-in intents (with overrides)
  for (const [brand, intents] of Object.entries(BUILT_IN_INTENTS)) {
    for (const [id, intent] of Object.entries(intents)) {
      const override = overridesCache[brand]?.[id];
      const finalIntent = override ? mergeIntentWithOverride(intent, override) : intent;
      allIntents.push({ ...finalIntent, brand });
    }
  }

  // Add custom intents
  for (const [brand, intents] of Object.entries(customIntentsCache)) {
    for (const intent of Object.values(intents)) {
      allIntents.push({ ...intent, brand });
    }
  }

  return allIntents;
}

/**
 * List intents for a specific brand (with overrides applied)
 */
export function listIntentsByBrand(brand: string): EmailIntent[] {
  const intents: EmailIntent[] = [];

  // Add built-in intents for this brand (with overrides)
  if (BUILT_IN_INTENTS[brand]) {
    for (const [id, intent] of Object.entries(BUILT_IN_INTENTS[brand])) {
      const override = overridesCache[brand]?.[id];
      const finalIntent = override ? mergeIntentWithOverride(intent, override) : intent;
      intents.push({ ...finalIntent, brand });
    }
  }

  // Add custom intents for this brand
  if (customIntentsCache[brand]) {
    for (const intent of Object.values(customIntentsCache[brand])) {
      intents.push({ ...intent, brand });
    }
  }

  return intents;
}

/**
 * Check if an intent is built-in (vs custom)
 */
export function isBuiltInIntent(brand: string, id: string): boolean {
  return !!BUILT_IN_INTENTS[brand]?.[id];
}

/**
 * Check if an intent has an override
 */
export function hasOverride(brand: string, id: string): boolean {
  return !!overridesCache[brand]?.[id];
}

/**
 * Get the override for an intent (if any)
 */
export function getOverrideData(brand: string, id: string): any | undefined {
  return overridesCache[brand]?.[id];
}

/**
 * Refresh the cache after an override is saved/deleted
 */
export async function refreshCache(): Promise<void> {
  await loadOverridesFromDB();
}

/**
 * Save a custom intent (deprecated - use intentOverrides service directly)
 */
export async function saveIntent(intent: SimpleEmailIntent): Promise<SimpleEmailIntent> {
  const { saveCustomIntent } = await import('../../api/services/intentOverrides');

  await saveCustomIntent({
    brandId: intent.brand || '',
    intentId: intent.id,
    name: intent.name,
    description: intent.description,
    template: intent.template,
    subject: intent.subject,
    slots: intent.slots,
    variables: intent.variables || [],
  });

  await refreshCache();
  return intent;
}

/**
 * Delete a custom intent
 */
export async function deleteIntent(brand: string, id: string): Promise<void> {
  if (isBuiltInIntent(brand, id)) {
    throw new Error('Cannot delete built-in intent. Use deleteOverride to remove customizations.');
  }

  const { deleteCustomIntent } = await import('../../api/services/intentOverrides');
  await deleteCustomIntent(brand, id);
  await refreshCache();
}

// Re-export
export { aigneIntents } from './aigne';
export { myvibeIntents } from './myvibe';
export { arcsphereIntents } from './arcsphere';
export { arcblockIntents } from './arcblock';
