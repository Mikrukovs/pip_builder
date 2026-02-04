import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// DELETE /api/projects/:id/collaborators/:userId - Удалить участника
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    const userId = parseInt(params.userId);

    if (isNaN(projectId) || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Только owner может удалять участников
    const access = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: auth.userId,
        role: 'owner',
      },
    });

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Нельзя удалить owner
    const targetCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (targetCollaborator?.role === 'owner') {
      return NextResponse.json(
        { error: 'Cannot remove project owner' },
        { status: 400 }
      );
    }

    await prisma.projectCollaborator.delete({
      where: {
        id: targetCollaborator!.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id/collaborators/:userId - Изменить роль
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    const userId = parseInt(params.userId);

    if (isNaN(projectId) || isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Только owner может изменять роли
    const access = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: auth.userId,
        role: 'owner',
      },
    });

    if (!access) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { role } = body;

    if (!['viewer', 'editor', 'owner'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const collaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId,
      },
    });

    if (!collaborator) {
      return NextResponse.json({ error: 'Collaborator not found' }, { status: 404 });
    }

    const updated = await prisma.projectCollaborator.update({
      where: { id: collaborator.id },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ collaborator: updated });
  } catch (error) {
    console.error('Update collaborator role error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
