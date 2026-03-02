'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'next/navigation';

interface AccessDeniedProps {
  projectId: number;
  projectName?: string;
}

export function AccessDenied({ projectId, projectName }: AccessDeniedProps) {
  const { fetchWithAuth } = useAuthStore();
  const router = useRouter();
  const [requesting, setRequesting] = useState(false);
  const [requested, setRequested] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestAccess = async () => {
    try {
      setRequesting(true);
      setError('');

      const res = await fetchWithAuth('/api/access-requests', {
        method: 'POST',
        body: JSON.stringify({
          projectId,
          message: message.trim() || null,
        }),
      });

      if (res.ok) {
        setRequested(true);
      } else {
        const data = await res.json();
        setError(data.error || 'Не удалось отправить запрос');
      }
    } catch (err) {
      console.error('Request access error:', err);
      setError('Произошла ошибка при отправке запроса');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Доступ запрещён
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          {projectName ? (
            <>У вас нет доступа к проекту <span className="font-semibold">{projectName}</span></>
          ) : (
            'У вас нет доступа к этому проекту'
          )}
        </p>

        {!requested ? (
          <>
            {/* Message input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Сообщение владельцу (необязательно)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Расскажите, зачем вам нужен доступ..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={requesting}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                На главную
              </button>
              <button
                onClick={handleRequestAccess}
                disabled={requesting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {requesting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Отправка...
                  </>
                ) : (
                  'Запросить доступ'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success state */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Запрос отправлен
                  </p>
                  <p className="text-sm text-green-700">
                    Владелец проекта получит уведомление и сможет предоставить вам доступ.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Вернуться на главную
            </button>
          </>
        )}
      </div>
    </div>
  );
}
