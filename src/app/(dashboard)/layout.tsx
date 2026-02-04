'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    // Проверяем авторизацию
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }

    // Проверяем валидность токена
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }).then((res) => {
      if (!res.ok) {
        router.push('/login');
      }
    });
  }, [isAuthenticated, token, router]);

  if (!isAuthenticated) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return <>{children}</>;
}
