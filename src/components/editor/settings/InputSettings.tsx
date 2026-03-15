'use client';

import { InputProps, SearchCell, SearchTab } from '@/types';
import { useState } from 'react';
import { useEditorStore } from '@/store/editor';
import { v4 as uuidv4 } from 'uuid';

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
  const [expandedCellId, setExpandedCellId] = useState<string | null>(null);
  const { project } = useEditorStore();

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

  // === Inline Search: Табы ===
  const searchTabs = config.searchTabs || [];
  const searchCells = config.searchCells || [];
  const searchMode = config.searchMode || 'dropdown';

  const addSearchTab = () => {
    if (searchTabs.length >= 10) return;
    const newTabs: SearchTab[] = [
      ...searchTabs,
      { id: uuidv4(), text: `Категория ${searchTabs.length + 1}` }
    ];
    onChange({ searchTabs: newTabs });
  };

  const updateSearchTab = (id: string, text: string) => {
    const newTabs = searchTabs.map(tab => 
      tab.id === id ? { ...tab, text } : tab
    );
    onChange({ searchTabs: newTabs });
  };

  const removeSearchTab = (id: string) => {
    if (searchTabs.length <= 1) return;
    const newTabs = searchTabs.filter(tab => tab.id !== id);
    // Удаляем этот таб из всех ячеек
    const newCells = searchCells.map(cell => ({
      ...cell,
      tabIds: cell.tabIds.filter(tabId => tabId !== id)
    }));
    onChange({ searchTabs: newTabs, searchCells: newCells });
  };

  // === Inline Search: Ячейки ===
  const addSearchCell = () => {
    const newCell: SearchCell = {
      id: uuidv4(),
      icon: '',
      title: `Результат ${searchCells.length + 1}`,
      subtitle: 'Описание',
      showSubtitle: true,
      tabIds: searchTabs.length > 0 ? [searchTabs[0].id] : [],
      action: 'none',
      targetScreenId: null,
    };
    onChange({ searchCells: [...searchCells, newCell] });
    setExpandedCellId(newCell.id);
  };

  const updateSearchCell = (id: string, updates: Partial<SearchCell>) => {
    const newCells = searchCells.map(cell =>
      cell.id === id ? { ...cell, ...updates } : cell
    );
    onChange({ searchCells: newCells });
  };

  const removeSearchCell = (id: string) => {
    onChange({ searchCells: searchCells.filter(cell => cell.id !== id) });
    if (expandedCellId === id) setExpandedCellId(null);
  };

  const handleCellIconUpload = (cellId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateSearchCell(cellId, { icon: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const toggleCellTab = (cellId: string, tabId: string) => {
    const cell = searchCells.find(c => c.id === cellId);
    if (!cell) return;
    
    const hasTab = cell.tabIds.includes(tabId);
    const newTabIds = hasTab
      ? cell.tabIds.filter(id => id !== tabId)
      : [...cell.tabIds, tabId];
    
    updateSearchCell(cellId, { tabIds: newTabIds });
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

      {/* Режим поиска - только для search варианта */}
      {currentVariant === 'search' && (
        <div className="pt-2 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Режим результатов
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onChange({ searchMode: 'dropdown' })}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                searchMode === 'dropdown'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Dropdown
            </button>
            <button
              onClick={() => onChange({ searchMode: 'inline' })}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                searchMode === 'inline'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              На странице
            </button>
          </div>
        </div>
      )}

      {/* Опции для dropdown режима */}
      {(currentVariant === 'dropdown' || (currentVariant === 'search' && searchMode === 'dropdown')) && (
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

      {/* Inline Search: Табы (категории) */}
      {currentVariant === 'search' && searchMode === 'inline' && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Категории ({searchTabs.length}/10)
            </label>
            <button
              onClick={addSearchTab}
              disabled={searchTabs.length >= 10}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              + Добавить
            </button>
          </div>
          <div className="space-y-2">
            {searchTabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-5">{index + 1}.</span>
                <input
                  type="text"
                  value={tab.text}
                  onChange={(e) => updateSearchTab(tab.id, e.target.value)}
                  className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchTabs.length > 1 && (
                  <button
                    onClick={() => removeSearchTab(tab.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Первая категория считается &quot;Все&quot; — показывает все ячейки
          </p>
        </div>
      )}

      {/* Inline Search: Ячейки результатов */}
      {currentVariant === 'search' && searchMode === 'inline' && (
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Результаты поиска ({searchCells.length})
            </label>
            <button
              onClick={addSearchCell}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Добавить
            </button>
          </div>

          <div className="space-y-2">
            {searchCells.map((cell) => (
              <div key={cell.id} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Заголовок ячейки */}
                <div
                  className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
                    expandedCellId === cell.id ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                  onClick={() => setExpandedCellId(expandedCellId === cell.id ? null : cell.id)}
                >
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${expandedCellId === cell.id ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>

                  {cell.icon ? (
                    <img src={cell.icon} alt="" className="w-6 h-6 rounded object-cover" />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}

                  <span className="flex-1 text-sm font-medium text-gray-900 truncate">{cell.title}</span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearchCell(cell.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Развёрнутые настройки ячейки */}
                {expandedCellId === cell.id && (
                  <div className="p-3 border-t border-gray-200 bg-white space-y-3">
                    {/* Иконка */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Иконка</label>
                      <div className="flex items-center gap-2">
                        {cell.icon ? (
                          <div className="relative">
                            <img src={cell.icon} alt="" className="w-10 h-10 rounded-lg object-cover" />
                            <button
                              onClick={() => updateSearchCell(cell.id, { icon: '' })}
                              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                            >
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0];
                                if (file) handleCellIconUpload(cell.id, file);
                              };
                              input.click();
                            }}
                            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-blue-500 transition-colors"
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Заголовок */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Заголовок</label>
                      <input
                        type="text"
                        value={cell.title}
                        onChange={(e) => updateSearchCell(cell.id, { title: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    {/* Подзаголовок */}
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-gray-600">Подзаголовок</label>
                      <button
                        onClick={() => updateSearchCell(cell.id, { showSubtitle: !cell.showSubtitle })}
                        className={`relative w-9 h-5 rounded-full transition-colors ${
                          cell.showSubtitle ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            cell.showSubtitle ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {cell.showSubtitle && (
                      <input
                        type="text"
                        value={cell.subtitle}
                        onChange={(e) => updateSearchCell(cell.id, { subtitle: e.target.value })}
                        className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-blue-500"
                      />
                    )}

                    {/* Категории */}
                    {searchTabs.length > 1 && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Категории</label>
                        <div className="flex flex-wrap gap-1">
                          {searchTabs.slice(1).map((tab) => {
                            const isSelected = cell.tabIds.includes(tab.id);
                            return (
                              <button
                                key={tab.id}
                                onClick={() => toggleCellTab(cell.id, tab.id)}
                                className={`px-2 py-1 text-xs rounded-full transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {tab.text}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Без категории — в &quot;{searchTabs[0]?.text || 'Все'}&quot;
                        </p>
                      </div>
                    )}

                    {/* Действие */}
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">При нажатии</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => updateSearchCell(cell.id, { action: 'none', targetScreenId: null })}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                            cell.action === 'none'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Ничего
                        </button>
                        <button
                          onClick={() => updateSearchCell(cell.id, { action: 'navigate' })}
                          className={`flex-1 px-2 py-1 text-xs rounded transition-colors ${
                            cell.action === 'navigate'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Переход
                        </button>
                      </div>
                    </div>

                    {/* Выбор страницы */}
                    {cell.action === 'navigate' && project?.screens && (
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Страница</label>
                        <select
                          value={cell.targetScreenId || ''}
                          onChange={(e) => updateSearchCell(cell.id, { targetScreenId: e.target.value || null })}
                          className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Выберите страницу</option>
                          {project.screens.map((screen) => (
                            <option key={screen.id} value={screen.id}>
                              {screen.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {searchCells.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-3">
                Добавьте результаты поиска
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
