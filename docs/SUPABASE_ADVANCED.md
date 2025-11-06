# Supabase Advanced Features Guide

This guide covers advanced Supabase features for building event-driven AI applications with Edge Functions, Database Triggers, and real-time capabilities.

## 🚀 Edge Functions

Supabase Edge Functions are server-side TypeScript functions running on Deno Deploy globally distributed edge network.

### Why Edge Functions?

- **Global distribution**: Low latency worldwide
- **Event-driven**: Trigger on database changes
- **Full TypeScript support**: Type-safe with Deno
- **Direct database access**: No API roundtrips
- **Integrated auth**: Automatic JWT verification

### Setup

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Create new Edge Function
supabase functions new send-ai-notification
```

### Basic Edge Function Structure

```typescript
// supabase/functions/send-ai-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Parse request
    const { conversationId, userId } = await req.json()

    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch conversation
    const { data: conversation } = await supabaseClient
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single()

    // Your logic here
    console.log('Processing conversation:', conversation)

    return new Response(
      JSON.stringify({ success: true, conversationId }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Deploy Edge Function

```bash
# Deploy single function
supabase functions deploy send-ai-notification

# Deploy all functions
supabase functions deploy

# Deploy with secrets
supabase secrets set SMTP_PASSWORD=your-password
supabase functions deploy send-ai-notification
```

### Invoke from Next.js

```typescript
// app/api/trigger-notification/route.ts
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { conversationId, userId } = await req.json()

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // Use service key for Edge Functions
  )

  const { data, error } = await supabase.functions.invoke('send-ai-notification', {
    body: { conversationId, userId },
  })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true, data })
}
```

## 🔔 Database Triggers & Webhooks

Automatically execute Edge Functions when database rows change.

### Create Database Trigger

```sql
-- Create function to call Edge Function
create or replace function trigger_ai_notification()
returns trigger
language plpgsql
security definer
as $$
declare
  payload json;
begin
  -- Build JSON payload
  payload := json_build_object(
    'conversation_id', NEW.id,
    'user_id', NEW.user_id,
    'created_at', NEW.created_at
  );

  -- Call Edge Function via pg_net
  perform
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-ai-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := payload::jsonb
    );

  return NEW;
end;
$$;

-- Attach trigger to conversations table
create trigger on_conversation_created
  after insert on conversations
  for each row
  execute function trigger_ai_notification();
```

### Alternative: Supabase Webhooks (Simpler Setup)

**Via Dashboard**:
1. Database → Webhooks
2. Create new webhook
3. Select table: `conversations`
4. Select events: `INSERT`, `UPDATE`
5. Webhook URL: `https://your-project.supabase.co/functions/v1/send-ai-notification`
6. Add headers: `Authorization: Bearer YOUR_SERVICE_KEY`

**Webhook Payload**:
```json
{
  "type": "INSERT",
  "table": "conversations",
  "record": {
    "id": "uuid",
    "user_id": "uuid",
    "messages": [{...}],
    "created_at": "2025-01-15T10:30:00Z"
  },
  "schema": "public",
  "old_record": null
}
```

### Handle Webhook in Edge Function

```typescript
// supabase/functions/send-ai-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { type, table, record, old_record } = await req.json()

  // Verify webhook signature (recommended)
  const signature = req.headers.get('x-supabase-signature')
  if (!verifySignature(signature, await req.text())) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Handle different events
  switch (type) {
    case 'INSERT':
      await handleNewConversation(record)
      break
    case 'UPDATE':
      await handleConversationUpdate(record, old_record)
      break
    case 'DELETE':
      await handleConversationDelete(old_record)
      break
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function handleNewConversation(conversation: any) {
  // Send email notification
  // Log to analytics
  // Trigger AI summary generation
  console.log('New conversation created:', conversation.id)
}
```

## 📧 Email Notifications via Edge Functions

Send emails when AI conversations are created or updated.

### Setup SMTP (AWS SES Recommended)

```bash
# Set secrets in Supabase
supabase secrets set SMTP_HOST=email-smtp.us-east-1.amazonaws.com
supabase secrets set SMTP_PORT=2587  # NOT 25, 465, or 587 (Deno Deploy restriction)
supabase secrets set SMTP_USER=your-smtp-user
supabase secrets set SMTP_PASSWORD=your-smtp-password
supabase secrets set SMTP_FROM=noreply@yourdomain.com
```

### Email Edge Function

```typescript
// supabase/functions/send-email-notification/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

serve(async (req) => {
  try {
    const { to, subject, conversationId, summary } = await req.json()

    // Configure SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: Deno.env.get('SMTP_HOST')!,
        port: parseInt(Deno.env.get('SMTP_PORT')!),
        tls: true,
        auth: {
          username: Deno.env.get('SMTP_USER')!,
          password: Deno.env.get('SMTP_PASSWORD')!,
        },
      },
    })

    // Send email
    await client.send({
      from: Deno.env.get('SMTP_FROM')!,
      to: to,
      subject: subject,
      content: `
        <h2>New AI Conversation</h2>
        <p><strong>Conversation ID:</strong> ${conversationId}</p>
        <p><strong>Summary:</strong> ${summary}</p>
        <p><a href="https://your-app.com/conversations/${conversationId}">View Conversation</a></p>
      `,
      html: true,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Email error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

### Trigger Email from Conversation Insert

```sql
-- Database trigger to send email on new conversation
create or replace function send_conversation_email()
returns trigger
language plpgsql
security definer
as $$
declare
  user_email text;
  conversation_summary text;
begin
  -- Get user email
  select email into user_email
  from auth.users
  where id = NEW.user_id;

  -- Generate summary (first message content)
  select messages->0->>'content' into conversation_summary
  from conversations
  where id = NEW.id;

  -- Call email Edge Function
  perform
    net.http_post(
      url := 'https://your-project.supabase.co/functions/v1/send-email-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_role_key')
      ),
      body := jsonb_build_object(
        'to', user_email,
        'subject', 'New AI Conversation Created',
        'conversationId', NEW.id,
        'summary', conversation_summary
      )
    );

  return NEW;
end;
$$;

create trigger on_conversation_email
  after insert on conversations
  for each row
  execute function send_conversation_email();
```

## 🔄 Real-time Subscriptions

Subscribe to database changes in real-time for live updates.

### Setup Real-time Policy

```sql
-- Enable real-time for conversations table
alter publication supabase_realtime add table conversations;

-- RLS policy for real-time
create policy "Users can subscribe to own conversations"
  on conversations for select
  using (auth.uid() = user_id);
```

### Subscribe in Next.js

```typescript
// components/live-conversations.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function LiveConversations() {
  const [conversations, setConversations] = useState([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchConversations = async () => {
      const { data } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })

      setConversations(data || [])
    }

    fetchConversations()

    // Subscribe to changes
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('New conversation:', payload.new)
          setConversations((prev) => [payload.new, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Updated conversation:', payload.new)
          setConversations((prev) =>
            prev.map((conv) =>
              conv.id === payload.new.id ? payload.new : conv
            )
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('Deleted conversation:', payload.old)
          setConversations((prev) =>
            prev.filter((conv) => conv.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div>
      <h2>Live Conversations ({conversations.length})</h2>
      {conversations.map((conv) => (
        <ConversationCard key={conv.id} conversation={conv} />
      ))}
    </div>
  )
}
```

## 🎯 AI-Powered Use Cases

### 1. Auto-Generate Conversation Summaries

```typescript
// supabase/functions/generate-summary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { conversationId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Fetch conversation
  const { data: conversation } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  // Call AI API to generate summary
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `Summarize this conversation in 2-3 sentences:\n\n${JSON.stringify(conversation.messages)}`,
        },
      ],
    }),
  })

  const aiResult = await response.json()
  const summary = aiResult.content[0].text

  // Update conversation with summary
  await supabase
    .from('conversations')
    .update({ summary })
    .eq('id', conversationId)

  return new Response(JSON.stringify({ success: true, summary }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

### 2. Usage Quota Enforcement

```typescript
// supabase/functions/check-quota/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get current month usage
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { data: usage } = await supabase
    .from('ai_usage')
    .select('tokens_used')
    .eq('user_id', userId)
    .gte('timestamp', startOfMonth.toISOString())

  const totalTokens = usage?.reduce((sum, row) => sum + row.tokens_used, 0) || 0

  // Check quota
  const MONTHLY_LIMIT = 1_000_000 // 1M tokens
  const hasQuota = totalTokens < MONTHLY_LIMIT

  return new Response(
    JSON.stringify({
      hasQuota,
      tokensUsed: totalTokens,
      tokensRemaining: MONTHLY_LIMIT - totalTokens,
      limit: MONTHLY_LIMIT,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

### 3. Conversation Cleanup (Scheduled)

```typescript
// supabase/functions/cleanup-old-conversations/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Delete conversations older than 90 days
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const { data: deleted } = await supabase
    .from('conversations')
    .delete()
    .lt('created_at', ninetyDaysAgo.toISOString())
    .select('id')

  return new Response(
    JSON.stringify({
      success: true,
      deletedCount: deleted?.length || 0,
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

**Schedule with Supabase Cron**:
```sql
-- Run cleanup daily at 2 AM UTC
select cron.schedule(
  'cleanup-old-conversations',
  '0 2 * * *', -- Cron expression
  $$
  select net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/cleanup-old-conversations',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    )
  ) as request_id;
  $$
);
```

## 🔒 Security Best Practices

### Environment Variables

```bash
# Required secrets for Edge Functions
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-your-key

# Email secrets
supabase secrets set SMTP_HOST=email-smtp.us-east-1.amazonaws.com
supabase secrets set SMTP_PORT=2587
supabase secrets set SMTP_USER=your-smtp-user
supabase secrets set SMTP_PASSWORD=your-smtp-password

# List all secrets
supabase secrets list
```

### Verify JWT in Edge Functions

```typescript
// lib/auth.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function verifyUser(req: Request) {
  const authHeader = req.headers.get('Authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing or invalid authorization header')
  }

  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)

  if (error || !user) {
    throw new Error('Invalid token')
  }

  return user
}
```

## 📊 Monitoring & Debugging

### View Edge Function Logs

```bash
# Tail logs for specific function
supabase functions logs send-ai-notification --tail

# View recent logs
supabase functions logs send-ai-notification --limit 50
```

### Log Structured Data

```typescript
// Good practice: Structured logging
console.log(JSON.stringify({
  level: 'info',
  timestamp: new Date().toISOString(),
  function: 'send-ai-notification',
  conversationId: conversation.id,
  userId: user.id,
  duration: Date.now() - startTime,
}))
```

## 🚀 Production Deployment Checklist

- [ ] Set all required secrets via `supabase secrets set`
- [ ] Configure SMTP with non-restricted ports (2587 for AWS SES)
- [ ] Set up database triggers or webhooks
- [ ] Enable real-time for required tables
- [ ] Configure RLS policies for security
- [ ] Test Edge Functions in staging environment
- [ ] Set up monitoring and alerting
- [ ] Deploy functions: `supabase functions deploy`
- [ ] Verify function invocations work
- [ ] Test email delivery
- [ ] Monitor error logs for first 24 hours

## 📚 Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Real-time Subscriptions](https://supabase.com/docs/guides/realtime)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
