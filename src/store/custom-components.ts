import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CustomComponentDefinition, validateCustomComponent } from '@/types/custom-components';

interface CustomComponentsState {
  // Список импортированных компонентов
  components: CustomComponentDefinition[];
  
  // Импорт компонента из JSON
  importComponent: (json: unknown) => { success: boolean; error?: string };
  
  // Удаление компонента
  removeComponent: (name: string) => void;
  
  // Получить компонент по имени
  getComponent: (name: string) => CustomComponentDefinition | undefined;
  
  // Проверить существует ли компонент
  hasComponent: (name: string) => boolean;
}

export const useCustomComponentsStore = create<CustomComponentsState>()(
  persist(
    (set, get) => ({
      components: [],
      
      importComponent: (json) => {
        // Валидация
        const validation = validateCustomComponent(json);
        if (!validation.valid) {
          return { success: false, error: validation.errors.join(', ') };
        }
        
        const component = json as CustomComponentDefinition;
        
        // Проверка на дубликат
        if (get().hasComponent(component.name)) {
          // Обновляем существующий
          set((state) => ({
            components: state.components.map((c) =>
              c.name === component.name ? { ...component, category: 'custom' } : c
            ),
          }));
          return { success: true };
        }
        
        // Добавляем новый
        set((state) => ({
          components: [...state.components, { ...component, category: 'custom' }],
        }));
        
        return { success: true };
      },
      
      removeComponent: (name) => {
        set((state) => ({
          components: state.components.filter((c) => c.name !== name),
        }));
      },
      
      getComponent: (name) => {
        return get().components.find((c) => c.name === name);
      },
      
      hasComponent: (name) => {
        return get().components.some((c) => c.name === name);
      },
    }),
    {
      name: 'custom-components-storage',
    }
  )
);
