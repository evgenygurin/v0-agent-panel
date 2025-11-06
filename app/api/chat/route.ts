import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export const maxDuration = 300 // 5 minutes max duration

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Validate messages
    if (!messages || !Array.isArray(messages)) {
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
      model = anthropic('claude-sonnet-4-5-20250929', { apiKey })
    } else if (!isProduction) {
      // Local development with Claude Code CLI (requires: claude login)
      try {
        model = claudeCode('sonnet', {
          systemPrompt: { type: 'preset', preset: 'claude_code' },
          settingSources: ['user', 'project', 'local'],
        })
      } catch (error) {
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

    const result = streamText({
      model,
      messages,
      async onFinish({ text, finishReason, usage }) {
        // Log completion for monitoring
        console.log('Stream finished:', {
          finishReason,
          usage,
          textLength: text.length,
        })
      },
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error('Chat API error:', error)
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
}
