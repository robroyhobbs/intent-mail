/**
 * Usage Tracking Service
 *
 * Tracks API usage for billing and analytics.
 * Uses atomic batch reporting pattern from AIGNE Hub.
 */

import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Config, calculateEmailCredits } from '../libs/config';

// Database setup (shared with apiKey.ts)
const dataDir = process.env.BLOCKLET_DATA_DIR || path.join(process.cwd(), 'data');
const dbPath = path.join(dataDir, 'email-kit.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Types
export type UsageType = 'email_sent' | 'ai_generation' | 'preview';
export type UsageReportStatus = null | 'counted' | 'reported';

export interface UsageAttributes {
  id: string;
  apiKeyId: string | null;
  userDid: string;
  type: UsageType;
  brand: string;
  intent: string;
  emailCount: number;
  aiInputTokens: number;
  aiOutputTokens: number;
  usedCredits: number;
  usageReportStatus: UsageReportStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Model
class Usage extends Model<UsageAttributes> implements UsageAttributes {
  declare id: string;
  declare apiKeyId: string | null;
  declare userDid: string;
  declare type: UsageType;
  declare brand: string;
  declare intent: string;
  declare emailCount: number;
  declare aiInputTokens: number;
  declare aiOutputTokens: number;
  declare usedCredits: number;
  declare usageReportStatus: UsageReportStatus;
  declare metadata: Record<string, unknown>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Usage.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    apiKeyId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    userDid: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    emailCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    aiInputTokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    aiOutputTokens: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    usedCredits: {
      type: DataTypes.DECIMAL(20, 10),
      allowNull: false,
      defaultValue: 0,
    },
    usageReportStatus: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
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
    tableName: 'usage',
    timestamps: true,
    indexes: [
      { fields: ['userDid'] },
      { fields: ['apiKeyId'] },
      { fields: ['usageReportStatus'] },
      { fields: ['createdAt'] },
    ],
  }
);

/**
 * Record usage for an email operation
 */
export async function recordUsage(data: {
  apiKeyId?: string;
  userDid: string;
  type: UsageType;
  brand: string;
  intent: string;
  emailCount?: number;
  aiInputTokens?: number;
  aiOutputTokens?: number;
  metadata?: Record<string, unknown>;
}): Promise<UsageAttributes> {
  const credits = calculateEmailCredits({
    emailCount: data.emailCount || 1,
    aiInputTokens: data.aiInputTokens || 0,
    aiOutputTokens: data.aiOutputTokens || 0,
  });

  const record = await Usage.create({
    id: uuidv4(),
    apiKeyId: data.apiKeyId || null,
    userDid: data.userDid,
    type: data.type,
    brand: data.brand,
    intent: data.intent,
    emailCount: data.emailCount || (data.type === 'email_sent' ? 1 : 0),
    aiInputTokens: data.aiInputTokens || 0,
    aiOutputTokens: data.aiOutputTokens || 0,
    usedCredits: credits,
    usageReportStatus: null,
    metadata: data.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return record.toJSON();
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(
  userDid: string,
  options: {
    startDate?: Date;
    endDate?: Date;
  } = {}
): Promise<{
  totalEmails: number;
  totalAiTokens: number;
  totalCredits: number;
  byType: Record<string, { count: number; credits: number }>;
  byBrand: Record<string, { count: number; credits: number }>;
}> {
  const where: Record<string, unknown> = { userDid };

  if (options.startDate || options.endDate) {
    const dateRange: { [key: symbol]: Date } = {};
    if (options.startDate) {
      dateRange[Op.gte] = options.startDate;
    }
    if (options.endDate) {
      dateRange[Op.lte] = options.endDate;
    }
    where.createdAt = dateRange;
  }

  const records = await Usage.findAll({ where });

  const stats = {
    totalEmails: 0,
    totalAiTokens: 0,
    totalCredits: 0,
    byType: {} as Record<string, { count: number; credits: number }>,
    byBrand: {} as Record<string, { count: number; credits: number }>,
  };

  for (const record of records) {
    stats.totalEmails += record.emailCount;
    stats.totalAiTokens += record.aiInputTokens + record.aiOutputTokens;
    stats.totalCredits += Number(record.usedCredits);

    // By type
    if (!stats.byType[record.type]) {
      stats.byType[record.type] = { count: 0, credits: 0 };
    }
    stats.byType[record.type].count += record.emailCount || 1;
    stats.byType[record.type].credits += Number(record.usedCredits);

    // By brand
    if (!stats.byBrand[record.brand]) {
      stats.byBrand[record.brand] = { count: 0, credits: 0 };
    }
    stats.byBrand[record.brand].count += record.emailCount || 1;
    stats.byBrand[record.brand].credits += Number(record.usedCredits);
  }

  return stats;
}

/**
 * Get usage history for a user
 */
export async function getUserUsageHistory(
  userDid: string,
  options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    type?: UsageType;
  } = {}
): Promise<{ records: UsageAttributes[]; total: number }> {
  const where: Record<string, unknown> = { userDid };

  if (options.type) {
    where.type = options.type;
  }

  if (options.startDate || options.endDate) {
    const dateRange: { [key: symbol]: Date } = {};
    if (options.startDate) {
      dateRange[Op.gte] = options.startDate;
    }
    if (options.endDate) {
      dateRange[Op.lte] = options.endDate;
    }
    where.createdAt = dateRange;
  }

  const { rows, count } = await Usage.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: options.limit || 50,
    offset: options.offset || 0,
  });

  return {
    records: rows.map((r) => r.toJSON()),
    total: count,
  };
}

/**
 * Get unreported usage for batch reporting to PaymentKit
 * Uses atomic claiming to prevent double-reporting
 */
export async function claimUnreportedUsage(
  userDid: string,
  batchSize: number = 100
): Promise<UsageAttributes[]> {
  // Find unreported records
  const records = await Usage.findAll({
    where: {
      userDid,
      usageReportStatus: null,
    },
    order: [['createdAt', 'ASC']],
    limit: batchSize,
  });

  if (records.length === 0) {
    return [];
  }

  // Atomically claim these records
  const ids = records.map((r) => r.id);
  await Usage.update({ usageReportStatus: 'counted' }, { where: { id: ids, usageReportStatus: null } });

  return records.map((r) => r.toJSON());
}

/**
 * Mark usage records as reported
 */
export async function markUsageReported(ids: string[]): Promise<void> {
  await Usage.update({ usageReportStatus: 'reported' }, { where: { id: ids, usageReportStatus: 'counted' } });
}

/**
 * Reset claimed records (on reporting failure)
 */
export async function resetClaimedUsage(ids: string[]): Promise<void> {
  await Usage.update({ usageReportStatus: null }, { where: { id: ids, usageReportStatus: 'counted' } });
}

/**
 * Get aggregated unreported usage for a user
 */
export async function getUnreportedTotal(userDid: string): Promise<{
  totalCredits: number;
  recordCount: number;
}> {
  const result = await Usage.findOne({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('usedCredits')), 'totalCredits'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount'],
    ],
    where: {
      userDid,
      usageReportStatus: { [Op.or]: [null, 'counted'] },
    },
    raw: true,
  });

  return {
    totalCredits: Number((result as unknown as Record<string, unknown>)?.totalCredits) || 0,
    recordCount: Number((result as unknown as Record<string, unknown>)?.recordCount) || 0,
  };
}

/**
 * Initialize the database (create tables)
 */
export async function initUsageDatabase(): Promise<void> {
  await sequelize.sync();
  console.log('Usage database initialized');
}

export { Usage, sequelize };
