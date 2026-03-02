'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface ProjectMoveModalProps {
  projectId: number;
  projectName: string;
  currentFolderId: number | null;
  onClose: () => void;
  onMoved: () => void;
}

interface Folder {
  id: number;
  name: string;
  userRole: string;
}

export function ProjectMoveModal({
  projectId,
  projectName,
  currentFolderId,
  onClose,
  onMoved,
}: ProjectMoveModalProps) {
  const { fetchWithAuth } = useAuthStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(currentFolderId);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadFolders();
  }, []);

  const loadFolders = async () => {
    try {
      const res = await fetchWithAuth('/api/folders');
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const moveProject = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({
          folderId: selectedFolderId,
        }),
      });

      if (res.ok) {
        onMoved();
        onClose();
      }
    } catch (error) {
      console.error('Failed to move project:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-xl font-semibold mb-4">Переместить проект</h3>
        <p className="text-sm text-gray-600 mb-4">
          Выберите папку для проекта "{projectName}"
        </p>

        {/* Список папок */}
        <div className="space-y-2 mb-6 max-h-64 overflow-y-auto">
          {/* Опция "Без папки" */}
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
              selectedFolderId === null
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="font-medium">Без папки</span>
            </div>
          </button>

          {/* Папки пользователя */}
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => setSelectedFolderId(folder.id)}
              disabled={folder.id === currentFolderId}
              className={`w-full p-3 rounded-lg border-2 text-left transition-colors ${
                selectedFolderId === folder.id
                  ? 'border-blue-500 bg-blue-50'
                  : folder.id === currentFolderId
                  ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="font-medium">{folder.name}</span>
                {folder.id === currentFolderId && (
                  <span className="text-xs text-gray-500">(текущая)</span>
                )}
              </div>
            </button>
          ))}

          {folders.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              У вас пока нет папок. Создайте папку на главной странице.
            </p>
          )}
        </div>

        {/* Кнопки действий */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={moveProject}
            disabled={loading || selectedFolderId === currentFolderId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Перемещение...' : 'Переместить'}
          </button>
        </div>
      </div>
    </div>
  );
}
