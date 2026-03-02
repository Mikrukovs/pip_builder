import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// DELETE /api/analytics/project/:projectId/clear - Очистить всю аналитику проекта
export async function DELETE(
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
    if (!isNaN(numericProjectId)) {
      const project = await prisma.project.findUnique({
        where: { id: numericProjectId },
        select: { ownerId: true },
      });

      if (!project) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      // Только владелец проекта может очищать аналитику
      if (project.ownerId !== auth.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Удаляем все сессии для проекта
    const deleted = await prisma.analyticsSession.deleteMany({
      where: { projectId },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
    });
  } catch (error) {
    console.error('Clear project analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
