import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

// Note: In AI SDK v5, you can also use:
// import { anthropic } from '@ai-sdk/anthropic'
// const model = anthropic('claude-sonnet-4-5-20250929')

export const maxDuration = 300 // 5 minutes max duration

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    // Configure Claude Code with system prompt and settings
    const model = claudeCode('sonnet', {
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      settingSources: ['user', 'project', 'local'],
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
