# Workflow DevKit for AI Agents

This guide covers integrating Vercel's Workflow DevKit to build reliable, durable AI agents with automatic retries, state persistence, and observability.

## 🎯 What is Workflow DevKit?

**Workflow DevKit** brings durability, reliability, and observability to async TypeScript/JavaScript. It transforms plain async code into workflows that can **suspend, resume, and maintain state** across failures and long-running operations.

### Why Workflow DevKit for AI Agents?

AI applications have unique challenges that Workflow DevKit solves:

| Challenge | Without Workflow | With Workflow |
|-----------|------------------|---------------|
| **Rate Limits** | Manual retry logic, complex backoff | Automatic retries with exponential backoff |
| **Long Operations** | Server timeouts, resource waste | Suspend/resume without consuming resources |
| **State Management** | Custom databases, session storage | Built-in state persistence |
| **Observability** | Manual logging, APM setup | Automatic traces, logs, metrics |
| **Multi-step AI** | Complex orchestration code | Simple async/await syntax |

### Key Features

- **Durability**: Code survives crashes and restarts
- **Zero Config**: No queues, schedulers, or YAML
- **Observable**: Every step traced automatically
- **Portable**: Runs anywhere (local, Docker, Vercel, any cloud)
- **Type-Safe**: Full TypeScript support
- **Framework Agnostic**: Works with Next.js, Express, and more

## 🚀 Installation

```bash
# Install Workflow DevKit
pnpm add workflow

# Optional: Install monitoring package
pnpm add @vercel/workflow-monitor
```

## 📚 Core Concepts

### 1. Workflows (`"use workflow"`)

A workflow is a durable, resumable function:

```typescript
export async function myWorkflow(input: string) {
  "use workflow"

  // This entire function is durable
  const step1 = await doSomething(input)
  const step2 = await doSomethingElse(step1)

  return step2
}
```

**What makes it special**:
- Automatically retries on failure
- Persists state between steps
- Can pause for hours/days without consuming resources
- Provides observability out of the box

### 2. Steps (`"use step"`)

A step is a retriable unit of work within a workflow:

```typescript
export async function sendEmail(to: string, subject: string) {
  "use step"

  // This step will retry automatically on failure
  const result = await emailService.send({ to, subject })
  return result
}
```

**Step features**:
- Automatic retries (configurable)
- Idempotent by default
- Can throw `FatalError` to stop retries
- Execution traced and logged

### 3. Sleep (`sleep()`)

Pause workflow without consuming resources:

```typescript
import { sleep } from "workflow"

export async function drip(userId: string) {
  "use workflow"

  await sendEmail(userId, "Welcome!")
  await sleep("1 day")

  await sendEmail(userId, "Day 2: Getting Started")
  await sleep("7 days")

  await sendEmail(userId, "Week 2: Advanced Tips")
}
```

**Sleep benefits**:
- No server resources consumed during sleep
- Workflow resumes exactly when scheduled
- Handles clock drift and failures

## 🤖 AI Agent Integration

### Basic AI Workflow

```typescript
// app/workflows/ai-agent.ts
import { sleep } from "workflow"
import { streamText } from "ai"
import { claudeCode } from "ai-sdk-provider-claude-code"

export async function aiAgentWorkflow(query: string, userId: string) {
  "use workflow"

  // Step 1: Initial AI response
  const initialResponse = await generateInitialResponse(query)

  // Step 2: Research and fact-check
  const facts = await researchFacts(initialResponse)

  // Step 3: Refine with fact-checking
  const refinedResponse = await refineWithFacts(initialResponse, facts)

  // Step 4: Save to user history
  await saveConversation(userId, query, refinedResponse)

  return {
    response: refinedResponse,
    sources: facts,
    timestamp: new Date().toISOString(),
  }
}

async function generateInitialResponse(query: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: query,
  })

  return result.text
}

async function researchFacts(content: string) {
  "use step"

  // Simulate fact-checking API
  const facts = await fetch("https://api.example.com/fact-check", {
    method: "POST",
    body: JSON.stringify({ content }),
  }).then((r) => r.json())

  return facts
}

async function refineWithFacts(response: string, facts: any[]) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Refine this response with these facts: ${JSON.stringify(facts)}\n\nOriginal: ${response}`,
  })

  return result.text
}

async function saveConversation(userId: string, query: string, response: string) {
  "use step"

  const { createClient } = await import("@/lib/supabase/server")
  const supabase = createClient()

  await supabase.from("conversations").insert({
    user_id: userId,
    messages: [
      { role: "user", content: query },
      { role: "assistant", content: response },
    ],
  })
}
```

### Invoke Workflow from API Route

```typescript
// app/api/chat/workflow/route.ts
import { aiAgentWorkflow } from "@/app/workflows/ai-agent"

export async function POST(req: Request) {
  const { query, userId } = await req.json()

  try {
    // Run workflow (non-blocking)
    const workflowId = await aiAgentWorkflow(query, userId)

    return Response.json({
      workflowId,
      status: "processing",
    })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## 🔄 Advanced AI Use Cases

### 1. Multi-Step AI Research Agent

```typescript
// workflows/research-agent.ts
import { sleep } from "workflow"

export async function researchAgent(topic: string) {
  "use workflow"

  // Phase 1: Initial research
  const sources = await gatherSources(topic)

  // Phase 2: Analyze each source
  const analyses = await Promise.all(
    sources.map((source) => analyzeSource(source))
  )

  // Phase 3: Synthesize findings
  const synthesis = await synthesizeFindings(analyses)

  // Phase 4: Generate final report
  const report = await generateReport(synthesis)

  return { report, sources, analyses }
}

async function gatherSources(topic: string) {
  "use step"

  // Search multiple sources
  const [webResults, papers, news] = await Promise.all([
    searchWeb(topic),
    searchPapers(topic),
    searchNews(topic),
  ])

  return [...webResults, ...papers, ...news]
}

async function analyzeSource(source: any) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Analyze this source for key insights: ${JSON.stringify(source)}`,
  })

  return {
    sourceId: source.id,
    insights: result.text,
    credibility: assessCredibility(source),
  }
}
```

### 2. AI Email Drip Campaign

```typescript
// workflows/ai-drip-campaign.ts
import { sleep } from "workflow"

export async function aiDripCampaign(userId: string, planType: string) {
  "use workflow"

  const user = await getUser(userId)

  // Day 0: Welcome email with AI-personalized content
  const welcomeContent = await generatePersonalizedEmail({
    name: user.name,
    plan: planType,
    type: "welcome",
  })
  await sendEmail(user.email, "Welcome!", welcomeContent)

  // Day 1: Feature highlights
  await sleep("1 day")
  const featuresContent = await generatePersonalizedEmail({
    name: user.name,
    plan: planType,
    type: "features",
  })
  await sendEmail(user.email, "Getting Started", featuresContent)

  // Day 3: Usage tips based on behavior
  await sleep("2 days")
  const usage = await getUserUsage(userId)
  const tipsContent = await generatePersonalizedEmail({
    name: user.name,
    plan: planType,
    type: "tips",
    usage,
  })
  await sendEmail(user.email, "Pro Tips", tipsContent)

  // Day 7: Check-in
  await sleep("4 days")
  const checkinContent = await generatePersonalizedEmail({
    name: user.name,
    plan: planType,
    type: "checkin",
  })
  await sendEmail(user.email, "How's it going?", checkinContent)

  return { status: "completed", emailsSent: 4 }
}

async function generatePersonalizedEmail(params: any) {
  "use step"

  const result = await streamText({
    model: claudeCode("haiku"), // Use cheaper model for emails
    prompt: `Generate a personalized ${params.type} email for ${params.name} on ${params.plan} plan`,
  })

  return result.text
}
```

### 3. AI Content Pipeline

```typescript
// workflows/content-pipeline.ts
export async function contentPipeline(topic: string, userId: string) {
  "use workflow"

  // Step 1: Generate outline
  const outline = await generateOutline(topic)

  // Step 2: Generate sections in parallel
  const sections = await Promise.all(
    outline.sections.map((section) => generateSection(section))
  )

  // Step 3: Generate images for sections
  const sectionsWithImages = await Promise.all(
    sections.map(async (section) => ({
      ...section,
      image: await generateImage(section.title),
    }))
  )

  // Step 4: Compile and format
  const document = await compileDocument({
    title: outline.title,
    sections: sectionsWithImages,
  })

  // Step 5: Review and refine
  const reviewed = await reviewContent(document)

  // Step 6: Save to database
  await saveDocument(userId, reviewed)

  return { documentId: reviewed.id, status: "published" }
}

async function generateOutline(topic: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Create a detailed outline for: ${topic}`,
  })

  return JSON.parse(result.text)
}

async function generateSection(section: any) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Write detailed content for: ${section.title}\n\nContext: ${section.context}`,
  })

  return {
    title: section.title,
    content: result.text,
  }
}

async function generateImage(prompt: string) {
  "use step"

  // Call image generation API
  const response = await fetch("https://api.example.com/generate-image", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  })

  const { imageUrl } = await response.json()
  return imageUrl
}
```

## 🔧 Configuration

### Retry Configuration

```typescript
import { FatalError } from "workflow"

export async function callExternalAPI(url: string) {
  "use step"

  try {
    const response = await fetch(url)

    if (response.status === 404) {
      // Don't retry on 404
      throw new FatalError("Resource not found")
    }

    if (!response.ok) {
      // Will retry on other errors
      throw new Error(`HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    if (error.code === "ENOTFOUND") {
      // DNS error - don't retry
      throw new FatalError("Invalid URL")
    }
    throw error // Will retry
  }
}
```

### Workflow Timeout

```typescript
export async function longRunningWorkflow(input: string) {
  "use workflow"

  // Set workflow timeout (default: 30 days)
  const timeout = "7 days"

  const result = await processWithTimeout(input, timeout)
  return result
}
```

## 📊 Observability

### Built-in Monitoring

Workflow DevKit automatically captures:

- **Traces**: Every workflow and step execution
- **Logs**: Console output from each step
- **Metrics**: Duration, retry count, failure rate
- **State**: Current workflow status and position

### View Workflow Status

```typescript
// app/api/workflow/[id]/route.ts
import { getWorkflow } from "workflow"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const workflow = await getWorkflow(params.id)

  return Response.json({
    id: workflow.id,
    status: workflow.status, // "running" | "completed" | "failed"
    currentStep: workflow.currentStep,
    progress: workflow.progress,
    startedAt: workflow.startedAt,
    completedAt: workflow.completedAt,
    error: workflow.error,
  })
}
```

### Dashboard Integration

```typescript
// app/workflows/page.tsx
"use client"

import { useWorkflows } from "@vercel/workflow-monitor"

export default function WorkflowsDashboard() {
  const { workflows, loading } = useWorkflows()

  if (loading) return <div>Loading workflows...</div>

  return (
    <div>
      <h1>AI Agent Workflows</h1>
      {workflows.map((workflow) => (
        <WorkflowCard key={workflow.id} workflow={workflow} />
      ))}
    </div>
  )
}
```

## 🚨 Error Handling

### Automatic Retries

Steps retry automatically with exponential backoff:

```typescript
export async function unreliableOperation() {
  "use step"

  // Retries automatically:
  // Attempt 1: immediate
  // Attempt 2: after 1s
  // Attempt 3: after 2s
  // Attempt 4: after 4s
  // Attempt 5: after 8s (max 5 attempts)

  const result = await fetch("https://unreliable-api.com")
  return result.json()
}
```

### Fatal Errors (No Retry)

```typescript
import { FatalError } from "workflow"

export async function validateInput(input: string) {
  "use step"

  if (input.length === 0) {
    // Don't retry invalid input
    throw new FatalError("Input cannot be empty")
  }

  if (input.length > 10000) {
    throw new FatalError("Input too large")
  }

  return processInput(input)
}
```

### Error Recovery

```typescript
export async function resilientWorkflow(data: any) {
  "use workflow"

  try {
    const result = await riskyOperation(data)
    return { success: true, result }
  } catch (error) {
    // Log error and fallback
    console.error("Primary operation failed:", error)

    const fallbackResult = await fallbackOperation(data)
    return { success: true, result: fallbackResult, fallback: true }
  }
}
```

## 🔄 Migration from Existing Code

### Before: Manual Retry Logic

```typescript
// Old code with manual retries
async function sendWithRetry(data: any) {
  let attempts = 0
  const maxAttempts = 3

  while (attempts < maxAttempts) {
    try {
      const result = await fetch("https://api.example.com", {
        method: "POST",
        body: JSON.stringify(data),
      })
      return await result.json()
    } catch (error) {
      attempts++
      if (attempts >= maxAttempts) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempts))
    }
  }
}
```

### After: Workflow DevKit

```typescript
// New code with Workflow DevKit
async function sendWithWorkflow(data: any) {
  "use step"

  // Retries handled automatically
  const result = await fetch("https://api.example.com", {
    method: "POST",
    body: JSON.stringify(data),
  })

  return await result.json()
}
```

## 🎯 Best Practices

### 1. Idempotent Steps

Make steps safe to retry:

```typescript
async function createUser(email: string) {
  "use step"

  // Check if user exists first (idempotent)
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return existing

  return await db.user.create({ data: { email } })
}
```

### 2. Small, Focused Steps

Break workflows into logical units:

```typescript
// Good: Small, focused steps
export async function processOrder(orderId: string) {
  "use workflow"

  const order = await fetchOrder(orderId)
  const validated = await validateOrder(order)
  const charged = await chargePayment(validated)
  const shipped = await createShipment(charged)
  await sendConfirmation(shipped)

  return shipped
}

// Bad: One giant step
export async function processOrder(orderId: string) {
  "use workflow"

  const result = await doEverything(orderId) // Not retriable
  return result
}
```

### 3. Use Sleep for Long Pauses

Don't block with timers:

```typescript
// Good: Use sleep
export async function schedule(taskId: string) {
  "use workflow"

  await processTask(taskId)
  await sleep("1 hour") // No resources consumed
  await followUp(taskId)
}

// Bad: Use setTimeout
export async function schedule(taskId: string) {
  "use workflow"

  await processTask(taskId)
  await new Promise((resolve) => setTimeout(resolve, 3600000)) // Blocks
  await followUp(taskId)
}
```

### 4. Parallel Execution

Use Promise.all for independent steps:

```typescript
export async function processMultiple(ids: string[]) {
  "use workflow"

  // Run all in parallel
  const results = await Promise.all(
    ids.map((id) => processOne(id))
  )

  return results
}

async function processOne(id: string) {
  "use step"

  const data = await fetchData(id)
  return await transformData(data)
}
```

## 🌐 Deployment

### Vercel Deployment

Workflow DevKit works out of the box on Vercel:

```bash
# Deploy to Vercel
vercel --prod
```

### Self-Hosted

Run anywhere with Docker:

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

EXPOSE 3000

# Workflow DevKit requires no special configuration
CMD ["pnpm", "start"]
```

### Environment Variables

```bash
# .env.local
# Workflow DevKit uses no special env vars
# Works with your existing configuration

ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
```

## 📚 Resources

- [Workflow DevKit Documentation](https://vercel.com/docs/workflow)
- [Workflow DevKit GitHub](https://github.com/vercel/workflow)
- [Example Templates](https://vercel.com/templates?search=workflow)
- [Community Discord](https://vercel.com/discord)

## 🚀 Next Steps

1. **Install Workflow DevKit**: `pnpm add workflow`
2. **Convert existing AI endpoints** to use workflows
3. **Add observability** with built-in monitoring
4. **Deploy to production** with confidence
5. **Monitor workflows** in Vercel dashboard

---

**Workflow DevKit transforms your AI agents from fragile scripts to production-ready systems with reliability built in.**
