import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PUT /api/analytics/session/:sessionId - Обновить сессию (добавить клики, время, переходы)
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ sessionId: string }> }
) {
  try {
    const params = await props.params;
    const sessionId = params.sessionId;
    const body = await request.json();
    const { clicks, screenTimes, transitions, endTime } = body;

    const updateData: any = {};
    
    if (clicks !== undefined) updateData.clicks = clicks;
    if (screenTimes !== undefined) updateData.screenTimes = screenTimes;
    if (transitions !== undefined) updateData.transitions = transitions;
    if (endTime !== undefined) updateData.endTime = BigInt(endTime);

    await prisma.analyticsSession.update({
      where: { id: sessionId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update analytics session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
