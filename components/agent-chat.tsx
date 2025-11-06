"use client"

import { useChat } from '@ai-sdk/react'
import { Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEffect, useRef } from 'react'

export default function AgentChat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
    onError: (error) => {
      console.error('Chat error:', error)
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-16 w-16 text-white/20" />
            <h2 className="mb-2 text-2xl font-bold">Claude Code Agent</h2>
            <p className="max-w-md text-white/60">
              Start a conversation with Claude. I can help you write code, debug issues, and answer technical questions.
            </p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    'flex max-w-[80%] gap-3',
                    message.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      message.role === 'user'
                        ? 'bg-white/10'
                        : 'bg-gradient-to-br from-purple-500 to-blue-500'
                    )}
                  >
                    {message.role === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-3',
                      message.role === 'user'
                        ? 'bg-white/10 backdrop-blur-sm'
                        : 'bg-white/5 backdrop-blur-sm'
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60 [animation-delay:-0.3s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60 [animation-delay:-0.15s]" />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-white/60" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            <strong>Error:</strong> {error.message}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-white/10 bg-neutral-900/60 p-4 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            value={input}
            onChange={handleInputChange}
            placeholder="Ask Claude anything..."
            disabled={isLoading}
            className={cn(
              'flex-1 rounded-full bg-white/5 px-4 py-3 text-sm outline-none',
              'placeholder:text-white/40',
              'focus:bg-white/10 focus:ring-2 focus:ring-white/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'transition-all'
            )}
          />
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-12 w-12 shrink-0 rounded-full"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
