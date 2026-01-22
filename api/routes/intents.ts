import { Router } from 'express';
import {
  getIntent,
  getBaseIntent,
  listIntents,
  listIntentsByBrand,
  saveIntent,
  deleteIntent,
  isBuiltInIntent,
  hasOverride,
  getOverrideData,
  refreshCache,
} from '../../lib/intents';
import {
  saveOverride,
  deleteOverride,
  getAllOverrides,
  saveCustomIntent,
  getAllCustomIntents,
} from '../services/intentOverrides';
import { getTemplates } from '../../lib/templates';

const router = Router();

// ============================================================================
// Intent Listing & Retrieval
// ============================================================================

// List all intents (optionally filtered by brand)
router.get('/', (req, res) => {
  const { brand } = req.query;
  if (brand && typeof brand === 'string') {
    const intents = listIntentsByBrand(brand);
    res.json(intents);
  } else {
    const intents = listIntents();
    res.json(intents);
  }
});

// Get a specific intent (with overrides applied)
router.get('/:brand/:id', (req, res) => {
  const intent = getIntent(req.params.brand, req.params.id);
  if (!intent) {
    return res.status(404).json({ error: 'Intent not found' });
  }

  // Include metadata about the intent
  const isBuiltIn = isBuiltInIntent(req.params.brand, req.params.id);
  const hasCustomization = hasOverride(req.params.brand, req.params.id);

  res.json({
    intent,
    meta: {
      isBuiltIn,
      hasOverride: hasCustomization,
      canDelete: !isBuiltIn,
      canCustomize: isBuiltIn,
    },
  });
});

// Get the base (uncustomized) version of an intent
router.get('/:brand/:id/base', (req, res) => {
  const baseIntent = getBaseIntent(req.params.brand, req.params.id);
  if (!baseIntent) {
    return res.status(404).json({ error: 'Intent not found' });
  }
  res.json({ intent: baseIntent });
});

// ============================================================================
// Intent Overrides (for marketers to customize built-in intents)
// ============================================================================

// Get all overrides
router.get('/overrides/all', async (req, res) => {
  try {
    const overrides = await getAllOverrides(req.query.brand as string | undefined);
    res.json(overrides);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overrides' });
  }
});

// Get override for a specific intent
router.get('/:brand/:id/override', async (req, res) => {
  const override = getOverrideData(req.params.brand, req.params.id);
  if (!override) {
    return res.json({ override: null });
  }
  res.json({ override });
});

// Save an override for a built-in intent
router.post('/:brand/:id/override', async (req, res) => {
  try {
    const { brand, id } = req.params;

    // Verify this is a built-in intent
    if (!isBuiltInIntent(brand, id)) {
      return res.status(400).json({
        error: 'Can only create overrides for built-in intents. Use POST /api/intents for custom intents.',
      });
    }

    const { subject, slots, notes } = req.body;

    const override = await saveOverride({
      brandId: brand,
      intentId: id,
      subject,
      slots,
      notes,
    });

    // Refresh the cache
    await refreshCache();

    res.json({
      override,
      message: 'Override saved successfully',
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to save override',
    });
  }
});

// Delete an override (revert to base intent)
router.delete('/:brand/:id/override', async (req, res) => {
  try {
    const { brand, id } = req.params;

    const deleted = await deleteOverride(brand, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Override not found' });
    }

    // Refresh the cache
    await refreshCache();

    res.json({ message: 'Override deleted. Intent reverted to default.' });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete override',
    });
  }
});

// ============================================================================
// Custom Intents (fully custom intents created by marketers)
// ============================================================================

// List all custom intents
router.get('/custom/all', async (req, res) => {
  try {
    const customIntents = await getAllCustomIntents(req.query.brand as string | undefined);
    res.json(customIntents);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch custom intents' });
  }
});

// Create a new custom intent
router.post('/', async (req, res) => {
  try {
    const intent = await saveIntent(req.body);
    res.json({ intent, message: 'Intent saved successfully' });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to save intent',
    });
  }
});

// Update a custom intent
router.put('/:brand/:id', async (req, res) => {
  try {
    const { brand, id } = req.params;

    // If it's a built-in intent, use override instead
    if (isBuiltInIntent(brand, id)) {
      const { subject, slots, notes } = req.body;
      const override = await saveOverride({
        brandId: brand,
        intentId: id,
        subject,
        slots,
        notes,
      });
      await refreshCache();
      return res.json({
        override,
        message: 'Built-in intent customized via override',
      });
    }

    // Otherwise save as custom intent
    const intent = await saveIntent({
      ...req.body,
      brand,
      id,
    });
    res.json({ intent, message: 'Intent updated successfully' });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to update intent',
    });
  }
});

// Delete an intent
router.delete('/:brand/:id', async (req, res) => {
  try {
    await deleteIntent(req.params.brand, req.params.id);
    res.json({ message: 'Intent deleted successfully' });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'Failed to delete intent',
    });
  }
});

// ============================================================================
// Helpers
// ============================================================================

// Get available templates (for creating custom intents)
router.get('/meta/templates', (req, res) => {
  const templates = getTemplates();
  res.json(templates);
});

export default router;
