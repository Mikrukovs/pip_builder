'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface ProjectShareModalProps {
  projectId: number;
  projectName: string;
  onClose: () => void;
}

interface Collaborator {
  id: number;
  userId: number;
  role: string;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string | null;
    username: string;
    photoUrl: string | null;
  };
}

export function ProjectShareModal({ projectId, projectName, onClose }: ProjectShareModalProps) {
  const { fetchWithAuth } = useAuthStore();
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadCollaborators();
  }, [projectId]);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadCollaborators = async () => {
    try {
      const res = await fetchWithAuth(`/api/projects/${projectId}/collaborators`);
      if (res.ok) {
        const data = await res.json();
        setCollaborators(data.collaborators || []);
      }
    } catch (error) {
      console.error('Failed to load collaborators:', error);
    }
  };

  const searchUsers = async () => {
    try {
      setIsSearching(true);
      const res = await fetchWithAuth(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        // Фильтруем уже добавленных пользователей
        const filtered = data.users.filter(
          (user: any) => !collaborators.some(c => c.userId === user.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const addCollaborator = async (userId: number) => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/projects/${projectId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ userId, role: 'editor' }),
      });

      if (res.ok) {
        setSearchQuery('');
        setSearchResults([]);
        await loadCollaborators();
      }
    } catch (error) {
      console.error('Failed to add collaborator:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (userId: number) => {
    if (!confirm('Удалить этого пользователя из проекта?')) return;

    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/projects/${projectId}/collaborators/${userId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadCollaborators();
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">Управление доступом: {projectName}</h3>

        {/* Поиск пользователей */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Добавить участника
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или username..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Результаты поиска */}
          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => addCollaborator(user.id)}
                  disabled={loading}
                  className="w-full px-3 py-2 hover:bg-gray-50 flex items-center gap-3 text-left disabled:opacity-50"
                >
                  {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.firstName} className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm">
                      {user.firstName[0]}{user.lastName?.[0] || ''}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-sm">{user.firstName} {user.lastName || ''}</div>
                    <div className="text-xs text-gray-500">@{user.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {isSearching && (
            <div className="mt-2 text-sm text-gray-500">Поиск...</div>
          )}
        </div>

        {/* Список участников */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Участники ({collaborators.length})
          </h4>
          <div className="space-y-2">
            {collaborators.map((collab) => (
              <div key={collab.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {collab.user.photoUrl ? (
                    <img src={collab.user.photoUrl} alt={collab.user.firstName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white">
                      {collab.user.firstName[0]}{collab.user.lastName?.[0] || ''}
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{collab.user.firstName} {collab.user.lastName || ''}</div>
                    <div className="text-sm text-gray-500">@{collab.user.username}</div>
                  </div>
                </div>
                <button
                  onClick={() => removeCollaborator(collab.userId)}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  Удалить
                </button>
              </div>
            ))}
            {collaborators.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Пока нет участников. Добавьте кого-нибудь!
              </p>
            )}
          </div>
        </div>

        {/* Кнопка закрытия */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}
