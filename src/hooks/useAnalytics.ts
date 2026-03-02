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
    
    // Для navbar и sticky используем координаты относительно зоны
    if (zone === 'navbar' || zone === 'sticky') {
      if (!zoneElement) return;
      
      const rect = zoneElement.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
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
      return;
    }
    
    // Для content зоны используем координаты относительно ВСЕГО экрана (viewport)
    // Это позволяет отображать клики даже в пустых областях
    if (!containerRef) return;
    
    const containerRect = containerRef.getBoundingClientRect();
    
    // Находим navbar и sticky для расчета области контента
    const navbarElement = containerRef.querySelector('[data-zone="navbar"]') as HTMLElement | null;
    const stickyElement = containerRef.querySelector('[data-zone="sticky"]') as HTMLElement | null;
    
    const navbarHeight = navbarElement?.offsetHeight || 0;
    const stickyHeight = stickyElement?.offsetHeight || 0;
    
    // Высота области контента = высота контейнера - navbar - sticky
    const contentAreaHeight = containerRect.height - navbarHeight - stickyHeight;
    
    // Позиция клика относительно начала content области
    const clickX = event.clientX - containerRect.left;
    const clickY = event.clientY - containerRect.top - navbarHeight;
    
    // Нормализуем координаты
    const x = clickX / containerRect.width;
    const y = clickY / contentAreaHeight;

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
