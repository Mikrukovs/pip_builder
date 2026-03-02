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

    // Проверяем доступ к проекту только если это числовой ID (проект в БД)
    const numericProjectId = parseInt(projectId);
    if (!isNaN(numericProjectId) && auth) {
      // Проверяем: владелец, коллаборатор проекта или коллаборатор папки
      const project = await prisma.project.findUnique({
        where: { id: numericProjectId },
        select: { ownerId: true, folderId: true },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const isOwner = project.ownerId === auth.userId;

      const isProjectCollaborator = await prisma.projectCollaborator.findFirst({
        where: { projectId: numericProjectId, userId: auth.userId },
      });

      const isFolderCollaborator = project.folderId
        ? await prisma.folderCollaborator.findFirst({
            where: { folderId: project.folderId, userId: auth.userId },
          })
        : null;

      if (!isOwner && !isProjectCollaborator && !isFolderCollaborator) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }
    // Если projectId это shareId (строка), доступ проверять не нужно

    // Получаем все сессии для проекта
    const sessions = await prisma.analyticsSession.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Последние 100 сессий
    });

    // Конвертируем BigInt в строки для JSON
    const sessionsFormatted = sessions.map((session) => ({
      id: session.id,
      projectId: session.projectId,
      startTime: session.startTime.toString(),
      endTime: session.endTime?.toString() || null,
      userAgent: session.userAgent,
      clicks: session.clicks,
      screenTimes: session.screenTimes,
      transitions: session.transitions,
      createdAt: session.createdAt.toISOString(),
    }));

    return NextResponse.json({ sessions: sessionsFormatted });
  } catch (error) {
    console.error('Get project analytics error:', error);
    console.error('Error details:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
