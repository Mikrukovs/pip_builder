import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// DELETE /api/projects/[id]/collaborators/[userId] - удалить коллаборатора
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = await requireAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await context.params;
    const projectId = parseInt(id);
    const targetUserId = parseInt(userId);

    // Проверяем, что проект существует
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Проверяем, что пользователь - owner проекта
    const isOwner = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: auth.userId,
        role: 'owner',
      },
    });

    if (!isOwner) {
      return NextResponse.json({ error: 'Only owner can remove collaborators' }, { status: 403 });
    }

    // Проверяем, что удаляемый пользователь не owner
    const targetCollaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    if (targetCollaborator?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove project owner' }, { status: 400 });
    }

    // Удаляем коллаборатора
    await prisma.projectCollaborator.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: targetUserId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove project collaborator error:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
