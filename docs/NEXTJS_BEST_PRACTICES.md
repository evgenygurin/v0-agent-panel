# Next.js 15 Best Practices for AI Applications

This guide covers Next.js 15 best practices specifically for AI-powered applications with streaming responses.

## 🎯 App Router Architecture

### Server vs Client Components

**Default to Server Components** - Only use `"use client"` when necessary.

**Server Components** (Default):
```typescript
// app/page.tsx - NO "use client" directive
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = createClient()
  const { data } = await supabase.from('projects').select()

  return <ProjectList projects={data} />
}
```

**Client Components** (Interactive):
```typescript
// components/agent-chat.tsx
"use client"

import { useChat } from 'ai/react'

export default function AgentChat() {
  const { messages, input, handleSubmit } = useChat()
  // Interactive chat UI
}
```

**Key Rule**: Push `"use client"` as deep as possible in the component tree.

**Example - Good Practice**:
```typescript
// app/agent/page.tsx (Server Component)
import AgentHeader from '@/components/agent-header' // Server
import AgentChat from '@/components/agent-chat' // Client
import AgentSidebar from '@/components/agent-sidebar' // Server

export default function AgentPage() {
  return (
    <div>
      <AgentHeader /> {/* Server Component */}
      <div className="flex">
        <AgentSidebar /> {/* Server Component */}
        <AgentChat /> {/* Only this needs "use client" */}
      </div>
    </div>
  )
}
```

### Layout Patterns

**Root Layout** - Shared across all pages:
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI Agent Panel',
  description: 'Powered by Claude Code',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Nested Layouts** - Section-specific:
```typescript
// app/agent/layout.tsx
import { AgentProvider } from '@/components/agent-provider'

export default function AgentLayout({ children }) {
  return (
    <AgentProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </AgentProvider>
  )
}
```

### Route Groups

Organize routes without affecting URL structure:

```text
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx      # /login
│   └── register/
│       └── page.tsx      # /register
├── (dashboard)/
│   ├── agent/
│   │   └── page.tsx      # /agent
│   └── settings/
│       └── page.tsx      # /settings
└── layout.tsx
```

## 📊 Data Fetching Strategies

### Server-Side Data Fetching

**Sequential (Waterfall)**:
```typescript
// ❌ Bad: Sequential fetches
export default async function Page() {
  const user = await fetchUser()
  const conversations = await fetchConversations(user.id)
  const usage = await fetchUsage(user.id)

  return <Dashboard user={user} conversations={conversations} usage={usage} />
}
```

**Parallel (Optimized)**:
```typescript
// ✅ Good: Parallel fetches
export default async function Page() {
  const [user, conversations, usage] = await Promise.all([
    fetchUser(),
    fetchConversations(),
    fetchUsage(),
  ])

  return <Dashboard user={user} conversations={conversations} usage={usage} />
}
```

### Streaming with Suspense

```typescript
// app/agent/page.tsx
import { Suspense } from 'react'
import { ConversationHistory } from '@/components/conversation-history'
import { UsageStats } from '@/components/usage-stats'

export default function AgentPage() {
  return (
    <div>
      <Suspense fallback={<ConversationSkeleton />}>
        <ConversationHistory />
      </Suspense>

      <Suspense fallback={<UsageSkeleton />}>
        <UsageStats />
      </Suspense>
    </div>
  )
}
```

```typescript
// components/conversation-history.tsx (Server Component)
export async function ConversationHistory() {
  const conversations = await fetchConversations()

  return (
    <div>
      {conversations.map((conv) => (
        <ConversationCard key={conv.id} conversation={conv} />
      ))}
    </div>
  )
}
```

### Incremental Static Regeneration (ISR)

```typescript
// app/blog/[slug]/page.tsx
export const revalidate = 3600 // Revalidate every hour

export async function generateStaticParams() {
  const posts = await fetchAllPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function BlogPost({ params }) {
  const post = await fetchPost(params.slug)

  return <Article post={post} />
}
```

## 🔄 Streaming Responses

### AI Streaming with React Suspense

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai'
import { claudeCode } from 'ai-sdk-provider-claude-code'

export const dynamic = 'force-dynamic' // Ensure dynamic rendering

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = streamText({
    model: claudeCode('sonnet'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

```typescript
// components/agent-chat.tsx
"use client"

import { useChat } from 'ai/react'

export function AgentChat() {
  const { messages, input, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    streamMode: 'text', // Stream text as it's generated
  })

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.content}
        </div>
      ))}
    </div>
  )
}
```

### Server Actions for Mutations

```typescript
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveConversation(formData: FormData) {
  const title = formData.get('title') as string
  const messages = JSON.parse(formData.get('messages') as string)

  const supabase = createClient()
  const { data, error } = await supabase
    .from('conversations')
    .insert({ title, messages })

  if (error) throw error

  revalidatePath('/agent/history')

  return { success: true, id: data.id }
}
```

```typescript
// components/save-conversation-button.tsx
"use client"

import { saveConversation } from '@/app/actions'
import { useTransition } from 'react'

export function SaveButton({ messages }) {
  const [isPending, startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('title', 'New Conversation')
      formData.append('messages', JSON.stringify(messages))

      await saveConversation(formData)
    })
  }

  return (
    <button onClick={handleSave} disabled={isPending}>
      {isPending ? 'Saving...' : 'Save'}
    </button>
  )
}
```

## 🎨 Metadata & SEO

### Static Metadata

```typescript
// app/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AI Agent Panel',
  description: 'Chat with Claude Code AI',
  keywords: ['AI', 'chatbot', 'Claude', 'assistant'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'AI Agent Panel',
    description: 'Intelligent AI assistant',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Agent Panel',
    description: 'Intelligent AI assistant',
    images: ['/og-image.png'],
  },
}
```

### Dynamic Metadata

```typescript
// app/conversations/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const conversation = await fetchConversation(params.id)

  return {
    title: conversation.title,
    description: conversation.summary,
    openGraph: {
      title: conversation.title,
      description: conversation.summary,
    },
  }
}
```

## 🔧 Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image'

// ✅ Good: Using Next.js Image component
<Image
  src="/project-1.webp"
  alt="Project screenshot"
  width={1200}
  height={800}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>

// ❌ Bad: Using regular img tag
<img src="/project-1.webp" alt="Project" />
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Geist_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${geistMono.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('@/components/heavy-chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Disable SSR for client-only components
})

export default function Dashboard() {
  return (
    <div>
      <HeavyChart data={chartData} />
    </div>
  )
}
```

### Route Handlers Optimization

```typescript
// app/api/chat/route.ts
export const runtime = 'edge' // Use Edge Runtime for low latency
export const preferredRegion = ['iad1', 'sfo1'] // Deploy to specific regions
export const dynamic = 'force-dynamic' // Prevent caching
export const maxDuration = 300 // Maximum execution time
```

## 🛠️ Error Handling

### Error Boundaries

```typescript
// app/agent/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <p className="text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="mt-4 rounded-lg bg-primary px-4 py-2">
        Try again
      </button>
    </div>
  )
}
```

### Not Found Pages

```typescript
// app/agent/not-found.tsx
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h2 className="text-2xl font-bold">404 - Page Not Found</h2>
      <Link href="/agent" className="mt-4 text-primary">
        Go back to agent
      </Link>
    </div>
  )
}
```

### Loading States

```typescript
// app/agent/loading.tsx
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  )
}
```

## 🔒 Security Best Practices

### Content Security Policy

```typescript
// next.config.mjs
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

export default {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: cspHeader.replace(/\n/g, ''),
          },
        ],
      },
    ]
  },
}
```

### Input Validation

```typescript
// lib/validation.ts
import { z } from 'zod'

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().min(1).max(10000),
    })
  ),
})

// app/api/chat/route.ts
export async function POST(req: Request) {
  const body = await req.json()

  // Validate input
  const result = chatMessageSchema.safeParse(body)

  if (!result.success) {
    return Response.json(
      { error: 'Invalid input', details: result.error.errors },
      { status: 400 }
    )
  }

  // Continue with validated data
  const { messages } = result.data
}
```

## 📦 Environment Variables

### Type-Safe Environment Variables

```typescript
// lib/env.ts
import { z } from 'zod'

const envSchema = z.object({
  // Public variables (NEXT_PUBLIC_*)
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Private variables
  ANTHROPIC_API_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  DATABASE_URL: z.string().url().optional(),

  // System variables
  NODE_ENV: z.enum(['development', 'production', 'test']),
  VERCEL_ENV: z.enum(['production', 'preview', 'development']).optional(),
})

export const env = envSchema.parse(process.env)
```

```typescript
// Usage in components/API routes
import { env } from '@/lib/env'

console.log(env.NEXT_PUBLIC_APP_URL) // Type-safe!
```

## 📚 Additional Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [App Router Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [React Server Components](https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023#react-server-components)
- [Vercel Deployment Best Practices](https://vercel.com/docs/concepts/deployments/overview)
