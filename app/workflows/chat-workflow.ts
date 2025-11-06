import { anthropic } from '@ai-sdk/anthropic';
import { claudeCode } from 'ai-sdk-provider-claude-code';
import { streamText, type CoreMessage } from 'ai';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function chatWorkflow(messages: CoreMessage[]) {
  'use workflow';

  const model = isDevelopment
    ? claudeCode('sonnet', {
        systemPrompt: { type: 'preset', preset: 'claude_code' },
        settingSources: ['user', 'project', 'local'],
      })
    : anthropic('claude-sonnet-4-5-20250929');

  const result = await generateResponse(messages, model);
  await logMetrics(result);

  return {
    success: true,
    response: result.text,
    metadata: {
      finishReason: result.finishReason,
      usage: result.usage,
    },
  };
}

async function generateResponse(messages: CoreMessage[], model: any) {
  'use step';

  let fullText = '';
  let finishReason: string | undefined;
  let usage: Record<string, number> | undefined;

  const stream = streamText({
    model,
    messages,
    async onFinish({ text, finishReason: reason, usage: usageData }) {
      fullText = text;
      finishReason = reason;
      usage = usageData;
    },
  });

  for await (const chunk of stream.textStream) {
    fullText += chunk;
  }

  return {
    text: fullText,
    finishReason,
    usage,
  };
}

async function logMetrics(result: { text: string; finishReason?: string; usage?: Record<string, number> }) {
  'use step';

  console.log('[Workflow] Response generated:', {
    textLength: result.text.length,
    finishReason: result.finishReason,
    usage: result.usage,
  });
}
