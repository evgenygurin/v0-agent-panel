/**
 * Next.js Instrumentation with OpenTelemetry and Sentry
 *
 * This file is automatically loaded by Next.js 15 when deployed.
 * Provides distributed tracing, metrics, logs, and error monitoring.
 *
 * Documentation:
 * - Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * - Vercel: https://vercel.com/docs/observability/otel-overview
 * - Sentry: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
 */

export async function register() {
  // Initialize Sentry for Node.js runtime
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      sampleRate: 1.0,

      // Skip OpenTelemetry setup to avoid conflicts with @vercel/otel
      skipOpenTelemetrySetup: true,
    })

    console.log('✅ Sentry (Node.js) initialized')

    // Initialize OpenTelemetry after Sentry
    const { registerOTel } = await import('@vercel/otel')

    registerOTel({
      serviceName: 'v0-agent-panel',
      attributes: {
        'service.version': process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        'deployment.environment': process.env.VERCEL_ENV || 'development',
      },
    })

    console.log('✅ OpenTelemetry instrumentation registered')
  }

  // Initialize Sentry for Edge runtime
  if (process.env.NEXT_RUNTIME === 'edge') {
    const Sentry = await import('@sentry/nextjs')

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    })

    console.log('✅ Sentry (Edge) initialized')
  }
}

/**
 * Capture errors from nested React Server Components
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#errors-from-nested-react-server-components
 */
export async function onRequestError(
  err: Error,
  request: {
    method: string
    path: string
    headers: Record<string, string>
  },
  context: {
    routerKind: 'Pages Router' | 'App Router'
    routePath: string
    routeType: 'render' | 'route' | 'action' | 'middleware'
  }
) {
  const Sentry = await import('@sentry/nextjs')

  Sentry.captureException(err, (scope) => {
    scope.setContext('request', {
      method: request.method,
      path: request.path,
      headers: request.headers,
    })
    scope.setContext('router', context)
    return scope
  })
}
