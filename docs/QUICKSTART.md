# 🚀 Quick Start Guide

Get up and running with the v0 Agent Panel in 5 minutes.

## Step 1: Clone & Install (2 min)

```bash
# Clone repository
git clone <your-repo-url>
cd v0-agent-panel

# Install dependencies
pnpm install
```

## Step 2: Setup Claude Code (2 min)

```bash
# Install CLI globally
npm install -g @anthropic-ai/claude-code

# Authenticate (opens browser)
claude login
```

**Note**: Requires Claude Pro/Max subscription or API key.

## Step 3: Run Development Server (1 min)

```bash
# Start Next.js dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🎯 What You Get

### Portfolio Page (`/`)
- Modern responsive design
- Advanced animations (Motion One)
- Project showcase cards
- Glassmorphic UI

### AI Agent Page (`/agent`)
- Real-time chat with Claude
- Streaming responses
- Context-aware (loads CLAUDE.md)
- Beautiful chat UI

## 🔧 Quick Customization

### Change Portfolio Content

Edit `app/page.tsx`:

```typescript
const projects = [
  {
    title: "Your Project",
    subtitle: "Description",
    imageSrc: "/images/your-image.webp",
    tags: ["Tag1", "Tag2"],
    // ...
  },
]
```

### Customize Agent Model

Edit `app/api/chat/route.ts`:

```typescript
// Change to faster model
const model = claudeCode('haiku')

// Or most capable model
const model = claudeCode('opus')
```

### Add New UI Component

```bash
# Browse available components
npx shadcn@latest add

# Add specific component (e.g., dialog)
npx shadcn@latest add dialog
```

## 📚 Next Steps

- **Read** [CLAUDE.md](./CLAUDE.md) for detailed architecture
- **Explore** [AGENT_EXAMPLES.md](./AGENT_EXAMPLES.md) for AI patterns
- **Deploy** using [DEPLOYMENT.md](./DEPLOYMENT.md) guide
- **Customize** portfolio and agent to your needs

## 🐛 Troubleshooting

**Port already in use?**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

**Claude Code not authenticated?**
```bash
# Check authentication status
claude --version

# Re-authenticate
claude login
```

**Build errors?**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
pnpm install
```

**TypeScript errors?**
```bash
# Check for errors
pnpm tsc --noEmit

# Check diagnostics
pnpm lint
```

## 💡 Tips

1. **Development**: Use Haiku model for faster responses
2. **Production**: Use Sonnet for balanced performance
3. **Context**: Update CLAUDE.md with project-specific info
4. **Portfolio**: Optimize images (WebP format, compress)
5. **Agent**: Customize system prompt for specialized behavior

## 🎓 Learn More

- [Next.js 15 Docs](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai)
- [Claude Code Provider](https://github.com/ben-vargas/ai-sdk-provider-claude-code)
- [Anthropic Agent Guide](https://www.anthropic.com/engineering/building-effective-agents)
- [shadcn/ui Components](https://ui.shadcn.com)

---

**Ready to ship?** Check out [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.
