# Vercel AI Gateway Integration Guide

This guide covers integrating Vercel AI Gateway into your AI Agent application for unified access to 100+ AI models from multiple providers.

## 🎯 What is Vercel AI Gateway?

**Vercel AI Gateway** provides a unified interface for accessing hundreds of AI models from multiple providers (OpenAI, Anthropic, Google, Meta, DeepSeek, and more) through a single endpoint.

### Key Benefits

1. **Single Source of Billing**: Consolidate all AI provider costs under one Vercel account
2. **Intelligent Failover**: Automatic switching to backup providers during outages
3. **No Vercel Rate Limits**: Only upstream provider limits apply
4. **Zero Markup Option**: Use your own API keys for 0% markup
5. **Simplified Management**: One API key instead of managing multiple provider keys
6. **Multi-Model Strategies**: Easily switch between models for cost/performance optimization

## 💰 Pricing

- **Tokens at Provider List Prices**: No Vercel markup on token usage
- **0% Markup Option**: Bring your own API keys (BYOK) for zero additional cost
- **Free Trial**: Access to premium models during trial period
- **Consolidated Billing**: Single invoice for all providers

## 🚀 Integration with Existing Project

### Current Setup (Direct Claude Code Provider)

Your project currently uses the Claude Code provider directly:

```typescript
// app/api/chat/route.ts (CURRENT)
import { claudeCode } from 'ai-sdk-provider-claude-code'
import { streamText } from 'ai'

const model = claudeCode('sonnet', {
  systemPrompt: { type: 'preset', preset: 'claude_code' },
})

const result = streamText({
  model,
  messages,
})
```

### Migration to AI Gateway

**Step 1: Install Vercel AI SDK (Already Installed)**

```bash
# Already in package.json
pnpm add ai@5.0.88
```

**Step 2: Configure Environment Variables**

```bash
# .env.local
# Option A: Use Vercel AI Gateway (recommended)
VERCEL_AI_GATEWAY_TOKEN=your_vercel_token

# Option B: Bring Your Own Key (0% markup)
ANTHROPIC_API_KEY=sk-ant-your-key
```

**Step 3: Update API Route to Use AI Gateway**

```typescript
// app/api/chat/route.ts (NEW)
import { streamText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'

// Create provider with AI Gateway
const anthropic = createAnthropic({
  // Vercel AI Gateway automatically used if VERCEL_AI_GATEWAY_TOKEN is set
  // Falls back to ANTHROPIC_API_KEY if not
  baseURL: 'https://api.vercel.com/v1/ai',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

export const maxDuration = 300

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
    system: 'You are a helpful AI assistant powered by Vercel AI Gateway.',
  })

  return result.toDataStreamResponse()
}
```

**Step 4: Update Client Component (No Changes Needed)**

```typescript
// components/agent-chat.tsx (NO CHANGES)
"use client"

import { useChat } from 'ai/react'

export function AgentChat() {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat', // Same endpoint
  })

  // ... rest of component
}
```

## 🎨 Multi-Model Strategy

AI Gateway makes it easy to use different models for different tasks:

```typescript
// lib/ai-models.ts
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'

// AI Gateway configuration
const anthropic = createAnthropic({
  baseURL: 'https://api.vercel.com/v1/ai',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

const openai = createOpenAI({
  baseURL: 'https://api.vercel.com/v1/ai',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

const google = createGoogleGenerativeAI({
  baseURL: 'https://api.vercel.com/v1/ai',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

// Model selection based on task complexity
export function selectModel(complexity: 'simple' | 'medium' | 'complex') {
  switch (complexity) {
    case 'simple':
      // Fast, cheap model for simple tasks
      return anthropic('claude-haiku-4-5-20250929')
      // Cost: ~$0.25/1M input tokens

    case 'medium':
      // Balanced model for most tasks
      return anthropic('claude-sonnet-4-5-20250929')
      // Cost: ~$3/1M input tokens

    case 'complex':
      // Most capable model for complex reasoning
      return anthropic('claude-opus-4-1-20250514')
      // Cost: ~$15/1M input tokens
  }
}

// Provider failover strategy
export function getModelWithFailover(preferredModel: string) {
  try {
    return anthropic(preferredModel)
  } catch (error) {
    console.warn('Anthropic unavailable, falling back to OpenAI')
    return openai('gpt-4-turbo-preview')
  }
}
```

**Usage in API Route**:

```typescript
// app/api/chat/route.ts
import { selectModel } from '@/lib/ai-models'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages, complexity = 'medium' } = await req.json()

  // Automatically select appropriate model
  const model = selectModel(complexity)

  const result = streamText({
    model,
    messages,
  })

  return result.toDataStreamResponse()
}
```

## 🔀 Intelligent Failover

AI Gateway automatically handles provider outages:

```typescript
// lib/ai-gateway.ts
import { streamText } from 'ai'

export async function generateWithFailover(messages: any[]) {
  const providers = [
    { name: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
    { name: 'openai', model: 'gpt-4-turbo-preview' },
    { name: 'google', model: 'gemini-1.5-pro' },
  ]

  for (const provider of providers) {
    try {
      console.log(`Attempting with ${provider.name}`)

      const result = await streamText({
        model: provider.model,
        messages,
        maxRetries: 2,
      })

      return result
    } catch (error) {
      console.error(`${provider.name} failed:`, error)
      // Continue to next provider
    }
  }

  throw new Error('All AI providers unavailable')
}
```

## 💡 Advanced Use Cases

### 1. Cost-Optimized Chat with Model Switching

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { selectModel } from '@/lib/ai-models'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Analyze message complexity
  const complexity = analyzeComplexity(messages)

  // Select appropriate model
  const model = selectModel(complexity)

  console.log(`Using ${model} for complexity: ${complexity}`)

  const result = streamText({
    model,
    messages,
    async onFinish({ usage }) {
      // Track cost per model
      await logUsage({
        model: model.modelId,
        tokensUsed: usage.totalTokens,
        complexity,
      })
    },
  })

  return result.toDataStreamResponse()
}

function analyzeComplexity(messages: any[]): 'simple' | 'medium' | 'complex' {
  const lastMessage = messages[messages.length - 1].content
  const wordCount = lastMessage.split(' ').length

  // Simple heuristic
  if (wordCount < 20) return 'simple'
  if (wordCount < 100) return 'medium'
  return 'complex'
}
```

### 2. Multi-Model Consensus

```typescript
// lib/consensus.ts
import { generateText } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createOpenAI } from '@ai-sdk/openai'

export async function generateWithConsensus(prompt: string) {
  const anthropic = createAnthropic({
    baseURL: 'https://api.vercel.com/v1/ai',
    apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
  })

  const openai = createOpenAI({
    baseURL: 'https://api.vercel.com/v1/ai',
    apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
  })

  // Generate responses from multiple models in parallel
  const [claudeResponse, gptResponse] = await Promise.all([
    generateText({
      model: anthropic('claude-sonnet-4-5-20250929'),
      prompt,
    }),
    generateText({
      model: openai('gpt-4-turbo-preview'),
      prompt,
    }),
  ])

  // Combine or compare responses
  return {
    claude: claudeResponse.text,
    gpt: gptResponse.text,
    consensus: findConsensus(claudeResponse.text, gptResponse.text),
  }
}
```

### 3. Rate Limit Optimization

```typescript
// lib/rate-limit-optimizer.ts
import { streamText } from 'ai'

export class ModelLoadBalancer {
  private modelQueue: string[] = [
    'claude-sonnet-4-5-20250929',
    'gpt-4-turbo-preview',
    'gemini-1.5-pro',
  ]
  private currentIndex = 0

  async generate(messages: any[]) {
    const maxAttempts = this.modelQueue.length

    for (let i = 0; i < maxAttempts; i++) {
      const model = this.modelQueue[this.currentIndex]

      try {
        const result = await streamText({ model, messages })

        // Success - move to next model for next request
        this.currentIndex = (this.currentIndex + 1) % this.modelQueue.length

        return result
      } catch (error: any) {
        if (error.message.includes('rate_limit')) {
          console.log(`Rate limit hit on ${model}, trying next`)
          this.currentIndex = (this.currentIndex + 1) % this.modelQueue.length
          continue
        }

        throw error
      }
    }

    throw new Error('All models rate limited')
  }
}
```

## 📊 Monitoring & Analytics

### Track Usage Across Models

```typescript
// lib/analytics.ts
export async function trackAIUsage(data: {
  model: string
  provider: string
  tokensUsed: number
  duration: number
  cost: number
  userId?: string
}) {
  // Send to analytics service
  console.log('[AI Usage]', {
    timestamp: new Date().toISOString(),
    ...data,
  })

  // Store in database for analysis
  await db.aiUsage.create({
    data: {
      ...data,
      timestamp: new Date(),
    },
  })
}

// Usage in API route
const result = streamText({
  model: anthropic('claude-sonnet-4-5-20250929'),
  messages,
  async onFinish({ usage }) {
    await trackAIUsage({
      model: 'claude-sonnet-4-5-20250929',
      provider: 'anthropic',
      tokensUsed: usage.totalTokens,
      duration: Date.now() - startTime,
      cost: calculateCost(usage.totalTokens, 'sonnet'),
    })
  },
})
```

### Cost Calculation

```typescript
// lib/cost-calculator.ts
const PRICING = {
  'claude-haiku-4-5-20250929': {
    input: 0.25 / 1_000_000,
    output: 1.25 / 1_000_000,
  },
  'claude-sonnet-4-5-20250929': {
    input: 3 / 1_000_000,
    output: 15 / 1_000_000,
  },
  'claude-opus-4-1-20250514': {
    input: 15 / 1_000_000,
    output: 75 / 1_000_000,
  },
  'gpt-4-turbo-preview': {
    input: 10 / 1_000_000,
    output: 30 / 1_000_000,
  },
}

export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  model: keyof typeof PRICING
): number {
  const pricing = PRICING[model]
  return inputTokens * pricing.input + outputTokens * pricing.output
}
```

## 🔐 Security Best Practices

### Secure API Key Storage

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  VERCEL_AI_GATEWAY_TOKEN: z.string().min(1),
  // Fallback keys (optional)
  ANTHROPIC_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
})

export const env = envSchema.parse(process.env)
```

### Request Validation

```typescript
// app/api/chat/route.ts
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(10000),
    })
  ),
  complexity: z.enum(['simple', 'medium', 'complex']).optional(),
})

export async function POST(req: Request) {
  const body = await req.json()

  // Validate request
  const result = requestSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: 'Invalid request', details: result.error.errors },
      { status: 400 }
    )
  }

  const { messages, complexity } = result.data

  // Continue with validated data
}
```

## 🚨 Migration Checklist

Migrating from direct provider to AI Gateway:

- [ ] Set up Vercel AI Gateway access
- [ ] Configure `VERCEL_AI_GATEWAY_TOKEN` environment variable
- [ ] Update API routes to use `createAnthropic`/`createOpenAI` with gateway baseURL
- [ ] Test failover behavior
- [ ] Implement cost tracking
- [ ] Set up monitoring dashboards
- [ ] Update documentation for team
- [ ] Test in preview environment before production
- [ ] Monitor performance and costs for first week
- [ ] Optimize model selection strategy based on usage patterns

## 📚 Popular Use Cases from AI Gateway Users

From Vercel's data, top use cases include:

1. **AI Coding Agents** (Roo Code, Cline)
   - Multi-model support for different coding tasks
   - Fallback during provider outages
   - Cost optimization with model switching

2. **Autonomous Coding Platforms** (opencode)
   - 24/7 availability with intelligent failover
   - Mixed model strategies (fast for simple, powerful for complex)

3. **Multi-Model Chat Interfaces** (ChatHub)
   - User choice of models
   - Side-by-side comparisons
   - Single billing across all models

## 🔗 Resources

- [Vercel AI Gateway Documentation](https://vercel.com/ai-gateway)
- [Vercel AI SDK Documentation](https://sdk.vercel.ai)
- [AI Gateway Pricing](https://vercel.com/pricing#ai)
- [Supported Models List](https://sdk.vercel.ai/providers)

## 💡 Next Steps

1. **Set up AI Gateway access** in your Vercel dashboard
2. **Add environment variable** `VERCEL_AI_GATEWAY_TOKEN`
3. **Test in development** with a single model migration
4. **Deploy to preview** environment for testing
5. **Monitor costs** and performance for initial period
6. **Optimize** model selection based on usage patterns
