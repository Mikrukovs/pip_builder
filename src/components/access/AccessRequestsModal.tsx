'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

interface AccessRequest {
  id: number;
  projectId: number;
  userId: number;
  status: string;
  message: string | null;
  createdAt: string;
  user: {
    id: number;
    username: string;
    firstName: string;
    lastName: string | null;
    photoUrl: string | null;
  };
  project: {
    id: number;
    name: string;
  };
}

interface AccessRequestsModalProps {
  onClose: () => void;
}

export function AccessRequestsModal({ onClose }: AccessRequestsModalProps) {
  const { fetchWithAuth } = useAuthStore();
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const res = await fetchWithAuth('/api/access-requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(requestId: number, action: 'approve' | 'reject') {
    try {
      setProcessing(requestId);
      const res = await fetchWithAuth(`/api/access-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        // Удаляем запрос из списка
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        alert('Ошибка при обработке запроса');
      }
    } catch (error) {
      console.error('Handle request error:', error);
      alert('Ошибка при обработке запроса');
    } finally {
      setProcessing(null);
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'только что';
    if (diffMins < 60) return `${diffMins} мин назад`;
    if (diffHours < 24) return `${diffHours} ч назад`;
    if (diffDays < 7) return `${diffDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const getUserInitials = (user: AccessRequest['user']) => {
    return `${user.firstName[0]}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getUserColor = (userId: number) => {
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
    return colors[userId % colors.length];
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Запросы доступа</h2>
              <p className="text-sm text-gray-500 mt-1">
                {requests.length === 0 ? 'Нет новых запросов' : `${requests.length} ${requests.length === 1 ? 'запрос' : 'запросов'}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Нет запросов</h3>
              <p className="text-sm text-gray-500">
                Когда пользователи запросят доступ к вашим проектам, они появятся здесь
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="bg-gray-50 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    {request.user.photoUrl ? (
                      <img
                        src={request.user.photoUrl}
                        alt={request.user.firstName}
                        className="w-10 h-10 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0 ${getUserColor(request.user.id)}`}>
                        {getUserInitials(request.user)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-medium text-gray-900">
                            {request.user.firstName} {request.user.lastName || ''}
                          </p>
                          <p className="text-sm text-gray-500">@{request.user.username}</p>
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDate(request.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-700 mb-2">
                        Запрашивает доступ к проекту <span className="font-medium">{request.project.name}</span>
                      </p>

                      {request.message && (
                        <div className="bg-white rounded p-2 mb-3 border border-gray-200">
                          <p className="text-sm text-gray-600 italic">{request.message}</p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(request.id, 'approve')}
                          disabled={processing === request.id}
                          className="flex-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          {processing === request.id ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Одобрить
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={processing === request.id}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Отклонить
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
