'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth';

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
}

interface Collaborator {
  id: number; // ID записи FolderCollaborator
  userId: number; // ID пользователя
  username: string;
  firstName: string;
  lastName: string | null;
  photoUrl: string | null;
  role: string;
  createdAt: string;
}

interface FolderShareModalProps {
  folderId: number;
  folderName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FolderShareModal({
  folderId,
  folderName,
  isOpen,
  onClose,
}: FolderShareModalProps) {
  const { fetchWithAuth, user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [owner, setOwner] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isOpen) {
      loadCollaborators();
    }
  }, [isOpen, folderId]);

  useEffect(() => {
    // Дебаунс поиска
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeout.current = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchQuery]);

  async function loadCollaborators() {
    try {
      const res = await fetchWithAuth(`/api/folders/${folderId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setOwner(data.owner);
        setCollaborators(data.collaborators);
      }
    } catch (err) {
      console.error('Load collaborators error:', err);
    }
  }

  async function searchUsers() {
    try {
      const res = await fetchWithAuth(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.users);
      }
    } catch (err) {
      console.error('Search users error:', err);
    }
  }

  async function addCollaborator(user: User) {
    try {
      setLoading(true);
      setError('');

      const res = await fetchWithAuth(`/api/folders/${folderId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({
          username: user.username,
          role: 'editor',
        }),
      });

      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        loadCollaborators();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to add collaborator');
      }
    } catch (err) {
      setError('Failed to add collaborator');
    } finally {
      setLoading(false);
    }
  }

  async function removeCollaborator(userId: number) {
    if (!confirm('Удалить доступ к папке?')) return;

    try {
      const res = await fetchWithAuth(`/api/folders/${folderId}/collaborators/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadCollaborators();
      }
    } catch (err) {
      console.error('Remove collaborator error:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Доступ к папке</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{folderName}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Search Users */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Добавить пользователя
            </label>
            <input
              type="text"
              name="user-search-query"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по имени или username..."
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              data-lpignore="true"
              data-form-type="other"
              data-1p-ignore="true"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100">
                {searchResults.map((user) => {
                  const isAlreadyAdded = collaborators.some((c) => c.id === user.id);
                  
                  return (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {user.photoUrl ? (
                          <img
                            src={user.photoUrl}
                            alt={user.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                            {user.firstName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName || ''}
                          </p>
                          <p className="text-xs text-gray-500">@{user.username}</p>
                        </div>
                      </div>

                      {isAlreadyAdded ? (
                        <span className="text-xs text-gray-500">Уже добавлен</span>
                      ) : (
                        <button
                          onClick={() => addCollaborator(user)}
                          disabled={loading}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          Добавить
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Current Collaborators */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Участники</h3>

            <div className="space-y-2">
              {/* Owner */}
              {owner && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {owner.photoUrl ? (
                      <img
                        src={owner.photoUrl}
                        alt={owner.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {owner.firstName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {owner.firstName} {owner.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500">@{owner.username}</p>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2 py-1 rounded">
                    Владелец
                  </span>
                </div>
              )}

              {/* Collaborators */}
              {collaborators.map((collab) => (
                <div
                  key={collab.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {collab.photoUrl ? (
                      <img
                        src={collab.photoUrl}
                        alt={collab.firstName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {collab.firstName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {collab.firstName} {collab.lastName || ''}
                      </p>
                      <p className="text-xs text-gray-500">@{collab.username}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                      {collab.role === 'editor' ? 'Редактор' : 'Просмотр'}
                    </span>
                    {collab.userId !== user?.id && (
                      <button
                        onClick={() => removeCollaborator(collab.userId)}
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Удалить доступ"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {collaborators.length === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">
                  Пока никто не добавлен
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
