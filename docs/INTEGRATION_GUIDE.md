# Complete Integration Guide - Production AI Application

This guide walks you through integrating all components to build a production-ready AI application with Next.js 15, Vercel, Supabase, and Claude Code.

## 🎯 Goal Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  Next.js 15 + React 19 + Tailwind CSS 4 + shadcn/ui        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Authentication Layer                        │
│  Supabase Auth / Auth0 (Lock UI) + MFA                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   AI Agent Layer                            │
│  Vercel AI SDK v5 + Claude Code Provider                   │
│  + Workflow DevKit (durable workflows)                      │
│  + AI Gateway (multi-model access)                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data & Events Layer                       │
│  Supabase (PostgreSQL + Edge Functions + Real-time)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Deployment & Monitoring                     │
│  Vercel (Fluid Compute + Edge Network + Analytics)         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites Checklist

### Required Tools

```bash
# Node.js 20+
node --version  # Should be 20.x or higher

# pnpm (package manager)
npm install -g pnpm

# Claude Code CLI
npm install -g @anthropic-ai/claude-code
claude login

# Vercel CLI (optional)
npm install -g vercel

# Supabase CLI (optional)
brew install supabase/tap/supabase
```

### Required Accounts

- [ ] **Claude Pro/Max** - For Claude Code access
- [ ] **Vercel Account** - For deployment
- [ ] **Supabase Account** (optional) - For database/auth
- [ ] **Auth0 Account** (optional) - For enterprise auth

## 🚀 Step-by-Step Integration

### Phase 1: Foundation (Day 1)

#### 1.1 Project Setup

```bash
# Clone and setup
git clone https://github.com/evgenygurin/v0-agent-panel.git
cd v0-agent-panel

# Install dependencies
pnpm install

# Verify installation
pnpm dev
```

**Verify**:
- Portfolio loads at `http://localhost:3000`
- AI Agent loads at `http://localhost:3000/agent`
- No console errors

#### 1.2 Claude Code Authentication

```bash
# Authenticate
claude login

# Test in development
# Visit http://localhost:3000/agent
# Send a message to verify streaming works
```

**Verify**:
- Message sends successfully
- Response streams in real-time
- No authentication errors

### Phase 2: AI SDK Optimization (Day 2)

#### 2.1 Upgrade to Latest AI SDK

```bash
# Update to latest versions
pnpm update ai ai-sdk-provider-claude-code --latest

# Verify versions
pnpm list ai ai-sdk-provider-claude-code
```

**Expected**:
```json
{
  "ai": "^5.0.88",
  "ai-sdk-provider-claude-code": "^2.1.0"
}
```

#### 2.2 Implement Model Selection Strategy

```typescript
// lib/ai-models.ts
import { claudeCode } from 'ai-sdk-provider-claude-code'

export function selectModel(task: string, priority: 'speed' | 'quality' | 'balanced' = 'balanced') {
  if (priority === 'speed') {
    return claudeCode('haiku') // Fast, cheap
  }

  if (priority === 'quality') {
    return claudeCode('opus') // Best quality
  }

  // Analyze task complexity
  const isComplex = task.toLowerCase().includes('analyze') ||
                    task.toLowerCase().includes('synthesize') ||
                    task.toLowerCase().includes('reason')

  return isComplex ? claudeCode('opus') : claudeCode('sonnet')
}
```

**Update API Route**:

```typescript
// app/api/chat/route.ts
import { selectModel } from '@/lib/ai-models'

export async function POST(req: Request) {
  const { messages, priority } = await req.json()

  // Smart model selection
  const lastMessage = messages[messages.length - 1].content
  const model = selectModel(lastMessage, priority)

  const result = streamText({
    model,
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Phase 3: Workflow DevKit Integration (Day 3)

#### 3.1 Install Workflow DevKit

```bash
pnpm add workflow
```

#### 3.2 Create First Workflow

```typescript
// app/workflows/research-workflow.ts
import { sleep } from 'workflow'
import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export async function researchWorkflow(topic: string) {
  "use workflow"

  // Step 1: Initial research
  const initialFindings = await gatherInitialData(topic)

  // Step 2: Deep dive (wait for processing)
  await sleep('30 seconds')
  const deepAnalysis = await analyzeFindings(initialFindings)

  // Step 3: Synthesize
  const report = await synthesizeReport(topic, deepAnalysis)

  return report
}

async function gatherInitialData(topic: string) {
  "use step"

  const result = await streamText({
    model: claudeCode('sonnet'),
    prompt: `Research ${topic} and provide key points`,
  })

  return result.text
}

async function analyzeFindings(findings: string) {
  "use step"

  const result = await streamText({
    model: claudeCode('opus'), // Use best model for analysis
    prompt: `Analyze these findings in depth: ${findings}`,
  })

  return result.text
}

async function synthesizeReport(topic: string, analysis: string) {
  "use step"

  const result = await streamText({
    model: claudeCode('sonnet'),
    prompt: `Create final report on ${topic} using: ${analysis}`,
  })

  return result.text
}
```

#### 3.3 Invoke Workflow

```typescript
// app/api/workflows/research/route.ts
import { researchWorkflow } from '@/app/workflows/research-workflow'

export async function POST(req: Request) {
  const { topic } = await req.json()

  try {
    const workflowId = await researchWorkflow(topic)

    return Response.json({
      workflowId,
      status: 'running',
      message: 'Research workflow started',
    })
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

**Verify**:
- Workflow runs without errors
- Sleep pauses work correctly
- Results are returned

### Phase 4: Supabase Integration (Day 4-5)

#### 4.1 Setup Supabase Project

```bash
# Create project at https://supabase.com
# Get your credentials

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
EOF
```

#### 4.2 Install Supabase

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

#### 4.3 Create Supabase Clients

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

#### 4.4 Database Schema

```sql
-- Run in Supabase SQL Editor

-- Users table (extends auth.users)
create table user_profiles (
  id uuid references auth.users primary key,
  email text not null,
  display_name text,
  monthly_token_quota integer default 1000000,
  tokens_used_this_month integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Conversations table
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  title text,
  messages jsonb not null,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- AI usage tracking
create table ai_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  model text not null,
  tokens_used integer not null,
  cost numeric(10, 4),
  timestamp timestamptz default now()
);

-- Enable RLS
alter table user_profiles enable row level security;
alter table conversations enable row level security;
alter table ai_usage enable row level security;

-- RLS Policies
create policy "Users can view own profile"
  on user_profiles for select
  using (auth.uid() = id);

create policy "Users can manage own conversations"
  on conversations for all
  using (auth.uid() = user_id);

create policy "Users can view own usage"
  on ai_usage for select
  using (auth.uid() = user_id);
```

#### 4.5 Protect AI Routes with Auth

```typescript
// app/api/chat/route.ts
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = createClient()

  // Verify authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Check quota
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('tokens_used_this_month, monthly_token_quota')
    .eq('id', user.id)
    .single()

  if (profile.tokens_used_this_month >= profile.monthly_token_quota) {
    return new Response('Quota exceeded', { status: 429 })
  }

  // Continue with AI processing
  const { messages } = await req.json()

  const result = streamText({
    model: claudeCode('sonnet'),
    messages,
    async onFinish({ usage }) {
      // Track usage
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        model: 'sonnet',
        tokens_used: usage.totalTokens,
      })

      // Update quota
      await supabase
        .from('user_profiles')
        .update({
          tokens_used_this_month: profile.tokens_used_this_month + usage.totalTokens,
        })
        .eq('id', user.id)
    },
  })

  return result.toDataStreamResponse()
}
```

### Phase 5: Authentication UI (Day 6)

#### 5.1 Option A: Supabase Auth

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      router.push('/agent')
      router.refresh()
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login</h1>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border p-3"
          required
        />

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 p-3 text-white"
        >
          Login
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full rounded-lg border p-3"
        >
          Continue with Google
        </button>
      </form>
    </div>
  )
}
```

#### 5.2 Option B: Auth0 Lock

```bash
pnpm add @auth0/nextjs-auth0
```

```typescript
// app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0'

export const GET = handleAuth()
```

```bash
# Add to .env.local
AUTH0_SECRET=your-32-char-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### Phase 6: Vercel AI Gateway (Day 7)

#### 6.1 Setup AI Gateway

```bash
# Get token from Vercel dashboard
# Add to .env.local
VERCEL_AI_GATEWAY_TOKEN=your-token
```

#### 6.2 Update AI Route

```typescript
// app/api/chat/route.ts
import { createAnthropic } from '@ai-sdk/anthropic'

const anthropic = createAnthropic({
  baseURL: 'https://api.vercel.com/v1/ai',
  apiKey: process.env.VERCEL_AI_GATEWAY_TOKEN,
})

export async function POST(req: Request) {
  // Use AI Gateway
  const result = streamText({
    model: anthropic('claude-sonnet-4-5-20250929'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

**Benefits**:
- Access to 100+ models
- Single billing
- Automatic failover

### Phase 7: Production Deployment (Day 8)

#### 7.1 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_KEY production
vercel env add VERCEL_AI_GATEWAY_TOKEN production

# Deploy
vercel --prod
```

#### 7.2 Post-Deployment Checklist

- [ ] **DNS** - Configure custom domain
- [ ] **SSL** - Verify HTTPS works
- [ ] **Environment Variables** - All secrets set in Vercel
- [ ] **Authentication** - Test login/logout flow
- [ ] **AI Agent** - Test chat functionality
- [ ] **Database** - Verify Supabase connection
- [ ] **Monitoring** - Enable Vercel Analytics
- [ ] **Rate Limiting** - Configure Upstash Redis (optional)
- [ ] **Error Tracking** - Set up Sentry (optional)

## 📊 Complete Tech Stack

### Frontend
- ✅ **Next.js 15.2.4** - App Router
- ✅ **React 19** - Latest stable
- ✅ **Tailwind CSS 4.1.9** - Styling
- ✅ **shadcn/ui** - UI components
- ✅ **Motion** - Animations

### AI Layer
- ✅ **Vercel AI SDK 5.0.88** - Streaming
- ✅ **Claude Code 2.1.0** - AI provider
- ✅ **Workflow DevKit** - Durable workflows
- ✅ **AI Gateway** - Multi-model access

### Backend & Data
- ✅ **Supabase** - Database, Auth, Edge Functions
- ✅ **PostgreSQL** - Relational database
- ✅ **Supabase Auth** - Authentication
- ✅ **Edge Functions** - Serverless TypeScript

### Deployment & Monitoring
- ✅ **Vercel** - Hosting & deployment
- ✅ **Fluid Compute** - AI workloads
- ✅ **Edge Network** - Global CDN
- ✅ **Analytics** - Performance monitoring

## 🎯 Feature Roadmap

### ✅ Implemented (Current)
- AI Agent with streaming
- Portfolio showcase
- Basic authentication setup
- Documentation (8 guides)
- Latest AI SDK integration

### 🚧 Phase 1 (Week 1-2)
- Workflow DevKit integration
- Supabase database setup
- User authentication (Supabase or Auth0)
- Conversation history
- Usage tracking & quotas

### 🚧 Phase 2 (Week 3-4)
- AI Gateway integration
- Multi-model support
- Edge Functions (email notifications)
- Real-time features
- Advanced caching

### 🚧 Phase 3 (Week 5-6)
- OpenTelemetry monitoring
- Rate limiting with Upstash
- Advanced security (MFA)
- Payment integration (Stripe)
- Admin dashboard

## 📚 Reference Documentation

All guides are in `/docs`:

1. **[Building Effective Agents](./BUILDING_EFFECTIVE_AGENTS.md)** - Anthropic patterns
2. **[Workflow DevKit](./WORKFLOW_DEVKIT.md)** - Durable workflows
3. **[Vercel AI Gateway](./VERCEL_AI_GATEWAY.md)** - Multi-model access
4. **[Supabase Advanced](./SUPABASE_ADVANCED.md)** - Edge Functions & Triggers
5. **[Authentication](./AUTHENTICATION.md)** - Auth integration
6. **[Next.js Best Practices](./NEXTJS_BEST_PRACTICES.md)** - Advanced patterns
7. **[Vercel Production](./VERCEL_PRODUCTION.md)** - Production features
8. **[Deployment](./DEPLOYMENT.md)** - Deploy options

## 🆘 Troubleshooting

### Common Issues

**Issue**: AI responses not streaming
**Solution**: Check Claude Code authentication: `claude login`

**Issue**: Database connection fails
**Solution**: Verify Supabase environment variables in `.env.local`

**Issue**: Quota exceeded errors
**Solution**: Check `user_profiles.monthly_token_quota` in database

**Issue**: Authentication redirects fail
**Solution**: Update redirect URLs in Supabase/Auth0 dashboard

## 🎓 Learning Resources

### Official Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Supabase Docs](https://supabase.com/docs)
- [Anthropic Claude](https://www.anthropic.com/claude)

### Community
- [Vercel Discord](https://vercel.com/discord)
- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com)

## 🎉 Success Criteria

Your integration is complete when:

- [ ] Portfolio loads without errors
- [ ] AI Agent responds to messages
- [ ] Users can sign up/login
- [ ] Conversations are saved to database
- [ ] Usage is tracked per user
- [ ] Workflows run successfully
- [ ] Application is deployed to production
- [ ] Custom domain is configured
- [ ] Monitoring is active
- [ ] Documentation is up to date

---

**🚀 Ready to build production AI applications!**

*Last updated: November 2025*
