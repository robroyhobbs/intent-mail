import { Sequelize, DataTypes, Model } from 'sequelize';
import path from 'path';

// Initialize SQLite database
const dbPath = process.env.BLOCKLET_DATA_DIR
  ? path.join(process.env.BLOCKLET_DATA_DIR, 'email-logs.db')
  : path.join(__dirname, '../../data/email-logs.db');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

// Email Log model
interface EmailLogAttributes {
  id: string;
  brand: string;
  intent: string;
  to: string;
  subject: string;
  status: 'sent' | 'failed' | 'pending';
  messageId?: string;
  error?: string;
  sentAt: Date;
}

class EmailLog extends Model<EmailLogAttributes> implements EmailLogAttributes {
  declare id: string;
  declare brand: string;
  declare intent: string;
  declare to: string;
  declare subject: string;
  declare status: 'sent' | 'failed' | 'pending';
  declare messageId?: string;
  declare error?: string;
  declare sentAt: Date;
}

EmailLog.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    brand: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    intent: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    to: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subject: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('sent', 'failed', 'pending'),
      allowNull: false,
      defaultValue: 'pending',
    },
    messageId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    error: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'EmailLog',
    tableName: 'email_logs',
    timestamps: true,
  }
);

// Initialize database
export async function initDatabase() {
  try {
    await sequelize.sync();
    console.log('Email logs database initialized');
  } catch (error) {
    console.error('Failed to initialize email logs database:', error);
  }
}

// Initialize on import
initDatabase();

// Log an email
export async function logEmail(data: EmailLogAttributes): Promise<EmailLog> {
  return EmailLog.create(data);
}

// Get email logs with pagination
export async function getEmailLogs(options: {
  page?: number;
  limit?: number;
  brand?: string;
  intent?: string;
  status?: 'sent' | 'failed' | 'pending';
}): Promise<{ logs: EmailLog[]; total: number; page: number; totalPages: number }> {
  const { page = 1, limit = 20, brand, intent, status } = options;

  const where: any = {};
  if (brand) where.brand = brand;
  if (intent) where.intent = intent;
  if (status) where.status = status;

  const { count, rows } = await EmailLog.findAndCountAll({
    where,
    order: [['sentAt', 'DESC']],
    limit,
    offset: (page - 1) * limit,
  });

  return {
    logs: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
}

// Get a single email log
export async function getEmailLog(id: string): Promise<EmailLog | null> {
  return EmailLog.findByPk(id);
}

// Get email stats
export async function getEmailStats(): Promise<{
  total: number;
  sent: number;
  failed: number;
  byBrand: Record<string, number>;
  byIntent: Record<string, number>;
}> {
  const total = await EmailLog.count();
  const sent = await EmailLog.count({ where: { status: 'sent' } });
  const failed = await EmailLog.count({ where: { status: 'failed' } });

  // Group by brand
  const brandStats = await EmailLog.findAll({
    attributes: ['brand', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['brand'],
    raw: true,
  });

  const byBrand: Record<string, number> = {};
  brandStats.forEach((stat: any) => {
    byBrand[stat.brand] = parseInt(stat.count, 10);
  });

  // Group by intent
  const intentStats = await EmailLog.findAll({
    attributes: ['intent', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['intent'],
    raw: true,
  });

  const byIntent: Record<string, number> = {};
  intentStats.forEach((stat: any) => {
    byIntent[stat.intent] = parseInt(stat.count, 10);
  });

  return { total, sent, failed, byBrand, byIntent };
}

export { EmailLog };
