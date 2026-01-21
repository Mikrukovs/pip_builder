'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  CustomComponentDefinition, 
  TemplateElement, 
  TemplateStyle,
  StateMachineBehavior,
  ActionDefinition,
  EventType,
  DropdownItem
} from '@/types/custom-components';
import { Cell, Button, Input } from '@/components/ui-kit';
import { CellProps, ButtonProps, InputProps } from '@/types';

// Встроенные SVG иконки
const ICONS: Record<string, React.ReactNode> = {
  // Меню / действия
  'more': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="5" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="12" cy="19" r="2"/>
    </svg>
  ),
  'more-horizontal': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="2"/>
      <circle cx="12" cy="12" r="2"/>
      <circle cx="19" cy="12" r="2"/>
    </svg>
  ),
  'close': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6L6 18M6 6l12 12"/>
    </svg>
  ),
  'plus': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  'minus': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 12h14"/>
    </svg>
  ),
  
  // Стрелки
  'chevron-right': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  ),
  'chevron-left': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6"/>
    </svg>
  ),
  'chevron-down': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6"/>
    </svg>
  ),
  'chevron-up': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 15l-6-6-6 6"/>
    </svg>
  ),
  'arrow-left': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  ),
  'arrow-right': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  ),
  
  // Действия
  'check': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
  ),
  'search': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/>
      <path d="M21 21l-4.35-4.35"/>
    </svg>
  ),
  'settings': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
    </svg>
  ),
  'share': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/>
      <circle cx="6" cy="12" r="3"/>
      <circle cx="18" cy="19" r="3"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
    </svg>
  ),
  'edit': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  'trash': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
    </svg>
  ),
  'copy': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
    </svg>
  ),
  
  // Статусы
  'heart': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  'heart-filled': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  'star': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  'star-filled': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
    </svg>
  ),
  'info': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4M12 8h.01"/>
    </svg>
  ),
  'warning': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
      <path d="M12 9v4M12 17h.01"/>
    </svg>
  ),
  'user': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  'home': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <path d="M9 22V12h6v10"/>
    </svg>
  ),
  'bell': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 01-3.46 0"/>
    </svg>
  ),
  'camera': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  'image': (
    <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <path d="M21 15l-5-5L5 21"/>
    </svg>
  ),
};

interface CustomComponentRendererProps {
  definition: CustomComponentDefinition;
  props: Record<string, unknown>;
  preview?: boolean;
  onNavigate?: (screenId: string) => void;
}

interface RenderContext {
  props: Record<string, unknown>;
  context: Record<string, unknown>;
  currentState: string;
  itemIndex?: number;
  item?: Record<string, unknown>;
}

interface SheetState {
  isOpen: boolean;
  title: string;
  content: TemplateElement | null;
}

interface DropdownState {
  isOpen: boolean;
  items: DropdownItem[];
  position: { x: number; y: number };
}

export function CustomComponentRenderer({ 
  definition, 
  props, 
  preview = false,
  onNavigate 
}: CustomComponentRendererProps) {
  // State machine state
  const [machineState, setMachineState] = useState<string>(
    definition.behavior?.type === 'state-machine' ? definition.behavior.initial : 'idle'
  );
  const [context, setContext] = useState<Record<string, unknown>>(
    definition.behavior?.type === 'state-machine' ? (definition.behavior.context || {}) : {}
  );
  
  // Sheet state
  const [sheet, setSheet] = useState<SheetState>({ isOpen: false, title: '', content: null });
  
  // Dropdown state
  const [dropdown, setDropdown] = useState<DropdownState>({ isOpen: false, items: [], position: { x: 0, y: 0 } });
  const dropdownTriggerRef = useRef<HTMLElement | null>(null);

  // Execute actions
  const executeActions = useCallback((actions: ActionDefinition[]) => {
    for (const action of actions) {
      switch (action.type) {
        case 'navigate':
          if (action.screen && onNavigate) {
            // Если screen начинается с "prop:", берём значение из props
            const screenId = action.screen.startsWith('prop:')
              ? (props[action.screen.slice(5)] as string)
              : action.screen;
            if (screenId) {
              onNavigate(screenId);
            }
          }
          break;
          
        case 'haptic':
          // Вибрация (в реальном устройстве)
          if ('vibrate' in navigator) {
            const patterns: Record<string, number[]> = {
              light: [10],
              medium: [20],
              heavy: [30],
              success: [10, 50, 10],
              error: [50, 50, 50],
              warning: [30, 50, 30],
            };
            navigator.vibrate(patterns[action.hapticType || 'light'] || [10]);
          }
          break;
          
        case 'setValue':
          if (action.key) {
            setContext(prev => ({ ...prev, [action.key!]: action.value }));
          }
          break;
          
        case 'increment':
          if (action.key) {
            setContext(prev => ({
              ...prev,
              [action.key!]: (Number(prev[action.key!]) || 0) + (action.by || 1)
            }));
          }
          break;
          
        case 'decrement':
          if (action.key) {
            setContext(prev => ({
              ...prev,
              [action.key!]: (Number(prev[action.key!]) || 0) - (action.by || 1)
            }));
          }
          break;
          
        case 'nextItem':
          if (action.key && action.listKey) {
            const list = props[action.listKey] as unknown[];
            if (list) {
              setContext(prev => ({
                ...prev,
                [action.key!]: Math.min(Number(prev[action.key!]) + 1, list.length - 1)
              }));
            }
          }
          break;
          
        case 'prevItem':
          if (action.key) {
            setContext(prev => ({
              ...prev,
              [action.key!]: Math.max(Number(prev[action.key!]) - 1, 0)
            }));
          }
          break;
          
        case 'openSheet':
          setSheet({
            isOpen: true,
            title: action.sheetTitle || '',
            content: action.sheetContent || null,
          });
          break;
          
        case 'closeSheet':
          setSheet({ isOpen: false, title: '', content: null });
          break;
          
        case 'openDropdown':
          if (action.dropdownItems) {
            const rect = dropdownTriggerRef.current?.getBoundingClientRect();
            setDropdown({
              isOpen: true,
              items: action.dropdownItems,
              position: rect ? { x: rect.left, y: rect.bottom + 4 } : { x: 0, y: 0 },
            });
          }
          break;
          
        case 'closeDropdown':
          setDropdown({ isOpen: false, items: [], position: { x: 0, y: 0 } });
          break;
      }
    }
  }, [props, onNavigate]);

  // Handle event
  const handleEvent = useCallback((eventType: EventType, eventData?: Record<string, unknown>) => {
    if (definition.behavior?.type !== 'state-machine') return;
    
    const behavior = definition.behavior as StateMachineBehavior;
    const currentStateDefinition = behavior.states[machineState];
    
    if (!currentStateDefinition?.on) return;
    
    const transition = currentStateDefinition.on[eventType];
    if (!transition) return;
    
    // Обработка перехода (может быть объект или массив)
    const transitions = Array.isArray(transition) ? transition : [transition];
    
    for (const t of transitions) {
      // TODO: проверить condition
      
      // Выполнить exit actions текущего состояния
      if (currentStateDefinition.exit) {
        executeActions(currentStateDefinition.exit);
      }
      
      // Выполнить actions перехода
      if (t.actions) {
        executeActions(t.actions);
      }
      
      // Перейти в новое состояние
      setMachineState(t.target);
      
      // Выполнить entry actions нового состояния
      const newStateDefinition = behavior.states[t.target];
      if (newStateDefinition?.entry) {
        executeActions(newStateDefinition.entry);
      }
      
      break; // Только первый подходящий переход
    }
  }, [definition.behavior, machineState, executeActions]);

  // Reset state machine when definition changes
  useEffect(() => {
    if (definition.behavior?.type === 'state-machine') {
      setMachineState(definition.behavior.initial);
      setContext(definition.behavior.context || {});
    }
  }, [definition]);

  // Get value from props/context using path like "title" or "item.name"
  const getValue = (path: string, renderContext: RenderContext): unknown => {
    if (path.startsWith('context:')) {
      return renderContext.context[path.slice(8)];
    }
    if (path.startsWith('item.') && renderContext.item) {
      return renderContext.item[path.slice(5)];
    }
    if (path === 'item' && renderContext.item) {
      return renderContext.item;
    }
    return renderContext.props[path];
  };

  // Convert template style to CSS - поддержка всех основных свойств
  const styleToCSS = (style?: TemplateStyle | Record<string, unknown>): React.CSSProperties => {
    if (!style) return {};
    
    // Просто передаём все свойства как есть - React сам обработает
    const css: React.CSSProperties = {};
    
    const styleObj = style as Record<string, unknown>;
    for (const [key, value] of Object.entries(styleObj)) {
      if (value !== undefined) {
        (css as Record<string, unknown>)[key] = value;
      }
    }
    
    return css;
  };

  // Render template element
  const renderElement = (element: TemplateElement, renderContext: RenderContext, key?: string): React.ReactNode => {
    const style = styleToCSS(element.style);
    const propValue = element.prop ? getValue(element.prop, renderContext) : undefined;
    
    // Gesture handlers
    const gestureHandlers: Record<string, () => void> = {};
    if (preview && element.gestures) {
      if (element.gestures.includes('TAP')) {
        gestureHandlers.onClick = () => handleEvent('TAP', { itemIndex: renderContext.itemIndex });
      }
    }

    switch (element.type) {
      case 'container':
        return (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', ...style }} {...gestureHandlers}>
            {element.children?.map((child, i) => renderElement(child, renderContext, `${key}-${i}`))}
          </div>
        );

      case 'heading':
        return (
          <h2 key={key} style={{ margin: 0, fontSize: 20, fontWeight: 600, ...style }} {...gestureHandlers}>
            {String(propValue || '')}
          </h2>
        );

      case 'text':
        return (
          <p key={key} style={{ margin: 0, fontSize: 14, color: '#666', ...style }} {...gestureHandlers}>
            {String(propValue || '')}
          </p>
        );

      case 'image':
        const imageSrc = String(propValue || '');
        return imageSrc ? (
          <img 
            key={key} 
            src={imageSrc} 
            alt="" 
            style={{ width: '100%', objectFit: 'cover', ...style }} 
            {...gestureHandlers}
          />
        ) : (
          <div 
            key={key} 
            style={{ 
              width: '100%', 
              height: 120, 
              background: '#f0f0f0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#999',
              fontSize: 12,
              ...style 
            }}
            {...gestureHandlers}
          >
            Нет изображения
          </div>
        );

      case 'button':
        // Собираем конфиг для нативного Button
        const buttonConfig: ButtonProps = {
          type: 'button',
          label: String(propValue || element.title || 'Кнопка'),
          variant: element.variant || 'primary',
          size: (typeof element.size === 'string' ? element.size : 'm') as 's' | 'm' | 'l',
          action: element.action === 'navigate' ? 'navigate' : 'none',
          targetScreenId: element.target?.startsWith('prop:')
            ? (renderContext.props[element.target.slice(5)] as string) || null
            : element.target || null,
          requireValidation: element.requireValidation,
        };
        
        return (
          <div key={key} style={style} onClick={() => handleEvent('TAP')}>
            <Button 
              config={buttonConfig} 
              preview={preview} 
              onNavigate={onNavigate || (() => {})}
            />
          </div>
        );

      case 'input':
        // Собираем конфиг для нативного Input
        const inputConfig: InputProps = {
          type: 'input',
          inputVariant: element.inputVariant || 'default',
          placeholder: element.placeholder || String(propValue || ''),
          label: element.label || '',
          showLabel: element.showLabel ?? false,
          inputType: element.inputType || 'text',
          descriptor: element.descriptor || '',
          dropdownOptions: element.dropdownOptions || [],
          validation: {
            enabled: element.validation?.enabled ?? false,
            type: element.validation?.type ?? 'exact',
            exactValue: element.validation?.exactValue ?? '',
            min: element.validation?.min ?? null,
            max: element.validation?.max ?? null,
            errorMessage: element.validation?.errorMessage ?? '',
            successMessage: element.validation?.successMessage ?? '',
          },
        };
        
        return (
          <div key={key} style={style}>
            <Input config={inputConfig} preview={preview} />
          </div>
        );

      case 'cell':
        // Собираем конфиг для нативного Cell
        const cellTitle = element.title 
          ? (element.title.startsWith('prop:') ? String(getValue(element.title, renderContext) || '') : element.title)
          : String(propValue || '');
        const cellSubtitle = element.subtitle
          ? (element.subtitle.startsWith('prop:') ? String(getValue(element.subtitle, renderContext) || '') : element.subtitle)
          : '';
        const cellIcon = element.icon
          ? (element.icon.startsWith('prop:') ? String(getValue(element.icon, renderContext) || '') : element.icon)
          : '';
        const cellRightIcon = element.rightIcon
          ? (element.rightIcon.startsWith('prop:') ? String(getValue(element.rightIcon, renderContext) || '') : element.rightIcon)
          : '';
          
        const cellConfig: CellProps = {
          type: 'cell',
          cellType: element.cellType || 'basic',
          title: cellTitle,
          subtitle: cellSubtitle,
          showSubtitle: element.showSubtitle ?? !!cellSubtitle,
          subtitlePosition: element.subtitlePosition || 'bottom',
          showIcon: element.showIcon ?? !!cellIcon,
          icon: cellIcon,
          rightIcon: cellRightIcon,
          action: element.action === 'navigate' ? 'navigate' : 'none',
          targetScreenId: element.target?.startsWith('prop:')
            ? (renderContext.props[element.target.slice(5)] as string) || null
            : element.target || null,
          infoValue: element.infoValue || '',
          radioGroup: element.radioGroup || '',
        };
        
        return (
          <div key={key} style={style} onClick={() => handleEvent('TAP')}>
            <Cell 
              config={cellConfig} 
              preview={preview} 
              onNavigate={onNavigate || (() => {})}
            />
          </div>
        );

      case 'spacer':
        return <div key={key} style={{ height: element.height || 16 }} />;

      case 'list':
        const listData = element.dataKey ? (renderContext.props[element.dataKey] as Record<string, unknown>[]) : [];
        if (!Array.isArray(listData) || !element.itemTemplate) return null;

        return (
          <div 
            key={key} 
            style={{
              display: style.display || 'flex',
              flexDirection: style.flexDirection || 'column',
              ...style
            }}
          >
            {listData.map((item, index) => (
              renderElement(element.itemTemplate!, {
                ...renderContext,
                item,
                itemIndex: index,
              }, `${key}-item-${index}`)
            ))}
          </div>
        );

      case 'stack':
        const stackData = element.dataKey ? (renderContext.props[element.dataKey] as Record<string, unknown>[]) : [];
        const currentIndex = element.indexKey ? (Number(renderContext.context[element.indexKey]) || 0) : 0;
        
        if (!Array.isArray(stackData) || !element.itemTemplate) return null;
        
        // Показываем только текущую карточку и следующие (для эффекта стека)
        const visibleCards = stackData.slice(currentIndex, currentIndex + 3);
        
        return (
          <div key={key} style={{ position: 'relative', ...style }}>
            {visibleCards.map((item, index) => (
              <div
                key={`${key}-stack-${currentIndex + index}`}
                style={{
                  position: index === 0 ? 'relative' : 'absolute',
                  top: index * 4,
                  left: 0,
                  right: 0,
                  transform: `scale(${1 - index * 0.02})`,
                  zIndex: visibleCards.length - index,
                  transition: 'all 0.3s ease',
                }}
                onTouchStart={preview && index === 0 ? (e) => {
                  // TODO: implement swipe gesture
                } : undefined}
              >
                {renderElement(element.itemTemplate!, {
                  ...renderContext,
                  item,
                  itemIndex: currentIndex + index,
                }, `${key}-stack-item-${currentIndex + index}`)}
              </div>
            ))}
          </div>
        );

      case 'icon':
        // Поддержка динамического имени: "context:isLiked ? 'heart-filled' : 'heart'"
        let iconName = element.name || '';
        if (iconName.startsWith('context:')) {
          const expr = iconName.slice(8);
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('context', 'props', `return ${expr};`);
            iconName = fn(renderContext.context, renderContext.props) || '';
          } catch {
            iconName = '';
          }
        }
        const iconSvg = ICONS[iconName];
        const iconSize = typeof element.size === 'number' ? element.size : 24;
        
        if (!iconSvg) {
          return (
            <span key={key} style={{ fontSize: iconSize, ...style }}>
              {iconName || '?'}
            </span>
          );
        }
        
        // Вычисляем rotation если указан (поддержка: число, "context:key", "context:isOpen ? 180 : 0")
        let rotation = 0;
        if (element.rotation) {
          if (element.rotation.startsWith('context:')) {
            const expr = element.rotation.slice(8);
            try {
              // eslint-disable-next-line no-new-func
              const fn = new Function('context', 'props', `return ${expr};`);
              rotation = Number(fn(renderContext.context, renderContext.props)) || 0;
            } catch {
              rotation = 0;
            }
          } else {
            rotation = Number(element.rotation) || 0;
          }
        }
        
        return (
          <span 
            key={key}
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: iconSize,
              height: iconSize,
              color: '#6b7280',
              transition: 'transform 0.2s ease',
              transform: rotation ? `rotate(${rotation}deg)` : undefined,
              ...style 
            }}
            {...gestureHandlers}
          >
            {iconSvg}
          </span>
        );

      default:
        return null;
    }
  };

  // Merge default props with provided props
  const mergedProps = { ...definition.defaultProps, ...props };
  
  const renderContext: RenderContext = {
    props: mergedProps,
    context,
    currentState: machineState,
  };

  // Закрытие dropdown при клике вне
  useEffect(() => {
    if (!dropdown.isOpen) return;
    
    const handleClickOutside = () => {
      setDropdown({ isOpen: false, items: [], position: { x: 0, y: 0 } });
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [dropdown.isOpen]);

  return (
    <>
      <div className="custom-component" style={{ width: '100%', maxWidth: '100%' }}>
        {renderElement(definition.template, renderContext, 'root')}
      </div>

      {/* Bottom Sheet */}
      {sheet.isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setSheet({ isOpen: false, title: '', content: null })}
          />
          
          {/* Sheet */}
          <div 
            className="relative w-full max-w-[375px] bg-white rounded-t-2xl shadow-xl animate-slide-up"
            style={{ maxHeight: '80vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            
            {/* Header */}
            {sheet.title && (
              <div className="px-4 pb-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 text-center">
                  {sheet.title}
                </h3>
              </div>
            )}
            
            {/* Content */}
            <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 100px)' }}>
              {sheet.content && renderElement(sheet.content, renderContext, 'sheet-content')}
            </div>
            
            {/* Safe area */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* Dropdown */}
      {dropdown.isOpen && dropdown.items.length > 0 && (
        <div 
          className="fixed z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[180px] animate-fade-in"
          style={{ 
            left: Math.min(dropdown.position.x, window.innerWidth - 200),
            top: dropdown.position.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {dropdown.items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  executeActions([item.action]);
                }
                setDropdown({ isOpen: false, items: [], position: { x: 0, y: 0 } });
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 
                         flex items-center gap-3 transition-colors"
            >
              {item.icon && <span className="text-lg">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
