# 🚀 Инструкция по деплою

## Быстрый деплой (рекомендуется)

```bash
cd ~/roflan4ik/pip_builder
./deploy.sh
```

Этот скрипт автоматически:
1. ✅ Подтягивает последний код из `dev` ветки
2. ✅ Пересобирает Docker образ
3. ✅ Перезапускает контейнеры
4. ✅ Применяет миграции БД
5. ✅ Генерирует Prisma Client
6. ✅ Рестартует приложение

---

## Ручной деплой

Если нужно больше контроля:

### 1. Подтянуть код
```bash
cd ~/roflan4ik/pip_builder
git pull origin dev
```

### 2. Пересобрать образ (если были изменения в зависимостях)
```bash
docker compose build app-dev
```

### 3. Перезапустить контейнеры
```bash
docker compose down
docker compose up -d
```

### 4. Применить миграции БД
```bash
docker compose exec app-dev npx prisma migrate deploy
```

### 5. Сгенерировать Prisma Client
```bash
docker compose exec app-dev npx prisma generate
```

### 6. Рестартовать приложение
```bash
docker compose restart app-dev
```

---

## Проверка статуса

```bash
# Посмотреть запущенные контейнеры
docker compose ps

# Посмотреть логи
docker compose logs app-dev --tail=50 -f

# Проверить здоровье БД
docker compose exec postgres psql -U user -d prototype_builder -c "\dt"
```

---

## Быстрые команды

### Рестарт только приложения
```bash
docker compose restart app-dev
```

### Полный rebuild
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Просмотр логов
```bash
docker compose logs app-dev -f
```

### Подключение к БД
```bash
docker compose exec postgres psql -U user -d prototype_builder
```

---

## Откат изменений

Если что-то пошло не так:

```bash
# Откатить Git на предыдущий коммит
git log --oneline  # посмотреть коммиты
git reset --hard <commit-hash>

# Перезапустить
./deploy.sh
```

---

## Первый деплой (initial setup)

Если деплоите первый раз:

```bash
cd ~/roflan4ik/pip_builder

# Создать .env файл (если нет)
cat > .env << EOF
DATABASE_URL="postgresql://user:password@postgres:5432/prototype_builder"
JWT_SECRET="$(openssl rand -base64 32)"
NEXT_PUBLIC_TELEGRAM_BOT_NAME=""
TELEGRAM_BOT_TOKEN=""
EOF

# Запустить деплой
./deploy.sh
```
