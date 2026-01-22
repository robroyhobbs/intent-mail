import type { BrandConfig } from '../types';

export const arcblockBrand: BrandConfig = {
  id: 'arcblock',
  name: 'ArcBlock',
  tagline: 'AI-Native Engineering Company',

  colors: {
    primary: '#4598fa',
    secondary: '#00d3f3',
    success: '#28A948',
    warning: '#FFAE00',
    error: '#ff6467',
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
    tone: 'Professional, technically confident, forward-thinking',
    doSay: [
      'AI-Native',
      'Self-hostable',
      'Decentralized identity',
      'Blocklet ecosystem',
      'DID-based authentication',
    ],
    dontSay: [
      'Blockchain company',
      'Crypto',
      'Web3 toolchain',
      'Revolutionary',
      'Simply',
    ],
  },

  logo: {
    url: 'https://www.arcblock.io/content/uploads/arcblock-logo.png',
    width: 140,
    altText: 'ArcBlock',
  },

  links: {
    home: 'https://www.arcblock.io',
    privacy: 'https://www.arcblock.io/privacy',
    documentation: 'https://www.arcblock.io/docs',
    support: 'https://community.arcblock.io',
    github: 'https://github.com/ArcBlock',
  },
};
