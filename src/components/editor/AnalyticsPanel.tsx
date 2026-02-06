'use client';

import { useEffect, useState } from 'react';
import { ProjectAnalytics, AnalyticsSession as AnalyticsSessionType } from '@/types/analytics';
import { Screen } from '@/types';
import { useAuthStore } from '@/store/auth';
import { HeatmapExport } from './HeatmapExport';

interface AnalyticsPanelProps {
  projectId: string;
  currentScreenId: string | null;
  screens: { id: string; name: string }[];
  currentScreen: Screen | null;
  embeddedComponents?: Record<string, unknown>[];
  onClose: () => void;
}

export function AnalyticsPanel({ projectId, currentScreenId, screens, currentScreen, embeddedComponents, onClose }: AnalyticsPanelProps) {
  const [analytics, setAnalytics] = useState<ProjectAnalytics | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useAuthStore();

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  const loadAnalytics = async () => {
    if (!projectId) {
      setLoading(false);
      setAnalytics(null);
      return;
    }

    try {
      setLoading(true);
      
      // Если нет авторизации, пропускаем загрузку
      const response = await fetchWithAuth(`/api/analytics/project/${projectId}`).catch((error) => {
        console.error('Analytics fetch error:', error);
        return null;
      });
      
      if (!response) {
        console.error('Failed to fetch analytics');
        setAnalytics(null);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load analytics:', response.status, errorData);
        setAnalytics(null);
        return;
      }

      const { sessions } = await response.json();
      
      // Преобразуем сессии в ProjectAnalytics
      const projectAnalytics = calculateAnalytics(sessions);
      setAnalytics(projectAnalytics);
    } catch (error) {
      console.error('Load analytics error:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (sessions: any[]): ProjectAnalytics => {
    const analytics: ProjectAnalytics = {
      projectId,
      sessions: sessions.map((s) => ({
        id: s.id,
        projectId: s.projectId,
        startTime: parseInt(s.startTime),
        endTime: s.endTime ? parseInt(s.endTime) : undefined,
        clicks: s.clicks,
        screenTimes: s.screenTimes,
        transitions: s.transitions,
      })),
      totalSessions: sessions.length,
      totalClicks: 0,
      averageSessionDuration: 0,
      heatmapData: {},
      screenTimes: [],
      transitions: [],
    };

    // Пересчитываем статистику (логика из recalculateAggregates)
    analytics.totalClicks = analytics.sessions.reduce((sum, s) => sum + s.clicks.length, 0);
    
    // Среднее время сессии
    const durations = analytics.sessions
      .filter((s) => s.endTime)
      .map((s) => s.endTime! - s.startTime);
    analytics.averageSessionDuration =
      durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

    // Тепловая карта
    const heatmapData: any = {};
    analytics.sessions.forEach((session) => {
      session.clicks.forEach((click: any) => {
        const screenId = click.screenId;
        const zone = click.zone || 'content';
        
        if (!heatmapData[screenId]) {
          heatmapData[screenId] = {
            navbar: [],
            content: [],
            sticky: [],
          };
        }
        
        const zoneData = heatmapData[screenId][zone];
        const existing = zoneData.find(
          (p: any) => Math.abs(p.x - click.x) < 0.03 && Math.abs(p.y - click.y) < 0.03
        );
        
        if (existing) {
          existing.intensity += 1;
        } else {
          zoneData.push({ x: click.x, y: click.y, intensity: 1 });
        }
      });
    });
    analytics.heatmapData = heatmapData;

    // Время на экранах
    const screenTimesMap: Record<string, { total: number; visits: number; name: string }> = {};
    analytics.sessions.forEach((session) => {
      Object.entries(session.screenTimes).forEach(([screenId, time]) => {
        if (!screenTimesMap[screenId]) {
          screenTimesMap[screenId] = { total: 0, visits: 0, name: screenId };
        }
        screenTimesMap[screenId].total += time as number;
        screenTimesMap[screenId].visits += 1;
      });
    });
    analytics.screenTimes = Object.entries(screenTimesMap).map(([screenId, data]) => ({
      screenId,
      screenName: data.name,
      totalTime: data.total,
      visits: data.visits,
    }));

    // Переходы
    const transitionsMap: Record<string, number> = {};
    analytics.sessions.forEach((session) => {
      session.transitions.forEach((t: any) => {
        const key = `${t.from}->${t.to}`;
        transitionsMap[key] = (transitionsMap[key] || 0) + 1;
      });
    });
    analytics.transitions = Object.entries(transitionsMap).map(([key, count]) => {
      const [from, to] = key.split('->');
      return { fromScreenId: from, toScreenId: to, count };
    });

    return analytics;
  };

  const handleClear = async () => {
    if (!confirm('Очистить всю статистику проекта? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/analytics/project/${projectId}/clear`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setAnalytics(null);
        alert('Статистика успешно очищена');
      } else {
        const error = await response.json();
        alert(`Ошибка: ${error.error || 'Не удалось очистить статистику'}`);
      }
    } catch (error) {
      console.error('Clear analytics error:', error);
      alert('Ошибка при очистке статистики');
    }
  };

  const handleRefresh = () => {
    loadAnalytics();
  };

  // Форматирование времени
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}мс`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}с`;
    return `${(ms / 60000).toFixed(1)}м`;
  };

  // Получаем имя экрана по ID
  const getScreenName = (screenId: string) => {
    const screen = screens.find(s => s.id === screenId);
    return screen?.name || screenId;
  };

  // Статистика текущего экрана
  const currentScreenStats = analytics?.screenTimes.find(s => s.screenId === currentScreenId);
  
  // Считаем клики по всем зонам
  const screenHeatmap = analytics?.heatmapData?.[currentScreenId || ''];
  const currentScreenClicks = screenHeatmap
    ? (Array.isArray(screenHeatmap) 
        // Старый формат (массив)
        ? (screenHeatmap as { intensity: number }[]).reduce((sum, p) => sum + p.intensity, 0)
        // Новый формат (объект с зонами)
        : (screenHeatmap.navbar?.reduce((sum, p) => sum + p.intensity, 0) || 0) +
          (screenHeatmap.content?.reduce((sum, p) => sum + p.intensity, 0) || 0) +
          (screenHeatmap.sticky?.reduce((sum, p) => sum + p.intensity, 0) || 0)
      )
    : 0;

  return (
    <div className="bg-white border-l border-gray-200 w-80 flex flex-col h-full">
      {/* Заголовок */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h2 className="font-semibold text-gray-900">Аналитика</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full" />
          </div>
        ) : !analytics ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-1">Нет данных</h3>
            <p className="text-sm text-gray-500 mb-4">
              Откройте превью и взаимодействуйте с прототипом
            </p>
            <button
              onClick={handleRefresh}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Обновить
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Общая статистика */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Общая статистика
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.totalSessions}
                  </div>
                  <div className="text-xs text-gray-500">Сессий</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-900">
                    {analytics.totalClicks}
                  </div>
                  <div className="text-xs text-gray-500">Кликов</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(analytics.averageSessionDuration)}
                  </div>
                  <div className="text-xs text-gray-500">Среднее время сессии</div>
                </div>
              </div>
            </div>

            {/* Текущий экран */}
            {currentScreenId && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Текущий экран
                </h3>
                <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                  <div className="font-medium text-purple-900">
                    {getScreenName(currentScreenId)}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Кликов:</span>
                    <span className="font-medium text-purple-900">{currentScreenClicks}</span>
                  </div>
                  {currentScreenStats && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">Время:</span>
                        <span className="font-medium text-purple-900">
                          {formatTime(currentScreenStats.totalTime)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-purple-600">Посещений:</span>
                        <span className="font-medium text-purple-900">{currentScreenStats.visits}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Кнопка экспорта тепловой карты */}
                  {currentScreenClicks > 0 && currentScreen && (
                    <button
                      onClick={() => setShowExport(true)}
                      className="w-full mt-2 px-3 py-2 bg-purple-600 text-white text-sm rounded-lg 
                                 hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Экспорт тепловой карты
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Время на экранах */}
            {analytics.screenTimes.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Время на экранах
                </h3>
                <div className="space-y-2">
                  {analytics.screenTimes
                    .sort((a, b) => b.totalTime - a.totalTime)
                    .slice(0, 5)
                    .map((screen) => {
                      const maxTime = analytics.screenTimes[0]?.totalTime || 1;
                      const percentage = (screen.totalTime / maxTime) * 100;
                      
                      return (
                        <div key={screen.screenId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate">
                              {getScreenName(screen.screenId)}
                            </span>
                            <span className="text-gray-500 flex-shrink-0 ml-2">
                              {formatTime(screen.totalTime)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Переходы между экранами */}
            {analytics.transitions.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  Популярные переходы
                </h3>
                <div className="space-y-2">
                  {analytics.transitions
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5)
                    .map((transition, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2"
                      >
                        <span className="text-gray-700 truncate">
                          {getScreenName(transition.fromScreenId)}
                        </span>
                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-700 truncate">
                          {getScreenName(transition.toScreenId)}
                        </span>
                        <span className="ml-auto text-gray-500 flex-shrink-0 bg-white px-2 py-0.5 rounded text-xs">
                          {transition.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Футер с действиями */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleRefresh}
          className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors flex items-center justify-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Обновить
        </button>
        {analytics && (
          <button
            onClick={handleClear}
            className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium text-red-600 transition-colors"
          >
            Очистить
          </button>
        )}
      </div>

      {/* Модал экспорта тепловой карты */}
      {showExport && analytics && currentScreen && currentScreenId && (
        <HeatmapExport
          analytics={analytics}
          screen={currentScreen}
          screenName={getScreenName(currentScreenId)}
          embeddedComponents={embeddedComponents}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
