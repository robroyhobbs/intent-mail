/**
 * Component Call Handler
 *
 * Handles inter-blocklet communication via @blocklet/sdk/lib/component
 *
 * Other blocklets can call Email Kit like this:
 *
 * ```typescript
 * import Component from '@blocklet/sdk/lib/component';
 *
 * await Component.call('email-kit', 'send', {
 *   brand: 'aigne',
 *   intent: 'credits.low',
 *   to: 'user@example.com',
 *   data: { userName: 'John', currentCredits: 5 },
 * });
 * ```
 */

import { Request, Response } from 'express';
import { emailService } from './services/email';
import { getBrand, listBrands } from '../lib/brands';
import { getIntent, listIntents, listIntentsByBrand } from '../lib/intents';
import { getTemplate, listTemplates } from '../lib/templates';
import { getEmailStats } from './services/logs';

type ComponentAction =
  | 'send'
  | 'preview'
  | 'getBrand'
  | 'listBrands'
  | 'getIntent'
  | 'listIntents'
  | 'getTemplate'
  | 'listTemplates'
  | 'getStats';

async function componentHandler(req: Request, res: Response) {
  const action = req.params.action as ComponentAction;
  const params = req.body;

  try {
    let result: any;

    switch (action) {
      // Email sending
      case 'send':
        result = await emailService.send(params);
        break;

      case 'preview':
        result = await emailService.preview(params);
        break;

      // Brand operations
      case 'getBrand':
        result = getBrand(params.id);
        if (!result) {
          return res.status(404).json({ error: 'Brand not found' });
        }
        break;

      case 'listBrands':
        result = listBrands();
        break;

      // Intent operations
      case 'getIntent':
        result = getIntent(params.brand, params.id);
        if (!result) {
          return res.status(404).json({ error: 'Intent not found' });
        }
        break;

      case 'listIntents':
        if (params.brand) {
          result = listIntentsByBrand(params.brand);
        } else {
          result = listIntents();
        }
        break;

      // Template operations
      case 'getTemplate':
        result = getTemplate(params.id);
        if (!result) {
          return res.status(404).json({ error: 'Template not found' });
        }
        break;

      case 'listTemplates':
        result = listTemplates();
        break;

      // Stats
      case 'getStats':
        result = await getEmailStats();
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export default componentHandler;
