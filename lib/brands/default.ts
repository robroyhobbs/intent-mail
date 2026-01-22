import type { BrandConfig } from '../types';

export const defaultBrand: BrandConfig = {
  id: 'default',
  name: 'Email Kit',
  tagline: 'AI-Native Email System',

  colors: {
    primary: '#2563eb',
    secondary: '#64748b',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
  },

  typography: {
    headings: 'system-ui, -apple-system, sans-serif',
    body: 'system-ui, -apple-system, sans-serif',
  },

  voice: {
    tone: 'Professional, clear, and helpful',
    doSay: ['Thank you', 'We appreciate', 'Here to help'],
    dontSay: ['URGENT', 'Act now', 'Limited time'],
  },

  logo: {
    url: '',
    width: 120,
    altText: 'Email Kit',
  },

  links: {
    home: 'https://example.com',
    privacy: 'https://example.com/privacy',
  },
};
