// Типы для кастомных компонентов

// === Template Types ===

export type TemplateElementType = 
  | 'container' 
  | 'heading' 
  | 'text' 
  | 'image' 
  | 'button' 
  | 'input' 
  | 'cell'
  | 'spacer'
  | 'list'
  | 'stack'
  | 'icon';

export interface TemplateStyle {
  // Основные свойства (для автокомплита)
  padding?: number | string;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number | string;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderRadius?: number | string;
  background?: string;
  backgroundColor?: string;
  boxShadow?: string;
  border?: string;
  borderBottom?: string;
  overflow?: string;
  overflowX?: string;
  overflowY?: string;
  position?: string;
  top?: number | string;
  bottom?: number | string;
  left?: number | string;
  right?: number | string;
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  flexShrink?: number;
  flexGrow?: number;
  justifyContent?: string;
  alignItems?: string;
  gap?: number | string;
  width?: number | string;
  height?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
  minHeight?: number | string;
  maxHeight?: number | string;
  aspectRatio?: string;
  fontSize?: number;
  fontWeight?: number | string;
  lineHeight?: number | string;
  color?: string;
  textAlign?: string;
  objectFit?: string;
  zIndex?: number;
  opacity?: number;
  transform?: string;
  transition?: string;
  cursor?: string;
  // Разрешаем любые другие CSS свойства
  [key: string]: unknown;
}

export interface TemplateElement {
  type: TemplateElementType;
  prop?: string; // Ссылка на свойство из props, например "title" или "item.name"
  style?: TemplateStyle;
  children?: TemplateElement[];
  
  // Для button
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 's' | 'm' | 'l' | number; // Для button: 's'|'m'|'l', для icon: число в пикселях
  action?: 'navigate' | 'none' | 'back';
  target?: string; // "prop:targetScreen" или screenId
  requireValidation?: boolean;
  
  // Для input
  placeholder?: string;
  label?: string;
  showLabel?: boolean;
  inputVariant?: 'default' | 'search' | 'dropdown' | 'password';
  inputType?: 'text' | 'numeric';
  descriptor?: string;
  dropdownOptions?: { id: string; label: string }[];
  validation?: {
    enabled: boolean;
    type: 'exact' | 'range';
    exactValue?: string;
    min?: number | null;
    max?: number | null;
    errorMessage?: string;
    successMessage?: string;
  };
  
  // Для cell
  cellType?: 'basic' | 'navigation' | 'toggle' | 'checkbox' | 'radio' | 'info' | 'icon';
  title?: string; // или prop
  subtitle?: string;
  showSubtitle?: boolean;
  subtitlePosition?: 'top' | 'bottom';
  showIcon?: boolean;
  icon?: string; // base64/URL или "prop:iconKey"
  rightIcon?: string;
  infoValue?: string;
  radioGroup?: string;
  
  // Для spacer
  height?: number;
  
  // Для list/stack
  dataKey?: string; // Ключ в props с данными списка
  indexKey?: string; // Ключ для текущего индекса в context
  itemTemplate?: TemplateElement;
  
  // Для icon
  name?: string; // Название иконки: more, close, chevron-down, check и др.
  rotation?: string; // Поворот: число или "context:ключ"
  
  // Интерактивность
  gestures?: ('TAP' | 'LONG_PRESS' | 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'SWIPE_UP' | 'SWIPE_DOWN')[];
  visible?: string; // Условие видимости, например "context:openIndex === item.index"
}

// === Settings Types ===

export type SettingType = 
  | 'text' 
  | 'textarea' 
  | 'number' 
  | 'select' 
  | 'toggle' 
  | 'color' 
  | 'image' 
  | 'screen'
  | 'items';

export interface SettingOption {
  value: string;
  label: string;
}

export interface SettingItemField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'image' | 'toggle';
}

export interface SettingDefinition {
  key: string;
  label: string;
  type: SettingType;
  placeholder?: string;
  options?: SettingOption[]; // Для select
  itemFields?: SettingItemField[]; // Для items
  min?: number; // Для number
  max?: number;
  step?: number;
}

// === Behavior / State Machine Types ===

export type EventType = 
  | 'TAP'
  | 'LONG_PRESS'
  | 'SWIPE_LEFT'
  | 'SWIPE_RIGHT'
  | 'SWIPE_UP'
  | 'SWIPE_DOWN'
  | 'DRAG_START'
  | 'DRAG_END'
  | 'INPUT_CHANGE'
  | 'TIMER';

export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'slideUp' 
  | 'slideDown'
  | 'flyLeft'
  | 'flyRight'
  | 'scale' 
  | 'spring'
  | 'expand'
  | 'collapse';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

export interface ActionDefinition {
  type: 'navigate' | 'animate' | 'haptic' | 'sound' | 'setValue' | 'increment' | 'decrement' | 'addToList' | 'removeFromList' | 'nextItem' | 'prevItem' | 'openSheet' | 'closeSheet' | 'openDropdown' | 'closeDropdown';
  
  // Для navigate
  screen?: string; // screenId или "prop:fieldName"
  
  // Для animate
  animation?: AnimationType;
  
  // Для haptic
  hapticType?: HapticType;
  
  // Для sound
  sound?: string;
  
  // Для setValue
  key?: string;
  value?: unknown;
  
  // Для increment/decrement
  by?: number;
  
  // Для addToList/removeFromList
  index?: number;
  
  // Для nextItem/prevItem
  listKey?: string;
  
  // Для openSheet
  sheetId?: string; // ID шторки для открытия
  sheetTitle?: string; // Заголовок шторки
  sheetContent?: TemplateElement; // Контент шторки (template)
  
  // Для openDropdown
  dropdownId?: string; // ID дропдауна
  dropdownItems?: DropdownItem[]; // Элементы дропдауна
}

// Элемент дропдауна
export interface DropdownItem {
  id: string;
  label: string;
  icon?: string; // Эмодзи или иконка
  action?: ActionDefinition; // Действие при выборе
}

export interface ConditionDefinition {
  type: 'isFirst' | 'isLast' | 'isEmpty' | 'isNotEmpty' | 'equals' | 'notEquals' | 'greaterThan' | 'lessThan';
  key?: string;
  value?: unknown;
}

export interface TransitionDefinition {
  target: string;
  actions?: ActionDefinition[];
  condition?: ConditionDefinition | string;
}

export interface StateDefinition {
  on?: Record<EventType | string, TransitionDefinition | TransitionDefinition[]>;
  entry?: ActionDefinition[];
  exit?: ActionDefinition[];
  after?: Record<string, TransitionDefinition | TransitionDefinition[]>;
}

export interface StateMachineBehavior {
  type: 'state-machine';
  initial: string;
  context?: Record<string, unknown>;
  states: Record<string, StateDefinition>;
}

export type BehaviorDefinition = StateMachineBehavior | null;

// === Custom Component ===

export interface CustomComponentDefinition {
  name: string;
  displayName: string;
  category: 'custom';
  icon: string;
  description?: string;
  
  template: TemplateElement;
  defaultProps: Record<string, unknown>;
  settings: SettingDefinition[];
  behavior?: BehaviorDefinition;
}

// Валидация JSON
export function validateCustomComponent(json: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!json || typeof json !== 'object') {
    return { valid: false, errors: ['JSON должен быть объектом'] };
  }
  
  const obj = json as Record<string, unknown>;
  
  // Проверка обязательных полей
  if (!obj.name || typeof obj.name !== 'string') {
    errors.push('Отсутствует или некорректное поле "name"');
  }
  
  if (!obj.displayName || typeof obj.displayName !== 'string') {
    errors.push('Отсутствует или некорректное поле "displayName"');
  }
  
  if (!obj.template || typeof obj.template !== 'object') {
    errors.push('Отсутствует или некорректное поле "template"');
  }
  
  if (!obj.defaultProps || typeof obj.defaultProps !== 'object') {
    errors.push('Отсутствует или некорректное поле "defaultProps"');
  }
  
  if (!obj.settings || !Array.isArray(obj.settings)) {
    errors.push('Отсутствует или некорректное поле "settings"');
  }
  
  // Проверка что все key в settings есть в defaultProps
  if (Array.isArray(obj.settings) && obj.defaultProps && typeof obj.defaultProps === 'object') {
    const props = obj.defaultProps as Record<string, unknown>;
    for (const setting of obj.settings as SettingDefinition[]) {
      if (!(setting.key in props)) {
        errors.push(`Настройка "${setting.key}" не найдена в defaultProps`);
      }
    }
  }
  
  return { valid: errors.length === 0, errors };
}
