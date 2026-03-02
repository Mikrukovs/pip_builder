'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { UserProfileDropdown } from '@/components/auth';
import { AccessRequestsModal } from '@/components/access/AccessRequestsModal';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user, hydrated, fetchWithAuth } = useAuthStore();
  const [showAccessRequests, setShowAccessRequests] = useState(false);
  const [requestsCount, setRequestsCount] = useState(0);

  useEffect(() => {
    // Проверяем авторизацию только после гидратации store
    if (hydrated && (!isAuthenticated || !user)) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, user, router]);

  // Загружаем количество запросов доступа
  useEffect(() => {
    if (!isAuthenticated) return;

    const loadRequestsCount = async () => {
      try {
        const res = await fetchWithAuth('/api/access-requests');
        if (res.ok) {
          const data = await res.json();
          setRequestsCount(data.requests?.length || 0);
        }
      } catch (error) {
        console.error('Load requests count error:', error);
      }
    };

    loadRequestsCount();
    
    // Обновляем каждые 30 секунд
    const interval = setInterval(loadRequestsCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchWithAuth]);

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
          
          <div className="flex items-center gap-4">
            {/* Кнопка запросов доступа */}
            <button
              onClick={() => setShowAccessRequests(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Запросы доступа"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {requestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {requestsCount > 9 ? '9+' : requestsCount}
                </span>
              )}
            </button>

            <UserProfileDropdown />
          </div>
        </div>
      </header>
      
      {/* Модал запросов доступа */}
      {showAccessRequests && (
        <AccessRequestsModal
          onClose={() => {
            setShowAccessRequests(false);
            // Перезагружаем счётчик после закрытия
            fetchWithAuth('/api/access-requests')
              .then(res => res.ok ? res.json() : null)
              .then(data => setRequestsCount(data?.requests?.length || 0))
              .catch(() => {});
          }}
        />
      )}
      
      {/* Основной контент */}
      <main>{children}</main>
    </div>
  );
}
