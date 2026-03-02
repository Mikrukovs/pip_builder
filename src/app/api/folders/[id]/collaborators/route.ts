import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/folders/[id]/collaborators - получить список коллабораторов папки
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await props.params;
    const folderId = parseInt(params.id);

    // Проверяем права доступа к папке
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
      include: {
        owner: true,
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

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Проверяем, что пользователь - владелец или коллаборатор
    const isOwner = folder.ownerId === decoded.userId;
    const isCollaborator = folder.collaborators.some((c) => c.userId === decoded.userId);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      owner: {
        id: folder.owner.id,
        username: folder.owner.username,
        firstName: folder.owner.firstName,
        lastName: folder.owner.lastName,
        photoUrl: folder.owner.photoUrl,
        role: 'owner',
      },
      collaborators: folder.collaborators.map((c) => ({
        id: c.id,
        userId: c.user.id,
        username: c.user.username,
        firstName: c.user.firstName,
        lastName: c.user.lastName,
        photoUrl: c.user.photoUrl,
        role: c.role,
        createdAt: c.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('Get folder collaborators error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/folders/[id]/collaborators - добавить коллаборатора
export async function POST(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const params = await props.params;
    const folderId = parseInt(params.id);
    const { username, role = 'editor' } = await request.json();

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    // Проверяем, что пользователь - владелец папки
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Only owner can add collaborators' }, { status: 403 });
    }

    // Ищем пользователя по username или telegramId
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { username: `tg_${username}` }, // Поддержка Telegram ID
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.id === decoded.userId) {
      return NextResponse.json({ error: 'Cannot add yourself' }, { status: 400 });
    }

    // Создаем или обновляем доступ
    const collaborator = await prisma.folderCollaborator.upsert({
      where: {
        folderId_userId: {
          folderId: folderId,
          userId: user.id,
        },
      },
      update: {
        role,
      },
      create: {
        folderId: folderId,
        userId: user.id,
        role,
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
      },
    });

    return NextResponse.json({
      success: true,
      collaborator: {
        id: collaborator.id,
        userId: collaborator.user.id,
        username: collaborator.user.username,
        firstName: collaborator.user.firstName,
        lastName: collaborator.user.lastName,
        photoUrl: collaborator.user.photoUrl,
        role: collaborator.role,
        createdAt: collaborator.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Add folder collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
