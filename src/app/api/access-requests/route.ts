import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/access-requests - Получить запросы доступа для проектов пользователя
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем все pending запросы для проектов, где пользователь owner
    const requests = await prisma.accessRequest.findMany({
      where: {
        status: 'pending',
        project: {
          collaborators: {
            some: {
              userId: auth.userId,
              role: 'owner',
            },
          },
        },
      },
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
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Get access requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/access-requests - Создать запрос доступа
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId, message } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    // Проверяем, что проект существует
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Проверяем, нет ли уже доступа
    const existingAccess = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: auth.userId,
        },
      },
    });

    if (existingAccess) {
      return NextResponse.json(
        { error: 'You already have access to this project' },
        { status: 400 }
      );
    }

    // Проверяем, нет ли уже pending запроса
    const existingRequest = await prisma.accessRequest.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: auth.userId,
        },
      },
    });

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json(
          { error: 'Access request already sent' },
          { status: 400 }
        );
      }
      
      // Если был rejected, обновляем статус на pending
      const updated = await prisma.accessRequest.update({
        where: { id: existingRequest.id },
        data: {
          status: 'pending',
          message: message || null,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({ request: updated });
    }

    // Создаём новый запрос
    const accessRequest = await prisma.accessRequest.create({
      data: {
        projectId,
        userId: auth.userId,
        message: message || null,
      },
    });

    return NextResponse.json({ request: accessRequest }, { status: 201 });
  } catch (error) {
    console.error('Create access request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
