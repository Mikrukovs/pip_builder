#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Подтягиваем код
echo "📥 Pulling latest code..."
git pull origin dev

# Проверяем, нужно ли пересобрать образ
echo "🔨 Rebuilding Docker image..."
docker compose build app-dev

# Останавливаем контейнеры
echo "🛑 Stopping containers..."
docker compose down

# Запускаем контейнеры
echo "▶️  Starting containers..."
docker compose up -d

# Ждём запуска PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
sleep 5

# Применяем миграции
echo "📊 Applying database migrations..."
docker compose exec -T app-dev npx prisma migrate deploy

# Генерируем Prisma Client
echo "🔧 Generating Prisma Client..."
docker compose exec -T app-dev npx prisma generate

# Рестартуем app-dev для применения изменений
echo "🔄 Restarting app..."
docker compose restart app-dev

echo "✅ Deployment complete!"
echo "🌐 App is running on http://$(hostname -I | awk '{print $1}'):8888"
