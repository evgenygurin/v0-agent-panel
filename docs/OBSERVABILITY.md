# Observability with OpenTelemetry

Comprehensive monitoring and tracing setup for production AI applications.

## 🎯 Overview

This project uses **Vercel OpenTelemetry** (`@vercel/otel`) for:

- Distributed tracing across all Vercel Functions
- AI request performance monitoring
- Token usage tracking
- Error tracking and debugging
- Integration with observability providers

## 📦 Installed Packages

```json
{
  "@opentelemetry/api": "1.9.0",
  "@vercel/otel": "2.1.0"
}
```

## 🔧 Configuration

### 1. Instrumentation Setup

**File:** `instrumentation.ts` (root directory)

```typescript
import { registerOTel } from '@vercel/otel'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    registerOTel({
      serviceName: 'v0-agent-panel',
      attributes: {
        'service.version': process.env.VERCEL_GIT_COMMIT_SHA || 'local',
        'deployment.environment': process.env.VERCEL_ENV || 'development',
      },
    })
  }
}
```

**Key Features:**
- Auto-instrumentation for Next.js 15
- Service name identification
- Git commit SHA tracking
- Environment detection

### 2. Custom AI Tracing

**File:** `app/api/chat/route.ts`

The AI Agent API includes custom tracing for:

#### Trace Attributes

```typescript
// Request metrics
span.setAttribute('ai.message_count', messages.length)
span.setAttribute('ai.provider', 'anthropic' | 'claude-code')
span.setAttribute('ai.model', 'claude-sonnet-4-5')

// Response metrics
span.setAttribute('ai.finish_reason', finishReason)
span.setAttribute('ai.response_length', text.length)
span.setAttribute('ai.duration_ms', duration)

// Token usage
span.setAttribute('ai.tokens.input', usage.promptTokens)
span.setAttribute('ai.tokens.output', usage.completionTokens)
span.setAttribute('ai.tokens.total', usage.totalTokens)
```

#### Error Tracking

```typescript
span.recordException(error)
span.setStatus({ code: 2, message: error.message }) // ERROR
```

## 📊 What Gets Traced

### Automatic Tracing (Next.js)

- HTTP requests to all routes
- API route handlers
- Server components rendering
- Middleware execution
- Static generation
- Dynamic rendering

### Custom AI Tracing

- **AI Chat Requests** (`ai-chat-request` span)
  - Message count
  - Provider (Anthropic/Claude Code)
  - Model version
  - Request duration
  - Response length
  - Token usage (input/output/total)
  - Finish reason
  - Errors and exceptions

## 🔍 Trace Example

```text
Trace: ai-chat-request
├─ Duration: 2,340ms
├─ Attributes:
│  ├─ ai.message_count: 3
│  ├─ ai.provider: anthropic
│  ├─ ai.model: claude-sonnet-4-5
│  ├─ ai.duration_ms: 2340
│  ├─ ai.response_length: 1250
│  ├─ ai.tokens.input: 450
│  ├─ ai.tokens.output: 380
│  ├─ ai.tokens.total: 830
│  └─ ai.finish_reason: stop
└─ Status: OK
```

## 🔌 Connecting to Observability Providers

### Vercel Drains (Enterprise/Pro)

Vercel automatically exports traces to configured drains:

1. **Go to Vercel Dashboard:**
   - Project Settings → Observability → Drains

2. **Add Drain:**
   - Select provider (DataDog, New Relic, etc.)
   - Configure endpoint
   - Add authentication

3. **Automatic Export:**
   - All OTel traces flow to provider
   - No code changes needed

### Supported Providers

- **DataDog** - Application Performance Monitoring
- **New Relic** - Full-stack observability
- **Honeycomb** - Distributed system debugging
- **Grafana Cloud** - Metrics and logs
- **Sentry** - Error monitoring (v8+ with OTel)
- **Custom OTLP endpoint** - Any OTel-compatible backend

## 📈 Metrics You Can Track

### Performance Metrics

- **Response Time:**
  - P50, P95, P99 latencies
  - Per-route performance
  - AI request duration

- **Throughput:**
  - Requests per second
  - AI chat messages per minute
  - Error rates

- **AI-Specific:**
  - Token usage per request
  - Model selection patterns
  - Average response length

### Cost Optimization

Track token usage to optimize costs:

```sql
-- Example query (in your APM)
SELECT
  AVG(ai.tokens.total) as avg_tokens,
  COUNT(*) as request_count,
  SUM(ai.tokens.input) as total_input_tokens,
  SUM(ai.tokens.output) as total_output_tokens
FROM spans
WHERE span_name = 'ai-chat-request'
GROUP BY DATE_TRUNC('hour', timestamp)
```

## 🐛 Debugging with Traces

### Finding Slow Requests

1. Filter spans by `ai-chat-request`
2. Sort by `ai.duration_ms` descending
3. Examine attributes for patterns

### Identifying Token Waste

1. Look for high `ai.tokens.total` with low `ai.response_length`
2. Check `ai.message_count` vs token usage
3. Optimize prompts based on data

### Error Analysis

1. Filter by `span.status.code = 2` (ERROR)
2. Group by `ai.provider` or `ai.model`
3. Review exception details

## 🔒 Security Considerations

### What's NOT Traced

- User message content (privacy)
- API keys
- Authentication tokens
- Sensitive user data

### What IS Traced

- Message counts
- Response lengths
- Token usage
- Error messages (sanitized)
- Performance metrics

### Best Practices

1. **Never log user content** in spans
2. **Sanitize error messages** before recording
3. **Use span attributes** for metadata only
4. **Configure sampling** for high-traffic routes

## 🧪 Local Testing

OpenTelemetry works locally but doesn't export:

```bash
# Start dev server
pnpm dev

# Make AI request
# Check console for trace info
```

Console output includes:
```text
Stream finished: {
  finishReason: 'stop',
  usage: { promptTokens: 450, completionTokens: 380, totalTokens: 830 },
  textLength: 1250,
  durationMs: 2340
}
```

## 📚 Advanced Configuration

### Custom Span Processor

For more control over traces:

```typescript
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'

export async function register() {
  registerOTel({
    serviceName: 'v0-agent-panel',
    spanProcessors: [
      new BatchSpanProcessor(exporter, {
        maxQueueSize: 2048,
        scheduledDelayMillis: 5000,
      }),
    ],
  })
}
```

### Custom Attributes

Add global attributes to all spans:

```typescript
registerOTel({
  serviceName: 'v0-agent-panel',
  attributes: {
    'app.version': '1.0.0',
    'deployment.region': process.env.VERCEL_REGION,
    'team': 'engineering',
  },
})
```

### Sampling Configuration

Control which traces are exported:

```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base'

registerOTel({
  serviceName: 'v0-agent-panel',
  sampler: new TraceIdRatioBasedSampler(0.1), // 10% sampling
})
```

## 🎯 Production Checklist

- [ ] OpenTelemetry instrumentation enabled
- [ ] Service name configured
- [ ] Custom AI tracing implemented
- [ ] Vercel Drain configured (Pro/Enterprise)
- [ ] APM dashboard set up
- [ ] Alerts configured for errors
- [ ] Token usage alerts set
- [ ] Performance baselines established

## 📖 Resources

### Official Documentation

- [Vercel OTel Docs](https://vercel.com/docs/observability/otel-overview)
- [Next.js OpenTelemetry](https://nextjs.org/docs/app/building-your-application/optimizing/open-telemetry)
- [OpenTelemetry Spec](https://opentelemetry.io/docs/)

### APM Provider Guides

- [DataDog Integration](https://docs.datadoghq.com/tracing/trace_collection/open_standards/otlp_ingest_in_the_agent/)
- [New Relic OpenTelemetry](https://docs.newrelic.com/docs/more-integrations/open-source-telemetry-integrations/opentelemetry/opentelemetry-introduction/)
- [Honeycomb Setup](https://docs.honeycomb.io/getting-data-in/opentelemetry/nodejs/)

## 🚀 Next Steps

1. **Deploy to production** - Traces automatically exported
2. **Configure Drain** - Connect to your APM
3. **Create dashboards** - Visualize AI performance
4. **Set up alerts** - Monitor token usage and errors
5. **Optimize** - Use insights to improve performance

---

**🎯 Production-ready observability for AI applications!**

Track every AI request, optimize costs, and debug with confidence.
