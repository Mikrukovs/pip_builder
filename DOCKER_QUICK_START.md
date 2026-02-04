# 🐳 Docker Quick Start

## Запуск за 3 шага

### 1. Development (с hot reload)

```bash
docker-compose up
```

Откройте http://localhost:3000

### 2. Production (с nginx)

```bash
docker-compose --profile production up
```

Откройте http://localhost:8080

### 3. Остановка

```bash
docker-compose down
```

---

## Полезные команды

```bash
# Запуск в фоне
docker-compose up -d

# Посмотреть логи
docker-compose logs -f

# Пересобрать образ
docker-compose build

# Зайти в контейнер
docker-compose exec app-dev sh
```

---

## Настройка Telegram (опционально)

Создайте `.env` файл:

```env
NEXT_PUBLIC_TELEGRAM_BOT_NAME=your_bot_name
```

---

📖 **Подробная документация:** `docs/docker-guide.md`
