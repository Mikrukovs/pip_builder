'use client';

import { useEditorStore } from '@/store/editor';
import { Slot } from './Slot';
import { useState, useEffect, useCallback } from 'react';

export function Canvas() {
  const { 
    project, 
    currentScreenId,
    selectedSlotId,
    selectedSlotIds,
    selectedSlotType,
    selectSlot,
    selectSlotAdditive,
    selectScreen,
    addScreen,
    removeScreen,
    renameScreen,
    addSlot, 
    removeSlot, 
    moveSlot,
    addStickySlot,
    removeStickySlot,
    moveStickySlot,
    getCurrentScreen,
    copyComponent,
    pasteComponent,
    copyProps,
    pasteProps,
    moveSelectedSlot,
    clipboard,
    propsClipboard,
    removeComponentFromSlot,
    removeSelectedComponents,
    removeSelectedSlots,
    undo,
    reorderSlot,
    duplicateSlot,
  } = useEditorStore();

  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dragSlotType, setDragSlotType] = useState<'main' | 'sticky'>('main');
  const [showClipboardBadge, setShowClipboardBadge] = useState(false);
  const [clipboardFading, setClipboardFading] = useState(false);
  const [showPropsBadge, setShowPropsBadge] = useState(false);
  const [propsFading, setPropsFading] = useState(false);

  // Обработка клавиатурных сокращений
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Игнорируем если фокус в input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

    // Cmd/Ctrl + C - копировать
    if (cmdOrCtrl && e.key === 'c') {
      e.preventDefault();
      copyComponent();
    }

    // Cmd/Ctrl + V - вставить
    if (cmdOrCtrl && e.key === 'v' && !e.shiftKey) {
      e.preventDefault();
      pasteComponent();
    }

    // Cmd/Ctrl + Shift + C - копировать свойства
    if (cmdOrCtrl && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      copyProps();
    }

    // Cmd/Ctrl + Shift + V - вставить свойства
    if (cmdOrCtrl && e.shiftKey && e.key === 'V') {
      e.preventDefault();
      pasteProps();
    }

    // Cmd/Ctrl + Z - отменить
    if (cmdOrCtrl && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    }

    // Cmd/Ctrl + D - дублировать слот
    if (cmdOrCtrl && e.key === 'd') {
      e.preventDefault();
      duplicateSlot();
    }

    // Стрелка вверх - переместить слот вверх
    if (e.key === 'ArrowUp' && selectedSlotId && !cmdOrCtrl) {
      e.preventDefault();
      moveSelectedSlot('up');
    }

    // Стрелка вниз - переместить слот вниз
    if (e.key === 'ArrowDown' && selectedSlotId && !cmdOrCtrl) {
      e.preventDefault();
      moveSelectedSlot('down');
    }

    // Escape - снять выделение
    if (e.key === 'Escape') {
      selectSlot(null);
    }

    // Shift + Plus - создать новый слот
    if (e.shiftKey && (e.key === '+' || e.key === '=')) {
      e.preventDefault();
      addSlot();
    }

    // Backspace/Delete - удалить компоненты или слоты
    if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedSlotIds.length === 0) return;
      e.preventDefault();
      
      const currentScreen = getCurrentScreen();
      if (!currentScreen) return;
      
      const slots = selectedSlotType === 'sticky' ? currentScreen.stickySlots : currentScreen.slots;
      
      // Проверяем есть ли компоненты в выбранных слотах
      const hasComponents = selectedSlotIds.some(id => {
        const slot = slots.find(s => s.id === id);
        return slot?.component;
      });
      
      if (hasComponents) {
        // Если есть компоненты — удаляем их
        removeSelectedComponents();
      } else {
        // Если все слоты пустые — удаляем слоты
        removeSelectedSlots();
      }
    }
  }, [selectedSlotId, selectedSlotIds, selectedSlotType, copyComponent, pasteComponent, copyProps, pasteProps, moveSelectedSlot, selectSlot, addSlot, getCurrentScreen, removeComponentFromSlot, removeSelectedComponents, removeSelectedSlots, removeSlot, removeStickySlot, undo, duplicateSlot]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Показываем бейдж "Компонент" на 2 секунды при копировании
  useEffect(() => {
    if (clipboard) {
      setShowClipboardBadge(true);
      setClipboardFading(false);
      const fadeTimer = setTimeout(() => setClipboardFading(true), 1500);
      const hideTimer = setTimeout(() => setShowClipboardBadge(false), 2000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [clipboard]);

  // Показываем бейдж "Свойства" на 2 секунды при копировании
  useEffect(() => {
    if (propsClipboard) {
      setShowPropsBadge(true);
      setPropsFading(false);
      const fadeTimer = setTimeout(() => setPropsFading(true), 1500);
      const hideTimer = setTimeout(() => setShowPropsBadge(false), 2000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [propsClipboard]);

  // Обработка клика по слоту с учётом Shift
  const handleSlotClick = (slotId: string, slotType: 'main' | 'sticky', e: React.MouseEvent) => {
    if (e.shiftKey) {
      selectSlotAdditive(slotId, slotType);
    } else {
      selectSlot(slotId, slotType);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, slotId: string, slotType: 'main' | 'sticky') => {
    setDraggedSlotId(slotId);
    setDragSlotType(slotType);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slotId);
  };

  const handleDragOver = (e: React.DragEvent, index: number, slotType: 'main' | 'sticky') => {
    e.preventDefault();
    if (dragSlotType !== slotType) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number, slotType: 'main' | 'sticky') => {
    e.preventDefault();
    if (draggedSlotId && dragSlotType === slotType) {
      reorderSlot(draggedSlotId, index, slotType);
    }
    setDraggedSlotId(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedSlotId(null);
    setDragOverIndex(null);
  };

  const currentScreen = getCurrentScreen();

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-400">Проект не загружен</div>
      </div>
    );
  }

  const startEditing = (screenId: string, currentName: string) => {
    setEditingScreenId(screenId);
    setEditingName(currentName);
  };

  const finishEditing = () => {
    if (editingScreenId && editingName.trim()) {
      renameScreen(editingScreenId, editingName.trim());
    }
    setEditingScreenId(null);
    setEditingName('');
  };

  return (
    <div className="h-full flex flex-col select-none">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-500">{project.screens.length} страниц</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Индикаторы буфера обмена (исчезают через 2 сек с fade-out) */}
            {showClipboardBadge && (
              <div 
                className={`flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-lg transition-opacity duration-500 ${
                  clipboardFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Скопировано
              </div>
            )}
            {showPropsBadge && (
              <div 
                className={`flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-lg transition-opacity duration-500 ${
                  propsFading ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Свойства скопированы
              </div>
            )}
            <button
              onClick={addSlot}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Добавить слот
            </button>
          </div>
        </div>

        {/* Индикатор множественного выбора */}
        {selectedSlotIds.length > 1 && (
          <div className="flex items-center gap-4 px-4 py-1.5 bg-blue-50 border-b border-blue-200 text-xs text-blue-600 font-medium">
            Выбрано: {selectedSlotIds.length}
          </div>
        )}

        {/* Tabs для страниц */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {project.screens.map((screen) => (
            <div
              key={screen.id}
              className={`
                group flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer min-w-fit
                ${currentScreenId === screen.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
                }
              `}
              onClick={() => selectScreen(screen.id)}
            >
              {editingScreenId === screen.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={finishEditing}
                  onKeyDown={(e) => e.key === 'Enter' && finishEditing()}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                  className="w-24 px-1 py-0 text-sm bg-transparent border-b border-blue-500 focus:outline-none"
                />
              ) : (
                <>
                  <span 
                    className="text-sm font-medium"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startEditing(screen.id, screen.name);
                    }}
                  >
                    {screen.name}
                  </span>
                  {project.screens.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeScreen(screen.id);
                      }}
                      className="ml-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-gray-200 transition-all"
                    >
                      <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </>
              )}
            </div>
          ))}
          
          <button
            onClick={() => addScreen()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-gray-300 
                       text-gray-500 hover:border-blue-500 hover:text-blue-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm">Страница</span>
          </button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
        <div className="max-w-md mx-auto">
          {/* Мобильный превью */}
          <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-200">
            {/* Status bar mockup */}
            <div className="flex justify-between items-center px-2 pb-2 text-xs text-gray-500">
              <span>9:41</span>
              <div className="flex gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.33 4.67L18.67 11H14v9h-4v-9H5.33l6.67-6.33z" transform="rotate(90 12 12)" />
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 17h20v2H2v-2zm2-3h16v2H4v-2zm2-3h12v2H6v-2zm2-3h8v2H8V8z" />
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 4h3v16h-3V4zM5 14h3v6H5v-6zm6-4h3v10h-3V10z" />
                </svg>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 min-h-[400px]">
              {currentScreen?.slots.map((slot, index) => (
                <div 
                  key={slot.id} 
                  className={`relative group transition-all ${
                    dragOverIndex === index && dragSlotType === 'main' 
                      ? 'border-t-2 border-blue-500 pt-2' 
                      : ''
                  } ${draggedSlotId === slot.id ? 'opacity-50' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, slot.id, 'main')}
                  onDragOver={(e) => handleDragOver(e, index, 'main')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index, 'main')}
                  onDragEnd={handleDragEnd}
                >
                  <Slot
                    slot={slot}
                    isSelected={selectedSlotIds.includes(slot.id) && selectedSlotType === 'main'}
                    onSelect={(e) => handleSlotClick(slot.id, 'main', e)}
                    index={index}
                  />
                  
                  {/* Slot controls */}
                  <div className={`
                    absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1
                    opacity-0 group-hover:opacity-100 transition-opacity
                  `}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlot(slot.id, 'up');
                      }}
                      disabled={index === 0}
                      className="p-1.5 bg-white rounded border border-gray-200 hover:bg-gray-50 
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveSlot(slot.id, 'down');
                      }}
                      disabled={index === (currentScreen?.slots.length || 0) - 1}
                      className="p-1.5 bg-white rounded border border-gray-200 hover:bg-gray-50
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSlot(slot.id);
                      }}
                      disabled={(currentScreen?.slots.length || 0) <= 1}
                      className="p-1.5 bg-white rounded border border-gray-200 hover:bg-red-50 hover:border-red-200
                                 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sticky Section */}
            <div className="mt-4 border-t-2 border-dashed border-purple-300 pt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-purple-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12l4-4m-4 4l4 4" />
                  </svg>
                  Sticky секция (прилипает к низу)
                </span>
                <button
                  onClick={addStickySlot}
                  className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors"
                >
                  + Слот
                </button>
              </div>
              
              {currentScreen?.stickySlots && currentScreen.stickySlots.length > 0 ? (
                <div className="space-y-2 bg-purple-50/50 rounded-lg p-2">
                  {currentScreen.stickySlots.map((slot, index) => (
                    <div 
                      key={slot.id} 
                      className={`relative group transition-all ${
                        dragOverIndex === index && dragSlotType === 'sticky' 
                          ? 'border-t-2 border-purple-500 pt-2' 
                          : ''
                      } ${draggedSlotId === slot.id ? 'opacity-50' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, slot.id, 'sticky')}
                      onDragOver={(e) => handleDragOver(e, index, 'sticky')}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, index, 'sticky')}
                      onDragEnd={handleDragEnd}
                    >
                      <Slot
                        slot={slot}
                        isSelected={selectedSlotIds.includes(slot.id) && selectedSlotType === 'sticky'}
                        onSelect={(e) => handleSlotClick(slot.id, 'sticky', e)}
                        index={index}
                      />
                      
                      {/* Sticky slot controls */}
                      <div className={`
                        absolute -right-12 top-1/2 -translate-y-1/2 flex flex-col gap-1
                        opacity-0 group-hover:opacity-100 transition-opacity
                      `}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStickySlot(slot.id, 'up');
                          }}
                          disabled={index === 0}
                          className="p-1.5 bg-white rounded border border-purple-200 hover:bg-purple-50 
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveStickySlot(slot.id, 'down');
                          }}
                          disabled={index === (currentScreen?.stickySlots?.length || 0) - 1}
                          className="p-1.5 bg-white rounded border border-purple-200 hover:bg-purple-50
                                     disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeStickySlot(slot.id);
                          }}
                          className="p-1.5 bg-white rounded border border-purple-200 hover:bg-red-50 hover:border-red-200"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={addStickySlot}
                  className="border-2 border-dashed border-purple-200 rounded-lg p-4 text-center text-purple-400 
                             hover:border-purple-400 hover:text-purple-600 cursor-pointer transition-colors"
                >
                  <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Добавить sticky элемент</span>
                </div>
              )}
            </div>

            {/* Home indicator mockup */}
            <div className="pt-4 flex justify-center">
              <div className="w-32 h-1 bg-gray-300 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
