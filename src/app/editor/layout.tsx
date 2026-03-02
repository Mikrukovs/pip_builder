'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();

  // Проверяем авторизацию только после гидратации store
  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Пока store не гидратирован - показываем минимальный loader
  // Это предотвращает мелькание редиректов
  if (!hydrated) {
    return null; // Или можно вернуть пустой div, чтобы не было мелькания
  }

  // Если не авторизован после гидратации - показываем loader (редирект произойдет)
  if (!isAuthenticated) {
    return null;
  }

  // Рендерим контент без обертки (Editor сам управляет своим layout)
  return <>{children}</>;
}
