'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { useEditorStore } from '@/store/editor';
import { Editor } from '@/components/editor';

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, fetchWithAuth } = useAuthStore();
  const { loadProject } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    loadProjectFromServer();
  }, [params.projectId, isAuthenticated]);

  async function loadProjectFromServer() {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetchWithAuth(`/api/projects/${params.projectId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          setError('Проект не найден');
        } else if (res.status === 403) {
          setError('Нет доступа к проекту');
        } else {
          setError('Ошибка загрузки проекта');
        }
        return;
      }

      const data = await res.json();
      
      // Загружаем проект в редактор
      if (data.project) {
        loadProject(data.project.data);
      }
    } catch (error) {
      console.error('Load project error:', error);
      setError('Ошибка загрузки проекта');
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Загрузка проекта...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{error}</h2>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  }

  return <Editor projectId={parseInt(params.projectId as string)} />;
}
