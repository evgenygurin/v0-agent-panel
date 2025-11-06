/**
 * Sentry Client Configuration
 * Error tracking for client-side (browser) errors
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Organization and project
  organization: 'mesoshop',
  project: 'sentry-orange-queen',

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional Replay configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out known third-party errors
  beforeSend(event, hint) {
    // Filter browser extension errors
    if (event.exception?.values) {
      const error = event.exception.values[0]
      if (error.value?.includes('Extension context invalidated')) {
        return null
      }
    }
    return event
  },

  // Environment detection
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',
})
