'use client';

import { useRouter } from 'next/navigation';
import { TelegramLogin } from './TelegramLogin';

export function LoginForm() {
  const router = useRouter();

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prototype Builder
          </h1>
          <p className="text-gray-600">
            Войдите через Telegram
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
