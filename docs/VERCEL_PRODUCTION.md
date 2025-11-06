# Vercel Production Deployment Guide

This guide covers advanced Vercel features for deploying AI-powered Next.js applications in production.

## 🚀 Vercel Platform Features

### Fluid Compute for AI Workloads

Vercel provides **"Servers, in serverless form"** with Fluid Compute - combining active CPU allocation with provisioned memory, ideal for AI tasks.

**Key Benefits**:
- Dynamic resource allocation for compute-intensive AI operations
- Automatic scaling based on demand
- Optimized for streaming responses (perfect for AI SDK)

**Configuration** (`app/api/chat/route.ts`):

```typescript
export const maxDuration = 300 // 5 minutes for complex AI tasks
export const runtime = 'nodejs' // or 'edge' for lower latency

// Optional: specify memory allocation
export const memory = 1024 // MB
```

### Edge Runtime vs Node.js Runtime

**Edge Runtime** (Recommended for simple AI tasks):
- Global distribution (low latency)
- Fast cold starts (<50ms)
- Limited to 30s execution time
- Ideal for: Quick responses, routing, middleware

**Node.js Runtime** (Recommended for complex AI):
- Full Node.js API support
- Longer execution times (up to 300s on Pro)
- More memory available
- Ideal for: Claude Code agent, file operations, complex logic

**Example**: Edge for routing, Node.js for generation

```typescript
// app/api/route-message/route.ts (Edge)
export const runtime = 'edge'

export async function POST(req: Request) {
  const { message } = await req.json()

  // Quick routing logic
  if (message.includes('urgent')) {
    return Response.redirect('/api/chat/urgent')
  }

  return Response.redirect('/api/chat')
}

// app/api/chat/route.ts (Node.js)
export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: Request) {
  // Complex AI processing
  const result = streamText({ /* ... */ })
  return result.toDataStreamResponse()
}
```

## 🔐 Environment Variables Management

### Types of Environment Variables

**1. Build-time Variables**
```bash
# .env.local (for build)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_ANALYTICS_ID=abc123
```

**2. Runtime Variables (Secret)**
```bash
# Via Vercel Dashboard or CLI
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_SERVICE_KEY=...
AUTH0_SECRET=...
```

**3. System Variables (Auto-provided)**
- `VERCEL=1` - Indicates Vercel environment
- `VERCEL_URL` - Deployment URL
- `VERCEL_ENV` - Environment (production/preview/development)
- `VERCEL_REGION` - Deployment region

### Setting Environment Variables

**Via Vercel CLI**:

```bash
# Add production secret
vercel env add ANTHROPIC_API_KEY production

# Add to all environments
vercel env add DATABASE_URL

# Pull environment variables locally
vercel env pull .env.local
```

**Via Vercel Dashboard**:
1. Project Settings → Environment Variables
2. Add key-value pairs
3. Select environments (Production/Preview/Development)
4. Click "Save"

**Best Practices**:

```typescript
// lib/env.ts - Type-safe environment variables
import { z } from 'zod'

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
})

export const env = envSchema.parse({
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  VERCEL_ENV: process.env.VERCEL_ENV,
})

// Usage in API routes
import { env } from '@/lib/env'

if (!env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY not configured')
}
```

## 🛡️ Deployment Protection

### Password Protection

Protect preview deployments from unauthorized access:

```bash
# Via CLI
vercel --prod --password my-secure-password

# Via Dashboard: Settings → Deployment Protection → Password
```

### Trusted IPs

Restrict access to specific IP ranges (Enterprise):

```javascript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'x-vercel-ip-country',
            value: 'US,CA,GB', // Allow only these countries
          },
        ],
      },
    ]
  },
}
```

### Vercel Authentication

Use Vercel team authentication for internal tools:

```typescript
// middleware.ts
import { verifyAccess } from '@vercel/edge'

export async function middleware(req: Request) {
  const verification = await verifyAccess(req)

  if (!verification.authorized) {
    return new Response('Unauthorized', { status: 401 })
  }

  return NextResponse.next()
}
```

## 📊 Monitoring & Observability

### Web Vitals Monitoring

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Custom Logging

```typescript
// lib/logger.ts
export function logAIRequest(data: {
  model: string
  tokensUsed: number
  duration: number
  userId?: string
}) {
  // Vercel automatically captures console.log
  console.log(JSON.stringify({
    type: 'ai_request',
    timestamp: new Date().toISOString(),
    ...data,
  }))
}

// Usage in API route
import { logAIRequest } from '@/lib/logger'

const result = streamText({
  model: claudeCode('sonnet'),
  messages,
  async onFinish({ usage }) {
    logAIRequest({
      model: 'sonnet',
      tokensUsed: usage.totalTokens,
      duration: Date.now() - startTime,
    })
  },
})
```

### OpenTelemetry Integration

```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node')

    const sdk = new NodeSDK({
      // Your OpenTelemetry configuration
    })

    sdk.start()
  }
}
```

## 🔄 Instant Rollback

If deployment issues occur:

**Via Dashboard**:
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**Via CLI**:

```bash
# List deployments
vercel ls

# Promote specific deployment
vercel promote <deployment-url>
```

## 🌐 Edge Network & Caching

### ISR (Incremental Static Regeneration)

```typescript
// app/portfolio/page.tsx
export const revalidate = 3600 // Revalidate every hour

export default async function PortfolioPage() {
  const projects = await fetchProjects()
  return <ProjectList projects={projects} />
}
```

### Custom Cache Headers

```typescript
// app/api/projects/route.ts
export async function GET() {
  const projects = await db.projects.findMany()

  return Response.json(projects, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
    },
  })
}
```

## 🔒 Security Features

### Web Application Firewall (Enterprise)

Configure via Dashboard:
- Settings → Security → Firewall Rules
- Add custom rules for AI endpoints
- Block malicious patterns

### Rate Limiting

**Using Vercel KV**:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true, // Track rate limit hits
})

// app/api/chat/route.ts
import { ratelimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown'
  const { success, limit, reset, remaining } = await ratelimit.limit(ip)

  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    })
  }

  // Continue with AI processing
}
```

### DDoS Protection

Vercel provides automatic DDoS protection. Additional hardening:

```typescript
// middleware.ts
import { next } from '@vercel/edge'

export function middleware(req: Request) {
  // Reject requests with suspicious patterns
  const userAgent = req.headers.get('user-agent') || ''

  if (!userAgent || userAgent.length < 10) {
    return new Response('Bad Request', { status: 400 })
  }

  // Verify origin for API routes
  const url = new URL(req.url)
  if (url.pathname.startsWith('/api/')) {
    const origin = req.headers.get('origin')
    const allowedOrigins = [
      'https://your-app.vercel.app',
      'https://your-custom-domain.com',
    ]

    if (origin && !allowedOrigins.includes(origin)) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  return next()
}

export const config = {
  matcher: '/api/:path*',
}
```

## 💰 Cost Optimization

### Function Duration Optimization

```typescript
// Expensive: Multiple sequential AI calls
async function generateContent() {
  const title = await generateTitle()
  const intro = await generateIntro()
  const body = await generateBody()
  return { title, intro, body }
}

// Optimized: Parallel execution
async function generateContent() {
  const [title, intro, body] = await Promise.all([
    generateTitle(),
    generateIntro(),
    generateBody(),
  ])
  return { title, intro, body }
}
```

### Edge Caching for Static Responses

```typescript
// Cache common AI responses at edge
export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.searchParams.get('q')

  // Common queries cached at edge
  const cacheKey = `ai-response:${query}`

  return Response.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'CDN-Cache-Control': 'public, s-maxage=3600',
    },
  })
}
```

### Model Selection Strategy

```typescript
// Cost-aware model selection
function selectModel(complexity: 'simple' | 'medium' | 'complex') {
  switch (complexity) {
    case 'simple':
      return claudeCode('haiku') // ~$0.25/1M tokens
    case 'medium':
      return claudeCode('sonnet') // ~$3/1M tokens
    case 'complex':
      return claudeCode('opus') // ~$15/1M tokens
  }
}
```

## 🔧 Advanced Configuration

### Custom Build Command

```json
// package.json
{
  "scripts": {
    "vercel-build": "next build && node scripts/post-build.js"
  }
}
```

### Framework Preset Override

```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "outputDirectory": ".next"
}
```

### Multi-region Deployment (Enterprise)

```json
// vercel.json
{
  "regions": ["iad1", "sfo1", "fra1"]
}
```

## 📚 Resources

- [Vercel Functions Documentation](https://vercel.com/docs/functions)
- [Environment Variables Guide](https://vercel.com/docs/environment-variables)
- [Edge Runtime](https://vercel.com/docs/functions/edge-functions)
- [Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [Observability](https://vercel.com/docs/observability)
