import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AgentChat from '@/components/agent-chat'

// Force dynamic rendering to prevent prerendering errors with client-side chat hooks
export const dynamic = 'force-dynamic'

export default function AgentPage() {
  return (
    <main className="flex h-screen flex-col bg-neutral-950 text-white">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-white/10 bg-neutral-900/60 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-full">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-lg font-bold">Claude Code Agent</h1>
            <p className="text-xs text-white/60">AI-powered coding assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400 sm:flex">
            <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
            Connected
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden">
        <AgentChat />
      </div>
    </main>
  )
}
