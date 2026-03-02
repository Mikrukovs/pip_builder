import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/projects - Получить все проекты пользователя (опционально с фильтром по папке)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Проверяем, есть ли фильтр по папке
    const searchParams = request.nextUrl.searchParams;
    const folderIdParam = searchParams.get('folderId');
    const folderId = folderIdParam ? parseInt(folderIdParam) : null;

    let whereClause: any = {
      OR: [
        // Проекты в папках пользователя
        {
          folder: {
            ownerId: auth.userId,
          },
        },
        // Проекты в shared папках
        {
          folder: {
            collaborators: {
              some: {
                userId: auth.userId,
              },
            },
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
    };

    // Если указан folderId, добавляем фильтр
    if (folderId) {
      whereClause.AND = [
        { folderId },
      ];
    }

    const projects = await prisma.project.findMany({
      where: whereClause,
      include: {
        folder: {
          select: {
            id: true,
            name: true,
          },
        },
        collaborators: {
          where: {
            userId: auth.userId,
          },
          select: {
            role: true,
          },
        },
        _count: {
          select: { collaborators: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Добавляем userRole к каждому проекту
    const projectsWithRole = projects.map(project => ({
      ...project,
      userRole: project.collaborators[0]?.role || null,
      collaborators: undefined, // Убираем из ответа
    }));

    return NextResponse.json({ projects: projectsWithRole });
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
