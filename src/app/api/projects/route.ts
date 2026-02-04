import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/projects - Получить все проекты пользователя
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем проекты где пользователь owner или collaborator
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          // Проекты в папках пользователя
          {
            folder: {
              ownerId: auth.userId,
            },
          },
          // Проекты где пользователь collaborator
          {
            collaborators: {
              some: {
                userId: auth.userId,
              },
            },
          },
        ],
      },
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: { collaborators: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Создать проект
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, folderId, data } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Если указана папка, проверяем что она принадлежит пользователю
    if (folderId) {
      const folder = await prisma.folder.findFirst({
        where: {
          id: folderId,
          ownerId: auth.userId,
        },
      });

      if (!folder) {
        return NextResponse.json(
          { error: 'Folder not found or access denied' },
          { status: 404 }
        );
      }
    }

    const project = await prisma.project.create({
      data: {
        name: name.trim(),
        folderId: folderId || null,
        data: data || {
          screens: [],
          customComponents: [],
        },
      },
    });

    // Автоматически добавляем создателя как owner
    await prisma.projectCollaborator.create({
      data: {
        projectId: project.id,
        userId: auth.userId,
        role: 'owner',
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
