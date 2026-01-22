import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import path from 'path';

import brandsRouter from './routes/brands';
import intentsRouter from './routes/intents';
import templatesRouter from './routes/templates';
import sendRouter from './routes/send';
import logsRouter from './routes/logs';
import settingsRouter from './routes/settings';
import componentHandler from './component';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/brands', brandsRouter);
app.use('/api/intents', intentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/send', sendRouter);
app.use('/api/logs', logsRouter);
app.use('/api/settings', settingsRouter);

// Component call handler (for inter-blocklet communication)
app.post('/api/component/:action', componentHandler);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
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
