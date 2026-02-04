'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

interface Project {
  id: number;
  name: string;
  updatedAt: string;
  _count?: {
    collaborators: number;
  };
}

interface Folder {
  id: number;
  name: string;
  projects: Project[];
}

export default function FolderPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchWithAuth } = useAuthStore();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    loadFolder();
  }, [params.id]);

  async function loadFolder() {
    try {
      setLoading(true);
      const res = await fetchWithAuth(`/api/folders/${params.id}`);
      
      if (res.ok) {
        const data = await res.json();
        setFolder(data.folder);
      } else {
        router.push('/');
      }
    } catch (error) {
      console.error('Load folder error:', error);
      router.push('/');
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;

    try {
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          folderId: parseInt(params.id as string),
          data: {
            screens: [{
              id: crypto.randomUUID(),
              name: 'Главная',
              slots: [],
              stickySlots: [],
            }],
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewProjectName('');
        setShowCreateProject(false);
        router.push(`/editor/${data.project.id}`);
      }
    } catch (error) {
      console.error('Create project error:', error);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!folder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{folder.name}</h1>
            <p className="text-gray-500">
              {folder.projects.length} {folder.projects.length === 1 ? 'проект' : 'проектов'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateProject(true)}
            className="ml-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            + Создать проект
          </button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folder.projects.map((project) => (
            <div
              key={project.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/editor/${project.id}`)}
            >
              <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
              <p className="text-xs text-gray-400">
                Обновлено {new Date(project.updatedAt).toLocaleDateString()}
              </p>
            </div>
          ))}

          {folder.projects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">В этой папке пока нет проектов</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Создать первый проект
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateProject(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Создать проект</h3>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Название проекта"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createProject()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateProject(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
