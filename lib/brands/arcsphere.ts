import type { BrandConfig } from '../types';

export const arcsphereBrand: BrandConfig = {
  id: 'arcsphere',
  name: 'ArcSphere',
  tagline: 'Your Window into the AI-Enabled Internet',

  colors: {
    primary: '#4598fa',
    secondary: '#00b8db',
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
    headings: 'Bai Jamjuree, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    fontImportUrl: 'https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@500;600;700&family=Inter:wght@400;500;600&display=swap',
  },

  voice: {
    tone: 'Modern, accessible, empowering - your gateway to AI capabilities',
    doSay: [
      'Your AI agents',
      'Discover and activate',
      'Seamless access',
      'Your digital passport',
      'In your pocket',
    ],
    dontSay: [
      'Revolutionary',
      'Magic',
      'Simply',
      'Easy',
      'Game-changing',
    ],
  },

  logo: {
    url: 'https://www.arcblock.io/content/uploads/arcsphere-logo.png',
    width: 120,
    altText: 'ArcSphere',
  },

  links: {
    home: 'https://www.arcblock.io/arcsphere',
    privacy: 'https://www.arcblock.io/privacy',
    documentation: 'https://www.arcblock.io/docs/arcsphere',
    support: 'https://community.arcblock.io',
    appStore: 'https://apps.apple.com/app/arcsphere',
    playStore: 'https://play.google.com/store/apps/details?id=io.arcblock.arcsphere',
  },
};
