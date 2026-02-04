'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { TelegramLogin } from '@/components/auth';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prototype Builder
          </h1>
          <p className="text-gray-600">
            Войдите чтобы начать создавать прототипы
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <TelegramLogin 
            botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ''} 
            onAuth={() => router.push('/')}
          />

          <p className="text-sm text-gray-500 text-center mt-4">
            Нажимая "Log in with Telegram", вы соглашаетесь<br />
            с нашими условиями использования
          </p>
        </div>
      </div>
    </div>
  );
}
