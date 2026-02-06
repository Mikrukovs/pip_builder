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
  const serverSessionIdRef = useRef<string | null>(null);

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

    // Создаём сессию на сервере
    fetch('/api/analytics/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId,
        startTime: session.startTime,
        userAgent: navigator.userAgent,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        serverSessionIdRef.current = data.sessionId;
      })
      .catch((error) => {
        console.error('Failed to create analytics session:', error);
      });

    // Периодически сохраняем данные на сервер (каждые 10 секунд)
    const saveInterval = setInterval(() => {
      saveSession();
    }, 10000);

    // Сохраняем при закрытии/уходе со страницы
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(saveInterval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      endSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, enabled]);

  // Сохранение сессии на сервер
  const saveSession = useCallback(() => {
    if (!sessionRef.current || !serverSessionIdRef.current) return;

    try {
      // Отправляем данные на сервер
      fetch(`/api/analytics/session/${serverSessionIdRef.current}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clicks: sessionRef.current.clicks,
          screenTimes: sessionRef.current.screenTimes,
          transitions: sessionRef.current.transitions,
          endTime: sessionRef.current.endTime,
        }),
      }).catch((error) => {
        console.error('Failed to save analytics session:', error);
      });
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }, []);

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
