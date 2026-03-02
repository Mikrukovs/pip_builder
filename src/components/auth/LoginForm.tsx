'use client';

import { useRouter } from 'next/navigation';
import { TelegramLogin } from './TelegramLogin';

export function LoginForm() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать
          </h1>
          <p className="text-gray-600">
            Войдите через Telegram для продолжения
          </p>
        </div>

        <div className="flex justify-center">
          <TelegramLogin
            botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ''}
            onAuth={() => router.push('/')}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Нажимая кнопку входа, вы принимаете условия использования
          </p>
        </div>
      </div>
    </div>
  );
}
