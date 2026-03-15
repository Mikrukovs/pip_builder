'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { Project, Screen, TabsProps } from '@/types';
import { ComponentRenderer } from '@/components/editor/ComponentRenderer';
import { useAnalytics } from '@/hooks/useAnalytics';
import { FormValidationProvider } from '@/contexts/FormValidationContext';

function PreviewContent() {
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [shareId, setShareId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  
  // Хуки для sticky секции - должны быть до любых условных return
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Аналитика - используем shareId для отслеживания
  const { trackClick, trackScreenChange } = useAnalytics({
    projectId: shareId || '',
    enabled: !!shareId,
  });

  // Загрузка проекта
  useEffect(() => {
    const shareIdFromUrl = searchParams.get('id');
    const encodedData = searchParams.get('data');
    
    // Сохраняем shareId для аналитики
    if (shareIdFromUrl) {
      setShareId(shareIdFromUrl);
    }
    
    // Сначала пробуем загрузить из URL параметра
    if (encodedData) {
      try {
        const decoded = decodeURIComponent(atob(encodedData));
        const loadedProject = JSON.parse(decoded) as Project;
        setProject(loadedProject);
        
        if (loadedProject.screens && loadedProject.screens.length > 0) {
          setCurrentScreenId(loadedProject.screens[0].id);
        }
        return;
      } catch (error) {
        console.error('Failed to decode project data:', error);
        // Продолжаем пробовать другие способы
      }
    }
    
    // Если нет data параметра, пробуем загрузить по ID
    if (!shareIdFromUrl) {
      // Нет ID - показываем загрузку файла
      setShowUpload(true);
      return;
    }

    // Загружаем проект с сервера по shareId
    const loadFromServer = async () => {
      try {
        const response = await fetch(`/api/share/${shareIdFromUrl}`);
        
        if (!response.ok) {
          throw new Error('Failed to load shared project');
        }
        
        const { project: loadedProject } = await response.json();
        setProject(loadedProject);
        
        // Устанавливаем первую страницу как текущую
        if (loadedProject.screens && loadedProject.screens.length > 0) {
          setCurrentScreenId(loadedProject.screens[0].id);
        }
      } catch (error) {
        console.error('Load shared project error:', error);
        setShowUpload(true);
      }
    };

    loadFromServer();
  }, [searchParams]);

  // Загрузка проекта из файла
  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const loadedProject = JSON.parse(text) as Project;
      
      setProject(loadedProject);
      setShowUpload(false);
      
      if (loadedProject.screens && loadedProject.screens.length > 0) {
        setCurrentScreenId(loadedProject.screens[0].id);
      }
    } catch {
      alert('Ошибка загрузки файла');
    }
  };

  // Измеряем высоту sticky секции для корректного padding
  useEffect(() => {
    if (stickyRef.current) {
      setStickyHeight(stickyRef.current.offsetHeight);
    }
  });

  // Трекинг смены экрана
  useEffect(() => {
    if (currentScreenId) {
      trackScreenChange(currentScreenId);
    }
  }, [currentScreenId, trackScreenChange]);

  const handleNavigate = useCallback((screenId: string) => {
    // Сохраняем текущий экран в историю перед переходом
    if (currentScreenId) {
      setNavigationHistory(prev => [...prev, currentScreenId]);
    }
    setCurrentScreenId(screenId);
    setActiveTabId(null); // Сбрасываем активный таб при переходе на другую страницу
  }, [currentScreenId]);

  const handleBack = useCallback(() => {
    if (navigationHistory.length > 0) {
      // Берём последний экран из истории
      const previousScreen = navigationHistory[navigationHistory.length - 1];
      // Убираем его из истории
      setNavigationHistory(prev => prev.slice(0, -1));
      // Переходим на него (без добавления в историю)
      setCurrentScreenId(previousScreen);
    }
  }, [navigationHistory]);

  const handleTabChange = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  // Обработчик кликов для аналитики
  const handleContentClick = useCallback((event: React.MouseEvent) => {
    if (contentRef.current) {
      // Определяем, был ли клик по компоненту
      const target = event.target as HTMLElement;
      const componentEl = target.closest('[data-component-id]');
      const componentId = componentEl?.getAttribute('data-component-id') || undefined;
      const componentType = componentEl?.getAttribute('data-component-type') || undefined;
      
      trackClick(event.nativeEvent, contentRef.current, componentId, componentType);
    }
  }, [trackClick]);

  if (showUpload) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Загрузить прототип</h1>
          <p className="text-gray-600 mb-6">
            Прототип не найден. Загрузите файл проекта или используйте ссылку для шаринга из редактора.
          </p>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="hidden"
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 
                       transition-colors font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Выбрать файл
          </button>
          
          <p className="text-xs text-gray-400 mt-4">
            Файл .json, экспортированный из Prototype Builder
          </p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentScreen: Screen | undefined = project.screens.find(s => s.id === currentScreenId);
  const hasStickyContent = currentScreen?.stickySlots && currentScreen.stickySlots.some(slot => slot.component);

  if (!currentScreen) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">Страница не найдена</div>
      </div>
    );
  }

  // Встроенные кастомные компоненты из проекта
  const embeddedComponents = project.customComponents;

  // Находим навбар среди компонентов (рендерим его отдельно сверху)
  const navbarSlot = currentScreen.slots.find(slot => slot.component?.type === 'navbar');
  
  // Находим табы
  const tabsSlot = currentScreen.slots.find(slot => slot.component?.type === 'tabs');
  const tabsConfig = tabsSlot?.component as TabsProps | undefined;
  
  // Определяем активный таб (если есть табы на странице)
  const currentActiveTabId = activeTabId || tabsConfig?.items[tabsConfig.defaultTabIndex]?.id || null;
  
  // Получаем список slotId которые должны быть видимы для активного таба
  const activeTabItem = tabsConfig?.items.find(item => item.id === currentActiveTabId);
  const visibleSlotIds = activeTabItem?.visibleSlotIds || [];
  
  // Собираем все slotIds которые привязаны хотя бы к одному табу
  const allBoundSlotIds = new Set<string>();
  tabsConfig?.items.forEach(item => {
    item.visibleSlotIds.forEach(id => allBoundSlotIds.add(id));
  });
  
  // Фильтруем слоты:
  // - Навбар рендерим отдельно
  // - Табы рендерим всегда (они не привязываются к себе)
  // - Слоты без привязки к табам показываем всегда
  // - Слоты с привязкой показываем только если они в visibleSlotIds активного таба
  const otherSlots = currentScreen.slots.filter(slot => {
    if (slot.component?.type === 'navbar') return false;
    if (slot.component?.type === 'tabs') return true; // Табы всегда видны
    
    // Если слот не привязан ни к одному табу - показываем всегда
    if (!allBoundSlotIds.has(slot.id)) return true;
    
    // Если есть привязка - показываем только если в активном табе
    return visibleSlotIds.includes(slot.id);
  });
  
  const hasNavbar = !!navbarSlot?.component;

  return (
    <FormValidationProvider>
      <div 
        ref={contentRef}
        className="min-h-screen bg-gray-100 flex justify-center"
        onClick={handleContentClick}
      >
        {/* Навбар - fixed сверху */}
        {hasNavbar && navbarSlot?.component && (
          <div 
            data-zone="navbar"
            className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] z-40 bg-white shadow-sm"
          >
            <ComponentRenderer 
              config={navbarSlot.component} 
              preview 
              onNavigate={handleNavigate}
              onBack={handleBack}
              embeddedComponents={embeddedComponents}
            />
          </div>
        )}

        {/* Основной контейнер */}
        <div 
          className="relative w-full max-w-[375px] min-h-screen bg-white shadow-lg"
          style={{
            paddingTop: hasNavbar ? 56 : 0, // высота навбара
            paddingBottom: hasStickyContent ? stickyHeight : 0,
          }}
        >
          {/* Основной контент - data-zone здесь для точных координат */}
          <div
            data-zone="content"
            className="px-4 py-6 space-y-2"
          >
            {otherSlots.map((slot) => (
              slot.component && (
                <div key={slot.id}>
                  <ComponentRenderer 
                    config={slot.component} 
                    preview 
                    onNavigate={handleNavigate}
                    onBack={handleBack}
                    activeTabId={currentActiveTabId}
                    onTabChange={handleTabChange}
                    embeddedComponents={embeddedComponents}
                  />
                </div>
              )
            ))}
          </div>
        </div>

        {/* Sticky секция - fixed внизу */}
        {hasStickyContent && (
          <div 
            ref={stickyRef}
            data-zone="sticky"
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] bg-white border-t border-gray-200 shadow-lg z-30"
          >
            <div className="px-4 py-3 space-y-2">
              {currentScreen.stickySlots!.map((slot) => (
                slot.component && (
                  <div key={slot.id}>
                    <ComponentRenderer 
                      config={slot.component} 
                      preview 
                      onNavigate={handleNavigate}
                      onBack={handleBack}
                      embeddedComponents={embeddedComponents}
                    />
                  </div>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </FormValidationProvider>
  );
}

export default function PreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <PreviewContent />
    </Suspense>
  );
}
