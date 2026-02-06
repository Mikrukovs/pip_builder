import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/analytics/project/:projectId - Получить всю аналитику проекта
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ projectId: string }> }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const projectId = params.projectId;

    // Проверяем доступ к проекту (если это числовой ID)
    const numericProjectId = parseInt(projectId);
    if (!isNaN(numericProjectId)) {
      const access = await prisma.projectCollaborator.findFirst({
        where: {
          projectId: numericProjectId,
          userId: auth.userId,
        },
      });

      if (!access) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Получаем все сессии для проекта
    const sessions = await prisma.analyticsSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Последние 100 сессий
    });

    // Конвертируем BigInt в строки для JSON
    const sessionsFormatted = sessions.map((session) => ({
      ...session,
      startTime: session.startTime.toString(),
      endTime: session.endTime?.toString() || null,
    }));

    return NextResponse.json({ sessions: sessionsFormatted });
  } catch (error) {
    console.error('Get project analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
