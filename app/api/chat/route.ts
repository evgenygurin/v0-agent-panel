import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

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

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Configuration error',
          details: 'ANTHROPIC_API_KEY environment variable is not set. Please configure it in your Vercel project settings.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Use Anthropic provider with API key
    const model = anthropic('claude-sonnet-4-5-20250929', {
      apiKey,
    })

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
