/**
 * Next.js Instrumentation with Vercel OpenTelemetry
 *
 * This file is automatically loaded by Next.js 15 when deployed.
 * Provides distributed tracing, metrics, and logs for production monitoring.
 *
 * Documentation:
 * - Next.js: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 * - Vercel: https://vercel.com/docs/observability/otel-overview
 */

export async function register() {
  // Only register instrumentation in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { registerOTel } = await import('@vercel/otel')

    registerOTel({
      serviceName: 'v0-agent-panel',

      // Vercel automatically provides these environment variables
      // OTEL_EXPORTER_OTLP_ENDPOINT
      // OTEL_EXPORTER_OTLP_HEADERS

      // Custom attributes for all traces
      attributes: {
        'service.version': process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        'deployment.environment': process.env.VERCEL_ENV || 'development',
      },
    })

    console.log('✅ OpenTelemetry instrumentation registered')
  }
}
