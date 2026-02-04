# Docker Guide

## Быстрый старт

### Development режим

```bash
# Запуск dev сервера с hot reload
docker-compose up

# Или явно указать dev профиль
docker-compose --profile development up

# В фоне
docker-compose up -d
```

Приложение будет доступно на `http://localhost:3000`

### Production режим

```bash
# Запуск production сборки с nginx
docker-compose --profile production up

# В фоне
docker-compose --profile production up -d
```

Приложение будет доступно на `http://localhost:8080`

## Команды

### Сборка

```bash
# Dev образ
docker-compose build app-dev

# Production образ
docker-compose build app-prod
```

### Остановка

```bash
# Остановить контейнеры
docker-compose down

# Остановить и удалить volumes
docker-compose down -v
```

### Просмотр логов

```bash
# Все логи
docker-compose logs

# Следить за логами
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs app-dev
```

### Выполнение команд внутри контейнера

```bash
# Зайти в shell
docker-compose exec app-dev sh

# Установить новую зависимость
docker-compose exec app-dev npm install package-name

# Запустить линтер
docker-compose exec app-dev npm run lint
```

## Переменные окружения

Создайте `.env` файл в корне проекта:

```env
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
```

Docker Compose автоматически подхватит эти переменные.

## Структура Docker файлов

### `Dockerfile` (Production)

Multi-stage build для production:

1. **Stage 1 (deps)**: Установка зависимостей
2. **Stage 2 (builder)**: Сборка Next.js приложения
3. **Stage 3 (production)**: Nginx для раздачи статики

**Преимущества:**
- Минимальный размер финального образа
- Быстрая раздача статики через nginx
- Оптимизация для production

### `Dockerfile.dev` (Development)

Простой образ для разработки:
- Hot reload из коробки
- Volume mounting для изменений в реальном времени
- Полный набор dev зависимостей

### `docker-compose.yml`

Оркестрация с профилями:
- `development` - dev сервер с hot reload
- `production` - production сборка с nginx

### `nginx.conf`

Настройки nginx для production:
- SPA роутинг
- Gzip сжатие
- Кеширование статических файлов
- Security headers

## Размеры образов

```bash
# Посмотреть размеры образов
docker images | grep prototype-builder

# Примерные размеры:
# - Development: ~500-600 MB (Node.js + зависимости)
# - Production: ~50-80 MB (nginx + статика)
```

## Оптимизация

### Использование build cache

```bash
# Пересобрать без кеша
docker-compose build --no-cache

# Пересобрать с кешем (быстрее)
docker-compose build
```

### Очистка

```bash
# Удалить неиспользуемые образы
docker image prune -a

# Удалить всё неиспользуемое (осторожно!)
docker system prune -a --volumes
```

## Troubleshooting

### Порт уже занят

Измените порты в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Вместо 3000:3000
```

### Изменения не применяются в dev режиме

1. Проверьте, что volumes правильно смонтированы:
   ```bash
   docker-compose config
   ```

2. Перезапустите контейнер:
   ```bash
   docker-compose restart app-dev
   ```

### Ошибки при установке зависимостей

1. Очистите node_modules:
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

### Production сборка не работает

1. Проверьте переменные окружения:
   ```bash
   docker-compose --profile production config
   ```

2. Проверьте логи nginx:
   ```bash
   docker-compose --profile production logs app-prod
   ```

## CI/CD Integration

### GitHub Actions пример

```yaml
name: Docker Build

on:
  push:
    branches: [main, dev]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t prototype-builder:${{ github.sha }} .
      
      - name: Run tests
        run: docker run prototype-builder:${{ github.sha }} npm test
```

## Production Deployment

### С Docker Hub

```bash
# Tag образа
docker tag prototype-builder:latest username/prototype-builder:latest

# Push в Docker Hub
docker push username/prototype-builder:latest

# На сервере
docker pull username/prototype-builder:latest
docker run -d -p 80:80 username/prototype-builder:latest
```

### С docker-compose на сервере

1. Скопируйте файлы на сервер:
   ```bash
   scp docker-compose.yml server:/app/
   scp nginx.conf server:/app/
   ```

2. На сервере:
   ```bash
   cd /app
   docker-compose --profile production up -d
   ```

## Мониторинг

```bash
# Статистика использования ресурсов
docker stats

# Проверка здоровья контейнера
docker inspect --format='{{.State.Health.Status}}' prototype-builder-dev
```

## Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)
- [Nginx Documentation](https://nginx.org/en/docs/)
