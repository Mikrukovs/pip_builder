'use client';

import { InputProps } from '@/types';
import { useState } from 'react';

interface Props {
  config: InputProps;
  onChange: (props: Partial<InputProps>) => void;
}

// Иконки для видов инпута
const InputVariantIcon = ({ variant }: { variant: string }) => {
  switch (variant) {
    case 'search':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case 'dropdown':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      );
    case 'password':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      );
  }
};

const inputVariants = [
  { value: 'default', label: 'Стандартный', description: 'Обычное поле ввода' },
  { value: 'search', label: 'Поисковый', description: 'С иконкой лупы и фильтрацией' },
  { value: 'dropdown', label: 'Выпадающий список', description: 'Выбор из заданных опций' },
  { value: 'password', label: 'Пароль', description: 'Скрытый ввод с кнопкой показа' },
] as const;

export function InputSettings({ config, onChange }: Props) {
  const [variantDropdownOpen, setVariantDropdownOpen] = useState(false);

  const updateValidation = (updates: Partial<InputProps['validation']>) => {
    onChange({
      validation: { ...config.validation, ...updates }
    });
  };

  // Для обратной совместимости
  const currentVariant = config.inputVariant || 'default';
  const currentVariantInfo = inputVariants.find(v => v.value === currentVariant) || inputVariants[0];

  // Управление опциями dropdown
  const addDropdownOption = () => {
    const newOptions = [
      ...(config.dropdownOptions || []),
      { id: Date.now().toString(), label: `Вариант ${(config.dropdownOptions?.length || 0) + 1}` }
    ];
    onChange({ dropdownOptions: newOptions });
  };

  const updateDropdownOption = (id: string, label: string) => {
    const newOptions = (config.dropdownOptions || []).map(opt => 
      opt.id === id ? { ...opt, label } : opt
    );
    onChange({ dropdownOptions: newOptions });
  };

  const removeDropdownOption = (id: string) => {
    const newOptions = (config.dropdownOptions || []).filter(opt => opt.id !== id);
    onChange({ dropdownOptions: newOptions });
  };

  return (
    <div className="space-y-4">
      {/* Вид инпута - кастомный dropdown */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Вид инпута
        </label>
        <button
          onClick={() => setVariantDropdownOpen(!variantDropdownOpen)}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-300 
                     hover:border-gray-400 transition-colors bg-white text-left"
        >
          <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
            <InputVariantIcon variant={currentVariant} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900">{currentVariantInfo.label}</div>
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform ${variantDropdownOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {variantDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setVariantDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 max-h-64 overflow-y-auto">
              {inputVariants.map((variant) => (
                <button
                  key={variant.value}
                  onClick={() => {
                    onChange({ inputVariant: variant.value });
                    setVariantDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    currentVariant === variant.value
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="w-7 h-7 rounded-md bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                    <InputVariantIcon variant={variant.value} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm ${currentVariant === variant.value ? 'font-medium text-blue-700' : 'text-gray-900'}`}>
                      {variant.label}
                    </div>
                    <div className="text-xs text-gray-500">{variant.description}</div>
                  </div>
                  {currentVariant === variant.value && (
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Placeholder
        </label>
        <input
          type="text"
          value={config.placeholder}
          onChange={(e) => onChange({ placeholder: e.target.value })}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Показывать лейбл
        </label>
        <button
          onClick={() => onChange({ showLabel: !config.showLabel })}
          className={`relative w-11 h-6 rounded-full transition-colors ${
            config.showLabel ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              config.showLabel ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>

      {config.showLabel && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Текст лейбла
          </label>
          <input
            type="text"
            value={config.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Тип ввода - только для default и search */}
      {(currentVariant === 'default' || currentVariant === 'search') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Тип ввода
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ inputType: 'text' })}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                config.inputType === 'text'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Текст
            </button>
            <button
              onClick={() => onChange({ inputType: 'numeric' })}
              className={`flex-1 px-3 py-2 rounded-lg border transition-colors ${
                config.inputType === 'numeric'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Число
            </button>
          </div>
        </div>
      )}

      {/* Опции для dropdown и search */}
      {(currentVariant === 'dropdown' || currentVariant === 'search') && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Опции списка
            </label>
            <button
              onClick={addDropdownOption}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Добавить
            </button>
          </div>
          <div className="space-y-2">
            {(config.dropdownOptions || []).map((option, index) => (
              <div key={option.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateDropdownOption(option.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => removeDropdownOption(option.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            {(!config.dropdownOptions || config.dropdownOptions.length === 0) && (
              <p className="text-xs text-gray-400 text-center py-2">
                Нет опций. Добавьте первую.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Подсказка (по умолчанию)
        </label>
        <input
          type="text"
          value={config.descriptor}
          onChange={(e) => onChange({ descriptor: e.target.value })}
          placeholder="Текст под полем"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Валидация - только для default и password */}
      {(currentVariant === 'default' || currentVariant === 'password') && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-gray-700">
              Валидация
            </label>
            <button
              onClick={() => updateValidation({ enabled: !config.validation.enabled })}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                config.validation.enabled ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  config.validation.enabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          {config.validation.enabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-2">
                  Тип проверки
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateValidation({ type: 'exact' })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      config.validation.type === 'exact'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Точное значение
                  </button>
                  <button
                    onClick={() => updateValidation({ type: 'range' })}
                    className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                      config.validation.type === 'range'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Диапазон
                  </button>
                </div>
              </div>

              {config.validation.type === 'exact' ? (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Правильное значение
                  </label>
                  <input
                    type="text"
                    value={config.validation.exactValue}
                    onChange={(e) => updateValidation({ exactValue: e.target.value })}
                    placeholder="Введите правильный ответ"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Минимум
                      </label>
                      <input
                        type="number"
                        value={config.validation.min ?? ''}
                        onChange={(e) => updateValidation({ 
                          min: e.target.value ? Number(e.target.value) : null 
                        })}
                        placeholder="Не задан"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Максимум
                      </label>
                      <input
                        type="number"
                        value={config.validation.max ?? ''}
                        onChange={(e) => updateValidation({ 
                          max: e.target.value ? Number(e.target.value) : null 
                        })}
                        placeholder="Не задан"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">
                    Оставьте пустым для проверки только одной границы
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-2">Сообщения</p>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      При ошибке
                    </label>
                    <input
                      type="text"
                      value={config.validation.errorMessage}
                      onChange={(e) => updateValidation({ errorMessage: e.target.value })}
                      placeholder="Неверное значение"
                      className="w-full px-3 py-2 rounded-lg border border-red-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      При успехе
                    </label>
                    <input
                      type="text"
                      value={config.validation.successMessage}
                      onChange={(e) => updateValidation({ successMessage: e.target.value })}
                      placeholder="Верно!"
                      className="w-full px-3 py-2 rounded-lg border border-green-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
