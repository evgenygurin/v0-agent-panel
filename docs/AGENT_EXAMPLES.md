# AI Agent Examples & Best Practices

This document provides examples and best practices for working with the Claude Code AI Agent integrated into this project.

## 🎯 Agent Workflow Patterns

Based on [Anthropic's Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents), we implement the following patterns:

### 1. Prompt Chaining (Sequential Processing)

Break complex tasks into sequential steps:

```typescript
// Example: Multi-step code generation
const steps = [
  'Analyze requirements',
  'Design architecture',
  'Generate code',
  'Add tests',
]

// Each chat message processes one step
```

**Use when**: Tasks have clear sequential dependencies

### 2. Routing (Task Classification)

Route different types of requests to specialized handlers:

```typescript
// In route.ts, detect intent and route accordingly
if (message.includes('debug')) {
  // Enable debugging tools
} else if (message.includes('refactor')) {
  // Focus on code quality
}
```

**Use when**: Handling diverse request types

### 3. Parallelization

Process independent subtasks simultaneously:

```typescript
// Client-side: Multiple independent requests
const [result1, result2] = await Promise.all([
  fetch('/api/chat', { method: 'POST', body: task1 }),
  fetch('/api/chat', { method: 'POST', body: task2 }),
])
```

**Use when**: Tasks are independent and can run concurrently

### 4. Orchestrator-Workers

Central agent breaks down and delegates tasks:

```typescript
// Main orchestrator agent
const model = claudeCode('sonnet', {
  systemPrompt: {
    type: 'custom',
    prompt: `You are an orchestrator. Break down complex coding tasks
             into subtasks and delegate to specialized workers.`,
  },
})

// Worker agents for specific tasks
const workerModel = claudeCode('haiku') // Faster for specific tasks
```

**Use when**: Task complexity is unpredictable

### 5. Evaluator-Optimizer

One agent generates, another evaluates and refines:

```typescript
// Generator
const generator = claudeCode('sonnet')

// Evaluator
const evaluator = claudeCode('opus', {
  systemPrompt: {
    type: 'custom',
    prompt: 'Review code quality, security, and best practices.',
  },
})
```

**Use when**: Quality improvement through iteration

## 🔧 Configuration Examples

### Basic Chat Agent

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: claudeCode('sonnet'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Context-Aware Agent

```typescript
const model = claudeCode('sonnet', {
  systemPrompt: { type: 'preset', preset: 'claude_code' },
  settingSources: ['user', 'project', 'local'],
})
```

**Settings Sources**:
- `user`: Global CLAUDE.md from `~/.claude/CLAUDE.md`
- `project`: Project CLAUDE.md (this file)
- `local`: CLAUDE.local.md (gitignored, personal notes)

### Specialized Code Agent

```typescript
const model = claudeCode('sonnet', {
  systemPrompt: {
    type: 'custom',
    prompt: `You are a specialized React/TypeScript expert.
             Focus on:
             - Type safety (strict TypeScript)
             - React Server Components best practices
             - Performance optimization
             - Accessibility (WCAG 2.1 AA)

             Always provide code examples with explanations.`,
  },
  allowedTools: ['read', 'write', 'edit', 'bash'],
})
```

### High-Capability Agent (Opus with Extended Thinking)

```typescript
const model = claudeCode('opus', {
  systemPrompt: { type: 'preset', preset: 'claude_code' },
  settingSources: ['user', 'project', 'local'],
  thinkingConfig: {
    type: 'enabled',
    budget_tokens: 10000,
  },
})
```

**Use for**: Complex architectural decisions, deep debugging

### Fast Prototyping Agent (Haiku)

```typescript
const model = claudeCode('haiku', {
  systemPrompt: {
    type: 'custom',
    prompt: 'Quick prototyping assistant. Generate working code fast.',
  },
})
```

**Use for**: Rapid iteration, simple tasks, cost optimization

## 🎨 Custom UI Patterns

### Multi-Agent Interface

```typescript
// components/multi-agent-chat.tsx
const agents = [
  { id: 'architect', name: 'Architecture', model: 'opus' },
  { id: 'coder', name: 'Code Generation', model: 'sonnet' },
  { id: 'reviewer', name: 'Code Review', model: 'sonnet' },
]

// User selects agent before sending message
const handleSubmit = async (agentId: string) => {
  await fetch(`/api/chat/${agentId}`, {
    method: 'POST',
    body: JSON.stringify({ messages }),
  })
}
```

### Streaming with Tool Calls

```typescript
// app/api/chat/route.ts
const result = streamText({
  model: claudeCode('sonnet'),
  messages,
  tools: {
    generateComponent: {
      description: 'Generate a new React component',
      parameters: z.object({
        name: z.string(),
        props: z.record(z.string()),
      }),
      execute: async ({ name, props }) => {
        // Generate component code
        return { code: '...', filePath: `components/${name}.tsx` }
      },
    },
  },
})
```

### Error Handling & Retry

```typescript
// Client-side with retry logic
const { messages, error, reload } = useChat({
  api: '/api/chat',
  onError: (error) => {
    console.error('Chat error:', error)
    toast.error('Failed to send message. Click to retry.')
  },
})

// Retry button
<Button onClick={reload}>Retry</Button>
```

## 📊 Monitoring & Analytics

### Token Usage Tracking

```typescript
// app/api/chat/route.ts
const result = streamText({
  model: claudeCode('sonnet'),
  messages,
  async onFinish({ text, finishReason, usage }) {
    // Log to analytics service
    await logUsage({
      model: 'sonnet',
      tokensUsed: usage.totalTokens,
      finishReason,
      timestamp: new Date(),
    })
  },
})
```

### Performance Monitoring

```typescript
const startTime = Date.now()

const result = streamText({
  model: claudeCode('sonnet'),
  messages,
  async onFinish() {
    const duration = Date.now() - startTime
    console.log(`Request completed in ${duration}ms`)
  },
})
```

## 🔒 Security Best Practices

### Rate Limiting

```typescript
// app/api/chat/route.ts
import { ratelimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', { status: 429 })
  }

  // Continue with chat logic
}
```

### Content Filtering

```typescript
const result = streamText({
  model: claudeCode('sonnet'),
  messages: messages.map((msg) => ({
    ...msg,
    content: sanitizeInput(msg.content), // Remove potentially harmful content
  })),
})
```

### Tool Restrictions

```typescript
// Production environment: restrict dangerous tools
const model = claudeCode('sonnet', {
  disallowedTools: ['bash', 'write'], // No file system access
  allowedTools: ['read'], // Read-only access
})
```

## 🚀 Advanced Patterns

### Conversational Memory

```typescript
// Store conversation history in database
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json()

  // Load conversation history
  const history = await kv.get(`conversation:${conversationId}`)

  const result = streamText({
    model: claudeCode('sonnet'),
    messages: [...(history || []), ...messages],
  })

  // Save updated history
  const fullMessages = [...(history || []), ...messages]
  await kv.set(`conversation:${conversationId}`, fullMessages)

  return result.toDataStreamResponse()
}
```

### Multi-Modal Input

```typescript
// Support text + images
const result = streamText({
  model: claudeCode('sonnet'),
  messages: [
    {
      role: 'user',
      content: [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image',
          image: 'data:image/png;base64,...', // Base64 encoded
        },
      ],
    },
  ],
})
```

**Note**: Images must be base64-encoded or data URLs. HTTP(S) URLs not supported.

### Structured Output

```typescript
import { streamObject } from 'ai'
import { z } from 'zod'

const result = streamObject({
  model: claudeCode('sonnet'),
  schema: z.object({
    componentName: z.string(),
    props: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        required: z.boolean(),
      })
    ),
    code: z.string(),
  }),
  prompt: 'Generate a React component for a user profile card',
})

// Result is typed!
const { object } = await result
console.log(object.componentName) // TypeScript knows this is a string
```

## 📚 Resources

- [AI SDK Documentation](https://sdk.vercel.ai)
- [Claude Code Provider](https://github.com/ben-vargas/ai-sdk-provider-claude-code)
- [Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Prompt Engineering Guide](https://docs.anthropic.com/claude/docs/prompt-engineering)

## 💡 Tips

1. **Start Simple**: Use basic streaming first, add complexity when needed
2. **Monitor Costs**: Haiku for prototyping, Sonnet for production, Opus for complex tasks
3. **Context Matters**: Use CLAUDE.md to provide project-specific context
4. **Tool Carefully**: Only enable tools that are necessary
5. **Test Streaming**: Verify UI handles streaming states gracefully
6. **Cache Effectively**: Reuse conversation history when possible
7. **Error Gracefully**: Always provide user-friendly error messages
