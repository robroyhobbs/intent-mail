/**
 * Intent Overrides Service
 *
 * Allows marketers to customize intent content (CTAs, prompts, subjects)
 * without modifying source code. Overrides are stored in SQLite and
 * merged with base intents at runtime.
 */

import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';
import { v4 as uuid } from 'uuid';

// Initialize SQLite database (shared path with logs)
const dbPath = process.env.BLOCKLET_DATA_DIR
  ? path.join(process.env.BLOCKLET_DATA_DIR, 'email-kit.db')
  : path.join(__dirname, '../../data/email-kit.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Slot override structure
interface SlotOverride {
  prompt?: string;
  text?: string;
  url?: string;
  items?: number;
}

// Intent Override model attributes
interface IntentOverrideAttributes {
  id: string;
  brandId: string;
  intentId: string;
  // Override fields (null means use base intent value)
  subject?: string;
  slots?: Record<string, SlotOverride>;
  // Metadata
  isActive: boolean;
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class IntentOverride extends Model<IntentOverrideAttributes> implements IntentOverrideAttributes {
  declare id: string;
  declare brandId: string;
  declare intentId: string;
  declare subject?: string;
  declare slots?: Record<string, SlotOverride>;
  declare isActive: boolean;
  declare notes?: string;
  declare createdBy?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

IntentOverride.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuid(),
    },
    brandId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    intentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slots: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'IntentOverride',
    tableName: 'intent_overrides',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['brandId', 'intentId'],
      },
    ],
  }
);

// Custom Intent model (for fully custom intents created by marketers)
interface CustomIntentAttributes {
  id: string;
  brandId: string;
  intentId: string; // unique identifier like 'promo.summer-sale'
  name: string;
  description: string;
  template: string;
  subject: string;
  slots: Record<string, SlotOverride>;
  variables: string[];
  isActive: boolean;
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

class CustomIntent extends Model<CustomIntentAttributes> implements CustomIntentAttributes {
  declare id: string;
  declare brandId: string;
  declare intentId: string;
  declare name: string;
  declare description: string;
  declare template: string;
  declare subject: string;
  declare slots: Record<string, SlotOverride>;
  declare variables: string[];
  declare isActive: boolean;
  declare createdBy?: string;
  declare createdAt?: Date;
  declare updatedAt?: Date;
}

CustomIntent.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuid(),
    },
    brandId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    intentId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    template: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slots: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    variables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdBy: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CustomIntent',
    tableName: 'custom_intents',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['brandId', 'intentId'],
      },
    ],
  }
);

// Initialize database
export async function initIntentDatabase() {
  try {
    await sequelize.sync();
    console.log('Intent overrides database initialized');
  } catch (error) {
    console.error('Failed to initialize intent overrides database:', error);
  }
}

// Initialize on import
initIntentDatabase();

// ============================================================================
// Intent Override CRUD
// ============================================================================

export async function getOverride(brandId: string, intentId: string): Promise<IntentOverride | null> {
  return IntentOverride.findOne({
    where: { brandId, intentId, isActive: true },
  });
}

export async function getAllOverrides(brandId?: string): Promise<IntentOverride[]> {
  const where: any = {};
  if (brandId) where.brandId = brandId;
  return IntentOverride.findAll({ where, order: [['updatedAt', 'DESC']] });
}

export async function saveOverride(data: {
  brandId: string;
  intentId: string;
  subject?: string;
  slots?: Record<string, SlotOverride>;
  notes?: string;
  createdBy?: string;
}): Promise<IntentOverride> {
  const existing = await IntentOverride.findOne({
    where: { brandId: data.brandId, intentId: data.intentId },
  });

  if (existing) {
    await existing.update({
      subject: data.subject,
      slots: data.slots,
      notes: data.notes,
      isActive: true,
    });
    return existing;
  }

  return IntentOverride.create({
    id: uuid(),
    ...data,
    isActive: true,
  });
}

export async function deleteOverride(brandId: string, intentId: string): Promise<boolean> {
  const result = await IntentOverride.destroy({
    where: { brandId, intentId },
  });
  return result > 0;
}

// ============================================================================
// Custom Intent CRUD
// ============================================================================

export async function getCustomIntent(brandId: string, intentId: string): Promise<CustomIntent | null> {
  return CustomIntent.findOne({
    where: { brandId, intentId, isActive: true },
  });
}

export async function getAllCustomIntents(brandId?: string): Promise<CustomIntent[]> {
  const where: any = { isActive: true };
  if (brandId) where.brandId = brandId;
  return CustomIntent.findAll({ where, order: [['name', 'ASC']] });
}

export async function saveCustomIntent(data: {
  brandId: string;
  intentId: string;
  name: string;
  description: string;
  template: string;
  subject: string;
  slots: Record<string, SlotOverride>;
  variables: string[];
  createdBy?: string;
}): Promise<CustomIntent> {
  const existing = await CustomIntent.findOne({
    where: { brandId: data.brandId, intentId: data.intentId },
  });

  if (existing) {
    await existing.update(data);
    return existing;
  }

  return CustomIntent.create({
    id: uuid(),
    ...data,
    isActive: true,
  });
}

export async function deleteCustomIntent(brandId: string, intentId: string): Promise<boolean> {
  const result = await CustomIntent.update(
    { isActive: false },
    { where: { brandId, intentId } }
  );
  return result[0] > 0;
}

// ============================================================================
// Merge Logic
// ============================================================================

/**
 * Merge a base intent with its override (if any)
 */
export function mergeIntentWithOverride(
  baseIntent: any,
  override: IntentOverride | null
): any {
  if (!override) return baseIntent;

  const merged = { ...baseIntent };

  // Override subject if provided
  if (override.subject) {
    merged.subject = override.subject;
  }

  // Merge slots
  if (override.slots) {
    merged.slots = { ...merged.slots };
    for (const [slotId, slotOverride] of Object.entries(override.slots)) {
      if (merged.slots[slotId]) {
        merged.slots[slotId] = { ...merged.slots[slotId], ...slotOverride };
      } else {
        merged.slots[slotId] = slotOverride;
      }
    }
  }

  // Mark as customized
  merged._customized = true;
  merged._overrideId = override.id;

  return merged;
}

/**
 * Convert a CustomIntent to the SimpleEmailIntent format
 */
export function customIntentToSimple(custom: CustomIntent): any {
  return {
    id: custom.intentId,
    brand: custom.brandId,
    name: custom.name,
    description: custom.description,
    template: custom.template,
    subject: custom.subject,
    slots: custom.slots,
    variables: custom.variables,
    isCustom: true,
    _customIntentId: custom.id,
  };
}

export { IntentOverride, CustomIntent, sequelize };
