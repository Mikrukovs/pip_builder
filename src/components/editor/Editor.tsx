'use client';

import { useEditorStore, useHydration } from '@/store/editor';
import { useCustomComponentsStore } from '@/store/custom-components';
import { useAuthStore } from '@/store/auth';
import { Canvas } from './Canvas';
import { ComponentPicker } from './ComponentPicker';
import { SettingsPanel } from './SettingsPanel';
import { ImportComponentModal } from './ImportComponentModal';
import { AnalyticsPanel } from './AnalyticsPanel';
import { TelegramLogin, UserProfile } from '@/components/auth';
import { useState, useEffect } from 'react';
import { Project } from '@/types';

export function Editor() {
  const {
    project,
    selectedSlotId,
    selectedSlotType,
    showComponentPicker,
    createProject,
    toggleComponentPicker,
    addComponentToSlot,
    updateComponent,
    removeComponentFromSlot,
    getShareableLink,
    getCurrentScreen,
  } = useEditorStore();

  const [shareLink, setShareLink] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Ждём гидратации zustand store (загрузка данных из localStorage)
  const hydrated = useHydration();
  
  // Хук для кастомных компонентов - должен быть до условных return
  const { components: customComponents } = useCustomComponentsStore();
  
  // Авторизация
  const { isAuthenticated } = useAuthStore();

  // Создаём проект при первом запуске, если его нет (только после гидратации)
  useEffect(() => {
    if (hydrated && !project) {
      createProject('Мой прототип');
    }
  }, [hydrated, project, createProject]);

  // Показываем загрузку пока ждём данные из localStorage
  if (!hydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Загрузка...</span>
        </div>
      </div>
    );
  }

  const currentScreen = getCurrentScreen();
  // Ищем слот в правильном массиве в зависимости от типа
  const selectedSlot = selectedSlotType === 'sticky'
    ? currentScreen?.stickySlots?.find((s) => s.id === selectedSlotId)
    : currentScreen?.slots.find((s) => s.id === selectedSlotId);

  // Получаем проект с встроенными кастомными компонентами для экспорта
  const getProjectWithEmbeddedComponents = (): Project | null => {
    if (!project) return null;

    // Собираем имена всех используемых кастомных компонентов
    const usedNames = new Set<string>();
    project.screens.forEach((screen) => {
      [...screen.slots, ...screen.stickySlots].forEach((slot) => {
        if (slot.component?.type === 'custom') {
          usedNames.add((slot.component as { componentName: string }).componentName);
        }
      });
    });

    // Находим определения
    const embeddedComponents = customComponents
      .filter((c) => usedNames.has(c.name))
      .map((c) => c as unknown as Record<string, unknown>);

    return {
      ...project,
      customComponents: embeddedComponents.length > 0 ? embeddedComponents : undefined,
    };
  };

  const handleShare = () => {
    const link = getShareableLink();
    setShareLink(link);
    setShowShareModal(true);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top bar */}
      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg" />
          <span className="font-semibold text-gray-900">Prototype Builder</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Авторизация через Telegram */}
          {isAuthenticated ? (
            <UserProfile />
          ) : (
            <TelegramLogin botName={process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || ''} />
          )}
          
          <div className="h-6 w-px bg-gray-200" />
          
          <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="px-3 py-1.5 text-sm text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Импорт
          </button>
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1.5 ${
              showAnalytics 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Аналитика
          </button>
          <button
            onClick={() => createProject('Новый прототип')}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Новый проект
          </button>
          <button
            onClick={handleShare}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Поделиться
          </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Component picker (всегда показываем при выбранном слоте) */}
        <div
          className={`
            bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden
            ${selectedSlotId && !showAnalytics ? 'w-72' : 'w-0'}
          `}
        >
          {selectedSlotId && !showAnalytics && (
            <ComponentPicker
              onSelect={(type, customComponentName) => addComponentToSlot(selectedSlotId, type, customComponentName)}
              onClose={() => toggleComponentPicker(false)}
            />
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1">
          <Canvas />
        </div>

        {/* Right panel - Settings */}
        <div
          className={`
            bg-white border-l border-gray-200 transition-all duration-300 overflow-hidden
            ${selectedSlot?.component && !showAnalytics ? 'w-80' : 'w-0'}
          `}
        >
          {selectedSlot?.component && !showAnalytics && (
            <SettingsPanel
              config={selectedSlot.component}
              onChange={(props) => updateComponent(selectedSlotId!, props)}
              onRemove={() => removeComponentFromSlot(selectedSlotId!)}
            />
          )}
        </div>

        {/* Analytics panel */}
        {showAnalytics && project && (
          <AnalyticsPanel
            projectId={project.id}
            currentScreenId={currentScreen?.id || null}
            screens={project.screens.map(s => ({ id: s.id, name: s.name }))}
            currentScreen={currentScreen || null}
            embeddedComponents={project.customComponents}
            onClose={() => setShowAnalytics(false)}
          />
        )}
      </div>

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Поделиться прототипом</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Ссылка для этого браузера */}
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Ссылка для этого браузера:
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={shareLink}
                  readOnly
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-600"
                />
                <button
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-600 text-white'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
            </div>

            {/* Экспорт для другого устройства */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Для другого устройства (iOS симулятор и т.д.):
              </p>
              <button
                onClick={() => {
                  const exportProject = getProjectWithEmbeddedComponents();
                  if (!exportProject) return;
                  const blob = new Blob([JSON.stringify(exportProject, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${exportProject.name || 'prototype'}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 
                           transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Скачать файл проекта
              </button>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Откройте /preview и загрузите файл
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Import component modal */}
      <ImportComponentModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </div>
  );
}
