'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserProfileDropdown } from '@/components/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, hydrated } = useAuthStore();

  useEffect(() => {
    // Проверяем авторизацию только после гидратации store
    if (hydrated && (!isAuthenticated || !user)) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Пока store не гидратирован - ничего не показываем (предотвращает мелькание)
  if (!hydrated) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header с профилем */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Prototype Builder</h1>
          <UserProfileDropdown />
        </div>
      </header>
      
      {/* Основной контент */}
      <main>{children}</main>
    </div>
  );
}
