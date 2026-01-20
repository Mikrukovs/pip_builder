'use client';

import { NavbarProps, ComponentType, defaultComponentProps, Slot, ComponentProps, ButtonProps, CellProps, TextProps } from '@/types';
import { useEditorStore } from '@/store/editor';
import { v4 as uuidv4 } from 'uuid';
import { useState } from 'react';

// Иконки для типов ячеек
const CellTypeIcon = ({ type, small = false }: { type: string; small?: boolean }) => {
  const size = small ? 'w-3 h-3' : 'w-4 h-4';
  switch (type) {
    case 'navigation':
      return (
        <svg className={size} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      );
    case 'toggle':
      return (
        <div className={`${small ? 'w-5 h-2.5' : 'w-6 h-3'} bg-blue-500 rounded-full relative`}>
          <div className={`absolute ${small ? 'right-0.5 top-0.5 w-1.5 h-1.5' : 'right-0.5 top-0.5 w-2 h-2'} bg-white rounded-full`} />
        </div>
      );
    case 'checkbox':
      return (
        <div className={`${size} bg-blue-500 rounded flex items-center justify-center`}>
          <svg className={small ? 'w-2 h-2' : 'w-2.5 h-2.5'} fill="none" stroke="white" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    case 'radio':
      return (
        <div className={`${size} border-2 border-blue-500 rounded-full flex items-center justify-center`}>
          <div className={`${small ? 'w-1 h-1' : 'w-1.5 h-1.5'} bg-blue-500 rounded-full`} />
        </div>
      );
    case 'info':
      return (
        <span className={`${small ? 'text-[9px]' : 'text-[10px]'} font-medium text-gray-500`}>123</span>
      );
    default:
      return null;
  }
};

interface Props {
  config: NavbarProps;
  onChange: (props: Partial<NavbarProps>) => void;
}

// Компоненты которые можно добавить в меню
const menuComponents: { type: ComponentType; name: string }[] = [
  { type: 'button', name: 'Кнопка' },
  { type: 'cell', name: 'Ячейка' },
  { type: 'text', name: 'Текст' },
];

export function NavbarSettings({ config, onChange }: Props) {
  const { project } = useEditorStore();
  const [showComponentPicker, setShowComponentPicker] = useState(false);
  const [expandedSlotId, setExpandedSlotId] = useState<string | null>(null);

  const updateBackButton = (updates: Partial<NavbarProps['backButton']>) => {
    onChange({
      backButton: { ...config.backButton, ...updates }
    });
  };

  const updateMenu = (updates: Partial<NavbarProps['menu']>) => {
    onChange({
      menu: { ...config.menu, ...updates }
    });
  };

  const addMenuComponent = (type: ComponentType) => {
    const newSlot: Slot = {
      id: uuidv4(),
      component: { ...defaultComponentProps[type] },
    };
    updateMenu({
      slots: [...config.menu.slots, newSlot]
    });
    setShowComponentPicker(false);
    setExpandedSlotId(newSlot.id); // Раскрываем настройки нового компонента
  };

  const removeMenuSlot = (slotId: string) => {
    updateMenu({
      slots: config.menu.slots.filter((slot) => slot.id !== slotId)
    });
    if (expandedSlotId === slotId) {
      setExpandedSlotId(null);
    }
  };

  const updateSlotComponent = (slotId: string, updates: Partial<ComponentProps>) => {
    updateMenu({
      slots: config.menu.slots.map((slot) => {
        if (slot.id === slotId && slot.component) {
          return {
            ...slot,
            component: { ...slot.component, ...updates } as ComponentProps,
          };
        }
        return slot;
      })
    });
  };

  const getComponentName = (type: string) => {
    const names: Record<string, string> = {
      button: 'Кнопка',
      cell: 'Ячейка',
      text: 'Текст',
      heading: 'Заголовок',
      input: 'Поле ввода',
      image: 'Изображение',
    };
    return names[type] || type;
  };

  // Рендер настроек компонента в зависимости от типа
  const renderComponentSettings = (slot: Slot) => {
    if (!slot.component) return null;

    const comp = slot.component;

    switch (comp.type) {
      case 'button':
        return (
          <div className="space-y-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Текст кнопки</label>
              <input
                type="text"
                value={(comp as ButtonProps).label}
                onChange={(e) => updateSlotComponent(slot.id, { label: e.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Вариант</label>
              <div className="flex gap-1">
                {(['primary', 'secondary', 'destructive'] as const).map((variant) => (
                  <button
                    key={variant}
                    onClick={() => updateSlotComponent(slot.id, { variant })}
                    className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                      (comp as ButtonProps).variant === variant
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {variant === 'primary' ? 'Основная' : variant === 'secondary' ? 'Вторичная' : 'Удаление'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Действие</label>
              <select
                value={(comp as ButtonProps).targetScreenId || ''}
                onChange={(e) => updateSlotComponent(slot.id, { 
                  action: e.target.value ? 'navigate' : 'none',
                  targetScreenId: e.target.value || null 
                })}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="">Без действия</option>
                {project?.screens.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    → {screen.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'cell':
        return (
          <div className="space-y-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Заголовок</label>
              <input
                type="text"
                value={(comp as CellProps).title}
                onChange={(e) => updateSlotComponent(slot.id, { title: e.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Подзаголовок</label>
              <input
                type="text"
                value={(comp as CellProps).subtitle}
                onChange={(e) => updateSlotComponent(slot.id, { subtitle: e.target.value })}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Тип</label>
              <select
                value={(comp as CellProps).cellType}
                onChange={(e) => updateSlotComponent(slot.id, { cellType: e.target.value as CellProps['cellType'] })}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white"
              >
                <option value="basic">Базовая</option>
                <option value="navigation">Навигация →</option>
                <option value="icon">С иконкой</option>
                <option value="toggle">Переключатель</option>
                <option value="checkbox">Чекбокс</option>
                <option value="radio">Радио</option>
                <option value="info">Информация</option>
              </select>
            </div>
            {(comp as CellProps).cellType === 'navigation' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Переход на</label>
                <select
                  value={(comp as CellProps).targetScreenId || ''}
                  onChange={(e) => updateSlotComponent(slot.id, { 
                    action: e.target.value ? 'navigate' : 'none',
                    targetScreenId: e.target.value || null 
                  })}
                  className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm bg-white"
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
            {(comp as CellProps).cellType === 'info' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Значение (summ)</label>
                <input
                  type="text"
                  value={(comp as CellProps).infoValue || ''}
                  onChange={(e) => updateSlotComponent(slot.id, { infoValue: e.target.value })}
                  placeholder="1 500 ₽"
                  className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm"
                />
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-2 pt-2">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Текст</label>
              <textarea
                value={(comp as TextProps).text}
                onChange={(e) => updateSlotComponent(slot.id, { text: e.target.value })}
                rows={2}
                className="w-full px-2 py-1.5 rounded border border-gray-200 focus:border-blue-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Выравнивание</label>
              <div className="flex gap-1">
                {(['left', 'center'] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateSlotComponent(slot.id, { alignment: align })}
                    className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
                      (comp as TextProps).alignment === align
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {align === 'left' ? 'Слева' : 'По центру'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
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
          Подзаголовок
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
        <div>
          <input
            type="text"
            value={config.subtitle}
            onChange={(e) => onChange({ subtitle: e.target.value })}
            placeholder="Текст подзаголовка"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Кнопка назад */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Кнопка «Назад»
          </label>
          <button
            onClick={() => updateBackButton({ show: !config.backButton.show })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              config.backButton.show ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.backButton.show ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {config.backButton.show && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Стиль</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBackButton({ style: 'icon' })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    config.backButton.style === 'icon'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ← Иконка
                </button>
                <button
                  onClick={() => updateBackButton({ style: 'iconText' })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    config.backButton.style === 'iconText'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  ← Текст
                </button>
              </div>
            </div>

            {config.backButton.style === 'iconText' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Текст</label>
                <input
                  type="text"
                  value={config.backButton.text}
                  onChange={(e) => updateBackButton({ text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">Действие</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateBackButton({ action: 'back' })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    config.backButton.action === 'back'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  Назад
                </button>
                <button
                  onClick={() => updateBackButton({ action: 'navigate' })}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm transition-colors ${
                    config.backButton.action === 'navigate'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  На страницу
                </button>
              </div>
            </div>

            {config.backButton.action === 'navigate' && (
              <div>
                <select
                  value={config.backButton.targetScreenId || ''}
                  onChange={(e) => updateBackButton({ targetScreenId: e.target.value || null })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm"
                >
                  <option value="">Выберите страницу</option>
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
      </div>

      {/* Меню (Bottom Sheet) */}
      <div className="pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-700">
            Меню (шторка)
          </label>
          <button
            onClick={() => updateMenu({ show: !config.menu.show })}
            className={`relative w-11 h-6 rounded-full transition-colors ${
              config.menu.show ? 'bg-blue-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                config.menu.show ? 'translate-x-5' : ''
              }`}
            />
          </button>
        </div>

        {config.menu.show && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Заголовок шторки</label>
              <input
                type="text"
                value={config.menu.title}
                onChange={(e) => updateMenu({ title: e.target.value })}
                placeholder="Опционально"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm"
              />
            </div>

            {/* Компоненты в меню */}
            <div>
              <label className="block text-xs text-gray-500 mb-2">
                Компоненты ({config.menu.slots.length})
              </label>
              
              {config.menu.slots.length > 0 && (
                <div className="space-y-2 mb-2">
                  {config.menu.slots.map((slot, index) => (
                    <div 
                      key={slot.id} 
                      className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                    >
                      {/* Header */}
                      <div 
                        className="flex items-center justify-between p-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => setExpandedSlotId(expandedSlotId === slot.id ? null : slot.id)}
                      >
                        <div className="flex items-center gap-2">
                          <svg 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedSlotId === slot.id ? 'rotate-90' : ''
                            }`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          <span className="text-xs text-gray-400">{index + 1}.</span>
                          <span className="text-sm text-gray-700">
                            {slot.component ? getComponentName(slot.component.type) : 'Пусто'}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeMenuSlot(slot.id);
                          }}
                          className="text-red-500 hover:text-red-700 text-xs px-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      {/* Settings */}
                      {expandedSlotId === slot.id && (
                        <div className="px-3 pb-3 border-t border-gray-200">
                          {renderComponentSettings(slot)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Добавление компонента */}
              {showComponentPicker ? (
                <div className="p-2 bg-blue-50 rounded-lg border border-blue-200 space-y-2">
                  <p className="text-xs text-blue-600 font-medium">Выберите компонент:</p>
                  <div className="grid grid-cols-3 gap-1">
                    {menuComponents.map((comp) => (
                      <button
                        key={comp.type}
                        onClick={() => addMenuComponent(comp.type)}
                        className="px-2 py-1.5 text-xs bg-white border border-blue-200 rounded 
                                   hover:bg-blue-100 transition-colors"
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowComponentPicker(false)}
                    className="w-full text-xs text-gray-500 hover:text-gray-700"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowComponentPicker(true)}
                  className="w-full py-2 border border-dashed border-gray-300 rounded-lg
                            text-gray-500 hover:border-blue-500 hover:text-blue-600 
                            transition-colors text-sm"
                >
                  + Добавить компонент
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
