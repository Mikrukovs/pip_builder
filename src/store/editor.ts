import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useState, useEffect } from 'react';
import { Slot, ComponentProps, Project, Screen, defaultComponentProps, ComponentType } from '@/types';

interface EditorState {
  // Текущий проект
  project: Project | null;
  
  // История для undo
  history: Project[];
  
  // UI состояние
  currentScreenId: string | null;
  selectedSlotId: string | null;
  selectedSlotIds: string[]; // Множественный выбор
  selectedSlotType: 'main' | 'sticky'; // Тип выбранного слота
  showComponentPicker: boolean;
  clipboard: ComponentProps | null; // Буфер обмена (компонент целиком)
  propsClipboard: Partial<ComponentProps> | null; // Буфер обмена (только свойства)
  
  // Действия с проектом
  createProject: (name: string) => void;
  loadProject: (project: Project) => void;
  
  // Undo
  undo: () => void;
  saveToHistory: () => void;
  
  // Действия со страницами
  addScreen: (name?: string) => void;
  removeScreen: (screenId: string) => void;
  renameScreen: (screenId: string, name: string) => void;
  selectScreen: (screenId: string) => void;
  
  // Действия со слотами (основной контент)
  selectSlot: (slotId: string | null, slotType?: 'main' | 'sticky') => void;
  selectSlotAdditive: (slotId: string, slotType?: 'main' | 'sticky') => void; // Shift+клик
  toggleComponentPicker: (show: boolean) => void;
  
  // Копирование/вставка
  copyComponent: () => void;
  pasteComponent: () => void;
  copyProps: () => void;
  pasteProps: () => void;
  
  // Перемещение выбранного слота стрелками
  moveSelectedSlot: (direction: 'up' | 'down') => void;
  
  // Дублирование слота
  duplicateSlot: () => void;
  
  addComponentToSlot: (slotId: string, componentType: ComponentType, customComponentName?: string) => void;
  updateComponent: (slotId: string, props: Partial<ComponentProps>) => void;
  removeComponentFromSlot: (slotId: string) => void;
  
  // Удаление для группы
  removeSelectedComponents: () => void;
  removeSelectedSlots: () => void;
  
  addSlot: () => void;
  removeSlot: (slotId: string) => void;
  moveSlot: (slotId: string, direction: 'up' | 'down') => void;
  
  // Действия со sticky слотами
  addStickySlot: () => void;
  removeStickySlot: (slotId: string) => void;
  moveStickySlot: (slotId: string, direction: 'up' | 'down') => void;
  
  // Drag & Drop
  reorderSlot: (slotId: string, newIndex: number, slotType: 'main' | 'sticky') => void;
  
  // Хелперы
  getCurrentScreen: () => Screen | null;
  getShareableLink: () => string;
}

// Создаём начальные слоты
const createInitialSlots = (count: number = 4): Slot[] => {
  return Array.from({ length: count }, () => ({
    id: uuidv4(),
    component: null,
  }));
};

// Создаём начальную страницу
const createScreen = (name: string): Screen => ({
  id: uuidv4(),
  name,
  slots: createInitialSlots(),
  stickySlots: [], // Sticky секция изначально пустая
});

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      project: null,
      history: [],
      currentScreenId: null,
      selectedSlotId: null,
      selectedSlotIds: [],
      selectedSlotType: 'main',
      showComponentPicker: false,
      clipboard: null,
      propsClipboard: null,
      
      // Сохранить текущее состояние в историю
      saveToHistory: () => {
        const { project, history } = get();
        if (!project) return;
        
        // Храним максимум 50 состояний
        const newHistory = [...history, JSON.parse(JSON.stringify(project))].slice(-50);
        set({ history: newHistory });
      },
      
      // Отменить последнее действие
      undo: () => {
        const { history } = get();
        if (history.length === 0) return;
        
        const newHistory = [...history];
        const previousProject = newHistory.pop();
        
        if (previousProject) {
          set({ 
            project: previousProject,
            history: newHistory,
          });
        }
      },

      createProject: (name) => {
        const firstScreen = createScreen('Главная');
        const project: Project = {
          id: uuidv4(),
          name,
          screens: [firstScreen],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ 
          project, 
          currentScreenId: firstScreen.id,
          selectedSlotId: null, 
          showComponentPicker: false 
        });
      },

      loadProject: (project) => {
        set({ 
          project, 
          currentScreenId: project.screens[0]?.id || null,
          selectedSlotId: null, 
          showComponentPicker: false 
        });
      },

      // Страницы
      addScreen: (name) => {
        const { project } = get();
        if (!project) return;

        const screenName = name || `Страница ${project.screens.length + 1}`;
        const newScreen = createScreen(screenName);

        set({
          project: {
            ...project,
            screens: [...project.screens, newScreen],
            updatedAt: Date.now(),
          },
          currentScreenId: newScreen.id,
          selectedSlotId: null,
          showComponentPicker: false,
        });
      },

      removeScreen: (screenId) => {
        const { project, currentScreenId } = get();
        if (!project || project.screens.length <= 1) return;

        const newScreens = project.screens.filter(s => s.id !== screenId);
        const newCurrentScreenId = currentScreenId === screenId 
          ? newScreens[0]?.id || null 
          : currentScreenId;

        set({
          project: {
            ...project,
            screens: newScreens,
            updatedAt: Date.now(),
          },
          currentScreenId: newCurrentScreenId,
          selectedSlotId: null,
        });
      },

      renameScreen: (screenId, name) => {
        const { project } = get();
        if (!project) return;

        const newScreens = project.screens.map(screen =>
          screen.id === screenId ? { ...screen, name } : screen
        );

        set({
          project: {
            ...project,
            screens: newScreens,
            updatedAt: Date.now(),
          },
        });
      },

      selectScreen: (screenId) => {
        set({ 
          currentScreenId: screenId,
          selectedSlotId: null,
          showComponentPicker: false,
        });
      },

      // Слоты
      selectSlot: (slotId, slotType = 'main') => {
        const currentScreen = get().getCurrentScreen();
        if (!currentScreen) return;
        
        const slots = slotType === 'sticky' ? currentScreen.stickySlots : currentScreen.slots;
        const slot = slots.find(s => s.id === slotId);
        set({ 
          selectedSlotId: slotId,
          selectedSlotIds: slotId ? [slotId] : [],
          selectedSlotType: slotType,
          showComponentPicker: slotId !== null && (!slot?.component),
        });
      },

      // Множественный выбор (Shift+клик)
      selectSlotAdditive: (slotId, slotType = 'main') => {
        const { selectedSlotIds, selectedSlotType } = get();
        const currentScreen = get().getCurrentScreen();
        if (!currentScreen) return;
        
        // Если тип слота отличается, сбрасываем выбор
        if (slotType !== selectedSlotType) {
          set({
            selectedSlotId: slotId,
            selectedSlotIds: [slotId],
            selectedSlotType: slotType,
            showComponentPicker: false,
          });
          return;
        }
        
        // Добавляем/убираем из выбора
        const newSelectedIds = selectedSlotIds.includes(slotId)
          ? selectedSlotIds.filter(id => id !== slotId)
          : [...selectedSlotIds, slotId];
        
        // Проверяем, есть ли среди выбранных пустые слоты
        const slots = slotType === 'sticky' ? currentScreen.stickySlots : currentScreen.slots;
        const hasEmptySlots = newSelectedIds.some(id => {
          const slot = slots.find(s => s.id === id);
          return slot && !slot.component;
        });
        
        set({
          selectedSlotId: newSelectedIds[newSelectedIds.length - 1] || null,
          selectedSlotIds: newSelectedIds,
          showComponentPicker: hasEmptySlots && newSelectedIds.length > 0,
        });
      },

      toggleComponentPicker: (show) => {
        set({ showComponentPicker: show });
      },

      // Копирование компонента в буфер
      copyComponent: () => {
        const { selectedSlotId, selectedSlotType } = get();
        const currentScreen = get().getCurrentScreen();
        if (!currentScreen || !selectedSlotId) return;
        
        const slots = selectedSlotType === 'sticky' ? currentScreen.stickySlots : currentScreen.slots;
        const slot = slots.find(s => s.id === selectedSlotId);
        
        if (slot?.component) {
          set({ clipboard: JSON.parse(JSON.stringify(slot.component)) });
        }
      },

      // Вставка компонента из буфера (во все выбранные слоты)
      pasteComponent: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType, clipboard } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0 || !clipboard) return;

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (selectedSlotIds.includes(slot.id)) {
            return {
              ...slot,
              component: JSON.parse(JSON.stringify(clipboard)),
            };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          showComponentPicker: false,
        });
      },

      // Копирование свойств компонента
      copyProps: () => {
        const { selectedSlotId, selectedSlotType } = get();
        const currentScreen = get().getCurrentScreen();
        if (!currentScreen || !selectedSlotId) return;
        
        const slots = selectedSlotType === 'sticky' ? currentScreen.stickySlots : currentScreen.slots;
        const slot = slots.find(s => s.id === selectedSlotId);
        
        if (slot?.component) {
          // Копируем все свойства кроме type
          const { type, ...props } = slot.component;
          set({ propsClipboard: JSON.parse(JSON.stringify(props)) });
        }
      },

      // Вставка свойств во все выбранные слоты (только к компонентам того же типа)
      pasteProps: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType, propsClipboard } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0 || !propsClipboard) return;

        get().saveToHistory();

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (selectedSlotIds.includes(slot.id) && slot.component) {
            return {
              ...slot,
              component: {
                ...slot.component,
                ...JSON.parse(JSON.stringify(propsClipboard)),
              } as ComponentProps,
            };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      // Перемещение выбранных слотов стрелками (группой)
      moveSelectedSlot: (direction) => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        const slots = selectedSlotType === 'sticky' 
          ? [...(currentScreen.stickySlots || [])] 
          : [...currentScreen.slots];

        // Получаем индексы выбранных слотов
        const selectedIndices = selectedSlotIds
          .map(id => slots.findIndex(s => s.id === id))
          .filter(i => i !== -1)
          .sort((a, b) => a - b);

        if (selectedIndices.length === 0) return;

        // Проверяем можно ли двигать
        if (direction === 'up' && selectedIndices[0] === 0) return;
        if (direction === 'down' && selectedIndices[selectedIndices.length - 1] === slots.length - 1) return;

        // Перемещаем группу
        if (direction === 'up') {
          // Двигаем сверху вниз
          for (const idx of selectedIndices) {
            [slots[idx - 1], slots[idx]] = [slots[idx], slots[idx - 1]];
          }
        } else {
          // Двигаем снизу вверх
          for (let i = selectedIndices.length - 1; i >= 0; i--) {
            const idx = selectedIndices[i];
            [slots[idx], slots[idx + 1]] = [slots[idx + 1], slots[idx]];
          }
        }

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return selectedSlotType === 'sticky'
            ? { ...screen, stickySlots: slots }
            : { ...screen, slots };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      // Дублирование выбранных слотов
      duplicateSlot: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        get().saveToHistory();

        const slots = selectedSlotType === 'sticky' 
          ? [...(currentScreen.stickySlots || [])]
          : [...currentScreen.slots];

        // Находим индексы выбранных слотов и сортируем
        const selectedIndices = selectedSlotIds
          .map(id => slots.findIndex(s => s.id === id))
          .filter(i => i !== -1)
          .sort((a, b) => a - b);

        if (selectedIndices.length === 0) return;

        // Создаём дубликаты выбранных слотов (в порядке их расположения)
        const duplicatedSlots: Slot[] = selectedIndices.map(index => {
          const originalSlot = slots[index];
          return {
            id: uuidv4(),
            component: originalSlot.component 
              ? JSON.parse(JSON.stringify(originalSlot.component))
              : null,
          };
        });

        // Вставляем все дубликаты после последнего выбранного
        const insertIndex = Math.max(...selectedIndices) + 1;
        slots.splice(insertIndex, 0, ...duplicatedSlots);

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return selectedSlotType === 'sticky'
            ? { ...screen, stickySlots: slots }
            : { ...screen, slots };
        });

        // Выбираем все дубликаты
        const duplicatedIds = duplicatedSlots.map(s => s.id);

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          selectedSlotId: duplicatedIds[duplicatedIds.length - 1],
          selectedSlotIds: duplicatedIds,
        });
      },

      addComponentToSlot: (slotId, componentType, customComponentName) => {
        const { project, currentScreenId, selectedSlotType, selectedSlotIds } = get();
        if (!project || !currentScreenId) return;
        
        get().saveToHistory();

        // Используем все выбранные слоты или только переданный
        const targetSlotIds = selectedSlotIds.length > 1 ? selectedSlotIds : [slotId];

        // Функция создания компонента (каждый раз новый объект)
        const createComponent = (): ComponentProps => {
          if (componentType === 'custom' && customComponentName) {
            return {
              type: 'custom',
              componentName: customComponentName,
              props: {},
            };
          }
          return { ...defaultComponentProps[componentType] };
        };

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (targetSlotIds.includes(slot.id)) {
            return {
              ...slot,
              component: createComponent(),
            };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        // Оставляем фокус на первом выбранном слоте
        const firstSelectedId = targetSlotIds[0];
        
        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          showComponentPicker: false,
          selectedSlotIds: [firstSelectedId],
          selectedSlotId: firstSelectedId,
        });
      },

      updateComponent: (slotId, props) => {
        const { project, currentScreenId, selectedSlotType } = get();
        if (!project || !currentScreenId) return;

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (slot.id === slotId && slot.component) {
            return {
              ...slot,
              component: { ...slot.component, ...props } as ComponentProps,
            };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      removeComponentFromSlot: (slotId) => {
        const { project, currentScreenId, selectedSlotType } = get();
        if (!project || !currentScreenId) return;
        
        get().saveToHistory();

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (slot.id === slotId) {
            return { ...slot, component: null };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          showComponentPicker: true,
        });
      },

      // Удалить компоненты из всех выбранных слотов
      removeSelectedComponents: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0) return;
        
        get().saveToHistory();

        const updateSlots = (slots: Slot[]) => slots.map(slot => {
          if (selectedSlotIds.includes(slot.id)) {
            return { ...slot, component: null };
          }
          return slot;
        });

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          
          return {
            ...screen,
            slots: selectedSlotType === 'main' ? updateSlots(screen.slots) : screen.slots,
            stickySlots: selectedSlotType === 'sticky' ? updateSlots(screen.stickySlots || []) : (screen.stickySlots || []),
          };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          showComponentPicker: true,
        });
      },

      // Удалить все выбранные слоты
      removeSelectedSlots: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId || selectedSlotIds.length === 0) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        get().saveToHistory();

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;

          if (selectedSlotType === 'sticky') {
            return {
              ...screen,
              stickySlots: (screen.stickySlots || []).filter(s => !selectedSlotIds.includes(s.id)),
            };
          } else {
            // Оставляем минимум 1 слот
            const remainingSlots = screen.slots.filter(s => !selectedSlotIds.includes(s.id));
            return {
              ...screen,
              slots: remainingSlots.length > 0 ? remainingSlots : [screen.slots[0]],
            };
          }
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          selectedSlotId: null,
          selectedSlotIds: [],
        });
      },

      addSlot: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        const newSlot: Slot = {
          id: uuidv4(),
          component: null,
        };

        // Определяем позицию для вставки
        let insertIndex = currentScreen.slots.length; // По умолчанию в конец
        
        // Если есть выбранные слоты в основной секции, вставляем после последнего выбранного
        if (selectedSlotIds.length > 0 && selectedSlotType === 'main') {
          const selectedIndices = selectedSlotIds
            .map(id => currentScreen.slots.findIndex(s => s.id === id))
            .filter(i => i !== -1);
          
          if (selectedIndices.length > 0) {
            insertIndex = Math.max(...selectedIndices) + 1;
          }
        }

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          const newSlots = [...screen.slots];
          newSlots.splice(insertIndex, 0, newSlot);
          return {
            ...screen,
            slots: newSlots,
          };
        });

        set({
          project: {
            ...project,
            screens: newScreens,
            updatedAt: Date.now(),
          },
          // Выбираем новый слот
          selectedSlotId: newSlot.id,
          selectedSlotIds: [newSlot.id],
          selectedSlotType: 'main',
        });
      },

      removeSlot: (slotId) => {
        const { project, currentScreenId, selectedSlotId } = get();
        if (!project || !currentScreenId) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen || currentScreen.slots.length <= 1) return;
        
        get().saveToHistory();

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return {
            ...screen,
            slots: screen.slots.filter(s => s.id !== slotId),
          };
        });
        
        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          selectedSlotId: selectedSlotId === slotId ? null : selectedSlotId,
        });
      },

      moveSlot: (slotId, direction) => {
        const { project, currentScreenId } = get();
        if (!project || !currentScreenId) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        const index = currentScreen.slots.findIndex(s => s.id === slotId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentScreen.slots.length) return;

        const newSlots = [...currentScreen.slots];
        [newSlots[index], newSlots[newIndex]] = [newSlots[newIndex], newSlots[index]];

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return { ...screen, slots: newSlots };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      // Sticky слоты
      addStickySlot: () => {
        const { project, currentScreenId, selectedSlotIds, selectedSlotType } = get();
        if (!project || !currentScreenId) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        const newSlot: Slot = {
          id: uuidv4(),
          component: null,
        };

        const stickySlots = currentScreen.stickySlots || [];
        
        // Определяем позицию для вставки
        let insertIndex = stickySlots.length; // По умолчанию в конец
        
        // Если есть выбранные слоты в sticky секции, вставляем после последнего выбранного
        if (selectedSlotIds.length > 0 && selectedSlotType === 'sticky') {
          const selectedIndices = selectedSlotIds
            .map(id => stickySlots.findIndex(s => s.id === id))
            .filter(i => i !== -1);
          
          if (selectedIndices.length > 0) {
            insertIndex = Math.max(...selectedIndices) + 1;
          }
        }

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          const newStickySlots = [...(screen.stickySlots || [])];
          newStickySlots.splice(insertIndex, 0, newSlot);
          return {
            ...screen,
            stickySlots: newStickySlots,
          };
        });

        set({
          project: {
            ...project,
            screens: newScreens,
            updatedAt: Date.now(),
          },
          // Выбираем новый слот
          selectedSlotId: newSlot.id,
          selectedSlotIds: [newSlot.id],
          selectedSlotType: 'sticky',
        });
      },

      removeStickySlot: (slotId) => {
        const { project, currentScreenId, selectedSlotId } = get();
        if (!project || !currentScreenId) return;
        
        get().saveToHistory();

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return {
            ...screen,
            stickySlots: (screen.stickySlots || []).filter(s => s.id !== slotId),
          };
        });
        
        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
          selectedSlotId: selectedSlotId === slotId ? null : selectedSlotId,
        });
      },

      moveStickySlot: (slotId, direction) => {
        const { project, currentScreenId } = get();
        if (!project || !currentScreenId) return;

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen || !currentScreen.stickySlots) return;

        const index = currentScreen.stickySlots.findIndex(s => s.id === slotId);
        if (index === -1) return;

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= currentScreen.stickySlots.length) return;

        const newSlots = [...currentScreen.stickySlots];
        [newSlots[index], newSlots[newIndex]] = [newSlots[newIndex], newSlots[index]];

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return { ...screen, stickySlots: newSlots };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      // Drag & Drop - переместить слот на новую позицию
      reorderSlot: (slotId, newIndex, slotType) => {
        const { project, currentScreenId } = get();
        if (!project || !currentScreenId) return;

        get().saveToHistory();

        const currentScreen = project.screens.find(s => s.id === currentScreenId);
        if (!currentScreen) return;

        const slots = slotType === 'sticky' 
          ? [...(currentScreen.stickySlots || [])]
          : [...currentScreen.slots];

        const oldIndex = slots.findIndex(s => s.id === slotId);
        if (oldIndex === -1 || oldIndex === newIndex) return;

        // Перемещаем элемент
        const [removed] = slots.splice(oldIndex, 1);
        slots.splice(newIndex, 0, removed);

        const newScreens = project.screens.map(screen => {
          if (screen.id !== currentScreenId) return screen;
          return slotType === 'sticky'
            ? { ...screen, stickySlots: slots }
            : { ...screen, slots };
        });

        set({
          project: { ...project, screens: newScreens, updatedAt: Date.now() },
        });
      },

      getCurrentScreen: () => {
        const { project, currentScreenId } = get();
        if (!project || !currentScreenId) return null;
        return project.screens.find(s => s.id === currentScreenId) || null;
      },

      getShareableLink: () => {
        const { project } = get();
        if (!project) return '';

        // Генерируем уникальный ID для шаринга
        const shareId = uuidv4();

        // Собираем все используемые кастомные компоненты
        const usedCustomComponentNames = new Set<string>();
        project.screens.forEach((screen) => {
          [...screen.slots, ...screen.stickySlots].forEach((slot) => {
            if (slot.component?.type === 'custom') {
              usedCustomComponentNames.add((slot.component as { componentName: string }).componentName);
            }
          });
        });

        // Получаем определения кастомных компонентов из localStorage
        const customComponentsData: Record<string, unknown>[] = [];
        if (usedCustomComponentNames.size > 0) {
          try {
            const stored = localStorage.getItem('custom-components-storage');
            if (stored) {
              const parsed = JSON.parse(stored);
              const allComponents = parsed?.state?.components || [];
              allComponents.forEach((comp: { name: string }) => {
                if (usedCustomComponentNames.has(comp.name)) {
                  customComponentsData.push(comp);
                }
              });
            }
          } catch (e) {
            console.warn('Could not load custom components', e);
          }
        }

        // Создаём проект с встроенными кастомными компонентами
        const projectWithComponents: Project = {
          ...project,
          customComponents: customComponentsData.length > 0 ? customComponentsData : undefined,
        };

        // Сохраняем проект в localStorage с этим ID
        try {
          const sharedProjects = JSON.parse(localStorage.getItem('shared-projects') || '{}');

          // Очищаем старые проекты (оставляем только 10 последних)
          const entries = Object.entries(sharedProjects) as [string, { createdAt: number }][];
          if (entries.length > 10) {
            entries
              .sort((a, b) => a[1].createdAt - b[1].createdAt)
              .slice(0, entries.length - 10)
              .forEach(([key]) => delete sharedProjects[key]);
          }

          sharedProjects[shareId] = {
            project: projectWithComponents,
            createdAt: Date.now(),
          };
          localStorage.setItem('shared-projects', JSON.stringify(sharedProjects));
        } catch (e) {
          // Если localStorage переполнен, очищаем все shared проекты
          console.warn('localStorage quota exceeded, clearing shared projects');
          localStorage.removeItem('shared-projects');
          try {
            localStorage.setItem('shared-projects', JSON.stringify({
              [shareId]: { project: projectWithComponents, createdAt: Date.now() }
            }));
          } catch {
            // Если всё ещё не помещается, просто пропускаем сохранение
            console.warn('Could not save to localStorage');
          }
        }

        // Короткая ссылка без данных в URL (работает на этом устройстве)
        return `${typeof window !== 'undefined' ? window.location.origin : ''}/preview?id=${shareId}`;
      },
    }),
    {
      name: 'editor-storage',
      // Обработка ошибок при сохранении в localStorage
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (e) {
            // Если localStorage переполнен, очищаем shared-projects
            console.warn('localStorage quota exceeded, clearing shared-projects');
            localStorage.removeItem('shared-projects');
            try {
              localStorage.setItem(name, JSON.stringify(value));
            } catch {
              // Если всё ещё не помещается, очищаем всё кроме текущего проекта
              console.warn('Still exceeded, clearing all localStorage');
              localStorage.clear();
              localStorage.setItem(name, JSON.stringify(value));
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

// Хук для отслеживания гидратации zustand store
export const useHydration = () => {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Проверяем состояние гидратации при монтировании
    const unsubFinishHydration = useEditorStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    // Если уже гидратирован
    if (useEditorStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
};
