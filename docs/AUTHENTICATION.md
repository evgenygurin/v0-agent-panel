# Authentication Integration Guide

This guide covers adding authentication to your AI Agent panel using Auth0, Supabase, or custom solutions.

## 🎯 Why Authentication for AI Agents?

**Critical Use Cases**:
- User-specific conversation history
- Usage tracking and quota management
- Access control for premium features
- Personalized AI responses
- Multi-tenant applications

## 🔐 Option 1: Supabase Authentication (Recommended)

Supabase provides cookie-based authentication that works across all Next.js layers.

### Installation

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### Setup Supabase Client

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

### Middleware for Session Management

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && request.nextUrl.pathname.startsWith('/agent')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/agent/:path*', '/api/chat/:path*'],
}
```

### Protected AI Agent Route

```typescript
// app/api/chat/route.ts
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export const maxDuration = 300

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

  const { messages } = await req.json()

  // User-specific AI configuration
  const result = streamText({
    model: claudeCode('sonnet', {
      systemPrompt: {
        type: 'custom',
        prompt: `You are assisting user: ${user.email}.
                 User ID: ${user.id}
                 Personalize responses based on user context.`,
      },
    }),
    messages,
    async onFinish({ usage }) {
      // Track user usage
      await supabase.from('ai_usage').insert({
        user_id: user.id,
        tokens_used: usage.totalTokens,
        model: 'sonnet',
        timestamp: new Date().toISOString(),
      })
    },
  })

  return result.toDataStreamResponse()
}
```

### Login Page

```typescript
// app/login/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

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

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <form onSubmit={handleLogin} className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold">Login to AI Agent</h1>

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

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  )
}
```

### Database Schema

```sql
-- Create usage tracking table
create table ai_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  tokens_used integer not null,
  model text not null,
  timestamp timestamptz not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table ai_usage enable row level security;

-- Users can only see their own usage
create policy "Users can view own usage"
  on ai_usage for select
  using (auth.uid() = user_id);

-- Create conversation history table
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  messages jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table conversations enable row level security;

create policy "Users can manage own conversations"
  on conversations for all
  using (auth.uid() = user_id);
```

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
```

## 🔑 Option 2: Auth0 Integration

Auth0 provides enterprise-grade authentication with extensive features.

### Installation

```bash
pnpm add @auth0/nextjs-auth0
```

### Setup Auth0

```typescript
// app/api/auth/[auth0]/route.ts
import { handleAuth } from '@auth0/nextjs-auth0'

export const GET = handleAuth()
```

### Environment Variables

```bash
# .env.local
AUTH0_SECRET=your-32-char-secret
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```

### Protected API Route

```typescript
// app/api/chat/route.ts
import { getSession } from '@auth0/nextjs-auth0'
import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export const maxDuration = 300

export async function POST(req: Request) {
  const session = await getSession()

  if (!session || !session.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { messages } = await req.json()

  const result = streamText({
    model: claudeCode('sonnet', {
      systemPrompt: {
        type: 'custom',
        prompt: `You are assisting ${session.user.name} (${session.user.email}).`,
      },
    }),
    messages,
  })

  return result.toDataStreamResponse()
}
```

### Client-Side Auth

```typescript
// components/agent-header.tsx
'use client'

import { useUser } from '@auth0/nextjs-auth0/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function AgentHeader() {
  const { user, isLoading } = useUser()

  if (isLoading) return <div>Loading...</div>

  return (
    <header className="flex items-center justify-between p-4">
      <h1>AI Agent</h1>

      {user ? (
        <div className="flex items-center gap-4">
          <span>Welcome, {user.name}</span>
          <Button asChild>
            <Link href="/api/auth/logout">Logout</Link>
          </Button>
        </div>
      ) : (
        <Button asChild>
          <Link href="/api/auth/login">Login</Link>
        </Button>
      )}
    </header>
  )
}
```

### Middleware Protection

```typescript
// middleware.ts
import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge'

export default withMiddlewareAuthRequired()

export const config = {
  matcher: ['/agent/:path*', '/api/chat/:path*'],
}
```

## 🛡️ Option 3: Custom JWT Authentication

For full control, implement custom JWT authentication.

### Installation

```bash
pnpm add jose bcryptjs
```

### Authentication Utilities

```typescript
// lib/auth.ts
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export async function createToken(userId: string) {
  return await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret)
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export async function getUser() {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')

  if (!token) return null

  const payload = await verifyToken(token.value)
  if (!payload) return null

  // Fetch user from database
  const user = await db.user.findUnique({
    where: { id: payload.userId as string },
  })

  return user
}
```

### Login API Route

```typescript
// app/api/auth/login/route.ts
import { createToken } from '@/lib/auth'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { email, password } = await req.json()

  // Fetch user from database
  const user = await db.user.findUnique({ where: { email } })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Create JWT token
  const token = await createToken(user.id)

  // Set cookie
  const cookieStore = cookies()
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  return Response.json({ success: true })
}
```

### Protected Route

```typescript
// app/api/chat/route.ts
import { getUser } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getUser()

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Continue with AI processing
}
```

## 📊 User-Specific Features

### Conversation History

```typescript
// lib/conversation-history.ts
import { createClient } from '@/lib/supabase/server'

export async function saveConversation(userId: string, messages: any[]) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      messages,
    })
    .select()
    .single()

  return { data, error }
}

export async function getConversations(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return { data, error }
}
```

### Usage Tracking & Quotas

```typescript
// lib/usage.ts
export async function checkQuota(userId: string): Promise<boolean> {
  const supabase = createClient()

  // Get usage for current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data } = await supabase
    .from('ai_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth.toISOString())

  const totalTokens = data?.reduce((sum, row) => sum + row.tokens_used, 0) || 0

  // Example: 1M tokens per month limit
  const MONTHLY_LIMIT = 1_000_000

  return totalTokens < MONTHLY_LIMIT
}

// In API route
const hasQuota = await checkQuota(user.id)
if (!hasQuota) {
  return new Response('Monthly quota exceeded', { status: 429 })
}
```

## 🔒 Security Best Practices

### CSRF Protection

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check origin for state-changing operations
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const origin = request.headers.get('origin')
    const host = request.headers.get('host')

    if (!origin || new URL(origin).host !== host) {
      return new Response('Forbidden', { status: 403 })
    }
  }

  return NextResponse.next()
}
```

### Rate Limiting per User

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const userRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  prefix: 'user-ratelimit',
})

// In API route
const { success } = await userRatelimit.limit(user.id)
if (!success) {
  return new Response('Too many requests', { status: 429 })
}
```

## 📚 Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Auth0 Next.js Quickstart](https://auth0.com/docs/quickstart/webapp/nextjs)
- [Next.js Authentication Patterns](https://nextjs.org/docs/app/building-your-application/authentication)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
