'use client';

import { useState, useRef, useEffect } from 'react';

interface CollaborationUser {
  id: number;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  username: string;
}

interface CollaboratorsStackProps {
  users: CollaborationUser[];
  isConnected: boolean;
}

export function CollaboratorsStack({ users, isConnected }: CollaboratorsStackProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Закрываем дропдаун при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (!isConnected || users.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <div className="w-2 h-2 bg-gray-300 rounded-full" />
        <span>Оффлайн</span>
      </div>
    );
  }

  // Показываем максимум 5 аватаров в стеке
  const visibleUsers = users.slice(0, 5);
  const hiddenCount = Math.max(0, users.length - 5);

  const getInitials = (user: CollaborationUser) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    return (first + last).toUpperCase() || user.username?.[0]?.toUpperCase() || '?';
  };

  const getAvatarColors = (id: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
    ];
    return colors[id % colors.length];
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Стек аватаров */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center hover:opacity-80 transition-opacity"
      >
        <div className="flex items-center -space-x-2">
          {visibleUsers.map((user, index) => (
            <div
              key={user.id}
              className="relative"
              style={{ zIndex: visibleUsers.length - index }}
            >
              {user.photoUrl ? (
                <img
                  src={user.photoUrl}
                  alt={user.firstName}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover"
                />
              ) : (
                <div
                  className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium ${getAvatarColors(user.id)}`}
                >
                  {getInitials(user)}
                </div>
              )}
            </div>
          ))}
          
          {/* Показываем +N если есть скрытые пользователи */}
          {hiddenCount > 0 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center text-white text-xs font-medium">
              +{hiddenCount}
            </div>
          )}
        </div>
      </button>

      {/* Дропдаун со списком пользователей */}
      {showDropdown && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              {users.length === 1 ? 'Вы работаете один' : `${users.length} участника онлайн`}
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                className="px-3 py-2 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.firstName}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 ${getAvatarColors(user.id)}`}
                  >
                    {getInitials(user)}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.firstName} {user.lastName || ''}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    @{user.username}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
