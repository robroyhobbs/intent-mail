import type { SimpleEmailIntent } from '../types';

export const arcsphereIntents: Record<string, SimpleEmailIntent> = {
  'welcome': {
    id: 'welcome',
    brand: 'arcsphere',
    name: 'Welcome to ArcSphere',
    description: 'Welcome email for new ArcSphere users with app setup guide',
    template: 'with-bullets',
    subject: 'Welcome to ArcSphere - Your AI Gateway',
    slots: {
      greeting: { prompt: 'Welcome the user to ArcSphere' },
      intro: { prompt: 'Explain what ArcSphere enables them to do' },
      bullets: { prompt: 'List 3-4 key features to explore first', items: 4 },
      cta: { text: 'Open ArcSphere', url: '{{appUrl}}' },
      signature: { text: 'The ArcSphere Team' },
    },
    variables: ['userName', 'appUrl'],
  },

  'did-created': {
    id: 'did-created',
    brand: 'arcsphere',
    name: 'DID Passport Created',
    description: 'Confirmation when user creates their DID passport',
    template: 'with-info-box',
    subject: 'Your Digital Passport is Ready',
    slots: {
      greeting: { prompt: 'Congratulate the user on creating their DID' },
      intro: { prompt: 'Explain what their DID passport enables' },
      infoBox: { prompt: 'Important security tips for their DID' },
      cta: { text: 'View Your Passport', url: '{{passportUrl}}' },
      signature: { text: 'The ArcSphere Team' },
    },
    variables: ['userName', 'didAddress', 'passportUrl'],
  },

  'skill-activated': {
    id: 'skill-activated',
    brand: 'arcsphere',
    name: 'Skill Activated',
    description: 'Notification when user activates a new AI skill',
    template: 'simple',
    subject: 'Skill Activated: {{skillName}}',
    slots: {
      greeting: { prompt: 'Confirm the skill activation' },
      body: { prompt: 'Explain what the skill does and how to use it' },
      cta: { text: 'Try It Now', url: '{{skillUrl}}' },
      signature: { text: 'The ArcSphere Team' },
    },
    variables: ['userName', 'skillName', 'skillUrl'],
  },

  'agent-alert': {
    id: 'agent-alert',
    brand: 'arcsphere',
    name: 'Agent Fleet Alert',
    description: 'Notification from user\'s AI agent fleet',
    template: 'with-info-box',
    subject: 'Agent Update: {{agentName}}',
    slots: {
      greeting: { prompt: 'Brief notification header' },
      intro: { prompt: 'Summarize what the agent has done or discovered' },
      infoBox: { prompt: 'Details of the agent action or finding' },
      cta: { text: 'View Details', url: '{{detailsUrl}}' },
      signature: { text: 'Your ArcSphere Agents' },
    },
    variables: ['userName', 'agentName', 'detailsUrl'],
  },

  'security-login': {
    id: 'security-login',
    brand: 'arcsphere',
    name: 'New Login Detected',
    description: 'Security alert for new device login',
    template: 'security',
    subject: 'New Login to Your ArcSphere Account',
    slots: {
      greeting: { prompt: 'Alert the user about new login' },
      securityAlert: { prompt: 'Details of the login: device, location, time' },
      body: { prompt: 'Instructions if this wasn\'t them' },
      cta: { text: 'Review Activity', url: '{{securityUrl}}' },
      signature: { text: 'ArcSphere Security' },
    },
    variables: ['userName', 'deviceInfo', 'location', 'loginTime', 'securityUrl'],
  },
};
