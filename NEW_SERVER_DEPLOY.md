# 🚀 Деплой проекта на новый сервер

Полная инструкция по развертыванию проекта Prototype Builder на чистом сервере.

---

## 📋 Требования к серверу

- **ОС**: Ubuntu 20.04+ / Debian 11+
- **RAM**: минимум 2GB (рекомендуется 4GB+)
- **Disk**: минимум 10GB свободного места
- **Docker**: версия 20.10+
- **Docker Compose**: V2 (встроенный в Docker)
- **Git**: установлен

---

## 1️⃣ Подготовка сервера

### Обновление системы

```bash
sudo apt update && sudo apt upgrade -y
```

### Установка Docker

```bash
# Удаляем старые версии Docker (если есть)
sudo apt remove docker docker-engine docker.io containerd runc

# Устанавливаем зависимости
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Добавляем GPG ключ Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Добавляем репозиторий Docker
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Устанавливаем Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Проверяем установку
docker --version
docker compose version
```

### Настройка прав для Docker (чтобы не использовать sudo)

```bash
sudo usermod -aG docker $USER
newgrp docker

# Проверка
docker ps
```

### Установка Git (если не установлен)

```bash
sudo apt install -y git
git --version
```

---

## 2️⃣ Клонирование проекта

```bash
# Создаем директорию для проектов
mkdir -p ~/projects
cd ~/projects

# Клонируем репозиторий
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git tilda-vtb
# Или если уже есть доступ по SSH:
# git clone git@github.com:YOUR_USERNAME/YOUR_REPO.git tilda-vtb

cd tilda-vtb

# Переключаемся на dev ветку
git checkout dev
git pull origin dev
```

---

## 3️⃣ Настройка окружения

### Создание .env файла

```bash
cat > .env << 'EOF'
# Database
POSTGRES_DB=prototype_builder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secure_password_change_me

# JWT
JWT_SECRET=your_jwt_secret_change_me_to_random_string

# Next.js Auth (если используется NextAuth)
NEXTAUTH_SECRET=your_nextauth_secret_change_me
NEXTAUTH_URL=http://your-domain.com

# Telegram Bot (опционально, если будет Telegram авторизация)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=
TELEGRAM_BOT_TOKEN=
EOF
```

### Генерация безопасных секретов

```bash
# Генерируем случайные секреты
JWT_SECRET=$(openssl rand -base64 32)
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Обновляем .env файл
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$NEXTAUTH_SECRET/" .env

# Задаем пароль БД
read -sp "Введите пароль для PostgreSQL: " DB_PASSWORD
echo
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASSWORD/" .env

echo "✅ Секреты сгенерированы и сохранены в .env"
```

### Настройка домена (если есть)

Если у тебя есть домен, обнови `NEXTAUTH_URL` в `.env`:

```bash
nano .env
# Измени NEXTAUTH_URL на ваш домен, например:
# NEXTAUTH_URL=https://builder.yourdomain.com
```

---

## 4️⃣ Запуск проекта

### Первый запуск

```bash
# Убедись, что находишься в директории проекта
cd ~/projects/tilda-vtb

# Запускаем контейнеры
docker compose up -d

# Проверяем статус
docker compose ps
```

### Ожидание запуска PostgreSQL

```bash
# Ждём пока PostgreSQL полностью запустится
echo "⏳ Waiting for PostgreSQL..."
sleep 10

# Проверяем здоровье БД
docker compose exec postgres pg_isready -U postgres
```

### Применение миграций базы данных

```bash
# Применяем миграции
docker compose exec app-dev npx prisma migrate deploy

# Генерируем Prisma Client
docker compose exec app-dev npx prisma generate

# Перезапускаем приложение для применения изменений
docker compose restart app-dev
```

### Проверка логов

```bash
# Смотрим логи приложения
docker compose logs app-dev -f

# Ctrl+C для выхода из просмотра логов
```

---

## 5️⃣ Настройка Nginx (если нужен SSL/HTTPS)

### Установка Nginx на хост (опционально)

Если хочешь использовать SSL сертификаты (Let's Encrypt):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx

# Создаем конфигурацию для вашего домена
sudo nano /etc/nginx/sites-available/prototype-builder
```

**Содержимое файла:**

```nginx
server {
    listen 80;
    server_name builder.yourdomain.com;

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Активируем конфигурацию
sudo ln -s /etc/nginx/sites-available/prototype-builder /etc/nginx/sites-enabled/

# Проверяем конфигурацию
sudo nginx -t

# Перезапускаем Nginx
sudo systemctl restart nginx

# Получаем SSL сертификат (замените на ваш домен)
sudo certbot --nginx -d builder.yourdomain.com
```

---

## 6️⃣ Проверка работы

### Проверка статуса всех сервисов

```bash
docker compose ps
```

Должно быть запущено 3 контейнера:
- `prototype-builder-nginx` (если используется встроенный nginx)
- `prototype-builder-dev`
- `prototype-builder-db`

### Проверка доступности приложения

```bash
# Получаем IP сервера
ip addr show | grep inet

# Открываем в браузере:
# http://YOUR_SERVER_IP:8888
# или
# http://your-domain.com (если настроили Nginx)
```

### Проверка базы данных

```bash
# Подключаемся к PostgreSQL
docker compose exec postgres psql -U postgres -d prototype_builder

# Список таблиц
\dt

# Выход
\q
```

---

## 7️⃣ Обновление проекта

### Использование скрипта deploy.sh (рекомендуется)

```bash
cd ~/projects/tilda-vtb
chmod +x deploy.sh
./deploy.sh
```

### Ручное обновление

```bash
cd ~/projects/tilda-vtb

# Подтягиваем код
git pull origin dev

# Пересобираем образ
docker compose build app-dev

# Перезапускаем
docker compose down
docker compose up -d

# Применяем миграции
docker compose exec app-dev npx prisma migrate deploy
docker compose exec app-dev npx prisma generate
docker compose restart app-dev
```

---

## 8️⃣ Полезные команды

### Просмотр логов

```bash
# Логи приложения
docker compose logs app-dev -f

# Логи БД
docker compose logs postgres -f

# Логи всех сервисов
docker compose logs -f
```

### Перезапуск сервисов

```bash
# Перезапуск приложения
docker compose restart app-dev

# Перезапуск всех сервисов
docker compose restart

# Полный перезапуск (с остановкой)
docker compose down && docker compose up -d
```

### Подключение к контейнеру

```bash
# Открыть shell в контейнере приложения
docker compose exec app-dev sh

# Открыть shell в контейнере БД
docker compose exec postgres bash
```

### Работа с базой данных

```bash
# Подключение к PostgreSQL
docker compose exec postgres psql -U postgres -d prototype_builder

# Создание бэкапа БД
docker compose exec postgres pg_dump -U postgres prototype_builder > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановление из бэкапа
docker compose exec -T postgres psql -U postgres -d prototype_builder < backup.sql
```

### Очистка Docker

```bash
# Удаление неиспользуемых образов
docker image prune -a

# Удаление неиспользуемых контейнеров
docker container prune

# Полная очистка Docker (осторожно!)
docker system prune -a --volumes
```

---

## 9️⃣ Решение проблем

### Контейнеры не запускаются

```bash
# Проверяем логи
docker compose logs

# Проверяем статус
docker compose ps

# Пересоздаем контейнеры
docker compose down -v
docker compose up -d
```

### Ошибки миграций БД

```bash
# Сброс миграций (осторожно, удалит данные!)
docker compose exec postgres psql -U postgres -d prototype_builder -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Повторное применение миграций
docker compose exec app-dev npx prisma migrate deploy
```

### Приложение не отвечает

```bash
# Проверяем, что порт 8888 открыт
sudo ufw status
sudo ufw allow 8888/tcp

# Перезапускаем приложение
docker compose restart app-dev
```

### Проблемы с правами доступа

```bash
# Исправляем права на файлы проекта
sudo chown -R $USER:$USER ~/projects/tilda-vtb

# Исправляем права на .env
chmod 600 .env
```

---

## 🔟 Безопасность

### Настройка файрвола

```bash
# Устанавливаем UFW
sudo apt install -y ufw

# Разрешаем SSH
sudo ufw allow 22/tcp

# Разрешаем HTTP и HTTPS (если используете Nginx на хосте)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Разрешаем порт приложения (только если нужен прямой доступ)
sudo ufw allow 8888/tcp

# Включаем файрвол
sudo ufw enable

# Проверяем статус
sudo ufw status
```

### Обновление секретов

```bash
# Регулярно обновляйте пароли и секреты в .env
nano .env

# После изменения .env перезапустите контейнеры
docker compose down
docker compose up -d
```

### Бэкапы

Настройте автоматические бэкапы базы данных:

```bash
# Создаем скрипт бэкапа
cat > ~/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
cd ~/projects/tilda-vtb
docker compose exec -T postgres pg_dump -U postgres prototype_builder > $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql
# Удаляем бэкапы старше 7 дней
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup.sh

# Добавляем в cron (ежедневно в 2:00 ночи)
(crontab -l 2>/dev/null; echo "0 2 * * * ~/backup.sh") | crontab -
```

---

## ✅ Чек-лист готовности

- [ ] Docker и Docker Compose установлены
- [ ] Проект клонирован из Git
- [ ] Файл `.env` создан и настроен
- [ ] Контейнеры запущены (`docker compose ps`)
- [ ] База данных работает (`pg_isready`)
- [ ] Миграции применены (`prisma migrate deploy`)
- [ ] Приложение доступно в браузере
- [ ] Nginx настроен (если нужен SSL)
- [ ] Файрвол настроен
- [ ] Бэкапы настроены

---

## 📞 Поддержка

Если возникли проблемы:

1. Проверь логи: `docker compose logs -f`
2. Проверь статус: `docker compose ps`
3. Проверь .env файл
4. Проверь подключение к БД
5. Убедись, что все порты открыты

---

## 🎉 Готово!

Твой проект теперь работает на новом сервере! 

- **Dev-версия**: http://your-server-ip:8888
- **Nginx (если настроен)**: http://your-domain.com

Для обновлений используй: `./deploy.sh`
