import { NextRequest, NextResponse } from 'next/server';
import { chatWorkflow } from '@/app/workflows/chat-workflow';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    const result = await chatWorkflow(messages);

    return NextResponse.json({
      response: result.response,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error('[Workflow API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
