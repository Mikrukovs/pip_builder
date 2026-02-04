import { NextRequest, NextResponse } from 'next/server';

// Logout просто возвращает success
// Клиент должен удалить токен из localStorage
export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Logged out successfully',
  });
}
