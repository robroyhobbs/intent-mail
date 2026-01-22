import type { BrandConfig } from '../types';

export const myvibeBrand: BrandConfig = {
  id: 'myvibe',
  name: 'MyVibe',
  tagline: 'Ship your vibe',

  colors: {
    primary: '#8B5CF6',
    secondary: '#EC4899',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#FAF5FF',
    surface: '#FFFFFF',
    text: '#1F2937',
    textMuted: '#6B7280',
    border: '#E9D5FF',
  },

  typography: {
    headings: 'Poppins, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    fontImportUrl: 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap',
  },

  voice: {
    tone: 'Friendly, energetic, empowering - like a creative friend who gets things done',
    doSay: [
      'Ship it',
      'Your creation',
      'Go live',
      'Looking good',
      'Nice work',
      'Let\'s build',
    ],
    dontSay: [
      'Complex',
      'Technical',
      'Backend',
      'Configuration',
      'Parameters',
      'Enterprise',
    ],
  },

  logo: {
    url: 'https://myvibe.so/logo.png',
    width: 100,
    altText: 'MyVibe',
  },

  links: {
    home: 'https://myvibe.so',
    privacy: 'https://myvibe.so/privacy',
    documentation: 'https://myvibe.so/docs',
    support: 'https://myvibe.so/support',
  },
};
