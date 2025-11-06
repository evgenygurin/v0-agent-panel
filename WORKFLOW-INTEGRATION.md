# Vercel AI Workflows Integration

This document describes the Vercel AI Workflows integration in the v0-agent-panel project.

## Overview

The project now includes durable AI workflows powered by Vercel's Workflow SDK. This enables:

- **Durable execution**: Workflows survive server restarts and failures
- **Step-by-step execution**: Each step is retried independently if it fails
- **Monitoring**: Full visibility into workflow runs via Vercel Dashboard
- **Tracing**: Built-in OpenTelemetry integration

## Architecture

### Files Created

1. **`app/workflows/chat-workflow.ts`** - Main workflow definition
   - Defines the chat workflow with durable execution using `"use workflow"` directive
   - Uses the same model selection logic as the regular API (development vs production)
   - Includes two steps: `generateResponse` and `logMetrics`
   - Each step uses `"use step"` directive for automatic retry and state management

2. **`app/workflows/index.ts`** - Workflow exports
   - Central export file for all workflows

3. **`app/api/chat/workflow/route.ts`** - HTTP API endpoint
   - Calls the workflow function directly
   - Returns workflow execution results

## Usage

### API Endpoint

**POST** `/api/chat/workflow`

Request body:
```json
{
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

Response:
```json
{
  "response": "I'm doing well, thank you for asking! How can I help you today?",
  "metadata": {
    "finishReason": "stop",
    "usage": {
      "promptTokens": 10,
      "completionTokens": 15,
      "totalTokens": 25
    }
  }
}
```

### Workflow Structure

The workflow is defined using the `"use workflow"` directive and consists of:

**Main Workflow Function (`chatWorkflow`)**:
```typescript
export async function chatWorkflow(messages: CoreMessage[]) {
  'use workflow';

  const model = isDevelopment ? claudeCode('sonnet') : anthropic('claude-sonnet-4-5-20250929');
  const result = await generateResponse(messages, model);
  await logMetrics(result);

  return { success: true, response: result.text, metadata: { ... } };
}
```

**Step Functions**:

1. **`generateResponse`** - Generates AI response using streamText
   - Marked with `"use step"` directive for automatic retry
   - Uses development (Claude Code) or production (Anthropic) model
   - Captures full text, finish reason, and token usage
   - Streams text chunks and aggregates results

2. **`logMetrics`** - Logs execution metrics
   - Marked with `"use step"` directive for isolation
   - Records response length, finish reason, usage data
   - Useful for monitoring and debugging

Both steps are automatically retried on failure and maintain their own state.

### Model Selection

The workflow uses the same model selection logic as the regular API:

- **Development** (`NODE_ENV=development`): Uses `claudeCode('sonnet')` with full Claude Code SDK features
- **Production**: Uses `anthropic('claude-sonnet-4-5-20250929')`

## Local Development

### Prerequisites

```bash
# Install dependencies (already done)
pnpm add workflow@latest

# Ensure authentication
claude login  # For Claude Code SDK
```

### Running Locally

1. **Start development server**:
   ```bash
   pnpm dev
   ```

2. **Test workflow endpoint**:
   ```bash
   curl -X POST http://localhost:3000/api/chat/workflow \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {
           "role": "user",
           "content": "Hello!"
         }
       ]
     }'
   ```

### Workflow CLI Commands

```bash
# Inspect workflow runs
npx workflow inspect runs --backend vercel

# View specific run details
npx workflow inspect run <run-id> --backend vercel

# List all workflows
npx workflow list --backend vercel
```

## Deployment

### Vercel Deployment

1. **Build and deploy**:
   ```bash
   git add .
   git commit -m "feat: add Vercel AI Workflows integration"
   git push origin main
   ```

2. **Verify deployment**:
   - Visit: https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows
   - Check that `chat-workflow` appears in the workflows list

3. **Test production endpoint**:
   ```bash
   curl -X POST https://your-domain.vercel.app/api/chat/workflow \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {
           "role": "user",
           "content": "Hello!"
         }
       ]
     }'
   ```

### Environment Variables

Ensure these are configured in Vercel:

- `NODE_ENV` - Set to `production` for production deployments
- `ANTHROPIC_API_KEY` - Required for production Anthropic API calls
- Any other environment variables used by Claude Code SDK

## Monitoring

### Vercel Dashboard

View workflow runs at:
https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows

Dashboard provides:
- Real-time workflow execution status
- Step-by-step execution timeline
- Error logs and retry information
- Token usage and performance metrics

### OpenTelemetry Integration

The workflow automatically integrates with the existing OpenTelemetry setup:

- Traces are sent to configured OTLP endpoint
- Workflow steps appear as spans in trace timeline
- Full distributed tracing across API → Workflow → AI SDK

### Sentry Integration

Errors in workflows are automatically captured by Sentry:

- Workflow execution errors
- Individual step failures
- AI SDK errors and timeouts

## Comparison: Regular API vs Workflow API

### Regular API (`/api/chat`)

**Advantages**:
- Lower latency (direct execution)
- Simpler implementation
- Streaming response support

**Disadvantages**:
- No durability (request fails if server restarts)
- No built-in retry logic
- Limited visibility into execution

### Workflow API (`/api/chat/workflow`)

**Advantages**:
- **Durable execution** - survives server restarts
- **Automatic retries** - each step retried independently
- **Full monitoring** - complete visibility in Vercel Dashboard
- **Step isolation** - failures isolated to specific steps

**Disadvantages**:
- Slightly higher latency (workflow orchestration overhead)
- Non-streaming (returns complete response)
- Additional complexity

## When to Use Workflows

Use workflows for:

- **Long-running AI operations** that might exceed serverless timeouts
- **Critical operations** that require durability and retry guarantees
- **Complex multi-step processes** that benefit from step isolation
- **Operations requiring audit trail** of execution history

Use regular API for:

- **Real-time chat** requiring streaming responses
- **Simple single-step operations** with low latency requirements
- **High-throughput scenarios** where workflow overhead is undesirable

## Troubleshooting

### Workflow not appearing in dashboard

1. Ensure workflow is properly exported in `app/workflows/index.ts`
2. Deploy to Vercel (workflows only visible after deployment)
3. Check build logs for workflow registration errors

### Workflow execution failures

1. Check Vercel Dashboard for specific step failures
2. Review error logs in step details
3. Verify environment variables are configured
4. Test locally with `pnpm dev` before deployment

### Authentication errors

- **Development**: Run `claude login` and restart dev server
- **Production**: Verify `ANTHROPIC_API_KEY` is set in Vercel

### Timeout errors

- Increase `maxDuration` in route.ts (max 300 seconds for Hobby plan)
- Consider breaking long operations into multiple steps

## Future Enhancements

Potential improvements:

1. **Streaming support** - Implement streaming workflow responses
2. **Parallel steps** - Execute independent AI operations in parallel
3. **Conditional logic** - Branch workflow based on AI responses
4. **Human-in-the-loop** - Add approval steps for sensitive operations
5. **Scheduled workflows** - Trigger workflows on schedule (cron)
6. **Webhook integration** - Trigger workflows from external events

## Resources

- [Vercel Workflows Documentation](https://vercel.com/docs/workflow)
- [AI SDK Documentation](https://sdk.vercel.ai/)
- [Claude Code SDK](https://github.com/anthropics/claude-code)
- [OpenTelemetry Integration](https://vercel.com/docs/observability/otel-overview)

---

**Project**: v0-agent-panel
**Workflow ID**: `chat-workflow`
**Dashboard**: https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows
