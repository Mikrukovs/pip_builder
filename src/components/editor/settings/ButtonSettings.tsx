'use client';

import { ButtonProps } from '@/types';
import { useEditorStore } from '@/store/editor';

interface Props {
  config: ButtonProps;
  onChange: (props: Partial<ButtonProps>) => void;
}

export function ButtonSettings({ config, onChange }: Props) {
  const { project } = useEditorStore();
  const screens = project?.screens || [];

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Текст кнопки
        </label>
        <input
          type="text"
          value={config.label}
          onChange={(e) => onChange({ label: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Тип кнопки
        </label>
        <div className="space-y-2">
          {[
            { value: 'primary', label: 'Primary', desc: 'Основное действие' },
            { value: 'secondary', label: 'Secondary', desc: 'Второстепенное' },
            { value: 'destructive', label: 'Destructive', desc: 'Опасное действие' },
          ].map((variant) => (
            <button
              key={variant.value}
              onClick={() => onChange({ variant: variant.value as ButtonProps['variant'] })}
              className={`w-full px-3 py-2 rounded-lg border text-left transition-colors ${
                config.variant === variant.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <span className="font-medium text-gray-900">{variant.label}</span>
              <span className="text-sm text-gray-500 ml-2">{variant.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Размер
        </label>
        <div className="flex gap-2">
          {['s', 'm', 'l'].map((size) => (
            <button
              key={size}
              onClick={() => onChange({ size: size as ButtonProps['size'] })}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors font-medium uppercase ${
                config.size === size
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400 text-gray-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Действие кнопки */}
      <div className="pt-3 border-t border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Действие при нажатии
        </label>
        <div className="flex gap-2">
          <button
            onClick={() => onChange({ action: 'none', targetScreenId: null })}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              config.action === 'none'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            Нет
          </button>
          <button
            onClick={() => onChange({ action: 'navigate' })}
            className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
              config.action === 'navigate'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            Переход
          </button>
        </div>
      </div>

      {config.action === 'navigate' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Перейти на страницу
          </label>
          {screens.length > 0 ? (
            <div className="space-y-2">
              {screens.map((screen) => (
                <button
                  key={screen.id}
                  onClick={() => onChange({ targetScreenId: screen.id })}
                  className={`w-full px-3 py-2 rounded-lg border text-left transition-colors ${
                    config.targetScreenId === screen.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>{screen.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Нет доступных страниц</p>
          )}
        </div>
      )}
    </div>
  );
}
