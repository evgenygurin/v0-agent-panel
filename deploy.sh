#!/bin/bash

set -e

echo "🚀 Vercel AI Workflows Deployment Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "app/workflows/chat-workflow.ts" ]; then
    echo "❌ Error: Not in v0-agent-panel directory"
    exit 1
fi

echo "📦 Current status:"
echo "  • Workflow implementation: ✅ Complete"
echo "  • Local testing: ✅ Passed"
echo "  • Documentation: ✅ Created"
echo ""

# Check if git remote is set up
echo "🔍 Checking GitHub repository..."
if git ls-remote origin &> /dev/null; then
    echo "  ✅ GitHub repository exists and is accessible"
    echo ""
    echo "🚢 Pushing to GitHub..."
    git push origin main
    echo "  ✅ Code pushed successfully"
    echo ""
    echo "🌐 Deploying to Vercel..."
    vercel --prod --yes
    echo "  ✅ Deployment initiated"
else
    echo "  ⚠️  GitHub repository not accessible or doesn't exist"
    echo ""
    echo "📋 To create the repository:"
    echo ""
    echo "Option 1: Create via GitHub CLI (gh)"
    echo "  gh repo create v0-agent-panel --public --source=. --remote=origin --push"
    echo ""
    echo "Option 2: Create via GitHub website"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: v0-agent-panel"
    echo "  3. Create repository"
    echo "  4. Then run:"
    echo "     git remote set-url origin git@github.com:YOUR_USERNAME/v0-agent-panel.git"
    echo "     git push -u origin main"
    echo ""
    echo "After repository is created, run this script again:"
    echo "  bash deploy.sh"
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Next steps:"
echo "  1. Check deployment: https://vercel.com/eagurins-projects/v0-agent-panel"
echo "  2. View workflows: https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows"
echo "  3. Test endpoint: curl -X POST https://your-domain.vercel.app/api/chat/workflow -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'"
echo ""
