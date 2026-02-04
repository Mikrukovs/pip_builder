import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyTelegramAuth, checkAuthDate, generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Получаем bot token из переменных окружения
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { error: 'Telegram bot token not configured' },
        { status: 500 }
      );
    }
    
    // Проверяем подлинность данных
    const isValid = verifyTelegramAuth(body, botToken);
    
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }
    
    // Проверяем, что данные не устарели
    const authDate = parseInt(body.auth_date, 10);
    if (!checkAuthDate(authDate)) {
      return NextResponse.json(
        { error: 'Authentication data expired' },
        { status: 401 }
      );
    }
    
    // Создаем или обновляем пользователя в БД
    const telegramId = BigInt(body.id);
    
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: body.username || null,
        firstName: body.first_name,
        lastName: body.last_name || null,
        photoUrl: body.photo_url || null,
        updatedAt: new Date(),
      },
      create: {
        telegramId,
        username: body.username || null,
        firstName: body.first_name,
        lastName: body.last_name || null,
        photoUrl: body.photo_url || null,
      },
    });
    
    // Генерируем JWT токен
    const token = generateToken(user.id);
    
    // Возвращаем данные пользователя и токен
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        telegramId: user.telegramId.toString(),
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
      },
    });
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
