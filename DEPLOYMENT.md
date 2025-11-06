# Deployment Guide

This guide covers deployment options for the v0 Agent Panel project.

## 🚀 Vercel Deployment (Recommended)

The project is optimized for Vercel deployment with automatic v0.dev sync.

### Prerequisites

1. **Claude Code Authentication**:
   ```bash
   npm install -g @anthropic-ai/claude-code
   claude login
   ```

2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)

### Deployment Steps

#### Option 1: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

#### Option 2: Deploy via GitHub Integration

1. Push code to GitHub repository
2. Import project in Vercel dashboard
3. Vercel auto-detects Next.js and configures build settings
4. Deploy

### Environment Variables

**Required for AI Agent**:

```bash
# None required - uses Claude Code CLI authentication
```

**Optional**:

```bash
# Custom API endpoint (if using Anthropic API instead of Claude Code CLI)
ANTHROPIC_API_KEY=your_api_key_here

# Rate limiting (if using Vercel KV)
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_token
```

### Build Configuration

Vercel auto-detects these settings from `package.json`:

```json
{
  "scripts": {
    "build": "next build",
    "start": "next start"
  }
}
```

### Domain Setup

1. Go to Vercel project settings → Domains
2. Add custom domain (optional)
3. Vercel configures DNS automatically

## 🔧 Alternative Deployment Options

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

**Build and run**:

```bash
# Build image
docker build -t v0-agent-panel .

# Run container
docker run -p 3000:3000 \
  -v ~/.claude:/root/.claude \
  v0-agent-panel
```

**Note**: Mount `~/.claude` to persist Claude Code authentication.

### Railway Deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

**Environment**:
- Node.js version: 20+
- Build command: `pnpm build`
- Start command: `pnpm start`

### Netlify Deployment

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Build settings**:
- Build command: `pnpm build`
- Publish directory: `.next`
- Functions directory: `netlify/functions` (for API routes)

**Note**: Netlify requires additional configuration for Next.js API routes.

## 🔐 Production Considerations

### Security

**Rate Limiting**:

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
})
```

**API Route Protection**:

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

**Content Security Policy**:

```typescript
// next.config.mjs
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline';",
  },
]

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### Performance

**Enable Image Optimization**:

```javascript
// next.config.mjs
export default {
  images: {
    unoptimized: false, // Change from true
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
}
```

**Enable Production Checks**:

```javascript
// next.config.mjs
export default {
  eslint: {
    ignoreDuringBuilds: false, // Change from true
  },
  typescript: {
    ignoreBuildErrors: false, // Change from true
  },
}
```

**Bundle Analysis**:

```bash
# Install analyzer
pnpm add -D @next/bundle-analyzer

# Analyze bundle
ANALYZE=true pnpm build
```

### Monitoring

**Vercel Analytics**:

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Error Tracking (Sentry)**:

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Initialize
npx @sentry/wizard@latest -i nextjs
```

## 📊 Cost Optimization

### Claude Code Model Selection

**Development/Testing**:
- Use **Haiku** (fastest, cheapest)
- Cost: ~$0.25 per 1M input tokens

**Production**:
- Use **Sonnet** (balanced)
- Cost: ~$3 per 1M input tokens

**Complex Tasks**:
- Use **Opus** (most capable)
- Cost: ~$15 per 1M input tokens

### Caching Strategy

```typescript
// app/api/chat/route.ts
import { kv } from '@vercel/kv'

export async function POST(req: Request) {
  const { messages } = await req.json()
  const cacheKey = `chat:${hashMessages(messages)}`

  // Check cache
  const cached = await kv.get(cacheKey)
  if (cached) {
    return new Response(cached, {
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  // Generate and cache
  const result = streamText({
    model: claudeCode('sonnet'),
    messages,
  })

  const stream = result.toDataStreamResponse()
  await kv.set(cacheKey, stream, { ex: 3600 }) // Cache for 1 hour

  return stream
}
```

## 🔄 v0.dev Sync

This project automatically syncs with v0.dev deployments:

1. **v0.dev changes** → Pushed to this repository
2. **This repository** → Triggers Vercel deployment
3. **Vercel deployment** → Live at your custom domain

**Important**: Local changes to v0.dev-managed files may be overwritten.

**Safe to modify locally**:
- `/app/agent/*` - AI Agent pages
- `/app/api/chat/*` - AI API routes
- `/components/agent-chat.tsx` - Agent UI
- `CLAUDE.md`, `README.md`, docs

**May be overwritten by v0.dev**:
- `/app/page.tsx` - Portfolio page
- `/app/layout.tsx` - Root layout
- `/components/project-card.tsx` - Portfolio components

## 🛠️ CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install pnpm
        run: npm install -g pnpm

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 🧪 Pre-deployment Checklist

- [ ] TypeScript errors resolved (`pnpm tsc --noEmit`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Production build successful (`pnpm build`)
- [ ] Claude Code CLI authenticated
- [ ] Environment variables configured
- [ ] Image optimization enabled (optional)
- [ ] Rate limiting configured (optional)
- [ ] Error tracking setup (optional)
- [ ] Analytics integrated (optional)

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Claude Code CLI](https://github.com/anthropics/claude-code)
- [AI SDK Documentation](https://sdk.vercel.ai)
