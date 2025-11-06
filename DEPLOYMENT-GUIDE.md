# Deployment Guide: Vercel AI Workflows

## Current Status

✅ **Completed Steps**:
1. Installed Vercel Workflow SDK (`workflow@4.0.1-beta.11`)
2. Created workflow definition (`app/workflows/chat-workflow.ts`)
3. Created workflow API endpoint (`app/api/chat/workflow/route.ts`)
4. Tested locally and confirmed working
5. Committed changes to local git repository

📝 **Commit Details**:
- **Commit**: `3d39bfd`
- **Message**: "feat: add Vercel AI Workflows integration with durable chat workflow"
- **Files changed**: 6 files, 3,877 insertions, 183 deletions

## Local Testing Results

The workflow was successfully tested locally on `http://localhost:3001`:

```bash
curl -X POST http://localhost:3001/api/chat/workflow \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Say hello in one sentence."}]}'

# Response:
{
  "response":"Hello! I'm Claude, ready to help you with your v0-agent-panel project...",
  "metadata":{
    "finishReason":"stop",
    "usage":{
      "inputTokens":28769,
      "outputTokens":29,
      "totalTokens":28798
    }
  }
}
```

✅ Workflow executed successfully with proper durable execution using `"use workflow"` and `"use step"` directives.

## Deployment Options

### Option 1: Fix Git Repository Access (Recommended)

The automated deployment failed due to repository access:

```text
Error: Git author goldmeat93@icloud.com must have access to the team eagurin's projects on Vercel
```

**Steps**:

1. **Create/Update GitHub Repository**:
   ```bash
   # If repository doesn't exist, create it on GitHub first:
   # https://github.com/new
   # Repository name: v0-agent-panel

   # Then update remote and push:
   cd /Users/laptop/dev/v0-agent-panel
   git remote set-url origin git@github.com:<your-username>/v0-agent-panel.git
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select project: `v0-agent-panel`
   - Go to Settings → Git
   - Connect your GitHub repository
   - Trigger deployment

3. **Add Team Member** (Alternative):
   - Go to [Team Settings](https://vercel.com/teams/eagurins-projects/settings/members)
   - Invite `goldmeat93@icloud.com` to the team
   - Then run: `cd /Users/laptop/dev/v0-agent-panel && vercel --prod`

### Option 2: Deploy from Vercel Dashboard

1. **Zip the Project**:
   ```bash
   cd /Users/laptop/dev/v0-agent-panel
   git archive -o ../v0-agent-panel.zip HEAD
   ```

2. **Manual Deploy**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select `v0-agent-panel` project
   - Click "Deployments" tab
   - Drag and drop the zip file or use CLI after fixing permissions

### Option 3: Use Vercel CLI with Different User

1. **Change Git Author**:
   ```bash
   cd /Users/laptop/dev/v0-agent-panel
   git config user.email "your-vercel-email@example.com"
   git commit --amend --reset-author --no-edit
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

## Verification After Deployment

### 1. Check Deployment Status

```bash
# List recent deployments
vercel ls

# Or visit:
# https://vercel.com/eagurins-projects/v0-agent-panel/deployments
```

### 2. Test Production Workflow Endpoint

```bash
# Replace <your-domain> with actual Vercel deployment URL
curl -X POST https://<your-domain>/api/chat/workflow \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ]
  }'
```

### 3. Verify Workflow in Dashboard

1. Go to [Workflows Dashboard](https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows)
2. You should see `chatWorkflow` listed
3. After testing the endpoint, check for workflow runs
4. Click on a run to see step-by-step execution details

## What to Expect After Deployment

### Workflow Dashboard

Once deployed, you'll see:

- **Workflow Name**: `chatWorkflow`
- **Workflow File**: `app/workflows/chat-workflow.ts`
- **Steps**:
  1. `generateResponse` - AI text generation
  2. `logMetrics` - Execution logging

### Execution Details

For each workflow run:

- **Duration**: Time taken for complete execution
- **Status**: Success/Failed/Running
- **Steps**: Individual step status with retry information
- **Logs**: Console output from each step
- **Metadata**: Token usage, finish reason, response length

### OpenTelemetry Integration

The workflow automatically integrates with existing OpenTelemetry setup:

- Traces appear in configured OTLP endpoint
- Workflow steps show as spans
- Full distributed tracing across API → Workflow → AI SDK

### Sentry Integration

Errors are automatically captured by Sentry:

- Workflow execution errors
- Individual step failures
- AI SDK timeout/authentication errors

## Troubleshooting

### Workflow Not Appearing in Dashboard

**Issue**: After deployment, workflow doesn't show in dashboard

**Solutions**:
1. Ensure workflow file is in `app/workflows/` directory
2. Verify workflow is exported in `app/workflows/index.ts`
3. Check build logs for compilation errors
4. Redeploy if necessary

### Workflow Execution Fails

**Issue**: API returns 500 error

**Debug Steps**:
1. Check Vercel Function logs in dashboard
2. Verify environment variables are set:
   - `ANTHROPIC_API_KEY` (production)
   - Any Claude Code SDK variables (development)
3. Test with simpler message to isolate issue
4. Check step-specific errors in workflow dashboard

### Permission/Authentication Errors

**Issue**: Claude Code SDK authentication fails

**Solutions**:
- Development: Ensure `claude login` was run
- Production: Verify `ANTHROPIC_API_KEY` environment variable
- Check model selection logic (development vs production)

## Next Steps

1. **Deploy the Workflow**:
   - Choose one of the deployment options above
   - Verify successful deployment

2. **Test in Production**:
   - Use curl or Postman to test the endpoint
   - Verify response structure matches expected format

3. **Monitor Execution**:
   - Check workflow runs in Vercel dashboard
   - Review OpenTelemetry traces
   - Monitor Sentry for errors

4. **Iterate and Improve**:
   - Add more workflow steps as needed
   - Implement parallel execution for independent tasks
   - Add conditional logic based on AI responses
   - Consider adding human-in-the-loop approval steps

## Resources

- **Project Dashboard**: https://vercel.com/eagurins-projects/v0-agent-panel
- **Workflows Dashboard**: https://vercel.com/eagurins-projects/v0-agent-panel/ai/workflows
- **Workflow Documentation**: https://useworkflow.dev
- **Vercel Docs**: https://vercel.com/docs/workflow
- **AI SDK Docs**: https://sdk.vercel.ai/

## Support

For issues or questions:

1. **Workflow SDK**: [GitHub Discussions](https://github.com/vercel/workflow/discussions)
2. **Vercel Support**: [Help Center](https://vercel.com/help)
3. **AI SDK**: [Documentation](https://sdk.vercel.ai/docs)

---

**Generated**: 2025-11-06
**Project**: v0-agent-panel
**Workflow**: chatWorkflow
**Status**: Ready for deployment
