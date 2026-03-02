import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

// GET /api/share/list?projectId=123 - Получить share links проекта
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request.headers.get('authorization'));
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = request.nextUrl.searchParams.get('projectId');
    if (!projectId) {
      return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    }

    const numericProjectId = parseInt(projectId);
    if (isNaN(numericProjectId)) {
      return NextResponse.json({ error: 'Invalid projectId' }, { status: 400 });
    }

    const shares = await prisma.sharedProject.findMany({
      where: { projectId: numericProjectId },
      select: {
        id: true,
        accessType: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Get share links error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
