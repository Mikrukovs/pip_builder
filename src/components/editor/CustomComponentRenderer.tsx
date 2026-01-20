'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  CustomComponentDefinition, 
  TemplateElement, 
  TemplateStyle,
  StateMachineBehavior,
  ActionDefinition,
  EventType
} from '@/types/custom-components';

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
        const buttonVariant = element.variant || 'primary';
        const buttonSize = element.size || 'm';
        
        const variantStyles: Record<string, string> = {
          primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
          secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300 border border-gray-300',
          destructive: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        };
        
        const sizeStyles: Record<string, string> = {
          s: 'px-3 py-1.5 text-sm',
          m: 'px-4 py-2 text-base',
          l: 'px-6 py-3 text-lg',
        };
        
        return (
          <button
            key={key}
            type="button"
            onClick={() => {
              if (preview && element.action === 'navigate' && element.target && onNavigate) {
                const targetScreen = element.target.startsWith('prop:')
                  ? (renderContext.props[element.target.slice(5)] as string)
                  : element.target;
                if (targetScreen) {
                  onNavigate(targetScreen);
                }
              }
              handleEvent('TAP');
            }}
            className={`
              w-full font-medium rounded-lg transition-colors duration-150 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              ${variantStyles[buttonVariant] || variantStyles.primary}
              ${sizeStyles[buttonSize] || sizeStyles.m}
            `}
            style={style}
          >
            {String(propValue || 'Кнопка')}
          </button>
        );

      case 'input':
        return (
          <input
            key={key}
            type="text"
            placeholder={element.placeholder || String(propValue || '')}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            style={style}
            readOnly={!preview}
          />
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

  return (
    <div className="custom-component" style={{ width: '100%', maxWidth: '100%' }}>
      {renderElement(definition.template, renderContext, 'root')}
    </div>
  );
}
