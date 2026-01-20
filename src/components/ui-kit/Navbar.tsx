'use client';

import { NavbarProps, ComponentProps } from '@/types';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  config: NavbarProps;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
  onBack?: () => void;
  // Функция для рендеринга компонентов в bottom sheet
  renderComponent?: (config: ComponentProps) => React.ReactNode;
}

export function Navbar({ config, preview, onNavigate, onBack, renderComponent }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Для Portal нужно дождаться монтирования на клиенте
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleBackClick = () => {
    if (!preview) return;
    
    if (config.backButton.action === 'back' && onBack) {
      onBack();
    } else if (config.backButton.action === 'navigate' && config.backButton.targetScreenId && onNavigate) {
      onNavigate(config.backButton.targetScreenId);
    }
  };

  const hasMenuContent = config.menu.slots.some(slot => slot.component !== null);

  return (
    <>
      <div className="relative flex items-center justify-between h-14 px-4 bg-white border-b border-gray-200">
        {/* Левая часть - кнопка назад */}
        <div className="flex-1 flex items-center">
          {config.backButton.show && (
            <button
              onClick={handleBackClick}
              className={`flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors ${
                preview ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {config.backButton.style === 'iconText' && (
                <span className="text-base">{config.backButton.text}</span>
              )}
            </button>
          )}
        </div>

        {/* Центральная часть - заголовок */}
        <div className="flex-1 flex flex-col items-center justify-center min-w-0">
          <span className="font-semibold text-gray-900 truncate max-w-full">
            {config.title}
          </span>
          {config.showSubtitle && config.subtitle && (
            <span className="text-xs text-gray-500 truncate max-w-full">
              {config.subtitle}
            </span>
          )}
        </div>

        {/* Правая часть - кнопка меню */}
        <div className="flex-1 flex items-center justify-end">
          {config.menu.show ? (
            <button
              onClick={() => preview && setSheetOpen(true)}
              className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${
                preview ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <svg className="w-6 h-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
          ) : (
            <div className="w-10" />
          )}
        </div>
      </div>

      {/* Bottom Sheet - рендерим через Portal в body чтобы избежать проблем с fixed внутри fixed */}
      {sheetOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[100] animate-fade-in flex justify-center">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          
          {/* Sheet - ограничен шириной устройства */}
          <div className="absolute bottom-0 w-full max-w-[375px] bg-white rounded-t-2xl shadow-xl animate-slide-up max-h-[80vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            {config.menu.title && (
              <div className="px-4 pb-3 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  {config.menu.title}
                </h3>
              </div>
            )}
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {hasMenuContent ? (
                config.menu.slots.map((slot) => (
                  slot.component && renderComponent && (
                    <div key={slot.id}>
                      {renderComponent(slot.component)}
                    </div>
                  )
                ))
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">
                  {preview ? 'Меню пустое' : 'Добавьте компоненты в настройках'}
                </div>
              )}
            </div>
            
            {/* Close button for accessibility */}
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
