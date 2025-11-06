# v0 Agent Panel - Portfolio + AI Assistant

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/lenxisms-projects/v0-portfolio-template-design)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/0INS7N2xMca)
[![AI SDK](https://img.shields.io/badge/AI%20SDK-v5%20beta-blue?style=for-the-badge)](https://sdk.vercel.ai)

## 🎯 Overview

Modern portfolio template with integrated **Claude Code AI Agent** built using:

- **Next.js 15** (App Router + React Server Components)
- **React 19** (latest stable)
- **Tailwind CSS v4** (PostCSS-based)
- **Vercel AI SDK v5** (streaming chat with Claude Code)
- **Motion One** (smooth animations)
- **shadcn/ui** (beautiful UI components)

## ✨ Features

- 📱 Responsive portfolio showcase with advanced animations
- 🤖 **AI Agent powered by Claude Code** (accessible at `/agent`)
- 💬 Real-time streaming chat interface
- 🎨 Modern glassmorphic design with gradient borders
- ⚡ Optimized for performance (React Server Components)
- 🔄 Auto-sync with v0.dev deployments

## 🚀 Quick Start

### Prerequisites

```bash
# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code

# Authenticate with Claude
claude login
```

**Note**: Requires Claude Pro/Max subscription or Anthropic API key.

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd v0-agent-panel

# Install dependencies (uses pnpm)
pnpm install

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the portfolio.
Open [http://localhost:3000/agent](http://localhost:3000/agent) to try the AI agent.

## 🤖 AI Agent

The integrated Claude Code agent provides AI-powered assistance directly in your browser.

**Features**:
- Real-time streaming responses
- Context-aware (loads CLAUDE.md automatically)
- Multiple model options (Opus, Sonnet, Haiku)
- Built-in tool support (file operations, bash, web search)

**Configuration**: Edit `app/api/chat/route.ts` to customize model and settings.

See [CLAUDE.md](./CLAUDE.md) for detailed documentation.

## 📚 Documentation

### Core Documentation
- **[CLAUDE.md](./CLAUDE.md)** - Complete technical reference
- **[Quick Start Guide](./docs/QUICKSTART.md)** - 5-minute setup

### AI Development
- **[Agent Examples](./docs/AGENT_EXAMPLES.md)** - AI patterns from Anthropic's guide
  - Prompt chaining, routing, parallelization
  - Multi-agent orchestration
  - Structured outputs with Zod

### Production Deployment
- **[Deployment Guide](./docs/DEPLOYMENT.md)** - General deployment (Docker, Railway, Netlify)
- **[Vercel Production Guide](./docs/VERCEL_PRODUCTION.md)** ⭐ **NEW**
  - Fluid Compute for AI workloads
  - Edge vs Node.js runtime selection
  - Environment variables best practices
  - Monitoring, logging, and observability
  - Rate limiting and security features
  - Cost optimization strategies

### Authentication & Security
- **[Authentication Guide](./docs/AUTHENTICATION.md)** ⭐ **NEW**
  - Supabase Auth integration (recommended)
  - Auth0 setup for enterprise
  - Custom JWT authentication
  - User-specific conversation history
  - Usage tracking and quota management

### Next.js Best Practices
- **[Next.js 15 Guide](./docs/NEXTJS_BEST_PRACTICES.md)** ⭐ **NEW**
  - App Router architecture patterns
  - Server vs Client Components strategy
  - Data fetching and caching
  - Streaming with React Suspense
  - Performance optimization techniques
  - Security and error handling

### Reference
- **[Project Summary](./docs/PROJECT_SUMMARY.md)** - Complete feature overview
- **[Project Structure](./docs/PROJECT_STRUCTURE.txt)** - File organization

## 📁 Project Structure

```text
app/
├── page.tsx              # Portfolio home page
├── agent/page.tsx        # AI Agent interface
├── api/chat/route.ts     # AI streaming endpoint
└── layout.tsx            # Root layout

components/
├── agent-chat.tsx        # Chat UI component
├── animated-heading.tsx  # Text animations
├── reveal-on-view.tsx    # Scroll animations
├── project-card.tsx      # Portfolio cards
└── ui/                   # shadcn/ui components
```

## 🎨 Customization

### Change Portfolio Content

Edit `app/page.tsx` to modify projects, text, and layout.

### Customize AI Agent

Edit `app/api/chat/route.ts`:

```typescript
// Change model
const model = claudeCode('haiku') // or 'opus', 'sonnet'

// Add custom system prompt
const model = claudeCode('sonnet', {
  systemPrompt: {
    type: 'custom',
    prompt: 'Your custom instructions...',
  },
})
```

### Add UI Components

```bash
# Browse shadcn/ui components
npx shadcn@latest add

# Add specific component
npx shadcn@latest add dialog
```

## 🔧 Development

This repository stays in sync with [v0.dev](https://v0.dev) deployments.

**Workflow**:
1. Design and iterate on [v0.dev](https://v0.dev/chat/projects/0INS7N2xMca)
2. Deploy from v0.dev interface
3. Changes automatically push to this repository
4. Vercel deploys from this repository

**Local changes** not managed by v0.dev:
- AI Agent features (`/agent`, `/api/chat`)
- Custom components in `/components`
- New routes and pages
- Configuration files

## Deployment

Your project is live at:

**[https://vercel.com/lenxisms-projects/v0-portfolio-template-design](https://vercel.com/lenxisms-projects/v0-portfolio-template-design)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/0INS7N2xMca](https://v0.dev/chat/projects/0INS7N2xMca)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
