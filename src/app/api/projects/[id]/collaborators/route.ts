import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/projects/[id]/collaborators - получить список коллабораторов проекта
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = await requireAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id);

    // Проверяем доступ к проекту
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        folder: {
          include: {
            collaborators: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Проверяем права доступа
    const isProjectCollaborator = await prisma.projectCollaborator.findFirst({
      where: {
        projectId,
        userId: auth.userId,
      },
    });
    const isFolderCollaborator = project.folderId
      ? await prisma.folderCollaborator.findFirst({
          where: {
            folderId: project.folderId,
            userId: auth.userId,
          },
        })
      : null;

    if (!isProjectCollaborator && !isFolderCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Получаем список коллабораторов
    const collaborators = await prisma.projectCollaborator.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Get project collaborators error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/projects/[id]/collaborators - добавить коллаборатора
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const auth = await requireAuth(authHeader);
    
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const projectId = parseInt(id);
    const body = await request.json();
    const { userId, role = 'editor' } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Only owner can add collaborators' }, { status: 403 });
    }

    // Проверяем, что пользователь существует
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Проверяем, что пользователь еще не добавлен
    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: 'User already added' }, { status: 400 });
    }

    // Добавляем коллаборатора
    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId,
        userId,
        role,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            photoUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ collaborator }, { status: 201 });
  } catch (error) {
    console.error('Add project collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
