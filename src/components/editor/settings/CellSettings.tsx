'use client';

import { CellProps } from '@/types';
import { useRef, useState } from 'react';
import { compressImage } from '@/utils/image';
import { useEditorStore } from '@/store/editor';

interface Props {
  config: CellProps;
  onChange: (props: Partial<CellProps>) => void;
}

// Иконки для типов ячеек
const CellTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'basic':
      return (
        <div className="w-5 h-3 border border-gray-300 rounded" />
      );
    case 'navigation':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'toggle':
      return (
        <div className="w-8 h-4 bg-blue-500 rounded-full relative">
          <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
        </div>
      );
    case 'checkbox':
      return (
        <div className="w-4 h-4 bg-blue-500 rounded flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'radio':
      return (
        <div className="w-4 h-4 border-2 border-blue-500 rounded-full flex items-center justify-center">
          <div className="w-2 h-2 bg-blue-500 rounded-full" />
        </div>
      );
    case 'info':
      return (
        <span className="text-sm font-medium text-gray-600">123</span>
      );
    case 'icon':
      return (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    default:
      return null;
  }
};

const cellTypes = [
  { value: 'basic', label: 'Базовая', description: 'Без контролов справа' },
  { value: 'navigation', label: 'Навигация', description: 'Переход на другую страницу' },
  { value: 'icon', label: 'С иконкой', description: 'Иконка справа' },
  { value: 'toggle', label: 'Переключатель', description: 'Вкл/выкл опцию' },
  { value: 'checkbox', label: 'Чекбокс', description: 'Множественный выбор' },
  { value: 'radio', label: 'Радио', description: 'Единственный выбор' },
  { value: 'info', label: 'Информация', description: 'Показать значение справа' },
] as const;

export function CellSettings({ config, onChange }: Props) {
  const iconInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false);
  const { project } = useEditorStore();

  const handleIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressed = await compressImage(file, {
        maxWidth: 128,
        maxHeight: 128,
        quality: 0.8,
      });
      onChange({ icon: compressed });
    } catch (error) {
      console.error('Failed to compress icon:', error);
      const reader = new FileReader();
      reader.onload = () => {
        onChange({ icon: reader.result as string });
      };
      reader.readAsDataURL(file);
    } finally {
      setLoading(false);
    }
  };

  const currentType = cellTypes.find(t => t.value === config.cellType) || cellTypes[0];

  return (
    <div className="space-y-4">
      {/* Тип ячейки - кастомный dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Тип ячейки
        </label>
        <button
          onClick={() => setTypeDropdownOpen(!typeDropdownOpen)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-300 
                     hover:border-gray-400 transition-colors bg-white text-left"
        >
          <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <CellTypeIcon type={currentType.value} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{currentType.label}</div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {typeDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setTypeDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
              {cellTypes.map((cellType) => (
                <button
                  key={cellType.value}
                  onClick={() => {
                    onChange({ cellType: cellType.value });
                    setTypeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    config.cellType === cellType.value
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <CellTypeIcon type={cellType.value} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${config.cellType === cellType.value ? 'font-medium text-blue-700' : 'text-gray-900'}`}>
                      {cellType.label}
                    </div>
                    <div className="text-xs text-gray-500">{cellType.description}</div>
                  </div>
                  {config.cellType === cellType.value && (
                    <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Иконка - toggle + загрузка */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">
            Иконка
          </label>
          <button
            onClick={() => onChange({ showIcon: config.showIcon === false ? true : false })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              config.showIcon !== false ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.showIcon !== false ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>
        
        {config.showIcon !== false && (
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-12 h-12 border-2 border-dashed border-blue-300 rounded-lg 
                             flex items-center justify-center bg-blue-50">
                <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full" />
              </div>
            ) : config.icon ? (
              <div className="relative">
                <img
                  src={config.icon}
                  alt="icon"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <button
                  onClick={() => onChange({ icon: '' })}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => iconInputRef.current?.click()}
                className="w-12 h-12 border-2 border-dashed border-gray-300 rounded-lg 
                           flex items-center justify-center 
                           hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <button
              onClick={() => iconInputRef.current?.click()}
              className="text-sm text-blue-600 hover:text-blue-700"
              disabled={loading}
            >
              {loading ? 'Сжатие...' : config.icon ? 'Изменить' : 'Загрузить'}
            </button>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              onChange={handleIconChange}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Заголовок */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Заголовок
        </label>
        <input
          type="text"
          value={config.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Подзаголовок */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Показывать подзаголовок
        </label>
        <button
          onClick={() => onChange({ showSubtitle: !config.showSubtitle })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.showSubtitle ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              config.showSubtitle ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {config.showSubtitle && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст подзаголовка
            </label>
            <input
              type="text"
              value={config.subtitle}
              onChange={(e) => onChange({ subtitle: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Позиция подзаголовка
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ subtitlePosition: 'top' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  config.subtitlePosition === 'top'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Сверху
              </button>
              <button
                onClick={() => onChange({ subtitlePosition: 'bottom' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                  config.subtitlePosition === 'bottom'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Снизу
              </button>
            </div>
          </div>
        </>
      )}

      {/* Настройки для navigation */}
      {config.cellType === 'navigation' && (
        <div className="pt-3 border-t border-gray-200 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Действие
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onChange({ action: 'none' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
                  config.action === 'none'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                Нет
              </button>
              <button
                onClick={() => onChange({ action: 'navigate' })}
                className={`flex-1 px-3 py-2 rounded-lg border transition-colors text-sm ${
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Целевая страница
              </label>
              <select
                value={config.targetScreenId || ''}
                onChange={(e) => onChange({ targetScreenId: e.target.value || null })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Не выбрано</option>
                {project?.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Настройки для info (summ) */}
      {config.cellType === 'info' && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Значение (summ)
          </label>
          <input
            type="text"
            value={config.infoValue || ''}
            onChange={(e) => onChange({ infoValue: e.target.value })}
            placeholder="Например: 1 500 ₽"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Отображается справа, выровнено по заголовку
          </p>
        </div>
      )}

      {/* Настройки для radio */}
      {config.cellType === 'radio' && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Группа радиокнопок
          </label>
          <input
            type="text"
            value={config.radioGroup || 'default'}
            onChange={(e) => onChange({ radioGroup: e.target.value })}
            placeholder="default"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="mt-1 text-xs text-gray-400">
            Радиокнопки с одинаковой группой работают вместе
          </p>
        </div>
      )}

      {/* Настройки для icon */}
      {config.cellType === 'icon' && (
        <div className="pt-3 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Иконка справа
          </label>
          <div className="flex items-center gap-3">
            {config.rightIcon ? (
              <div className="relative">
                <img
                  src={config.rightIcon}
                  alt="icon"
                  className="w-10 h-10 rounded-lg object-contain border border-gray-200"
                />
                <button
                  onClick={() => onChange({ rightIcon: '' })}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      try {
                        const compressed = await compressImage(file, {
                          maxWidth: 128,
                          maxHeight: 128,
                          quality: 0.8,
                        });
                        onChange({ rightIcon: compressed });
                      } catch {
                        const reader = new FileReader();
                        reader.onload = () => {
                          onChange({ rightIcon: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  };
                  input.click();
                }}
                className="w-10 h-10 border-2 border-dashed border-gray-300 rounded-lg 
                           flex items-center justify-center 
                           hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
            <span className="text-sm text-gray-500">
              {config.rightIcon ? 'Загружена' : 'Загрузить'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
