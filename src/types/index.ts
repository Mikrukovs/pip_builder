// Типы компонентов
export type ComponentType = 
  | 'heading'
  | 'text'
  | 'button'
  | 'input'
  | 'selector'
  | 'image'
  | 'cell'
  | 'navbar'
  | 'custom'; // Кастомные импортированные компоненты

// Базовые настройки для каждого типа компонента
export interface HeadingProps {
  type: 'heading';
  text: string;
  alignment: 'left' | 'center';
}

export interface TextProps {
  type: 'text';
  text: string;
  alignment: 'left' | 'center';
}

export interface ButtonProps {
  type: 'button';
  label: string;
  variant: 'primary' | 'secondary' | 'destructive';
  size: 's' | 'm' | 'l';
  action: 'none' | 'navigate';
  targetScreenId: string | null;
}

export interface InputProps {
  type: 'input';
  // Вид инпута
  inputVariant: 'default' | 'search' | 'dropdown' | 'password';
  placeholder: string;
  label: string;
  showLabel: boolean;
  inputType: 'text' | 'numeric';
  descriptor: string;
  // Для dropdown
  dropdownOptions: { id: string; label: string }[];
  // Валидация
  validation: {
    enabled: boolean;
    type: 'exact' | 'range'; // Тип валидации
    exactValue: string; // Для точного совпадения
    min: number | null; // Для диапазона
    max: number | null; // Для диапазона
    errorMessage: string; // Кастомный текст ошибки
    successMessage: string; // Кастомный текст успеха
  };
}

export interface SelectorProps {
  type: 'selector';
  items: { id: string; text: string }[];
}

export interface ImageProps {
  type: 'image';
  src: string; // base64 или URL
  alt: string;
}

export interface CellProps {
  type: 'cell';
  showIcon: boolean; // Показывать иконку
  icon: string; // base64 или URL
  title: string;
  subtitle: string;
  showSubtitle: boolean;
  subtitlePosition: 'top' | 'bottom';
  // Тип ячейки
  cellType: 'basic' | 'navigation' | 'toggle' | 'checkbox' | 'radio' | 'info' | 'icon';
  // Для icon типа
  rightIcon: string; // base64 или URL иконки справа
  // Для navigation
  action: 'none' | 'navigate';
  targetScreenId: string | null;
  // Для info (summ)
  infoValue: string;
  // Группа для radio (чтобы работали как группа)
  radioGroup: string;
}

// Navbar компонент
export interface NavbarProps {
  type: 'navbar';
  // Левая часть - кнопка назад
  backButton: {
    show: boolean;
    style: 'icon' | 'iconText'; // Только иконка или иконка + текст
    text: string; // Текст кнопки (для iconText)
    action: 'back' | 'navigate'; // Назад или на конкретную страницу
    targetScreenId: string | null;
  };
  // Центральная часть
  title: string;
  subtitle: string;
  showSubtitle: boolean;
  // Правая часть - меню (bottom sheet)
  menu: {
    show: boolean;
    title: string; // Заголовок шторки
    slots: Slot[]; // Слоты для компонентов в шторке
  };
}

// Кастомный компонент
export interface CustomProps {
  type: 'custom';
  componentName: string; // Имя кастомного компонента
  props: Record<string, unknown>; // Свойства компонента
}

// Union type для всех компонентов
export type ComponentProps = 
  | HeadingProps 
  | TextProps 
  | ButtonProps 
  | InputProps 
  | SelectorProps 
  | ImageProps 
  | CellProps
  | NavbarProps
  | CustomProps;

// Слот на холсте
export interface Slot {
  id: string;
  component: ComponentProps | null;
}

// Страница (экран)
export interface Screen {
  id: string;
  name: string;
  slots: Slot[];
  stickySlots: Slot[]; // Слоты для sticky секции внизу экрана
}

// Проект
export interface Project {
  id: string;
  name: string;
  screens: Screen[];
  createdAt: number;
  updatedAt: number;
  // Встроенные кастомные компоненты (для работы на других устройствах)
  customComponents?: Record<string, unknown>[];
}

// Дефолтные значения для компонентов
export const defaultComponentProps: Record<ComponentType, ComponentProps> = {
  heading: {
    type: 'heading',
    text: 'Заголовок',
    alignment: 'left',
  },
  text: {
    type: 'text',
    text: 'Текстовый блок',
    alignment: 'left',
  },
  button: {
    type: 'button',
    label: 'Кнопка',
    variant: 'primary',
    size: 'm',
    action: 'none',
    targetScreenId: null,
  },
  input: {
    type: 'input',
    inputVariant: 'default',
    placeholder: 'Введите текст',
    label: 'Поле ввода',
    showLabel: true,
    inputType: 'text',
    descriptor: '',
    dropdownOptions: [
      { id: '1', label: 'Вариант 1' },
      { id: '2', label: 'Вариант 2' },
      { id: '3', label: 'Вариант 3' },
    ],
    validation: {
      enabled: false,
      type: 'exact',
      exactValue: '',
      min: null,
      max: null,
      errorMessage: 'Неверное значение',
      successMessage: 'Верно!',
    },
  },
  selector: {
    type: 'selector',
    items: [
      { id: '1', text: 'Вариант 1' },
      { id: '2', text: 'Вариант 2' },
    ],
  },
  image: {
    type: 'image',
    src: '',
    alt: 'Изображение',
  },
  cell: {
    type: 'cell',
    showIcon: true,
    icon: '',
    title: 'Заголовок ячейки',
    subtitle: 'Подзаголовок',
    showSubtitle: true,
    subtitlePosition: 'bottom',
    cellType: 'navigation',
    action: 'none',
    targetScreenId: null,
    infoValue: '',
    radioGroup: 'default',
    rightIcon: '',
  },
  navbar: {
    type: 'navbar',
    backButton: {
      show: true,
      style: 'icon',
      text: 'Назад',
      action: 'back',
      targetScreenId: null,
    },
    title: 'Заголовок',
    subtitle: '',
    showSubtitle: false,
    menu: {
      show: true,
      title: '',
      slots: [],
    },
  },
  custom: {
    type: 'custom',
    componentName: '',
    props: {},
  },
};
