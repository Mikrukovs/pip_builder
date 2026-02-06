'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { generateAnonymousUser } from '@/utils/anonymous';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useAuthStore();

  useEffect(() => {
    // Автоматически создаём анонимного пользователя
    if (!isAuthenticated) {
      const anonymousUser = generateAnonymousUser();
      setAuth(anonymousUser, 'anonymous-token');
      // Не делаем редирект, просто обновляем состояние
    }
  }, [isAuthenticated, setAuth]);

  // Сразу редиректим на dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  // Показываем loader
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
    </div>
  );
}
