import type { SimpleEmailIntent } from '../types';

export const arcblockIntents: Record<string, SimpleEmailIntent> = {
  'blocklet-deployed': {
    id: 'blocklet-deployed',
    brand: 'arcblock',
    name: 'Blocklet Deployed',
    description: 'Notification when a blocklet is successfully deployed',
    template: 'with-info-box',
    subject: 'Blocklet Deployed: {{blockletName}}',
    slots: {
      greeting: { prompt: 'Confirm successful deployment' },
      intro: { prompt: 'Summary of the deployment' },
      infoBox: { prompt: 'Deployment details: URL, version, server' },
      cta: { text: 'View Blocklet', url: '{{blockletUrl}}' },
      signature: { text: 'Blocklet Server' },
    },
    variables: ['userName', 'blockletName', 'blockletUrl', 'serverName'],
  },

  'server-alert': {
    id: 'server-alert',
    brand: 'arcblock',
    name: 'Server Alert',
    description: 'Alert for Blocklet Server issues or status changes',
    template: 'with-warning',
    subject: 'Server Alert: {{serverName}}',
    slots: {
      greeting: { prompt: 'Alert header' },
      intro: { prompt: 'Brief description of the alert' },
      warningBox: { prompt: 'Details of the issue and recommended actions' },
      cta: { text: 'View Server Dashboard', url: '{{dashboardUrl}}' },
      signature: { text: 'Blocklet Server Monitoring' },
    },
    variables: ['userName', 'serverName', 'alertType', 'dashboardUrl'],
  },

  'launcher-ready': {
    id: 'launcher-ready',
    brand: 'arcblock',
    name: 'Launcher Ready',
    description: 'Notification when Launcher setup is complete',
    template: 'with-bullets',
    subject: 'Your Launcher is Ready',
    slots: {
      greeting: { prompt: 'Congratulate on Launcher setup' },
      intro: { prompt: 'Explain what they can do with Launcher' },
      bullets: { prompt: 'List key next steps: install blocklets, configure domain, etc.', items: 4 },
      cta: { text: 'Open Launcher', url: '{{launcherUrl}}' },
      signature: { text: 'The ArcBlock Team' },
    },
    variables: ['userName', 'launcherUrl'],
  },

  'store-purchase': {
    id: 'store-purchase',
    brand: 'arcblock',
    name: 'Store Purchase Receipt',
    description: 'Receipt for Blocklet Store purchase',
    template: 'transactional',
    subject: 'Receipt: {{blockletName}}',
    slots: {
      greeting: { prompt: 'Thank for purchase' },
      receiptDetails: { prompt: 'Purchase details: item, price, date' },
      body: { prompt: 'Installation instructions' },
      cta: { text: 'Install Now', url: '{{installUrl}}' },
      signature: { text: 'Blocklet Store' },
    },
    variables: ['userName', 'blockletName', 'price', 'installUrl'],
  },

  'did-spaces-quota': {
    id: 'did-spaces-quota',
    brand: 'arcblock',
    name: 'DID Spaces Quota Alert',
    description: 'Alert when DID Spaces storage quota is running low',
    template: 'with-warning',
    subject: 'DID Spaces Storage Alert',
    slots: {
      greeting: { prompt: 'Alert about storage usage' },
      intro: { prompt: 'Current storage status' },
      warningBox: { prompt: 'Details: used space, remaining, recommended action' },
      cta: { text: 'Manage Storage', url: '{{storageUrl}}' },
      signature: { text: 'DID Spaces' },
    },
    variables: ['userName', 'usedSpace', 'totalSpace', 'storageUrl'],
  },

  'newsletter': {
    id: 'newsletter',
    brand: 'arcblock',
    name: 'Developer Newsletter',
    description: 'Monthly developer newsletter with updates',
    template: 'with-bullets',
    subject: 'ArcBlock Developer Update - {{month}}',
    slots: {
      greeting: { prompt: 'Newsletter greeting' },
      intro: { prompt: 'Monthly highlights summary' },
      bullets: { prompt: 'List 4-5 key updates, releases, or announcements', items: 5 },
      cta: { text: 'Read Full Newsletter', url: '{{newsletterUrl}}' },
      signature: { text: 'The ArcBlock Team' },
    },
    variables: ['userName', 'month', 'newsletterUrl'],
  },
};
