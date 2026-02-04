import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// Проверка доступа к проекту
async function checkProjectAccess(projectId: number, userId: number, minRole: 'viewer' | 'editor' | 'owner' = 'viewer') {
  const access = await prisma.projectCollaborator.findFirst({
    where: {
      projectId,
      userId,
    },
  });

  if (!access) {
    return null;
  }

  const roleHierarchy = { viewer: 0, editor: 1, owner: 2 };
  if (roleHierarchy[access.role as keyof typeof roleHierarchy] < roleHierarchy[minRole]) {
    return null;
  }

  return access;
}

// GET /api/projects/:id - Получить проект
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Проверяем доступ
    const access = await checkProjectAccess(projectId, auth.userId);
    if (!access) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        collaborators: {
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
        },
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/projects/:id - Обновить проект
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Проверяем доступ (нужен editor или owner)
    const access = await checkProjectAccess(projectId, auth.userId, 'editor');
    if (!access) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    const { name, data, folderId } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (data !== undefined) updateData.data = data;
    if (folderId !== undefined) updateData.folderId = folderId;

    const project = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
    });

    // Сохраняем в историю
    await prisma.projectHistory.create({
      data: {
        projectId,
        userId: auth.userId,
        data: project.data,
      },
    });

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/:id - Удалить проект
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Проверяем доступ (только owner может удалить)
    const access = await checkProjectAccess(projectId, auth.userId, 'owner');
    if (!access) {
      return NextResponse.json({ error: 'Project not found or access denied' }, { status: 404 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
