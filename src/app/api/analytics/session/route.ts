import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/analytics/session - Создать новую сессию аналитики
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, startTime, userAgent } = body;

    if (!projectId || !startTime) {
      return NextResponse.json(
        { error: 'ProjectId and startTime are required' },
        { status: 400 }
      );
    }

    const session = await prisma.analyticsSession.create({
      data: {
        projectId,
        startTime: BigInt(startTime),
        userAgent: userAgent || null,
        clicks: [],
        screenTimes: {},
        transitions: [],
      },
    });

    return NextResponse.json({
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Create analytics session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
