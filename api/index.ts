import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';

// Blocklet SDK imports (gracefully handle non-blocklet environment)
let Auth: { ensure: () => express.RequestHandler } | null = null;
let blockletConfig: { env?: Record<string, string> } | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const authModule = require('@blocklet/sdk/lib/middlewares/auth');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  blockletConfig = require('@blocklet/sdk/lib/config');
  // Verify the auth module has the expected function
  if (authModule && typeof authModule.ensure === 'function') {
    Auth = authModule;
  } else {
    console.log('Blocklet auth module loaded but ensure() not available - auth middleware disabled');
  }
} catch {
  // Not running as blocklet, auth middleware will be skipped
  console.log('Running outside Blocklet environment - auth middleware disabled');
}

// Legacy routes (for backward compatibility)
import brandsRouter from './routes/brands';
import intentsRouter from './routes/intents';
import templatesRouter from './routes/templates';
import sendRouter from './routes/send';
import logsRouter from './routes/logs';
import settingsRouter from './routes/settings';
import componentHandler from './component';

// V1 API routes
import v1Router from './routes/v1';

// Database initialization
import { initApiKeyDatabase } from './services/apiKey';
import { initUsageDatabase } from './services/usage';

// PaymentKit integration
import { initPayment, getPaymentStatus } from './libs/payment';
import { startUsageReporting, getReportingStatus } from './libs/usageReporting';

const app = express();

// Helper: Optional auth middleware (only enforced when running as blocklet)
const optionalAuth = (): express.RequestHandler => {
  if (Auth) {
    return Auth.ensure();
  }
  // Pass-through when not in blocklet environment
  return (_req, _res, next) => next();
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
// Public routes (read-only, no auth required)
app.use('/api/brands', brandsRouter);
app.use('/api/intents', intentsRouter);
app.use('/api/templates', templatesRouter);

// Protected routes (require auth when running as blocklet)
app.use('/api/send', optionalAuth(), sendRouter);
app.use('/api/logs', optionalAuth(), logsRouter);
app.use('/api/settings', optionalAuth(), settingsRouter);

// Component call handler (for inter-blocklet communication)
app.post('/api/component/:action', componentHandler);

// V1 API (new versioned API with API key auth)
app.use('/api/v1', v1Router);

// Health check
app.get('/api/health', (req, res) => {
  const paymentStatus = getPaymentStatus();
  const reportingStatus = getReportingStatus();

  res.json({
    status: 'ok',
    version: '0.1.0',
    apiVersion: 'v1',
    blocklet: !!blockletConfig,
    authEnabled: !!Auth,
    features: {
      apiKeyAuth: true,
      rateLimiting: true,
      usageTracking: true,
      creditBilling: paymentStatus.enabled,
    },
    payment: paymentStatus,
    usageReporting: reportingStatus,
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

const port = process.env.BLOCKLET_PORT || process.env.PORT || 3030;

app.listen(port, async () => {
  console.log(`Email Kit server running on port ${port}`);
  console.log(`Email provider: ${process.env.EMAIL_PROVIDER || 'console'}`);
  console.log(`Blocklet environment: ${blockletConfig ? 'Yes' : 'No'}`);
  console.log(`Auth middleware: ${Auth ? 'Enabled' : 'Disabled'}`);
  console.log(`API Key auth: Enabled`);

  // Initialize databases
  try {
    await initApiKeyDatabase();
    await initUsageDatabase();
    console.log('Developer API databases initialized');
  } catch (error) {
    console.error('Failed to initialize developer API databases:', error);
  }

  // Initialize PaymentKit
  try {
    const paymentEnabled = await initPayment();
    if (paymentEnabled) {
      // Start usage reporting scheduler
      startUsageReporting();
      console.log('PaymentKit initialized, usage reporting started');
    } else {
      console.log('PaymentKit not enabled - credit billing disabled');
    }
  } catch (error) {
    console.error('Failed to initialize PaymentKit:', error);
  }

  // Load intent overrides from database (dynamic import to avoid circular deps)
  try {
    const intents = await import('../lib/intents');
    if (typeof intents.loadOverridesFromDB === 'function') {
      await intents.loadOverridesFromDB();
    }
  } catch (error) {
    console.error('Failed to load intent overrides:', error);
  }
});

export default app;
