'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter, useParams } from 'next/navigation';
import { generateUUID } from '@/utils/uuid';
import { FolderShareModal, FolderActionsMenu } from '@/components/folders';

interface Project {
  id: number;
  name: string;
  updatedAt: string;
  _count: {
    collaborators: number;
  };
}

interface Folder {
  id: number;
  name: string;
  ownerId: number;
  owner: {
    id: number;
    username: string;
    firstName: string;
    lastName: string | null;
  };
  _count: {
    collaborators: number;
  };
}

export default function FolderPage() {
  const router = useRouter();
  const params = useParams();
  const { fetchWithAuth, user } = useAuthStore();
  const [folder, setFolder] = useState<Folder | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const folderId = parseInt(params.id as string);
  const isOwner = folder ? folder.ownerId === user?.id : false;

  useEffect(() => {
    loadFolderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folderId]);

  async function loadFolderData() {
    try {
      setLoading(true);

      // Загружаем информацию о папке
      const folderRes = await fetchWithAuth(`/api/folders/${folderId}`);
      if (!folderRes.ok) {
        if (folderRes.status === 404) {
          router.push('/');
          return;
        }
        throw new Error('Failed to load folder');
      }
      const folderData = await folderRes.json();
      setFolder(folderData.folder);

      // Загружаем проекты папки
      const projectsRes = await fetchWithAuth(`/api/projects?folderId=${folderId}`);
      if (projectsRes.ok) {
        const projectsData = await projectsRes.json();
        setProjects(projectsData.projects || []);
      }
    } catch (error) {
      console.error('Load folder data error:', error);
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
          folderId: folderId,
          data: {
            screens: [{
              id: generateUUID(),
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

  async function deleteFolder() {
    if (!confirm(`Удалить папку "${folder?.name}"? Все проекты в ней также будут удалены.`)) return;

    try {
      const res = await fetchWithAuth(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.push('/');
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

  if (!folder) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{folder.name}</h1>
              {!isOwner && (
                <p className="text-sm text-gray-500 mt-1">
                  Владелец: {folder.owner.firstName} {folder.owner.lastName || ''}
                </p>
              )}
            </div>
          </div>

          {/* Меню действий */}
          <FolderActionsMenu
            folderId={folderId}
            folderName={folder.name}
            isOwner={isOwner}
            collaboratorsCount={folder._count.collaborators}
            onShare={() => setShareModalOpen(true)}
            onDelete={deleteFolder}
          />
        </div>

        {/* Projects Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Проекты</h2>
            <button
              onClick={() => setShowCreateProject(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + Создать проект
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Нет проектов</h3>
              <p className="text-gray-500 mb-4">Создайте первый проект в этой папке</p>
              <button
                onClick={() => setShowCreateProject(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Создать проект
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/editor/${project.id}`)}
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{project.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>
                      {new Date(project.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                    {project._count.collaborators > 1 && (
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span>{project._count.collaborators}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Создать проект</h3>
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
                onClick={() => {
                  setShowCreateProject(false);
                  setNewProjectName('');
                }}
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

      {/* Folder Share Modal */}
      <FolderShareModal
        folderId={folderId}
        folderName={folder.name}
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </div>
  );
}
