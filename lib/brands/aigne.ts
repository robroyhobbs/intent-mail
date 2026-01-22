import type { BrandConfig } from '../types';

export const aigneBrand: BrandConfig = {
  id: 'aigne-hub',
  name: 'AIGNE Hub',
  tagline: 'Your Unified AI Gateway',

  colors: {
    primary: '#7c3aed',
    secondary: '#4598fa',
    success: '#28A948',
    warning: '#ff9300',
    error: '#fb2c36',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },

  typography: {
    headings: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    fontImportUrl: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },

  voice: {
    tone: 'Professional, clear, technically confident but approachable',
    doSay: [
      'Your AI gateway',
      'Unified access',
      'Track your usage',
      'Credits remaining',
      'Multiple providers, one interface',
    ],
    dontSay: [
      'Revolutionary',
      'Game-changing',
      'Simply',
      'Just',
      'Magic',
      'Automagically',
    ],
  },

  logo: {
    url: 'https://www.arcblock.io/content/uploads/194efc0ff96ee91c860ae5dfb771e99e.png',
    width: 120,
    altText: 'AIGNE Hub',
  },

  links: {
    home: 'https://www.aigne.io',
    privacy: 'https://www.arcblock.io/privacy',
    documentation: 'https://www.arcblock.io/docs',
    support: 'https://community.arcblock.io/discussions/boards/aigne',
  },
};
