# v0 Agent Panel - Claude Code Memory

## 🎯 Project Overview

**v0 Agent Panel** is a modern portfolio template with integrated AI assistant powered by Claude Code. Built with Next.js 15, React 19, and Vercel AI SDK v5, it combines a stunning portfolio showcase with real-time AI chat capabilities.

**Live Production**: https://v0-agent-panel-two.vercel.app

**Key Characteristics**:
- **Architecture**: Next.js 15 App Router with React Server Components
- **AI Integration**: Dual-mode (Claude Code CLI for dev, Anthropic API for prod)
- **Monitoring**: Full-stack error tracking with Sentry + Session Replay
- **Observability**: OpenTelemetry instrumentation for AI operations
- **Deployment**: Vercel with GitHub integration (auto-deploy on push)

## 🛠️ Development Commands

### Essential Commands

```bash
# Development with hot reload
pnpm dev                    # Start dev server at http://localhost:3000
# Opens portfolio at / and AI agent at /agent

# Production build (validates before deploy)
pnpm build                  # Creates optimized production build
pnpm start                  # Runs production build locally

# Code quality
pnpm lint                   # Next.js ESLint (currently disabled in config)

# Dependency management
pnpm install                # Install/update dependencies
pnpm add <package>          # Add new dependency
pnpm add -D <package>       # Add dev dependency
```

### AI Agent Development

```bash
# Authenticate with Claude Code (one-time setup)
claude login                # Uses Claude Max/Pro subscription

# Test AI endpoint locally
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test workflow endpoint
curl -X POST http://localhost:3000/api/chat/workflow \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Test workflow"}]}'
```

### Deployment Workflow

```bash
# Automated deployment (recommended)
git add .
git commit -m "feat: your changes"
git push origin main        # Triggers automatic Vercel deployment

# Manual Vercel deployment
vercel                      # Deploy to preview environment
vercel --prod               # Deploy to production

# Check deployment status
vercel ls                   # List all deployments
vercel inspect <url>        # Get deployment details
```

### Environment Setup

```bash
# Local development (no API key needed)
claude login                # Authenticate once, then just run pnpm dev

# Production environment variables (add via Vercel Dashboard or CLI)
vercel env add ANTHROPIC_API_KEY        # Required for production
vercel env add NEXT_PUBLIC_SENTRY_DSN   # Optional: error monitoring
```

## 📚 Critical Architecture Documentation

### AI Integration: Dual-Mode System

The project uses **intelligent provider switching** based on environment:

**app/api/chat/route.ts**:
```typescript
// Development: Uses Claude Code CLI (no API key needed)
const isProduction = process.env.VERCEL_ENV === 'production'

if (!isProduction) {
  // Dynamic import to avoid loading in production
  const { claudeCode } = await import('ai-sdk-provider-claude-code')
  model = claudeCode('sonnet', {
    systemPrompt: { type: 'preset', preset: 'claude_code' },
    settingSources: ['user', 'project', 'local'],
  })
}

// Production: Uses Anthropic API
if (isProduction && apiKey) {
  model = anthropic('claude-sonnet-4-5-20250929')
}
```

**Why This Architecture?**
- **Development**: Uses existing Claude subscription (no API costs)
- **Production**: Dedicated API key (stable, predictable billing)
- **Failover**: Clear error messages guide user to authenticate

### OpenTelemetry Instrumentation

**instrumentation.ts**:
```typescript
// Provides distributed tracing for AI operations
const tracer = trace.getTracer('ai-agent', '1.0.0')

export async function POST(req: Request) {
  return tracer.startActiveSpan('ai-chat-request', async (span) => {
    span.setAttribute('ai.provider', 'anthropic')
    span.setAttribute('ai.message_count', messages.length)
    // ... AI operation ...
    span.setAttribute('ai.tokens.input', usage.inputTokens)
    span.setAttribute('ai.tokens.output', usage.outputTokens)
  })
}
```

**Benefits**:
- Track AI request performance in Vercel Dashboard
- Monitor token usage and costs
- Debug latency issues with distributed traces
- Correlate errors across frontend/backend

### Sentry Error Monitoring

**next.config.mjs**:
```javascript
export default withSentryConfig(nextConfig, {
  org: 'mesoshop',
  project: 'sentry-orange-queen',
  tunnelRoute: '/monitoring',           // Bypass ad-blockers
  hideSourceMaps: true,                  // Security
  reactComponentAnnotation: { enabled: true }, // Better breadcrumbs
  automaticVercelMonitors: true,         // Cron job monitoring
})
```

**instrumentation-client.ts**:
```typescript
Sentry.init({
  replaysSessionSampleRate: 0.1,     // 10% of sessions
  replaysOnErrorSampleRate: 1.0,     // 100% when error occurs

  // Filter out browser extension errors
  beforeSend(event) {
    if (error.value?.includes('Extension context invalidated')) {
      return null
    }
    return event
  },
})
```

**What This Provides**:
- Full-stack error tracking (client + server + edge)
- Session Replay (watch user interactions leading to errors)
- Performance monitoring (Core Web Vitals)
- Custom error filtering (ignore third-party noise)

### Vercel AI Workflows (Experimental)

**app/workflows/chat-workflow.ts**:
```typescript
import { DurableWorkflow } from 'workflow'

export const chatWorkflow = new DurableWorkflow({
  name: 'chat-workflow',
  steps: [
    {
      name: 'process-message',
      run: async (context) => {
        // Durable execution with automatic retries
        const response = await anthropic.messages.create({...})
        await context.sleep(1000)  // Long-running operations
        return response
      }
    }
  ]
})
```

**Status**: Currently experimental (not in production path)
**Use Case**: Long-running AI operations with state persistence

## 🚨 Critical Workflow Rules

### NEVER Disable Type Checking in Production

**Current Configuration (next.config.mjs)**:
```javascript
typescript: {
  ignoreBuildErrors: true,  // ⚠️ Technical debt - should be removed
},
eslint: {
  ignoreDuringBuilds: true, // ⚠️ Technical debt - should be removed
}
```

**Action Required**: Before production hardening:
1. Remove `ignoreBuildErrors: true`
2. Fix all TypeScript errors
3. Enable ESLint and fix warnings
4. Add pre-commit hooks for validation

### Environment Variable Security

**✅ SAFE**:
- `ANTHROPIC_API_KEY` (server-side only, never exposed to client)
- `NEXT_PUBLIC_SENTRY_DSN` (public by design, no security risk)

**❌ NEVER COMMIT**:
- `.env.local` (gitignored)
- `.env` (gitignored)
- API keys in code

**Validation**: Check `.gitignore`:
```bash
.env*.local
.env
.vercelrc
```

### Deployment Checklist

Before deploying to production:

1. **Environment Variables Set** (Vercel Dashboard):
   - [x] `ANTHROPIC_API_KEY` (required)
   - [ ] `NEXT_PUBLIC_SENTRY_DSN` (recommended)

2. **Build Success**:
   ```bash
   pnpm build  # Must complete without errors
   ```

3. **Git Repository Clean**:
   ```bash
   git status  # Should show no uncommitted changes
   ```

4. **Vercel Project Linked**:
   ```bash
   cat .vercel/project.json  # Should exist
   ```

5. **Deploy**:
   ```bash
   git push origin main  # Automatic deployment via GitHub integration
   # OR
   vercel --prod         # Manual deployment
   ```

### Post-Deployment Verification

```bash
# Check deployment status
curl -I https://v0-agent-panel-two.vercel.app

# Test AI endpoint (should return streaming response)
curl -X POST https://v0-agent-panel-two.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Check Sentry for errors
# Visit: https://sentry.io/organizations/mesoshop/projects/sentry-orange-queen/

# Check Vercel logs
vercel logs https://v0-agent-panel-two.vercel.app
```

## 📊 Project Statistics

- **Total Files**: 71 TypeScript/TSX files
- **Components**: 30+ UI components (shadcn/ui based)
- **API Routes**: 2 (chat, workflow)
- **Pages**: 2 (portfolio, agent)
- **Bundle Size**: Optimized with code splitting
- **Build Time**: ~30-60 seconds on Vercel

## 🔧 Troubleshooting

### "Authentication error" in development

**Cause**: Claude Code CLI not authenticated
**Solution**:
```bash
claude login
```

### "Configuration error" in production

**Cause**: Missing `ANTHROPIC_API_KEY` environment variable
**Solution**:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `ANTHROPIC_API_KEY` with your API key from https://console.anthropic.com/settings/keys
3. Redeploy project

### Build fails with TypeScript errors

**Temporary Workaround**: Enabled in `next.config.mjs` with `ignoreBuildErrors: true`
**Proper Solution**:
1. Remove `ignoreBuildErrors: true`
2. Run `pnpm build` to see errors
3. Fix TypeScript errors one by one
4. Consider using `pnpm tsc --noEmit` for type checking

### Sentry errors not appearing

**Check**:
1. `NEXT_PUBLIC_SENTRY_DSN` is set in Vercel environment variables
2. DSN format: `https://[key]@[organization].ingest.sentry.io/[project-id]`
3. Check Sentry dashboard: https://sentry.io/organizations/mesoshop/

### Performance issues

**Diagnosis**:
1. Check Vercel Analytics: https://vercel.com/eagurins-projects/v0-agent-panel/analytics
2. Check Sentry Performance: https://sentry.io/organizations/mesoshop/projects/sentry-orange-queen/performance/
3. Use Lighthouse in Chrome DevTools

**Common Fixes**:
- Enable Next.js Image Optimization (currently `unoptimized: true`)
- Add React Suspense boundaries for code splitting
- Use `next/dynamic` for heavy components

## 📚 Related Documentation

**Internal**:
- @docs/INTEGRATION_GUIDE.md - 8-day implementation roadmap
- @docs/BUILDING_EFFECTIVE_AGENTS.md - Anthropic's official agent patterns
- @docs/WORKFLOW_DEVKIT.md - Durable AI workflows guide
- @docs/VERCEL_PRODUCTION.md - Vercel-specific deployment patterns
- @docs/NEXTJS_BEST_PRACTICES.md - Next.js 15 architecture guide

**External**:
- [Vercel AI SDK](https://sdk.vercel.ai/docs) - Streaming AI responses
- [Claude Code Documentation](https://docs.anthropic.com/claude-code) - CLI usage
- [Next.js 15 Docs](https://nextjs.org/docs) - App Router and RSC
- [Sentry Next.js Integration](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

## 🎯 Next Steps

### Immediate (Technical Debt)

1. **Enable Type Checking**:
   ```bash
   # Remove from next.config.mjs
   # typescript: { ignoreBuildErrors: true }
   pnpm tsc --noEmit  # Fix all errors
   ```

2. **Add Pre-commit Hooks**:
   ```bash
   pnpm add -D husky lint-staged
   npx husky install
   ```

3. **Enable Image Optimization**:
   ```javascript
   // next.config.mjs
   images: {
     unoptimized: false,  // Enable optimization
   }
   ```

### Features (Product Enhancement)

1. **Authentication**:
   - Add Supabase Auth (see @docs/AUTHENTICATION.md)
   - User-specific chat history
   - Usage quota management

2. **Advanced AI**:
   - Multi-model support (see @docs/VERCEL_AI_GATEWAY.md)
   - Conversation persistence
   - Agent tools (file operations, web search)

3. **Analytics**:
   - Track AI usage metrics
   - Monitor token costs
   - User engagement analytics

## 🤖 Claude Code Instructions

When working on this project:

1. **ALWAYS check environment**:
   - Development → use `claude login` (no API key needed)
   - Production → ensure `ANTHROPIC_API_KEY` is set in Vercel

2. **NEVER commit secrets**:
   - Check `.gitignore` before adding new env files
   - Use `vercel env add` for production secrets

3. **Follow commit conventions**:
   ```bash
   feat: add user authentication
   fix: resolve streaming timeout issue
   docs: update deployment guide
   chore: update dependencies
   ```

4. **Test before deploying**:
   ```bash
   pnpm build      # Must succeed
   pnpm start      # Test production build locally
   git push        # Deploy to production
   ```

5. **Monitor deployments**:
   - Check Vercel Dashboard for build status
   - Check Sentry for errors
   - Verify AI endpoint responds correctly

---

**This CLAUDE.md is the source of truth for this project's architecture, workflows, and critical decisions.**

Last updated: 2025-01-07
