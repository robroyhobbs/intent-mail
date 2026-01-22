/**
 * MyVibe Email Intents
 *
 * Email intents for the MyVibe creative platform.
 */

import type { SimpleEmailIntent } from '../types';

export const myvibeIntents: Record<string, SimpleEmailIntent> = {
  // =============================================================================
  // ONBOARDING
  // =============================================================================

  'onboarding.welcome': {
    id: 'onboarding.welcome',
    brand: 'myvibe',
    name: 'Welcome Email',
    description: 'Welcome new creators to MyVibe',
    template: 'with-bullets',
    subject: 'Welcome to MyVibe! Let\'s ship your vibe 🚀',
    slots: {
      greeting: { prompt: 'Enthusiastic, friendly greeting using their name' },
      intro: { prompt: 'Welcome them to MyVibe, the platform for shipping creative projects fast' },
      points: {
        prompt: 'What they can do: create projects, go live in minutes, share with the world, get feedback',
        items: 4,
      },
      closing: { prompt: 'Encourage them to create their first project' },
      cta: { text: 'Create Your First Project', url: '{{dashboardUrl}}/new' },
    },
    variables: ['userName', 'dashboardUrl'],
  },

  'onboarding.first-project': {
    id: 'onboarding.first-project',
    brand: 'myvibe',
    name: 'First Project Created',
    description: 'Celebrate when user creates their first project',
    template: 'simple',
    subject: 'Nice work! Your first project is live',
    slots: {
      greeting: { prompt: 'Celebratory greeting using their name' },
      intro: { prompt: 'Celebrate their first project "{{projectName}}" going live. Encourage them to share it.' },
      cta: { text: 'View Your Project', url: '{{projectUrl}}' },
    },
    variables: ['userName', 'projectName', 'projectUrl'],
  },

  // =============================================================================
  // PROJECT UPDATES
  // =============================================================================

  'project.published': {
    id: 'project.published',
    brand: 'myvibe',
    name: 'Project Published',
    description: 'Confirmation when a project goes live',
    template: 'with-info-box',
    subject: '{{projectName}} is now live!',
    slots: {
      greeting: { prompt: 'Excited greeting' },
      intro: { prompt: 'Project "{{projectName}}" is now live and ready to share' },
      highlight: { prompt: 'Share URL: {{projectUrl}} - anyone with this link can view it' },
      explanation: { prompt: 'Tips for sharing: post on social, send to friends, embed on website' },
      cta: { text: 'View Live Project', url: '{{projectUrl}}' },
    },
    variables: ['userName', 'projectName', 'projectUrl'],
  },

  'project.feedback': {
    id: 'project.feedback',
    brand: 'myvibe',
    name: 'New Feedback Received',
    description: 'Notification when someone leaves feedback',
    template: 'simple',
    subject: 'New feedback on {{projectName}}',
    slots: {
      greeting: { prompt: 'Brief friendly greeting' },
      intro: { prompt: '{{feedbackAuthor}} left feedback on "{{projectName}}": "{{feedbackPreview}}"' },
      cta: { text: 'View Feedback', url: '{{projectUrl}}#feedback' },
    },
    variables: ['userName', 'projectName', 'feedbackAuthor', 'feedbackPreview', 'projectUrl'],
  },

  'project.milestone': {
    id: 'project.milestone',
    brand: 'myvibe',
    name: 'Project Milestone',
    description: 'Celebrate project view milestones',
    template: 'simple',
    subject: '{{projectName}} hit {{viewCount}} views!',
    slots: {
      greeting: { prompt: 'Celebratory greeting' },
      intro: { prompt: 'Project "{{projectName}}" just hit {{viewCount}} views! People are loving your work.' },
      cta: { text: 'See the Stats', url: '{{projectUrl}}/stats' },
    },
    variables: ['userName', 'projectName', 'viewCount', 'projectUrl'],
  },

  // =============================================================================
  // COLLABORATION
  // =============================================================================

  'collab.invite': {
    id: 'collab.invite',
    brand: 'myvibe',
    name: 'Collaboration Invite',
    description: 'Invite someone to collaborate on a project',
    template: 'with-info-box',
    subject: '{{inviterName}} invited you to collaborate',
    slots: {
      greeting: { prompt: 'Friendly greeting using their name' },
      intro: { prompt: '{{inviterName}} wants to collaborate with you on "{{projectName}}"' },
      highlight: { prompt: 'As a collaborator you can edit, add content, and help ship this project' },
      explanation: { prompt: 'Click below to accept the invite and join the project' },
      cta: { text: 'Accept Invite', url: '{{inviteUrl}}' },
    },
    variables: ['userName', 'inviterName', 'projectName', 'inviteUrl'],
  },

  'collab.joined': {
    id: 'collab.joined',
    brand: 'myvibe',
    name: 'Collaborator Joined',
    description: 'Notify project owner when collaborator joins',
    template: 'simple',
    subject: '{{collaboratorName}} joined {{projectName}}',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: '{{collaboratorName}} accepted your invite and joined "{{projectName}}". You can now build together!' },
      cta: { text: 'Go to Project', url: '{{projectUrl}}' },
    },
    variables: ['userName', 'collaboratorName', 'projectName', 'projectUrl'],
  },

  // =============================================================================
  // ACCOUNT
  // =============================================================================

  'account.pro-welcome': {
    id: 'account.pro-welcome',
    brand: 'myvibe',
    name: 'Pro Upgrade Welcome',
    description: 'Welcome new Pro subscribers',
    template: 'with-bullets',
    subject: 'Welcome to MyVibe Pro!',
    slots: {
      greeting: { prompt: 'Enthusiastic thank you greeting' },
      intro: { prompt: 'Thank them for upgrading to Pro and unlock their creative potential' },
      points: {
        prompt: 'Pro features: unlimited projects, custom domains, analytics, priority support, remove branding',
        items: 5,
      },
      closing: { prompt: 'Encourage them to try out the new features' },
      cta: { text: 'Explore Pro Features', url: '{{dashboardUrl}}/pro' },
    },
    variables: ['userName', 'dashboardUrl'],
  },

  'account.subscription-ending': {
    id: 'account.subscription-ending',
    brand: 'myvibe',
    name: 'Subscription Ending Soon',
    description: 'Reminder before subscription expires',
    template: 'with-warning',
    subject: 'Your MyVibe Pro subscription ends soon',
    slots: {
      greeting: { prompt: 'Friendly greeting' },
      intro: { prompt: 'Their Pro subscription expires on {{expirationDate}}' },
      warning: { prompt: 'After expiration, Pro features will be disabled but projects stay safe' },
      next_steps: { prompt: 'Renew to keep custom domains, analytics, and unlimited projects' },
      cta: { text: 'Renew Subscription', url: '{{dashboardUrl}}/billing' },
    },
    variables: ['userName', 'expirationDate', 'dashboardUrl'],
  },

  // =============================================================================
  // SECURITY
  // =============================================================================

  'security.password-changed': {
    id: 'security.password-changed',
    brand: 'myvibe',
    name: 'Password Changed',
    description: 'Confirmation when password is changed',
    template: 'security',
    subject: 'Your MyVibe password was changed',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      alert: { prompt: 'Password was changed on their account' },
      details: { prompt: 'Changed at: {{changeTime}}, from IP: {{ipAddress}}' },
      action: { prompt: 'If this was not them, reset password immediately and contact support' },
      cta: { text: 'Review Account Security', url: '{{dashboardUrl}}/security' },
    },
    variables: ['userName', 'changeTime', 'ipAddress', 'dashboardUrl'],
  },

  'security.reset-password': {
    id: 'security.reset-password',
    brand: 'myvibe',
    name: 'Password Reset Request',
    description: 'Password reset link email',
    template: 'simple',
    subject: 'Reset your MyVibe password',
    slots: {
      greeting: { prompt: 'Brief greeting' },
      intro: { prompt: 'Password reset was requested. Link expires in {{expirationTime}}. If not requested, ignore this email.' },
      cta: { text: 'Reset Password', url: '{{resetUrl}}' },
    },
    variables: ['userName', 'expirationTime', 'resetUrl'],
  },
};
