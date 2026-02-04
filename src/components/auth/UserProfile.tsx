'use client';

import { useAuthStore } from '@/store/auth';
import Image from 'next/image';

export function UserProfile() {
  const { user, isAuthenticated, logout } = useAuthStore();

  if (!isAuthenticated || !user) {
    return null;
  }

  const displayName = user.username 
    ? `@${user.username}` 
    : `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Аватар */}
      {user.photo_url ? (
        <Image
          src={user.photo_url}
          alt={displayName}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized // Для внешних изображений
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
          {user.first_name.charAt(0).toUpperCase()}
        </div>
      )}

      {/* Имя пользователя */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900">
          {user.first_name} {user.last_name || ''}
        </span>
        {user.username && (
          <span className="text-xs text-gray-500">
            @{user.username}
          </span>
        )}
      </div>

      {/* Кнопка выхода */}
      <button
        onClick={logout}
        className="ml-auto px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        title="Выйти"
      >
        Выйти
      </button>
    </div>
  );
}
