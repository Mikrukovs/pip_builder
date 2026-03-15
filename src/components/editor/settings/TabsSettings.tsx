'use client';

import { TabsProps } from '@/types';
import { useEditorStore } from '@/store/editor';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

interface Props {
  config: TabsProps;
  onChange: (props: Partial<TabsProps>) => void;
  currentSlotId: string;
}

export function TabsSettings({ config, onChange, currentSlotId }: Props) {
  const { getCurrentScreen } = useEditorStore();
  const currentScreen = getCurrentScreen();
  const [expandedTabId, setExpandedTabId] = useState<string | null>(config.items[0]?.id || null);

  // Получаем все слоты страницы кроме текущего (с табами)
  const availableSlots = currentScreen?.slots.filter(slot => slot.id !== currentSlotId) || [];

  const addTab = () => {
    if (config.items.length >= 10) return;
    
    onChange({
      items: [
        ...config.items,
        { id: uuidv4(), text: `Таб ${config.items.length + 1}`, visibleSlotIds: [] },
      ],
    });
  };

  const removeTab = (tabId: string) => {
    if (config.items.length <= 1) return;
    
    const newItems = config.items.filter(item => item.id !== tabId);
    const removedIndex = config.items.findIndex(item => item.id === tabId);
    
    onChange({
      items: newItems,
      defaultTabIndex: config.defaultTabIndex >= newItems.length 
        ? newItems.length - 1 
        : (config.defaultTabIndex > removedIndex ? config.defaultTabIndex - 1 : config.defaultTabIndex),
    });
    
    if (expandedTabId === tabId) {
      setExpandedTabId(newItems[0]?.id || null);
    }
  };

  const updateTabText = (tabId: string, text: string) => {
    onChange({
      items: config.items.map(item =>
        item.id === tabId ? { ...item, text } : item
      ),
    });
  };

  const toggleSlotVisibility = (tabId: string, slotId: string) => {
    onChange({
      items: config.items.map(item => {
        if (item.id !== tabId) return item;
        
        const isVisible = item.visibleSlotIds.includes(slotId);
        return {
          ...item,
          visibleSlotIds: isVisible
            ? item.visibleSlotIds.filter(id => id !== slotId)
            : [...item.visibleSlotIds, slotId],
        };
      }),
    });
  };

  const getSlotLabel = (slotId: string, index: number) => {
    const slot = availableSlots.find(s => s.id === slotId);
    if (!slot) return `Слот ${index + 1}`;
    
    if (slot.component) {
      const type = slot.component.type;
      const typeLabels: Record<string, string> = {
        heading: 'Заголовок',
        text: 'Текст',
        button: 'Кнопка',
        input: 'Поле ввода',
        selector: 'Селектор',
        image: 'Изображение',
        cell: 'Ячейка',
        navbar: 'Навбар',
        tabs: 'Табы',
        custom: 'Кастомный',
      };
      return `${index + 1}. ${typeLabels[type] || type}`;
    }
    
    return `${index + 1}. Пустой слот`;
  };

  return (
    <div className="space-y-4">
      {/* Список табов */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Табы ({config.items.length}/10)
          </label>
          <button
            onClick={addTab}
            disabled={config.items.length >= 10}
            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            + Добавить
          </button>
        </div>

        <div className="space-y-2">
          {config.items.map((item, index) => (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Заголовок таба */}
              <div 
                className={`flex items-center gap-2 p-2 cursor-pointer transition-colors ${
                  expandedTabId === item.id ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => setExpandedTabId(expandedTabId === item.id ? null : item.id)}
              >
                <svg 
                  className={`w-4 h-4 text-gray-500 transition-transform ${expandedTabId === item.id ? 'rotate-90' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateTabText(item.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 px-2 py-1 text-sm bg-white border border-gray-300 rounded 
                             focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                
                <span className="text-xs text-gray-500 px-1">
                  {item.visibleSlotIds.length} слотов
                </span>
                
                {config.items.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTab(item.id);
                    }}
                    className="p-1 rounded hover:bg-red-100 transition-colors"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Привязка слотов */}
              {expandedTabId === item.id && (
                <div className="p-3 border-t border-gray-200 bg-white">
                  <p className="text-xs text-gray-500 mb-2">
                    Выберите слоты, которые будут видны при активном табе:
                  </p>
                  
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                      Нет доступных слотов. Добавьте слоты на страницу.
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {availableSlots.map((slot, slotIndex) => {
                        const isChecked = item.visibleSlotIds.includes(slot.id);
                        return (
                          <label
                            key={slot.id}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSlotVisibility(item.id, slot.id)}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 
                                         focus:ring-blue-500"
                            />
                            <span className={`text-sm ${isChecked ? 'text-blue-700 font-medium' : 'text-gray-700'}`}>
                              {getSlotLabel(slot.id, slotIndex)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Таб по умолчанию */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Активный таб по умолчанию
        </label>
        <div className="flex flex-wrap gap-2">
          {config.items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => onChange({ defaultTabIndex: index })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                config.defaultTabIndex === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {/* Подсказка */}
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800">
          <strong>Как работает:</strong> Привяжите слоты к каждому табу. 
          При переключении табов в превью будут показываться только привязанные слоты. 
          Слоты без привязки (включая этот с табами) показываются всегда.
        </p>
      </div>
    </div>
  );
}
