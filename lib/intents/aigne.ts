/**
 * AIGNE Hub Email Intents
 *
 * Email intents for the AIGNE Hub AI gateway platform.
 */

import type { SimpleEmailIntent } from '../types';

export const aigneIntents: Record<string, SimpleEmailIntent> = {
  // =============================================================================
  // CREDITS & BILLING
  // =============================================================================

  'credits.low': {
    id: 'credits.low',
    brand: 'aigne-hub',
    name: 'Credits Running Low',
    description: 'Alert when user credits drop below threshold',
    template: 'with-warning',
    subject: 'Your AIGNE Hub credits are running low',
    slots: {
      greeting: { prompt: 'Brief greeting using their name' },
      intro: { prompt: 'Explain their credits are running low, mention the remaining amount: {{creditsRemaining}}' },
      warning: { prompt: 'Urgent but not alarming message about running out of credits soon' },
      next_steps: { prompt: 'Explain what happens when credits run out and how to add more' },
      cta: { text: 'Add Credits', url: '{{dashboardUrl}}/billing' },
    },
    variables: ['userName', 'creditsRemaining', 'dashboardUrl'],
  },

  'credits.exhausted': {
    id: 'credits.exhausted',
    brand: 'aigne-hub',
    name: 'Credits Exhausted',
    description: 'Alert when user credits reach zero',
    template: 'with-warning',
    subject: 'Your AIGNE Hub credits have been exhausted',
    slots: {
      greeting: { prompt: 'Brief greeting using their name' },
      intro: { prompt: 'Inform them their credits have run out' },
      warning: { prompt: 'Explain API requests are paused until they add more credits' },
      next_steps: { prompt: 'Clear instructions on how to restore access' },
      cta: { text: 'Add Credits Now', url: '{{dashboardUrl}}/billing' },
    },
    variables: ['userName', 'dashboardUrl'],
  },

  'credits.added': {
    id: 'credits.added',
    brand: 'aigne-hub',
    name: 'Credits Added',
    description: 'Confirmation when credits are purchased',
    template: 'transactional',
    subject: 'Credits added to your AIGNE Hub account',
    slots: {
      greeting: { prompt: 'Brief thank you greeting' },
      confirmation: { prompt: 'Confirm credits have been added: {{creditsAdded}} credits' },
      details: { prompt: 'Receipt details: amount paid {{amountPaid}}, new balance {{newBalance}}, transaction ID {{transactionId}}' },
      next_steps: { prompt: 'Brief note that they can start using their credits immediately' },
      cta: { text: 'View Dashboard', url: '{{dashboardUrl}}' },
    },
    variables: ['userName', 'creditsAdded', 'amountPaid', 'newBalance', 'transactionId', 'dashboardUrl'],
  },

  // =============================================================================
  // ONBOARDING
  // =============================================================================

  'onboarding.welcome': {
    id: 'onboarding.welcome',
    brand: 'aigne-hub',
    name: 'Welcome Email',
    description: 'Welcome new users to AIGNE Hub',
    template: 'with-bullets',
    subject: 'Welcome to AIGNE Hub - Your AI Gateway',
    slots: {
      greeting: { prompt: 'Warm welcome greeting using their name' },
      intro: { prompt: 'Welcome them to AIGNE Hub, explain it gives unified access to multiple AI providers' },
      points: {
        prompt: 'Key things they can do: access multiple AI models, track usage, manage API keys, use from any application',
        items: 4,
      },
      closing: { prompt: 'Encourage them to get started' },
      cta: { text: 'Go to Dashboard', url: '{{dashboardUrl}}' },
    },
    variables: ['userName', 'dashboardUrl'],
  },

  'onboarding.api-key-created': {
    id: 'onboarding.api-key-created',
    brand: 'aigne-hub',
    name: 'API Key Created',
    description: 'Confirm API key creation with getting started guide',
    template: 'with-info-box',
    subject: 'Your AIGNE Hub API key is ready',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'Confirm their API key has been created and is ready to use' },
      highlight: { prompt: 'Important: API key only shown once, store it securely, never commit to code' },
      explanation: { prompt: 'Brief explanation of how to use the key with the API endpoint' },
      cta: { text: 'View Documentation', url: '{{docsUrl}}' },
    },
    variables: ['userName', 'keyName', 'docsUrl'],
  },

  // =============================================================================
  // SECURITY
  // =============================================================================

  'security.new-login': {
    id: 'security.new-login',
    brand: 'aigne-hub',
    name: 'New Login Detected',
    description: 'Alert for login from new device or location',
    template: 'security',
    subject: 'New login to your AIGNE Hub account',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      alert: { prompt: 'New login detected to their account' },
      details: { prompt: 'Login details: time {{loginTime}}, location {{location}}, device {{device}}, IP {{ipAddress}}' },
      action: { prompt: 'If this was not them, secure their account immediately' },
      cta: { text: 'Review Account Activity', url: '{{dashboardUrl}}/security' },
    },
    variables: ['userName', 'loginTime', 'location', 'device', 'ipAddress', 'dashboardUrl'],
  },

  'security.api-key-used': {
    id: 'security.api-key-used',
    brand: 'aigne-hub',
    name: 'API Key First Use',
    description: 'Notification when an API key is used for the first time',
    template: 'with-info-box',
    subject: 'Your AIGNE Hub API key was used',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'API key "{{keyName}}" was just used for the first time' },
      highlight: { prompt: 'Details: time {{useTime}}, IP {{ipAddress}}, model accessed {{modelUsed}}' },
      explanation: { prompt: 'This is expected if they just started using the key. If not, revoke it immediately.' },
      cta: { text: 'Manage API Keys', url: '{{dashboardUrl}}/api-keys' },
    },
    variables: ['userName', 'keyName', 'useTime', 'ipAddress', 'modelUsed', 'dashboardUrl'],
  },

  // =============================================================================
  // USAGE & REPORTS
  // =============================================================================

  'usage.weekly-summary': {
    id: 'usage.weekly-summary',
    brand: 'aigne-hub',
    name: 'Weekly Usage Summary',
    description: 'Weekly summary of API usage and credits',
    template: 'with-bullets',
    subject: 'Your AIGNE Hub weekly summary',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'Summary of their usage this week' },
      points: {
        prompt: 'Key stats: total requests {{totalRequests}}, credits used {{creditsUsed}}, most used model {{topModel}}, remaining credits {{creditsRemaining}}',
        items: 4,
      },
      closing: { prompt: 'Brief note about viewing detailed analytics' },
      cta: { text: 'View Full Report', url: '{{dashboardUrl}}/analytics' },
    },
    variables: ['userName', 'totalRequests', 'creditsUsed', 'topModel', 'creditsRemaining', 'dashboardUrl'],
  },

  // =============================================================================
  // SYSTEM NOTIFICATIONS
  // =============================================================================

  'system.maintenance': {
    id: 'system.maintenance',
    brand: 'aigne-hub',
    name: 'Scheduled Maintenance',
    description: 'Notification about upcoming maintenance',
    template: 'with-warning',
    subject: 'Scheduled maintenance for AIGNE Hub',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'Scheduled maintenance notification' },
      warning: { prompt: 'Maintenance window: {{maintenanceStart}} to {{maintenanceEnd}}. Service may be unavailable.' },
      next_steps: { prompt: 'Recommend completing critical tasks before maintenance window' },
      cta: { text: 'Check Status', url: '{{statusUrl}}' },
    },
    variables: ['userName', 'maintenanceStart', 'maintenanceEnd', 'statusUrl'],
  },

  'system.incident-resolved': {
    id: 'system.incident-resolved',
    brand: 'aigne-hub',
    name: 'Incident Resolved',
    description: 'Notification that a service incident has been resolved',
    template: 'simple',
    subject: 'AIGNE Hub service restored',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'Service has been fully restored. Apologize for any inconvenience. Incident duration: {{incidentDuration}}' },
      cta: { text: 'View Incident Report', url: '{{incidentUrl}}' },
    },
    variables: ['userName', 'incidentDuration', 'incidentUrl'],
  },
};
