import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { trace } from '@opentelemetry/api'

export const maxDuration = 300 // 5 minutes max duration

// Get tracer for AI operations
const tracer = trace.getTracer('ai-agent', '1.0.0')

export async function POST(req: Request) {
  // Create trace span for AI request
  return tracer.startActiveSpan('ai-chat-request', async (span) => {
    try {
      const { messages } = await req.json()

      // Add trace attributes
      span.setAttribute('ai.message_count', messages?.length || 0)
      span.setAttribute('ai.provider', process.env.VERCEL_ENV === 'production' ? 'anthropic' : 'claude-code')

      // Validate messages
      if (!messages || !Array.isArray(messages)) {
        span.setStatus({ code: 2, message: 'Invalid request' }) // ERROR
        span.end()
        return new Response(
          JSON.stringify({
            error: 'Invalid request',
            details: 'Messages array is required',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // Determine which provider to use based on environment
      const isProduction = process.env.VERCEL_ENV === 'production'
      const apiKey = process.env.ANTHROPIC_API_KEY

      let model: any

      if (isProduction && apiKey) {
        // Production with API key
        span.setAttribute('ai.model', 'claude-sonnet-4-5')
        model = anthropic('claude-sonnet-4-5-20250929')
      } else if (!isProduction) {
        // Local development with Claude Code CLI (requires: claude login)
        try {
          // Dynamic import to avoid loading in production
          const { claudeCode } = await import('ai-sdk-provider-claude-code')
          span.setAttribute('ai.model', 'claude-code-sonnet')
          model = claudeCode('sonnet', {
            systemPrompt: { type: 'preset', preset: 'claude_code' },
            settingSources: ['user', 'project', 'local'],
          })
        } catch (error) {
          span.recordException(error as Error)
          span.setStatus({ code: 2, message: 'Auth error' }) // ERROR
          span.end()
          return new Response(
            JSON.stringify({
              error: 'Authentication error',
              details: 'Please run "claude login" in your terminal to authenticate with Claude Code CLI.',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        }
      } else {
        // Production without API key
        span.setStatus({ code: 2, message: 'Configuration error' }) // ERROR
        span.end()
        return new Response(
          JSON.stringify({
            error: 'Configuration error',
            details: 'AI Agent requires authentication. Please add ANTHROPIC_API_KEY to your Vercel environment variables, or get a free API key at https://console.anthropic.com/settings/keys (works alongside your Claude Max subscription).',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      const startTime = Date.now()

      const result = streamText({
        model,
        messages,
        async onFinish({ text, finishReason, usage }) {
          const duration = Date.now() - startTime

          // Add completion metrics to trace
          span.setAttribute('ai.finish_reason', finishReason)
          span.setAttribute('ai.response_length', text.length)
          span.setAttribute('ai.duration_ms', duration)

          if (usage) {
            const usageAny = usage as any;
            span.setAttribute('ai.tokens.input', usage.inputTokens || usageAny.promptTokens || 0)
            span.setAttribute('ai.tokens.output', usage.outputTokens || usageAny.completionTokens || 0)
            span.setAttribute('ai.tokens.total', usage.totalTokens || 0)
          }

          // Log completion for monitoring
          console.log('Stream finished:', {
            finishReason,
            usage,
            textLength: text.length,
            durationMs: duration,
          })

          span.setStatus({ code: 1 }) // OK
          span.end()
        },
      })

      return result.toTextStreamResponse()
    } catch (error) {
      console.error('Chat API error:', error)
      span.recordException(error as Error)
      span.setStatus({ code: 2, message: (error as Error).message }) // ERROR
      span.end()

      return new Response(
        JSON.stringify({
          error: 'Failed to process chat request',
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }
  })
}
