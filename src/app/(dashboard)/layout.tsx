'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { generateAnonymousUser } from '@/utils/anonymous';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, setAuth } = useAuthStore();

  useEffect(() => {
    // Автоматически создаём анонимного пользователя при первом заходе
    // Срабатывает только один раз при монтировании
    if (!isAuthenticated) {
      const anonymousUser = generateAnonymousUser();
      setAuth(anonymousUser, 'anonymous-token');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header с именем пользователя */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Prototype Builder</h1>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.firstName?.charAt(0) || '?'}
            </div>
            <span className="text-sm font-medium text-gray-700">
              {user?.firstName || 'Анонимный пользователь'}
            </span>
          </div>
        </div>
      </header>
      
      {/* Основной контент */}
      <main>{children}</main>
    </div>
  );
}
