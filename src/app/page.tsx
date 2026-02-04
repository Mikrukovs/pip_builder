'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Редирект на login если не авторизован
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  // Показываем loader пока проверяем auth
  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Редирект на dashboard (который рендерится через (dashboard) group)
  router.push('/');
  return null;
}
