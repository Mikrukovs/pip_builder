# Руководство по созданию компонентов для Prototype Builder

Этот документ описывает правила создания кастомных компонентов. Используй его как контекст при работе с дизайнером.

## Твоя роль

Ты помогаешь дизайнеру создать компонент для Prototype Builder. Веди диалог, задавай уточняющие вопросы, и в конце сгенерируй JSON файл компонента.

## Процесс работы с дизайнером

### Шаг 1: Понять что за компонент
Спроси:
- Как называется компонент?
- Что он делает? (краткое описание)
- Есть ли ссылка на Figma или скриншот?

### Шаг 2: Определить структуру (template)
Спроси:
- Из каких элементов состоит? (изображение, текст, кнопки и т.д.)
- Какие свойства должны настраиваться в редакторе?

### Шаг 3: Определить поведение (behavior)
Спроси:
- Есть ли интерактивность? (свайпы, нажатия, анимации)
- Что происходит при взаимодействии?
- Есть ли разные состояния?

### Шаг 4: Сгенерировать JSON
На основе ответов создай файл компонента по формату ниже.

---

## Формат файла компонента

```json
{
  "name": "ComponentName",
  "displayName": "Название для UI",
  "category": "custom",
  "icon": "🎴",
  "description": "Описание компонента",
  
  "template": { },
  "defaultProps": { },
  "settings": [ ],
  "behavior": { }
}
```

---

## Template: Структура компонента

Template описывает визуальную структуру. Доступные типы элементов:

### Базовые элементы
| Тип | Описание | Свойства |
|-----|----------|----------|
| `container` | Контейнер для группировки | `style`, `children` |
| `heading` | Заголовок | `prop`, `style` |
| `text` | Текст | `prop`, `style` |
| `image` | Изображение | `prop`, `style` |
| `icon` | Иконка | `name`, `size`, `rotation`, `style` |
| `button` | Кнопка (нативная) | `prop`, `variant`, `size`, `action`, `target`, `requireValidation`, `style` |
| `input` | Поле ввода (нативное) | `placeholder`, `label`, `inputVariant`, `inputType`, `validation`, `style` |
| `cell` | Ячейка (нативная) | `cellType`, `title`, `subtitle`, `icon`, `rightIcon`, `action`, `target`, `style` |
| `spacer` | Отступ | `height` |
| `list` | Список элементов | `dataKey`, `itemTemplate`, `style` |

**Нативные компоненты** (`button`, `input`, `cell`) поддерживают все свойства как в редакторе. Пример cell:

```json
{
  "type": "cell",
  "cellType": "navigation",
  "title": "prop:itemTitle",
  "subtitle": "prop:itemSubtitle",
  "showSubtitle": true,
  "icon": "prop:itemIcon",
  "showIcon": true,
  "action": "navigate",
  "target": "prop:targetScreen"
}
```

### Пример template

```json
{
  "template": {
    "type": "container",
    "style": { 
      "padding": 16, 
      "borderRadius": 12, 
      "background": "#ffffff",
      "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
    },
    "children": [
      { 
        "type": "image", 
        "prop": "image",
        "style": { "borderRadius": 8, "aspectRatio": "16/9" }
      },
      { "type": "spacer", "height": 12 },
      { 
        "type": "heading", 
        "prop": "title",
        "style": { "fontSize": 18, "fontWeight": 600 }
      },
      { 
        "type": "text", 
        "prop": "description",
        "style": { "color": "#666", "fontSize": 14 }
      },
      { "type": "spacer", "height": 16 },
      { 
        "type": "button", 
        "prop": "buttonLabel",
        "variant": "primary",
        "size": "m"
      }
    ]
  }
}
```

### Иконки (Icon)

Элемент `icon` позволяет добавлять встроенные SVG иконки в кастомные компоненты.

**Свойства:**
| Свойство | Тип | Описание |
|----------|-----|----------|
| `name` | `string` | Название иконки (см. таблицу ниже) |
| `size` | `number` | Размер в пикселях (по умолчанию 24) |
| `rotation` | `string` | Поворот: число (`"90"`) или из контекста (`"context:rotation"`) |
| `style` | `object` | CSS стили (color, etc.) |
| `gestures` | `array` | События: `TAP`, `LONG_PRESS` и др. |

**Доступные иконки:**
| Название | Описание |
|----------|----------|
| `more` | Три точки (вертикальные) — для меню |
| `more-horizontal` | Три точки (горизонтальные) |
| `close` | Крестик закрытия |
| `plus` | Плюс |
| `minus` | Минус |
| `chevron-right` | Стрелка вправо |
| `chevron-left` | Стрелка влево |
| `chevron-down` | Стрелка вниз |
| `chevron-up` | Стрелка вверх |
| `arrow-left` | Стрелка назад |
| `arrow-right` | Стрелка вперёд |
| `check` | Галочка |
| `search` | Лупа |
| `settings` | Шестерёнка |
| `share` | Поделиться |
| `edit` | Карандаш |
| `trash` | Корзина |
| `copy` | Копировать |
| `heart` | Сердце (контур) |
| `heart-filled` | Сердце (залитое) |
| `star` | Звезда (контур) |
| `star-filled` | Звезда (залитая) |
| `info` | Информация |
| `warning` | Предупреждение |
| `user` | Пользователь |
| `home` | Дом |
| `bell` | Колокольчик |
| `camera` | Камера |
| `image` | Изображение |

**Примеры использования:**

```json
// Кнопка "три точки" для меню
{
  "type": "icon",
  "name": "more",
  "size": 20,
  "style": { "color": "#666" },
  "gestures": ["TAP"]
}
```

```json
// Стрелка с анимацией поворота (для аккордеона)
{
  "type": "icon",
  "name": "chevron-down",
  "rotation": "context:isOpen ? 180 : 0",
  "style": { "color": "#999" }
}
```

```json
// Иконка лайка
{
  "type": "icon",
  "name": "context:isLiked ? 'heart-filled' : 'heart'",
  "size": 24,
  "style": { "color": "context:isLiked ? '#ff3b30' : '#999'" },
  "gestures": ["TAP"]
}
```

---

## Встроенные UI-компоненты

Кастомные компоненты могут использовать все встроенные UI-компоненты системы. Ниже полный список с их свойствами:

### Heading (Заголовок)

```json
{
  "type": "heading",
  "prop": "title",
  "style": { "fontSize": 24, "fontWeight": 600 }
}
```

**Доступные свойства в defaultProps:**
- `text` (string) — текст заголовка
- `alignment` ('left' | 'center') — выравнивание

---

### Text (Текст)

```json
{
  "type": "text",
  "prop": "description",
  "style": { "color": "#666", "fontSize": 14 }
}
```

**Доступные свойства в defaultProps:**
- `text` (string) — текст
- `alignment` ('left' | 'center') — выравнивание

---

### Button (Кнопка)

```json
{
  "type": "button",
  "prop": "buttonLabel",
  "variant": "primary",
  "size": "m",
  "action": "navigate",
  "target": "prop:targetScreen"
}
```

**Варианты (variant):**
- `primary` — синяя, основная кнопка
- `secondary` — серая, второстепенная
- `destructive` — красная, для удаления

**Размеры (size):**
- `s` — маленькая
- `m` — средняя
- `l` — большая

**Действия (action):**
- `none` — без действия
- `navigate` — переход на экран (указать `target`)

**Дополнительные опции:**
- `requireValidation` (boolean) — если `true`, кнопка не выполнит переход, пока все инпуты с включённой валидацией на странице не будут заполнены корректно. При нажатии фокусируется на первый невалидный инпут.

---

### Input (Поле ввода)

```json
{
  "type": "input",
  "prop": "searchQuery",
  "inputVariant": "search",
  "placeholder": "Поиск..."
}
```

**Варианты (inputVariant):**
| Вариант | Описание |
|---------|----------|
| `default` | Стандартное поле ввода |
| `search` | Поисковое поле с иконкой лупы и автоподсказками |
| `dropdown` | Выпадающий список — пользователь выбирает из опций |
| `password` | Пароль — скрытый ввод с кнопкой показа/скрытия |

**Доступные свойства в defaultProps:**
- `inputVariant` ('default' | 'search' | 'dropdown' | 'password')
- `placeholder` (string) — подсказка
- `label` (string) — лейбл над полем
- `showLabel` (boolean) — показывать ли лейбл
- `inputType` ('text' | 'numeric') — тип ввода (для default/search)
- `descriptor` (string) — подсказка под полем
- `dropdownOptions` (array) — опции для dropdown/search:
  ```json
  [
    { "id": "1", "label": "Вариант 1" },
    { "id": "2", "label": "Вариант 2" }
  ]
  ```
- `validation` (object) — настройки валидации:
  ```json
  {
    "enabled": true,
    "type": "range",
    "min": 0,
    "max": 100,
    "errorMessage": "Значение вне диапазона",
    "successMessage": "Отлично!"
  }
  ```
  
  **Типы валидации:**
  - `exact` — точное совпадение со значением `exactValue`
  - `range` — число в диапазоне от `min` до `max`
  
  **Пример exact валидации (для викторин, промокодов):**
  ```json
  {
    "enabled": true,
    "type": "exact",
    "exactValue": "СКИДКА2024",
    "errorMessage": "Неверный промокод",
    "successMessage": "Промокод применён!"
  }
  ```

**Пример инпута с dropdown:**

```json
{
  "template": {
    "type": "input",
    "prop": "city",
    "inputVariant": "dropdown",
    "placeholder": "Выберите город"
  },
  "defaultProps": {
    "city": "",
    "cityOptions": [
      { "id": "1", "label": "Москва" },
      { "id": "2", "label": "Санкт-Петербург" },
      { "id": "3", "label": "Казань" }
    ]
  },
  "settings": [
    {
      "key": "cityOptions",
      "label": "Города",
      "type": "items",
      "itemFields": [
        { "key": "label", "label": "Название", "type": "text" }
      ]
    }
  ]
}
```

---

### Cell (Ячейка)

```json
{
  "type": "cell",
  "prop": "menuItem",
  "cellType": "navigation"
}
```

**Типы ячеек (cellType):**
| Тип | Описание | Контрол справа |
|-----|----------|----------------|
| `basic` | Базовая | Нет (просто текст) |
| `navigation` | Навигационная | Стрелка → |
| `icon` | С иконкой | Кастомная иконка |
| `toggle` | Переключатель | Toggle switch |
| `checkbox` | Чекбокс | ☑ галочка |
| `radio` | Радио | ◎ точка |
| `info` | Информация | Текст значения |

**Доступные свойства в defaultProps:**
- `showIcon` (boolean) — показывать иконку слева
- `icon` (string) — base64 или URL иконки слева
- `title` (string) — заголовок
- `subtitle` (string) — подзаголовок
- `showSubtitle` (boolean) — показывать подзаголовок
- `subtitlePosition` ('top' | 'bottom') — позиция подзаголовка
- `cellType` ('basic' | 'navigation' | 'icon' | 'toggle' | 'checkbox' | 'radio' | 'info')
- `action` ('none' | 'navigate') — для navigation
- `targetScreenId` (string | null) — экран для перехода
- `infoValue` (string) — текст для info типа
- `radioGroup` (string) — группа для radio
- `rightIcon` (string) — base64 или URL иконки справа (для `icon` типа)

**Пример списка ячеек:**

```json
{
  "template": {
    "type": "list",
    "dataKey": "items",
    "itemTemplate": {
      "type": "cell",
      "cellType": "navigation",
      "showIcon": true
    }
  },
  "defaultProps": {
    "items": [
      { "icon": "", "title": "Профиль", "subtitle": "Настройки аккаунта" },
      { "icon": "", "title": "Уведомления", "subtitle": "Управление оповещениями" }
    ]
  }
}
```

---

### Image (Изображение)

```json
{
  "type": "image",
  "prop": "photo",
  "style": { 
    "borderRadius": 12, 
    "aspectRatio": "16/9",
    "objectFit": "cover"
  }
}
```

**Доступные свойства в defaultProps:**
- `src` (string) — base64 или URL
- `alt` (string) — альтернативный текст

---

### Selector (Переключатель)

```json
{
  "type": "selector",
  "prop": "tabs"
}
```

**Доступные свойства в defaultProps:**
- `items` (array):
  ```json
  [
    { "id": "1", "text": "Вкладка 1" },
    { "id": "2", "text": "Вкладка 2" }
  ]
  ```

---

### Navbar (Навигационная панель)

Используется для верхней панели с кнопкой назад, заголовком и меню.

**Доступные свойства:**
- `backButton.show` (boolean) — показывать кнопку назад
- `backButton.style` ('icon' | 'iconText') — только иконка или с текстом
- `backButton.text` (string) — текст кнопки
- `backButton.action` ('back' | 'navigate') — действие
- `backButton.targetScreenId` (string | null) — экран перехода
- `title` (string) — заголовок
- `subtitle` (string) — подзаголовок
- `showSubtitle` (boolean) — показывать подзаголовок
- `menu.show` (boolean) — показывать меню (три точки)
- `menu.title` (string) — заголовок bottom sheet
- `menu.slots` (array) — компоненты внутри bottom sheet

---

## Settings: Панель настроек

Определяет какие свойства видит дизайнер в панели справа.

### Типы полей
| Тип | Описание |
|-----|----------|
| `text` | Однострочный текст |
| `textarea` | Многострочный текст |
| `number` | Число |
| `select` | Выпадающий список |
| `toggle` | Переключатель |
| `color` | Выбор цвета |
| `image` | Загрузка изображения |
| `screen` | Выбор экрана для навигации |
| `items` | Список элементов (для карточек, списков) |

### Пример settings

```json
{
  "settings": [
    { 
      "key": "title", 
      "label": "Заголовок", 
      "type": "text",
      "placeholder": "Введите заголовок"
    },
    { 
      "key": "variant", 
      "label": "Стиль", 
      "type": "select",
      "options": [
        { "value": "default", "label": "Обычный" },
        { "value": "highlighted", "label": "Выделенный" }
      ]
    },
    {
      "key": "showSubtitle",
      "label": "Показать подзаголовок",
      "type": "toggle"
    },
    {
      "key": "cards",
      "label": "Карточки",
      "type": "items",
      "itemFields": [
        { "key": "image", "label": "Фото", "type": "image" },
        { "key": "name", "label": "Имя", "type": "text" }
      ]
    }
  ]
}
```

---

## Behavior: Интерактивность (State Machine)

Для сложной логики используем конечный автомат (state machine).

### Структура

```json
{
  "behavior": {
    "type": "state-machine",
    "initial": "idle",
    "context": {
      "currentIndex": 0,
      "likedItems": []
    },
    "states": {
      "stateName": {
        "on": {
          "EVENT_NAME": {
            "target": "nextState",
            "actions": ["actionName"],
            "condition": "conditionName"
          }
        },
        "entry": ["actionOnEnter"],
        "exit": ["actionOnExit"]
      }
    }
  }
}
```

### Доступные события (Events)
| Событие | Описание |
|---------|----------|
| `TAP` | Нажатие |
| `LONG_PRESS` | Долгое нажатие |
| `SWIPE_LEFT` | Свайп влево |
| `SWIPE_RIGHT` | Свайп вправо |
| `SWIPE_UP` | Свайп вверх |
| `SWIPE_DOWN` | Свайп вниз |
| `DRAG_START` | Начало перетаскивания |
| `DRAG_END` | Конец перетаскивания |
| `INPUT_CHANGE` | Изменение поля ввода |
| `TIMER` | Таймер (указать delay) |

### Доступные действия (Actions)
| Действие | Описание | Параметры |
|----------|----------|-----------|
| `navigate` | Переход на экран | `screen: "screenId"` или `screen: "prop:targetScreen"` |
| `animate` | Анимация | `animation: "fadeIn" \| "slideLeft" \| "scale" \| "spring"` |
| `haptic` | Вибрация | `type: "light" \| "medium" \| "success" \| "error"` |
| `sound` | Звук | `sound: "click" \| "success" \| "error"` |
| `setValue` | Установить значение | `key: "contextKey"`, `value: any` |
| `increment` | Увеличить число | `key: "contextKey"`, `by: 1` |
| `decrement` | Уменьшить число | `key: "contextKey"`, `by: 1` |
| `addToList` | Добавить в список | `key: "contextKey"`, `value: any` |
| `removeFromList` | Удалить из списка | `key: "contextKey"`, `index: number` |
| `nextItem` | Следующий элемент | `key: "currentIndex"`, `listKey: "items"` |
| `prevItem` | Предыдущий элемент | `key: "currentIndex"`, `listKey: "items"` |
| `openSheet` | Открыть шторку (bottom sheet) | `sheetTitle`, `sheetContent` |
| `closeSheet` | Закрыть шторку | — |
| `openDropdown` | Открыть выпадающее меню | `dropdownItems` |
| `closeDropdown` | Закрыть меню | — |

### Шторка (Bottom Sheet)

Открывает модальное окно снизу экрана с произвольным контентом.

**Пример:**
```json
{
  "type": "openSheet",
  "sheetTitle": "Выберите действие",
  "sheetContent": {
    "type": "container",
    "style": { "gap": 8 },
    "children": [
      {
        "type": "button",
        "prop": "shareLabel",
        "variant": "secondary"
      },
      {
        "type": "button",
        "prop": "deleteLabel",
        "variant": "destructive"
      }
    ]
  }
}
```

### Dropdown (Выпадающее меню)

Открывает контекстное меню рядом с элементом.

**Пример:**
```json
{
  "type": "openDropdown",
  "dropdownItems": [
    { "id": "edit", "label": "Редактировать", "icon": "✏️" },
    { "id": "copy", "label": "Копировать", "icon": "📋" },
    { 
      "id": "delete", 
      "label": "Удалить", 
      "icon": "🗑️",
      "action": { "type": "navigate", "screen": "confirmDelete" }
    }
  ]
}
```

**Поля dropdownItems:**
- `id` (string) — уникальный идентификатор
- `label` (string) — текст пункта меню
- `icon` (string, optional) — эмодзи или иконка слева
- `action` (ActionDefinition, optional) — действие при выборе

### Доступные условия (Conditions)
| Условие | Описание |
|---------|----------|
| `isFirst` | Текущий элемент первый |
| `isLast` | Текущий элемент последний |
| `isEmpty` | Список пуст |
| `isNotEmpty` | Список не пуст |
| `equals` | Значение равно (указать `key`, `value`) |
| `greaterThan` | Значение больше (указать `key`, `value`) |

---

## Примеры готовых компонентов

### Пример 1: Форма поиска с фильтрами

```json
{
  "name": "SearchForm",
  "displayName": "Форма поиска",
  "category": "custom",
  "icon": "🔍",
  "description": "Поисковое поле с выпадающим фильтром категорий",
  
  "template": {
    "type": "container",
    "style": { "gap": 12 },
    "children": [
      {
        "type": "input",
        "prop": "query",
        "inputVariant": "search",
        "placeholder": "Что ищете?"
      },
      {
        "type": "input",
        "prop": "category",
        "inputVariant": "dropdown",
        "placeholder": "Все категории"
      }
    ]
  },
  
  "defaultProps": {
    "query": "",
    "category": "",
    "categories": [
      { "id": "1", "label": "Электроника" },
      { "id": "2", "label": "Одежда" },
      { "id": "3", "label": "Дом и сад" }
    ]
  },
  
  "settings": [
    {
      "key": "categories",
      "label": "Категории",
      "type": "items",
      "itemFields": [
        { "key": "label", "label": "Название", "type": "text" }
      ]
    }
  ]
}
```

### Пример 2: Список настроек

```json
{
  "name": "SettingsList",
  "displayName": "Список настроек",
  "category": "custom",
  "icon": "⚙️",
  "description": "Ячейки с разными типами контролов",
  
  "template": {
    "type": "container",
    "style": { "gap": 8 },
    "children": [
      {
        "type": "cell",
        "cellType": "toggle",
        "showIcon": true,
        "prop": "notifications"
      },
      {
        "type": "cell",
        "cellType": "navigation",
        "showIcon": true,
        "prop": "account"
      },
      {
        "type": "cell",
        "cellType": "info",
        "showIcon": false,
        "prop": "version"
      }
    ]
  },
  
  "defaultProps": {
    "notifications": {
      "icon": "",
      "title": "Уведомления",
      "subtitle": "Получать push-уведомления"
    },
    "account": {
      "icon": "",
      "title": "Аккаунт",
      "subtitle": "Управление профилем"
    },
    "version": {
      "title": "Версия",
      "infoValue": "2.1.0"
    }
  }
}
```

### Пример 3: Swipe-карточки (Tinder-style)

```json
{
  "name": "SwipeCards",
  "displayName": "Карточки со свайпом",
  "category": "custom",
  "icon": "🎴",
  "description": "Стек карточек с возможностью свайпа влево/вправо",
  
  "template": {
    "type": "container",
    "style": { "position": "relative", "height": 400 },
    "children": [
      {
        "type": "stack",
        "dataKey": "cards",
        "indexKey": "currentIndex",
        "itemTemplate": {
          "type": "container",
          "style": { 
            "borderRadius": 16, 
            "overflow": "hidden",
            "boxShadow": "0 4px 16px rgba(0,0,0,0.15)"
          },
          "children": [
            { "type": "image", "prop": "item.photo", "style": { "height": 300 } },
            { 
              "type": "container", 
              "style": { "padding": 16 },
              "children": [
                { "type": "heading", "prop": "item.name" },
                { "type": "text", "prop": "item.bio", "style": { "color": "#666" } }
              ]
            }
          ]
        }
      }
    ]
  },
  
  "defaultProps": {
    "cards": [
      { "photo": "", "name": "Анна", "bio": "Люблю путешествия" },
      { "photo": "", "name": "Максим", "bio": "Фотограф" },
      { "photo": "", "name": "Елена", "bio": "Дизайнер" }
    ],
    "onLikeScreen": null,
    "onDislikeScreen": null,
    "onEmptyScreen": null
  },
  
  "settings": [
    {
      "key": "cards",
      "label": "Карточки",
      "type": "items",
      "itemFields": [
        { "key": "photo", "label": "Фото", "type": "image" },
        { "key": "name", "label": "Имя", "type": "text" },
        { "key": "bio", "label": "О себе", "type": "text" }
      ]
    },
    { "key": "onLikeScreen", "label": "При лайке перейти на", "type": "screen" },
    { "key": "onEmptyScreen", "label": "Когда карточки кончатся", "type": "screen" }
  ],
  
  "behavior": {
    "type": "state-machine",
    "initial": "idle",
    "context": {
      "currentIndex": 0
    },
    "states": {
      "idle": {
        "on": {
          "SWIPE_LEFT": {
            "target": "dismissing",
            "actions": [
              { "type": "animate", "animation": "flyLeft" },
              { "type": "haptic", "hapticType": "light" }
            ]
          },
          "SWIPE_RIGHT": {
            "target": "liking",
            "actions": [
              { "type": "animate", "animation": "flyRight" },
              { "type": "haptic", "hapticType": "success" }
            ]
          }
        }
      },
      "dismissing": {
        "entry": [
          { "type": "nextItem", "key": "currentIndex", "listKey": "cards" }
        ],
        "after": {
          "300": [
            { "target": "empty", "condition": "isLast" },
            { "target": "idle" }
          ]
        }
      },
      "liking": {
        "entry": [
          { "type": "navigate", "screen": "prop:onLikeScreen" },
          { "type": "nextItem", "key": "currentIndex", "listKey": "cards" }
        ],
        "after": {
          "300": [
            { "target": "empty", "condition": "isLast" },
            { "target": "idle" }
          ]
        }
      },
      "empty": {
        "entry": [
          { "type": "navigate", "screen": "prop:onEmptyScreen" }
        ]
      }
    }
  }
}
```

### Пример 4: Карусель карточек

```json
{
  "name": "CardsCarousel",
  "displayName": "Карусель карточек",
  "category": "custom",
  "icon": "🎠",
  "description": "Горизонтальная прокручиваемая карусель",
  
  "template": {
    "type": "list",
    "dataKey": "items",
    "style": {
      "display": "flex",
      "overflowX": "auto",
      "scrollSnapType": "x mandatory",
      "WebkitOverflowScrolling": "touch",
      "padding": 8,
      "gap": 12
    },
    "itemTemplate": {
      "type": "container",
      "style": {
        "width": 260,
        "minWidth": 260,
        "flexShrink": 0,
        "scrollSnapAlign": "start",
        "borderRadius": 12,
        "overflow": "hidden",
        "background": "#fff",
        "boxShadow": "0 2px 8px rgba(0,0,0,0.1)"
      },
      "children": [
        { "type": "image", "prop": "item.image", "style": { "height": 140, "objectFit": "cover" } },
        {
          "type": "container",
          "style": { "padding": 12 },
          "children": [
            { "type": "heading", "prop": "item.title", "style": { "fontSize": 16 } },
            { "type": "text", "prop": "item.description", "style": { "color": "#666", "fontSize": 14 } }
          ]
        }
      ]
    }
  },
  
  "defaultProps": {
    "items": [
      { "image": "", "title": "Карточка 1", "description": "Описание первой карточки" },
      { "image": "", "title": "Карточка 2", "description": "Описание второй карточки" },
      { "image": "", "title": "Карточка 3", "description": "Описание третьей карточки" }
    ]
  },
  
  "settings": [
    {
      "key": "items",
      "label": "Карточки",
      "type": "items",
      "itemFields": [
        { "key": "image", "label": "Изображение", "type": "image" },
        { "key": "title", "label": "Заголовок", "type": "text" },
        { "key": "description", "label": "Описание", "type": "text" }
      ]
    }
  ]
}
```

---

## Чеклист перед сохранением

Перед тем как отдать JSON дизайнеру, проверь:

- [ ] `name` — уникальное имя (латиницей, PascalCase)
- [ ] `displayName` — понятное название на русском
- [ ] `icon` — подходящий эмодзи
- [ ] `template` — все `prop` ссылки соответствуют `defaultProps`
- [ ] `settings` — все `key` соответствуют `defaultProps`
- [ ] `behavior` — если есть, все состояния достижимы
- [ ] Используемые `inputVariant` корректны (default, search, dropdown, password)
- [ ] Используемые `cellType` корректны (navigation, toggle, checkbox, radio, info)
- [ ] Нет опечаток в JSON

---

## Частые вопросы дизайнеров

**Q: Можно ли анимировать переход между состояниями?**
A: Да, используй action `animate` с нужным типом анимации.

**Q: Как сделать чтобы по нажатию переходило на другой экран?**
A: Добавь в settings поле типа `screen`, и используй action `navigate` с `screen: "prop:fieldName"`.

**Q: Можно ли добавить вибрацию?**
A: Да, используй action `haptic` с типом: light, medium, success или error.

**Q: Как сделать список элементов?**
A: В settings используй тип `items`, в template используй `type: "list"` с `dataKey`.

**Q: Как сделать поисковый инпут с подсказками?**
A: Используй `inputVariant: "search"` и задай `dropdownOptions` для автоподсказок.

**Q: Как сделать выбор из списка?**
A: Используй `inputVariant: "dropdown"` и задай `dropdownOptions` с вариантами.

**Q: Как сделать ячейки с переключателями?**
A: Используй `cellType: "toggle"` или `cellType: "checkbox"` для ячеек.

---

## Сохранение файла

После генерации JSON, сохрани файл:
- Расположение: любая папка на компьютере дизайнера
- Формат имени: `component-name.json` (kebab-case)
- Кодировка: UTF-8

Дизайнер потом импортирует этот файл в Prototype Builder через кнопку "Импорт компонента".
