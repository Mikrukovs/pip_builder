import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { TelegramUser } from '@/types/user';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'development-secret-please-change';
const JWT_EXPIRES_IN = '7d'; // 7 дней

// Генерация JWT токена
export function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Верификация JWT токена
export function verifyToken(token: string): { userId: number } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Верификация данных от Telegram
export function verifyTelegramAuth(data: Record<string, string>, botToken: string): boolean {
  const secret = crypto.createHash('sha256').update(botToken).digest();
  const checkString = Object.keys(data)
    .filter(key => key !== 'hash')
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join('\n');
  
  const hash = crypto
    .createHmac('sha256', secret)
    .update(checkString)
    .digest('hex');
  
  return hash === data.hash;
}

// Проверка времени авторизации (не старше 24 часов)
export function checkAuthDate(authDate: number): boolean {
  const currentTime = Math.floor(Date.now() / 1000);
  const timeDiff = currentTime - authDate;
  return timeDiff <= 86400; // 24 часа
}

// Извлечение токена из заголовков
export function extractToken(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

// Middleware для проверки авторизации
export async function requireAuth(authHeader: string | null): Promise<{ userId: number } | null> {
  const token = extractToken(authHeader);
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}
