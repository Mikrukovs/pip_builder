import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// DELETE /api/folders/[id]/collaborators/[userId] - удалить коллаборатора
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string; userId: string }> }
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
    const userId = parseInt(params.userId);

    // Проверяем, что пользователь - владелец папки
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    if (folder.ownerId !== decoded.userId) {
      return NextResponse.json({ error: 'Only owner can remove collaborators' }, { status: 403 });
    }

    // Удаляем доступ
    await prisma.folderCollaborator.delete({
      where: {
        folderId_userId: {
          folderId,
          userId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Remove folder collaborator error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
