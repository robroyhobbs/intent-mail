/**
 * API Key Service
 *
 * Manages API keys for external developer authentication.
 * Keys are hashed for security; only the prefix is stored for display.
 */

import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import { createHash, randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Config } from '../libs/config';

// Database setup
const dataDir = process.env.BLOCKLET_DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'intentmail.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Types
export type ApiKeyTier = 'free' | 'starter' | 'pro' | 'enterprise';
export type ApiKeyStatus = 'active' | 'revoked' | 'expired';

export interface ApiKeyPermissions {
  send: boolean;
  preview: boolean;
  logs: boolean;
  manage: boolean;
}

export interface ApiKeyAttributes {
  id: string;
  keyHash: string;
  keyPrefix: string;
  name: string;
  userDid: string;
  permissions: ApiKeyPermissions;
  tier: ApiKeyTier;
  status: ApiKeyStatus;
  rateLimit: number;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Model
class ApiKey extends Model<ApiKeyAttributes> implements ApiKeyAttributes {
  declare id: string;
  declare keyHash: string;
  declare keyPrefix: string;
  declare name: string;
  declare userDid: string;
  declare permissions: ApiKeyPermissions;
  declare tier: ApiKeyTier;
  declare status: ApiKeyStatus;
  declare rateLimit: number;
  declare lastUsedAt: Date | null;
  declare expiresAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ApiKey.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    keyHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    keyPrefix: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    userDid: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { send: true, preview: true, logs: true, manage: false },
    },
    tier: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'free',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
    },
    rateLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: Config.defaultRateLimit,
    },
    lastUsedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'api_keys',
    timestamps: true,
  }
);

/**
 * Hash an API key for secure storage
 */
function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 * Returns the full key (only shown once) and the record
 */
export async function createApiKey(data: {
  name: string;
  userDid: string;
  tier?: ApiKeyTier;
  permissions?: Partial<ApiKeyPermissions>;
  expiresAt?: Date;
}): Promise<{ key: string; record: ApiKeyAttributes }> {
  // Generate random key: ek_live_ + 32 random chars
  const randomPart = randomBytes(24).toString('base64url').slice(0, Config.apiKeyLength);
  const fullKey = `${Config.apiKeyPrefix}${randomPart}`;
  const keyHash = hashKey(fullKey);
  const keyPrefix = fullKey.slice(0, 12) + '...';

  const defaultPermissions: ApiKeyPermissions = {
    send: true,
    preview: true,
    logs: true,
    manage: false,
  };

  const record = await ApiKey.create({
    id: uuidv4(),
    keyHash,
    keyPrefix,
    name: data.name,
    userDid: data.userDid,
    tier: data.tier || 'free',
    permissions: { ...defaultPermissions, ...data.permissions },
    status: 'active',
    rateLimit: Config.tierLimits[data.tier || 'free']?.rateLimit || Config.defaultRateLimit,
    lastUsedAt: null,
    expiresAt: data.expiresAt || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    key: fullKey, // Only returned once!
    record: record.toJSON(),
  };
}

/**
 * Validate an API key and return the record if valid
 */
export async function validateApiKey(key: string): Promise<ApiKeyAttributes | null> {
  if (!key || !key.startsWith(Config.apiKeyPrefix)) {
    return null;
  }

  const keyHash = hashKey(key);
  const record = await ApiKey.findOne({
    where: {
      keyHash,
      status: 'active',
    },
  });

  if (!record) {
    return null;
  }

  // Check expiration
  if (record.expiresAt && new Date(record.expiresAt) < new Date()) {
    await record.update({ status: 'expired' });
    return null;
  }

  // Update last used timestamp
  await record.update({ lastUsedAt: new Date() });

  return record.toJSON();
}

/**
 * List API keys for a user
 */
export async function listApiKeys(userDid: string): Promise<ApiKeyAttributes[]> {
  const records = await ApiKey.findAll({
    where: { userDid },
    order: [['createdAt', 'DESC']],
  });
  return records.map((r) => r.toJSON());
}

/**
 * Get an API key by ID (for the owner)
 */
export async function getApiKey(id: string, userDid: string): Promise<ApiKeyAttributes | null> {
  const record = await ApiKey.findOne({
    where: { id, userDid },
  });
  return record ? record.toJSON() : null;
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(id: string, userDid: string): Promise<boolean> {
  const [updated] = await ApiKey.update(
    { status: 'revoked' },
    { where: { id, userDid, status: 'active' } }
  );
  return updated > 0;
}

/**
 * Update API key settings
 */
export async function updateApiKey(
  id: string,
  userDid: string,
  updates: {
    name?: string;
    tier?: ApiKeyTier;
    permissions?: Partial<ApiKeyPermissions>;
    rateLimit?: number;
  }
): Promise<ApiKeyAttributes | null> {
  const record = await ApiKey.findOne({
    where: { id, userDid },
  });

  if (!record) {
    return null;
  }

  const updateData: Partial<ApiKeyAttributes> = {};

  if (updates.name) {
    updateData.name = updates.name;
  }
  if (updates.tier) {
    updateData.tier = updates.tier;
    updateData.rateLimit = Config.tierLimits[updates.tier]?.rateLimit || Config.defaultRateLimit;
  }
  if (updates.permissions) {
    updateData.permissions = { ...record.permissions, ...updates.permissions };
  }
  if (updates.rateLimit !== undefined) {
    updateData.rateLimit = updates.rateLimit;
  }

  await record.update(updateData);
  return record.toJSON();
}

/**
 * Rotate an API key (create new, revoke old)
 */
export async function rotateApiKey(
  id: string,
  userDid: string
): Promise<{ key: string; record: ApiKeyAttributes } | null> {
  const oldRecord = await ApiKey.findOne({
    where: { id, userDid, status: 'active' },
  });

  if (!oldRecord) {
    return null;
  }

  // Create new key with same settings
  const result = await createApiKey({
    name: oldRecord.name,
    userDid: oldRecord.userDid,
    tier: oldRecord.tier,
    permissions: oldRecord.permissions,
    expiresAt: oldRecord.expiresAt || undefined,
  });

  // Revoke old key
  await oldRecord.update({ status: 'revoked' });

  return result;
}

/**
 * Initialize the database (create tables)
 */
export async function initApiKeyDatabase(): Promise<void> {
  await sequelize.sync();
  console.log('API Key database initialized');
}

export { ApiKey };
