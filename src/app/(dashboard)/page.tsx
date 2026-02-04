'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { UserProfile } from '@/components/auth';
import { useRouter } from 'next/navigation';

interface Folder {
  id: number;
  name: string;
  createdAt: string;
  _count: {
    projects: number;
  };
}

interface Project {
  id: number;
  name: string;
  folderId: number | null;
  updatedAt: string;
  folder: {
    id: number;
    name: string;
  } | null;
  _count: {
    collaborators: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const { fetchWithAuth, user, logout } = useAuthStore();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      
      const [foldersRes, projectsRes] = await Promise.all([
        fetchWithAuth('/api/folders'),
        fetchWithAuth('/api/projects'),
      ]);

      if (foldersRes.ok && projectsRes.ok) {
        const foldersData = await foldersRes.json();
        const projectsData = await projectsRes.json();
        setFolders(foldersData.folders || []);
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createFolder() {
    if (!newFolderName.trim()) return;

    try {
      const res = await fetchWithAuth('/api/folders', {
        method: 'POST',
        body: JSON.stringify({ name: newFolderName }),
      });

      if (res.ok) {
        setNewFolderName('');
        setShowCreateFolder(false);
        loadData();
      }
    } catch (error) {
      console.error('Create folder error:', error);
    }
  }

  async function createProject() {
    if (!newProjectName.trim()) return;

    try {
      const res = await fetchWithAuth('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: newProjectName,
          folderId: selectedFolderId,
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

  async function deleteFolder(id: number) {
    if (!confirm('Удалить папку? Все проекты в ней также будут удалены.')) return;

    try {
      const res = await fetchWithAuth(`/api/folders/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Delete folder error:', error);
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Prototype Builder
            </h1>
            <div className="flex items-center gap-4">
              <UserProfile />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Folders Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Папки</h2>
            <button
              onClick={() => setShowCreateFolder(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Создать папку
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {folders.map((folder) => (
              <div
                key={folder.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/folders/${folder.id}`)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{folder.name}</h3>
                      <p className="text-sm text-gray-500">
                        {folder._count.projects} {folder._count.projects === 1 ? 'проект' : 'проектов'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFolder(folder.id);
                    }}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Недавние проекты</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Создать проект
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.slice(0, 6).map((project) => (
              <div
                key={project.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => router.push(`/editor/${project.id}`)}
              >
                <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  {project.folder && (
                    <span className="px-2 py-1 bg-gray-100 rounded">
                      {project.folder.name}
                    </span>
                  )}
                  <span>{project._count.collaborators} участников</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Обновлено {new Date(project.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateFolder(false)}>
          <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Создать папку</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Название папки"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && createFolder()}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowCreateFolder(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={createFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

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
            />
            <select
              value={selectedFolderId || ''}
              onChange={(e) => setSelectedFolderId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4"
            >
              <option value="">Без папки</option>
              {folders.map((folder) => (
                <option key={folder.id} value={folder.id}>
                  {folder.name}
                </option>
              ))}
            </select>
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
