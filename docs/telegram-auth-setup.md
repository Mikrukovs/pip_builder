# Настройка авторизации через Telegram

## Инструкция по настройке

### 1. Создание Telegram бота

1. Откройте Telegram и найдите бота [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания нового бота:
   - Введите имя бота (например: "My Prototype Builder Bot")
   - Введите username бота (например: "my_prototype_bot")
4. После создания вы получите **bot token** (например: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Сохраните этот токен - он понадобится для конфигурации

### 2. Настройка домена для бота

1. В @BotFather отправьте команду `/setdomain`
2. Выберите вашего бота
3. Введите домен вашего приложения (например: `example.com` или `localhost` для разработки)

**Важно**: Telegram требует, чтобы домен был указан для работы Login Widget

### 3. Конфигурация переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=ваш_bot_token_от_BotFather

# Имя вашего Telegram бота (без @)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=ваш_username_бота
```

**Пример:**

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
NEXT_PUBLIC_TELEGRAM_BOT_NAME=my_prototype_bot
```

### 4. Запуск приложения

```bash
npm run dev
```

Откройте `http://localhost:3000` в браузере. Вы увидите кнопку "Log in with Telegram" в верхней панели редактора.

## Как это работает

### Процесс авторизации

1. **Пользователь нажимает кнопку "Log in with Telegram"**
   - Открывается окно Telegram с запросом на авторизацию
   
2. **Пользователь подтверждает авторизацию**
   - Telegram отправляет данные пользователя обратно в приложение
   
3. **Валидация данных**
   - Проверяется, что данные не устарели (не старше 24 часов)
   - Telegram Widget сам проверяет подлинность данных перед отправкой
   
4. **Сохранение пользователя**
   - Данные пользователя сохраняются в Zustand store
   - Store персистится в localStorage для сохранения между сессиями

### Получаемые данные

После успешной авторизации приложение получает:

- `id` - уникальный ID пользователя в Telegram
- `first_name` - имя пользователя
- `last_name` - фамилия (опционально)
- `username` - username в Telegram (опционально, без @)
- `photo_url` - URL аватарки пользователя (опционально)
- `auth_date` - timestamp авторизации
- `hash` - хеш для верификации данных

### Компоненты

#### `TelegramLogin`
Компонент, который рендерит Telegram Login Widget. Автоматически загружает скрипт виджета и обрабатывает callback авторизации.

**Props:**
- `botName` - имя вашего бота (без @)
- `onAuth` - опциональный callback после успешной авторизации

#### `UserProfile`
Компонент для отображения информации о залогиненном пользователе:
- Аватарка (или инициалы, если нет фото)
- Имя и фамилия
- Username
- Кнопка выхода

### Store

`useAuthStore` - Zustand store для управления состоянием авторизации:

```typescript
interface AuthState {
  user: TelegramUser | null;
  isAuthenticated: boolean;
  setUser: (user: TelegramUser) => void;
  logout: () => void;
}
```

## Безопасность

- Telegram Widget проверяет подлинность данных перед отправкой
- Проверяется время авторизации (не старше 24 часов)
- Данные пользователя сохраняются локально (localStorage)
- **Примечание**: Для максимальной безопасности в production рекомендуется верифицировать hash на сервере, но так как это static export приложение, используется упрощенная клиентская авторизация

## Развертывание в продакшн

При развертывании на сервер:

1. Убедитесь, что переменные окружения настроены на вашем хостинге
2. Обновите домен в @BotFather на продакшн домен
3. Telegram Login Widget работает только через HTTPS в продакшн режиме

## Troubleshooting

**Кнопка авторизации не отображается:**
- Проверьте, что `NEXT_PUBLIC_TELEGRAM_BOT_NAME` правильно указан в `.env.local`
- Перезапустите dev сервер после изменения `.env.local`

**Ошибка "Invalid authentication data":**
- Проверьте, что `TELEGRAM_BOT_TOKEN` правильно указан
- Убедитесь, что домен настроен в @BotFather

**Аватарка не загружается:**
- Проверьте настройки `remotePatterns` в `next.config.ts`
- В dev режиме может потребоваться использовать `unoptimized: true`

## Дополнительные ресурсы

- [Telegram Login Widget Documentation](https://core.telegram.org/widgets/login)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [@BotFather](https://t.me/BotFather)
