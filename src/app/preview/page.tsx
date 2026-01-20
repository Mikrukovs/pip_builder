'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, Suspense, useCallback } from 'react';
import { Project, Screen } from '@/types';
import { ComponentRenderer } from '@/components/editor/ComponentRenderer';
import { useAnalytics } from '@/hooks/useAnalytics';

function PreviewContent() {
  const searchParams = useSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [currentScreenId, setCurrentScreenId] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  
  // Хуки для sticky секции - должны быть до любых условных return
  const stickyRef = useRef<HTMLDivElement>(null);
  const [stickyHeight, setStickyHeight] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Аналитика
  const { trackClick, trackScreenChange } = useAnalytics({
    projectId: project?.id || '',
    enabled: !!project,
  });

  // Загрузка проекта
  useEffect(() => {
    const shareId = searchParams.get('id');
    
    if (!shareId) {
      // Нет ID - показываем загрузку файла
      setShowUpload(true);
      return;
    }

    try {
      // Пробуем загрузить из localStorage по ID
      const sharedProjects = JSON.parse(localStorage.getItem('shared-projects') || '{}');
      const sharedData = sharedProjects[shareId];
      
      if (!sharedData?.project) {
        // Проект не найден - показываем загрузку файла
        setShowUpload(true);
        return;
      }
      
      setProject(sharedData.project);
      
      // Устанавливаем первую страницу как текущую
      if (sharedData.project.screens && sharedData.project.screens.length > 0) {
        setCurrentScreenId(sharedData.project.screens[0].id);
      }
    } catch {
      setShowUpload(true);
    }
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
            Прототип не найден на этом устройстве. Загрузите файл проекта.
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
  const otherSlots = currentScreen.slots.filter(slot => slot.component?.type !== 'navbar');
  const hasNavbar = !!navbarSlot?.component;

  return (
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
          className="px-4 py-6 space-y-4"
        >
          {otherSlots.map((slot) => (
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
