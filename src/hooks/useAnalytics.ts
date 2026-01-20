'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  AnalyticsSession,
  ProjectAnalytics,
  ClickEvent,
  ClickZone,
  ZoneHeatmapData,
  ANALYTICS_STORAGE_KEY,
  generateSessionId,
  generateClickId,
} from '@/types/analytics';

interface UseAnalyticsOptions {
  projectId: string;
  enabled?: boolean;
}

interface UseAnalyticsReturn {
  trackClick: (event: MouseEvent, containerRef: HTMLElement | null, componentId?: string, componentType?: string) => void;
  trackScreenChange: (newScreenId: string) => void;
  endSession: () => void;
}

export function useAnalytics({ projectId, enabled = true }: UseAnalyticsOptions): UseAnalyticsReturn {
  const sessionRef = useRef<AnalyticsSession | null>(null);
  const currentScreenRef = useRef<string | null>(null);
  const screenStartTimeRef = useRef<number>(Date.now());

  // Инициализация сессии
  useEffect(() => {
    if (!enabled || !projectId) return;

    const session: AnalyticsSession = {
      id: generateSessionId(),
      projectId,
      startTime: Date.now(),
      clicks: [],
      screenTimes: {},
      transitions: [],
    };

    sessionRef.current = session;

    // Сохраняем при закрытии/уходе со страницы
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, enabled]);

  // Сохранение сессии в localStorage
  const saveSession = useCallback(() => {
    if (!sessionRef.current) return;

    try {
      const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      const analytics: Record<string, ProjectAnalytics> = stored ? JSON.parse(stored) : {};

      if (!analytics[projectId]) {
        analytics[projectId] = {
          projectId,
          sessions: [],
          totalSessions: 0,
          totalClicks: 0,
          averageSessionDuration: 0,
          heatmapData: {},
          screenTimes: [],
          transitions: [],
        };
      }

      // Добавляем сессию (ограничиваем количество)
      const projectAnalytics = analytics[projectId];
      projectAnalytics.sessions.push(sessionRef.current);
      
      // Храним максимум 50 последних сессий
      if (projectAnalytics.sessions.length > 50) {
        projectAnalytics.sessions = projectAnalytics.sessions.slice(-50);
      }

      // Пересчитываем агрегированные данные
      recalculateAggregates(projectAnalytics);

      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }, [projectId]);

  // Пересчет агрегированных данных
  const recalculateAggregates = (analytics: ProjectAnalytics) => {
    const sessions = analytics.sessions;
    
    analytics.totalSessions = sessions.length;
    analytics.totalClicks = sessions.reduce((sum, s) => sum + s.clicks.length, 0);
    
    // Среднее время сессии
    const durations = sessions
      .filter(s => s.endTime)
      .map(s => (s.endTime! - s.startTime));
    analytics.averageSessionDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length 
      : 0;

    // Тепловая карта по экранам и зонам
    const heatmapData: Record<string, ZoneHeatmapData> = {};
    
    sessions.forEach(session => {
      session.clicks.forEach(click => {
        const screenId = click.screenId;
        const zone = click.zone || 'content'; // fallback для старых данных
        
        // Инициализируем структуру для экрана если нужно
        if (!heatmapData[screenId]) {
          heatmapData[screenId] = {
            navbar: [],
            content: [],
            sticky: [],
          };
        }
        
        const zoneData = heatmapData[screenId][zone];
        
        // Ищем существующую точку рядом (в радиусе 0.03)
        const existing = zoneData.find(
          p => Math.abs(p.x - click.x) < 0.03 && Math.abs(p.y - click.y) < 0.03
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
    sessions.forEach(session => {
      Object.entries(session.screenTimes).forEach(([screenId, time]) => {
        if (!screenTimesMap[screenId]) {
          screenTimesMap[screenId] = { total: 0, visits: 0, name: screenId };
        }
        screenTimesMap[screenId].total += time;
        screenTimesMap[screenId].visits += 1;
      });
    });
    analytics.screenTimes = Object.entries(screenTimesMap).map(([screenId, data]) => ({
      screenId,
      screenName: data.name,
      totalTime: data.total,
      visits: data.visits,
    }));

    // Переходы между экранами
    const transitionsMap: Record<string, number> = {};
    sessions.forEach(session => {
      session.transitions.forEach(t => {
        const key = `${t.from}->${t.to}`;
        transitionsMap[key] = (transitionsMap[key] || 0) + 1;
      });
    });
    analytics.transitions = Object.entries(transitionsMap).map(([key, count]) => {
      const [from, to] = key.split('->');
      return { fromScreenId: from, toScreenId: to, count };
    });
  };

  // Трекинг клика
  const trackClick = useCallback((
    event: MouseEvent,
    containerRef: HTMLElement | null,
    componentId?: string,
    componentType?: string
  ) => {
    if (!enabled || !sessionRef.current) return;

    const target = event.target as HTMLElement;
    
    // Определяем зону клика через data-zone атрибут
    const zoneElement = target.closest('[data-zone]') as HTMLElement | null;
    const zone: ClickZone = (zoneElement?.getAttribute('data-zone') as ClickZone) || 'content';
    
    // Находим элемент зоны для расчёта координат
    let zoneRef: HTMLElement | null = zoneElement;
    
    // Если зона не найдена, ищем content зону
    if (!zoneRef && containerRef) {
      zoneRef = containerRef.querySelector('[data-zone="content"]') as HTMLElement;
    }
    
    if (!zoneRef) return;
    
    const rect = zoneRef.getBoundingClientRect();
    
    // Позиция клика относительно зоны
    const clickX = event.clientX - rect.left;
    const clickY = event.clientY - rect.top;
    
    // Нормализуем координаты относительно размера зоны
    const x = clickX / rect.width;
    const y = clickY / rect.height;

    const click: ClickEvent = {
      id: generateClickId(),
      timestamp: Date.now(),
      screenId: currentScreenRef.current || 'unknown',
      zone,
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      absoluteX: clickX,
      absoluteY: clickY,
      componentId,
      componentType,
    };

    sessionRef.current.clicks.push(click);
  }, [enabled]);

  // Трекинг смены экрана
  const trackScreenChange = useCallback((newScreenId: string) => {
    if (!enabled || !sessionRef.current) return;

    const now = Date.now();
    const previousScreen = currentScreenRef.current;

    // Записываем время на предыдущем экране
    if (previousScreen) {
      const timeSpent = now - screenStartTimeRef.current;
      sessionRef.current.screenTimes[previousScreen] = 
        (sessionRef.current.screenTimes[previousScreen] || 0) + timeSpent;

      // Записываем переход
      sessionRef.current.transitions.push({
        from: previousScreen,
        to: newScreenId,
        timestamp: now,
      });
    }

    currentScreenRef.current = newScreenId;
    screenStartTimeRef.current = now;
  }, [enabled]);

  // Завершение сессии
  const endSession = useCallback(() => {
    if (!sessionRef.current) return;

    const now = Date.now();
    
    // Записываем время на последнем экране
    if (currentScreenRef.current) {
      const timeSpent = now - screenStartTimeRef.current;
      sessionRef.current.screenTimes[currentScreenRef.current] = 
        (sessionRef.current.screenTimes[currentScreenRef.current] || 0) + timeSpent;
    }

    sessionRef.current.endTime = now;
    saveSession();
    sessionRef.current = null;
  }, [saveSession]);

  return {
    trackClick,
    trackScreenChange,
    endSession,
  };
}

// Утилита для получения аналитики проекта
export function getProjectAnalytics(projectId: string): ProjectAnalytics | null {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) return null;
    
    const analytics: Record<string, ProjectAnalytics> = JSON.parse(stored);
    return analytics[projectId] || null;
  } catch {
    return null;
  }
}

// Утилита для очистки аналитики проекта
export function clearProjectAnalytics(projectId: string): void {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!stored) return;
    
    const analytics: Record<string, ProjectAnalytics> = JSON.parse(stored);
    delete analytics[projectId];
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
  } catch (error) {
    console.error('Failed to clear analytics:', error);
  }
}
