# Building Effective AI Agents - Anthropic Guide

This guide synthesizes Anthropic's best practices for building production-ready AI agents, applied to your Next.js + Vercel AI SDK project.

## 🎯 Core Philosophy

**Start simple, add complexity only when necessary.**

> "Success in the LLM space isn't about building the most sophisticated system. It's about building the **right** system for your needs." - Anthropic

## 🏗️ Two Core Architectures

### 1. Workflows (Recommended for Most Use Cases)

LLMs follow **predefined code paths** with orchestrated tool usage.

**When to use**:
- Predictable tasks with known steps
- Need for reliability and observability
- Clear success criteria

**Example**:
```typescript
// app/workflows/content-generation.ts
export async function contentGenerationWorkflow(topic: string) {
  "use workflow" // Vercel Workflow DevKit

  // Step 1: Research
  const sources = await researchTopic(topic)

  // Step 2: Outline
  const outline = await generateOutline(topic, sources)

  // Step 3: Write
  const content = await writeContent(outline)

  // Step 4: Review
  const reviewed = await reviewContent(content)

  return reviewed
}

async function researchTopic(topic: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Research ${topic} and provide key points`,
  })

  return result.text
}
```

**Benefits**:
- ✅ Predictable behavior
- ✅ Easy debugging
- ✅ Clear observability
- ✅ Reliable retry logic

### 2. Agents (For Dynamic, Unpredictable Tasks)

LLMs **dynamically control** their own processes based on environmental feedback.

**When to use**:
- Unpredictable task sequences
- Need for adaptability
- Complex decision-making

**Example**:
```typescript
// app/api/agent/route.ts
export async function POST(req: Request) {
  const { task, context } = await req.json()

  const result = await streamText({
    model: claudeCode("opus"), // Most capable model
    system: `You are an autonomous agent. Analyze the task and decide which tools to use.

    Available tools:
    - web_search: Search the web
    - code_execute: Run code
    - file_read: Read files
    - file_write: Write files`,
    prompt: task,
    tools: {
      web_search: tool({
        description: "Search the web for information",
        parameters: z.object({
          query: z.string(),
        }),
        execute: async ({ query }) => {
          return await searchWeb(query)
        },
      }),
      code_execute: tool({
        description: "Execute Python or JavaScript code",
        parameters: z.object({
          language: z.enum(["python", "javascript"]),
          code: z.string(),
        }),
        execute: async ({ language, code }) => {
          return await executeCode(language, code)
        },
      }),
    },
  })

  return result.toDataStreamResponse()
}
```

## 🔧 Five Composable Workflow Patterns

### Pattern 1: Prompt Chaining

**Sequential task decomposition for accuracy.**

```typescript
// app/workflows/research-chain.ts
export async function researchChain(question: string) {
  "use workflow"

  // Chain 1: Break down question
  const subQuestions = await breakDownQuestion(question)

  // Chain 2: Answer each sub-question
  const answers = await Promise.all(
    subQuestions.map((q) => answerQuestion(q))
  )

  // Chain 3: Synthesize final answer
  const finalAnswer = await synthesizeAnswers(question, answers)

  return finalAnswer
}

async function breakDownQuestion(question: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Break this question into 3-5 sub-questions: ${question}`,
  })

  return JSON.parse(result.text)
}

async function answerQuestion(question: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Answer concisely: ${question}`,
  })

  return { question, answer: result.text }
}

async function synthesizeAnswers(question: string, answers: any[]) {
  "use step"

  const result = await streamText({
    model: claudeCode("opus"), // Use most capable for synthesis
    prompt: `Original question: ${question}

    Sub-answers: ${JSON.stringify(answers)}

    Synthesize a comprehensive final answer.`,
  })

  return result.text
}
```

**Use cases**:
- Research tasks
- Content generation
- Multi-step analysis

### Pattern 2: Routing

**Input classification to specialized handlers.**

```typescript
// app/api/route-agent/route.ts
export async function POST(req: Request) {
  const { message } = await req.json()

  // Step 1: Classify intent
  const intent = await classifyIntent(message)

  // Step 2: Route to specialist
  let result
  switch (intent) {
    case "coding":
      result = await codingAgent(message)
      break
    case "writing":
      result = await writingAgent(message)
      break
    case "research":
      result = await researchAgent(message)
      break
    default:
      result = await generalAgent(message)
  }

  return Response.json({ intent, result })
}

async function classifyIntent(message: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("haiku"), // Fast, cheap for classification
    prompt: `Classify this message into: coding, writing, research, or general

    Message: ${message}

    Respond with only the category.`,
  })

  return result.text.trim().toLowerCase()
}

async function codingAgent(message: string) {
  "use step"

  return await streamText({
    model: claudeCode("sonnet"),
    system: "You are an expert coding assistant.",
    prompt: message,
  })
}
```

**Use cases**:
- Customer support triage
- Multi-domain chatbots
- Task classification

### Pattern 3: Parallelization

**Concurrent processing or multiple attempts.**

```typescript
// app/workflows/parallel-generation.ts
export async function parallelGeneration(prompt: string) {
  "use workflow"

  // Generate 3 variations in parallel
  const [version1, version2, version3] = await Promise.all([
    generateVariation(prompt, "creative"),
    generateVariation(prompt, "professional"),
    generateVariation(prompt, "casual"),
  ])

  // Let user or evaluator choose best
  const best = await selectBestVariation([version1, version2, version3])

  return best
}

async function generateVariation(prompt: string, style: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    system: `Generate content in a ${style} style`,
    prompt,
  })

  return { style, content: result.text }
}

async function selectBestVariation(variations: any[]) {
  "use step"

  const result = await streamText({
    model: claudeCode("opus"),
    prompt: `Select the best variation:

    ${variations.map((v, i) => `${i + 1}. ${v.style}: ${v.content}`).join("\n\n")}

    Respond with the number only.`,
  })

  const index = parseInt(result.text) - 1
  return variations[index]
}
```

**Use cases**:
- A/B testing content
- Voting/ensemble methods
- Parallel research

### Pattern 4: Orchestrator-Workers

**Dynamic task delegation for unpredictable subtasks.**

```typescript
// app/workflows/orchestrator.ts
export async function orchestratorWorkflow(task: string) {
  "use workflow"

  // Orchestrator plans the work
  const plan = await orchestrator(task)

  // Workers execute subtasks
  const results = await Promise.all(
    plan.subtasks.map((subtask) => worker(subtask))
  )

  // Orchestrator synthesizes results
  const final = await synthesize(task, results)

  return final
}

async function orchestrator(task: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("opus"), // Most capable for planning
    prompt: `Break this task into 3-5 subtasks: ${task}

    Respond with JSON: { subtasks: ["subtask1", "subtask2", ...] }`,
  })

  return JSON.parse(result.text)
}

async function worker(subtask: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Complete this subtask: ${subtask}`,
  })

  return { subtask, result: result.text }
}
```

**Use cases**:
- Complex projects
- Research pipelines
- Multi-domain tasks

### Pattern 5: Evaluator-Optimizer

**Iterative refinement loops.**

```typescript
// app/workflows/evaluator-optimizer.ts
export async function evaluatorOptimizer(initialContent: string, criteria: string) {
  "use workflow"

  let content = initialContent
  let iteration = 0
  const maxIterations = 3

  while (iteration < maxIterations) {
    // Evaluate current content
    const evaluation = await evaluator(content, criteria)

    if (evaluation.score >= 9) {
      break // Good enough
    }

    // Optimize based on feedback
    content = await optimizer(content, evaluation.feedback)
    iteration++
  }

  return { content, iterations: iteration }
}

async function evaluator(content: string, criteria: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("sonnet"),
    prompt: `Evaluate this content against these criteria: ${criteria}

    Content: ${content}

    Respond with JSON: { score: 0-10, feedback: "..." }`,
  })

  return JSON.parse(result.text)
}

async function optimizer(content: string, feedback: string) {
  "use step"

  const result = await streamText({
    model: claudeCode("opus"),
    prompt: `Improve this content based on feedback:

    Content: ${content}

    Feedback: ${feedback}

    Provide improved version.`,
  })

  return result.text
}
```

**Use cases**:
- Content refinement
- Code optimization
- Iterative problem-solving

## 🛠️ Tool Design Best Practices

### Principle: Invest in ACIs (Agent-Computer Interfaces)

Treat tool design with the same rigor as human UIs.

### Good Tool Definition

```typescript
const goodTool = tool({
  description: `Search GitHub repositories.

  Use this when the user asks about code, projects, or open source.

  Examples:
  - "Find React component libraries"
  - "Search for Next.js templates"
  - "Look for AI agent examples"`,
  parameters: z.object({
    query: z.string().describe("Search query (e.g., 'react hooks')"),
    language: z.string().optional().describe("Filter by language (e.g., 'typescript')"),
    stars: z.number().optional().describe("Minimum stars (e.g., 1000)"),
  }),
  execute: async ({ query, language, stars }) => {
    const results = await searchGitHub({ query, language, stars })

    // Return structured, parseable data
    return {
      count: results.length,
      repositories: results.map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stars,
        url: r.url,
      })),
    }
  },
})
```

### Bad Tool Definition

```typescript
const badTool = tool({
  description: "Search GitHub", // Too vague
  parameters: z.object({
    q: z.string(), // Unclear parameter names
  }),
  execute: async ({ q }) => {
    const results = await fetch(`https://api.github.com/search?q=${q}`)
    return results // Unstructured, hard to parse
  },
})
```

## 🎯 Model Selection Strategy

### Task-based Model Selection

```typescript
function selectModel(task: string) {
  const complexity = analyzeComplexity(task)

  if (complexity === "simple") {
    return claudeCode("haiku") // Fast, cheap
  }

  if (complexity === "medium") {
    return claudeCode("sonnet") // Balanced
  }

  return claudeCode("opus") // Most capable
}

function analyzeComplexity(task: string): "simple" | "medium" | "complex" {
  const keywords = {
    simple: ["classify", "summarize", "extract"],
    complex: ["analyze", "synthesize", "reason", "plan"],
  }

  // Simple heuristic
  if (keywords.complex.some((k) => task.toLowerCase().includes(k))) {
    return "complex"
  }

  if (keywords.simple.some((k) => task.toLowerCase().includes(k))) {
    return "simple"
  }

  return "medium"
}
```

## 📊 Observability & Testing

### Log Everything

```typescript
export async function observableWorkflow(task: string) {
  "use workflow"

  const startTime = Date.now()

  try {
    console.log("[Workflow Start]", {
      task,
      timestamp: new Date().toISOString(),
    })

    const result = await processTask(task)

    console.log("[Workflow Success]", {
      task,
      duration: Date.now() - startTime,
      resultLength: result.length,
    })

    return result
  } catch (error) {
    console.error("[Workflow Error]", {
      task,
      duration: Date.now() - startTime,
      error: error.message,
    })
    throw error
  }
}
```

### Test Workflows

```typescript
// __tests__/workflows.test.ts
import { researchChain } from "@/app/workflows/research-chain"

describe("Research Chain Workflow", () => {
  it("should break down complex questions", async () => {
    const result = await researchChain("How does quantum computing work?")

    expect(result).toBeDefined()
    expect(result.length).toBeGreaterThan(100)
  })

  it("should handle errors gracefully", async () => {
    await expect(researchChain("")).rejects.toThrow()
  })
})
```

## 🚀 Production Best Practices

### 1. Start Direct, Add Frameworks Later

```typescript
// ✅ Good: Direct API usage
const result = await streamText({
  model: claudeCode("sonnet"),
  prompt: "Hello",
})

// ⚠️ Only when needed: Complex framework
const agent = new ComplexAgentFramework({
  model: "sonnet",
  tools: [...],
  memory: [...],
  // Many options you may not need
})
```

### 2. Explicit Planning

```typescript
// ✅ Good: Explicit steps
const plan = await createPlan(task)
const results = await executePlan(plan)
const final = await synthesize(results)

// ❌ Bad: Black box
const result = await magicAIFunction(task)
```

### 3. Error Handling

```typescript
import { FatalError } from "workflow"

async function robustStep(input: string) {
  "use step"

  try {
    return await riskyOperation(input)
  } catch (error) {
    if (error.code === "INVALID_INPUT") {
      // Don't retry invalid input
      throw new FatalError("Invalid input format")
    }

    // Retriable errors
    throw error
  }
}
```

## 📚 Resources

- [Anthropic Engineering Blog](https://www.anthropic.com/engineering/building-effective-agents)
- [Vercel AI SDK Docs](https://sdk.vercel.ai)
- [Workflow DevKit Guide](./WORKFLOW_DEVKIT.md)
- [AI Gateway Guide](./VERCEL_AI_GATEWAY.md)

## 🎯 Quick Decision Guide

**Use Workflows when**:
- Task is predictable
- Reliability is critical
- Need clear observability

**Use Agents when**:
- Task is unpredictable
- Need adaptability
- Complex decision-making required

**Use Prompt Chaining when**:
- Sequential steps
- Each step needs context from previous

**Use Routing when**:
- Multiple specialized handlers
- Clear input classification

**Use Parallelization when**:
- Independent subtasks
- Need multiple perspectives

**Use Orchestrator-Workers when**:
- Complex, dynamic task breakdown
- Hierarchical planning needed

**Use Evaluator-Optimizer when**:
- Iterative refinement
- Quality improvement over iterations

---

**Remember**: Start simple, measure results, add complexity only when proven necessary.
