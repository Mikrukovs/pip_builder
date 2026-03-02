import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// PUT /api/access-requests/:id - Одобрить или отклонить запрос
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const requestId = parseInt(params.id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    const body = await request.json();
    const { action } = body; // 'approve' or 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Получаем запрос
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
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

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Проверяем, что пользователь — owner проекта
    if (accessRequest.project.collaborators.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (action === 'approve') {
      // Добавляем пользователя как editor
      await prisma.projectCollaborator.create({
        data: {
          projectId: accessRequest.projectId,
          userId: accessRequest.userId,
          role: 'editor',
        },
      });

      // Обновляем статус запроса
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'approved' },
      });

      return NextResponse.json({ success: true, message: 'Access granted' });
    } else {
      // Отклоняем запрос
      await prisma.accessRequest.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });

      return NextResponse.json({ success: true, message: 'Access denied' });
    }
  } catch (error) {
    console.error('Update access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/access-requests/:id - Удалить запрос
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await props.params;
    const requestId = parseInt(params.id);

    if (isNaN(requestId)) {
      return NextResponse.json({ error: 'Invalid request ID' }, { status: 400 });
    }

    // Получаем запрос
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: requestId },
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

    if (!accessRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Проверяем, что пользователь — owner проекта
    if (accessRequest.project.collaborators.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Удаляем запрос
    await prisma.accessRequest.delete({
      where: { id: requestId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
