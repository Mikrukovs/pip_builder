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

    // Проверяем доступ к проекту
    const numericProjectId = parseInt(projectId);
    
    if (!isNaN(numericProjectId)) {
      // Числовой ID - проверяем через ProjectCollaborator
      // Только владелец (role: 'owner') может очищать аналитику
      const ownerAccess = await prisma.projectCollaborator.findFirst({
        where: {
          projectId: numericProjectId,
          userId: auth.userId,
          role: 'owner',
        },
      });

      if (!ownerAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    } else {
      // CUID (shareId) - проверяем через SharedProject
      const sharedProject = await prisma.sharedProject.findUnique({
        where: { id: projectId },
        include: {
          project: {
            include: {
              collaborators: {
                where: {
                  userId: auth.userId,
                  role: 'owner',
                },
              },
            },
          },
        },
      });

      if (!sharedProject || sharedProject.project.collaborators.length === 0) {
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
