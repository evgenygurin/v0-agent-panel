"use client"

import Link from "next/link"
import { ArrowRight, Bot, Moon, Sun } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import DotGridShader from "@/components/DotGridShader"

import AnimatedHeading from "@/components/animated-heading"
import RevealOnView from "@/components/reveal-on-view"

interface AgentChatProps {
  theme?: 'light' | 'dark'
  chatColor?: 'purple' | 'blue' | 'green'
}

// Dynamically import AgentChat without SSR to prevent hydration errors
const AgentChat = dynamic<AgentChatProps>(() => import("@/components/agent-chat"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Bot className="h-12 w-12 animate-pulse text-white/20" />
        <p className="text-sm text-white/60">Loading chat...</p>
      </div>
    </div>
  ),
})

export default function Page() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [chatColor, setChatColor] = useState<'purple' | 'blue' | 'green'>('purple')

  return (
    <main className="bg-neutral-950 text-white">
      {/* HERO: three-column layout with sticky sidebars */}
      <section className="px-4 pt-4 pb-16 lg:pb-4">
        <div className="grid h-full grid-cols-1 gap-4 lg:grid-cols-[420px_1fr_420px]">
          {/* LEFT: sticky and full height, no cut off */}
          <aside className="lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)]">
            <RevealOnView
              as="div"
              intensity="hero"
              className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-6 sm:p-8 shadow-[0_10px_60px_-10px_rgba(0,0,0,0.6)]"
              staggerChildren
            >
              {/* Texture background */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                <DotGridShader />
              </div>
              <div>
                {/* Wordmark */}
                <div className="mb-8 flex items-center gap-2">
                  <div className="text-2xl font-extrabold tracking-tight">brandon</div>
                  <div className="h-2 w-2 rounded-full bg-white/60" aria-hidden="true" />
                </div>

                {/* Headline with intro blur effect */}
                <AnimatedHeading
                  className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl"
                  lines={["I design products", "that people love"]}
                />

                <p className="mt-4 max-w-[42ch] text-lg text-white/70">
                  Brandon is a product designer based in New York. He helps early‑stage startups ship beautiful, usable
                  software fast.
                </p>

                {/* CTAs */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild size="lg" className="rounded-full">
                    <Link href="mailto:brandon@portfolio.dev">
                      Hire me
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="rounded-full border-white/10 bg-white/10">
                    <Link href="/agent">
                      <Bot className="mr-2 h-4 w-4" />
                      Try AI Agent
                    </Link>
                  </Button>
                </div>

                {/* Trusted by */}
                <div className="mt-10">
                  <p className="mb-3 text-xs font-semibold tracking-widest text-white/50">COMPANIES I'VE WORKED WITH</p>
                  <ul className="grid grid-cols-2 gap-x-6 gap-y-3 text-2xl font-black text-white/25 sm:grid-cols-3">
                    <li>Space Y</li>
                    <li>Melta</li>
                    <li>ClosedAI</li>
                    <li>Booble</li>
                    <li>Lentflix</li>
                    <li>Xwitter</li>
                  </ul>
                </div>

                {/* Theme & Color Controls */}
                <div className="mt-10 space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-widest text-white/50">THEME</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="flex-1 rounded-full text-xs"
                      >
                        <Moon className="mr-1 h-3 w-3" />
                        Dark
                      </Button>
                      <Button
                        size="sm"
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="flex-1 rounded-full text-xs"
                      >
                        <Sun className="mr-1 h-3 w-3" />
                        Light
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold tracking-widest text-white/50">CHAT COLOR</p>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant={chatColor === 'purple' ? 'default' : 'outline'}
                        onClick={() => setChatColor('purple')}
                        className="rounded-full bg-purple-600 hover:bg-purple-700"
                      >
                        Purple
                      </Button>
                      <Button
                        size="sm"
                        variant={chatColor === 'blue' ? 'default' : 'outline'}
                        onClick={() => setChatColor('blue')}
                        className="rounded-full bg-blue-600 hover:bg-blue-700"
                      >
                        Blue
                      </Button>
                      <Button
                        size="sm"
                        variant={chatColor === 'green' ? 'default' : 'outline'}
                        onClick={() => setChatColor('green')}
                        className="rounded-full bg-green-600 hover:bg-green-700"
                      >
                        Green
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnView>
          </aside>

          {/* CENTER: Chat window */}
          <div className="lg:h-[calc(100svh-2rem)]">
            <RevealOnView
              as="div"
              intensity="soft"
              className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/50 shadow-[0_10px_60px_-10px_rgba(0,0,0,0.6)]"
            >
              {/* Texture background */}
              <div className="pointer-events-none absolute inset-0 z-0 opacity-[0.15]">
                <DotGridShader />
              </div>
              <div className="relative z-10 flex h-full flex-col">
                <AgentChat theme={theme} chatColor={chatColor} />
              </div>
            </RevealOnView>
          </div>

          {/* RIGHT: Sidebar */}
          <aside className="hidden lg:block lg:sticky lg:top-4 lg:h-[calc(100svh-2rem)]">
            <RevealOnView
              as="div"
              intensity="soft"
              className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/50 p-6 sm:p-8 shadow-[0_10px_60px_-10px_rgba(0,0,0,0.6)]"
            >
              {/* Texture background */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
                <DotGridShader />
              </div>

              <div className="relative z-10">
                <h2 className="mb-4 text-2xl font-bold">Features</h2>

                <div className="space-y-4">
                  <div className="rounded-3xl bg-black/50 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-purple-400" />
                      <h3 className="font-semibold">AI-Powered</h3>
                    </div>
                    <p className="text-sm text-white/70">
                      Chat with Claude, powered by Anthropic's latest AI models
                    </p>
                  </div>

                  <div className="rounded-3xl bg-black/50 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 flex items-center gap-2">
                      <ArrowRight className="h-5 w-5 text-blue-400" />
                      <h3 className="font-semibold">Real-time</h3>
                    </div>
                    <p className="text-sm text-white/70">
                      Get instant responses with streaming support
                    </p>
                  </div>

                  <div className="rounded-3xl bg-black/50 p-4 backdrop-blur-sm border border-white/10">
                    <div className="mb-2 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-green-400" />
                      <h3 className="font-semibold">Context-Aware</h3>
                    </div>
                    <p className="text-sm text-white/70">
                      Maintains conversation history for better responses
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-xs font-semibold tracking-widest text-white/50">TECH STACK</p>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>• Next.js 15</li>
                    <li>• Vercel AI SDK</li>
                    <li>• OpenTelemetry</li>
                    <li>• Sentry Monitoring</li>
                  </ul>
                </div>
              </div>
            </RevealOnView>
          </aside>
        </div>
      </section>
    </main>
  )
}
