'use client';

import { ComponentType } from '@/types';
import { useCustomComponentsStore } from '@/store/custom-components';

interface Props {
  onSelect: (type: ComponentType, customComponentName?: string) => void;
  onClose: () => void;
}

const builtInComponents: { type: ComponentType; name: string; icon: React.ReactNode }[] = [
  {
    type: 'heading',
    name: 'Заголовок',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
      </svg>
    ),
  },
  {
    type: 'text',
    name: 'Текст',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    type: 'button',
    name: 'Кнопка',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
      </svg>
    ),
  },
  {
    type: 'input',
    name: 'Поле ввода',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    type: 'selector',
    name: 'Селектор',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    type: 'image',
    name: 'Изображение',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'cell',
    name: 'Ячейка',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    type: 'navbar',
    name: 'Навбар',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
];

export function ComponentPicker({ onSelect, onClose }: Props) {
  const { components: customComponents } = useCustomComponentsStore();

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Компоненты</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Базовые компоненты */}
      <div className="mb-4">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Базовые</h3>
        <div className="space-y-2">
          {builtInComponents.map((component) => (
            <button
              key={component.type}
              onClick={() => onSelect(component.type)}
              className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 
                         hover:border-blue-500 hover:bg-blue-50 transition-all duration-150"
            >
              <div className="text-gray-600">{component.icon}</div>
              <span className="font-medium text-gray-900">{component.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Кастомные компоненты */}
      {customComponents.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Импортированные
          </h3>
          <div className="space-y-2">
            {customComponents.map((component) => (
              <button
                key={component.name}
                onClick={() => onSelect('custom', component.name)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-purple-200 
                           hover:border-purple-500 hover:bg-purple-50 transition-all duration-150"
              >
                <div className="text-2xl">{component.icon || '📦'}</div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">{component.displayName}</div>
                  {component.description && (
                    <div className="text-xs text-gray-500 truncate">{component.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Подсказка про импорт */}
      {customComponents.length === 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-500">
            Импортируйте кастомные компоненты через меню
          </p>
        </div>
      )}
    </div>
  );
}
