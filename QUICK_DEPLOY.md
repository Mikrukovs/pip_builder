# ⚡ Быстрый деплой на сервер 85.198.109.41

## 🎯 Всё в одну команду!

Подключись к серверу и выполни:

```bash
ssh root@85.198.109.41
```

Затем скопируй и вставь эту команду:

```bash
curl -fsSL https://raw.githubusercontent.com/Mikrukovs/pip_builder/dev/auto-install.sh | bash
```

**Или**, если файл еще не в репозитории:

```bash
# 1. Скачай скрипт
wget https://raw.githubusercontent.com/Mikrukovs/pip_builder/main/auto-install.sh -O auto-install.sh

# Или создай вручную:
cat > auto-install.sh << 'EOF'
# [ВСТАВЬ СЮДА СОДЕРЖИМОЕ auto-install.sh]
EOF

# 2. Сделай исполняемым
chmod +x auto-install.sh

# 3. Запусти
./auto-install.sh
```

---

## 🚀 Что делает скрипт?

✅ Устанавливает Docker и Git  
✅ Клонирует проект из GitHub  
✅ Создает безопасный `.env` с секретами  
✅ Запускает PostgreSQL и приложение в Docker  
✅ Настраивает Nginx для домена proto-builder.ru  
✅ Получает SSL сертификат (HTTPS)  
✅ Настраивает файрвол

**Время выполнения:** ~5-10 минут

---

## ✋ Ручная установка (если скрипт не работает)

### Шаг 1: Установка Docker

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Перелогинься или выполни:
newgrp docker
```

### Шаг 2: Клонирование проекта

```bash
mkdir -p ~/projects
cd ~/projects
git clone https://github.com/Mikrukovs/pip_builder.git
cd pip_builder
git checkout dev
```

### Шаг 3: Создание .env

```bash
cat > .env << 'EOF'
POSTGRES_DB=prototype_builder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here

JWT_SECRET=your_jwt_secret_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://proto-builder.ru

NEXT_PUBLIC_TELEGRAM_BOT_NAME=
TELEGRAM_BOT_TOKEN=
EOF

# Сгенерируй безопасные секреты:
sed -i "s/JWT_SECRET=.*/JWT_SECRET=$(openssl rand -base64 32)/" .env
sed -i "s/NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=$(openssl rand -base64 32)/" .env
sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$(openssl rand -base64 16)/" .env
```

### Шаг 4: Запуск проекта

```bash
# Запуск контейнеров
docker compose up -d

# Подождать 10 секунд
sleep 10

# Применить миграции
docker compose exec app-dev npx prisma migrate deploy
docker compose exec app-dev npx prisma generate

# Перезапустить
docker compose restart app-dev
```

### Шаг 5: Настройка Nginx + SSL

```bash
# Установка Nginx и Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Создание конфига
sudo tee /etc/nginx/sites-available/prototype-builder > /dev/null << 'EOF'
server {
    listen 80;
    server_name proto-builder.ru www.proto-builder.ru;

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
EOF

# Активация
sudo ln -sf /etc/nginx/sites-available/prototype-builder /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Получение SSL
sudo certbot --nginx -d proto-builder.ru -d www.proto-builder.ru
```

### Шаг 6: Файрвол

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8888/tcp
sudo ufw --force enable
```

---

## 🎉 Готово!

Открой в браузере:
- **http://proto-builder.ru** (или https после получения SSL)
- **http://85.198.109.41:8888** (прямой доступ)

---

## 📋 Полезные команды после установки

```bash
# Перейти в директорию проекта
cd ~/projects/pip_builder

# Посмотреть логи
docker compose logs app-dev -f

# Проверить статус
docker compose ps

# Перезапустить
docker compose restart app-dev

# Обновить проект из Git
git pull origin dev
docker compose up -d --build
docker compose exec app-dev npx prisma migrate deploy
docker compose exec app-dev npx prisma generate
docker compose restart app-dev

# Или использовать готовый скрипт:
./deploy.sh
```

---

## ⚠️ Проверь перед запуском

1. ✅ Домен **proto-builder.ru** указывает на IP **85.198.109.41** (A-запись в DNS)
2. ✅ Порты 80, 443, 8888 открыты на сервере
3. ✅ У тебя есть SSH доступ к серверу

---

## 🆘 Если что-то пошло не так

### Контейнеры не запускаются

```bash
cd ~/projects/pip_builder
docker compose logs
docker compose down
docker compose up -d
```

### Приложение недоступно

```bash
# Проверь, что контейнеры запущены
docker compose ps

# Проверь Nginx
sudo systemctl status nginx
sudo nginx -t

# Проверь файрвол
sudo ufw status
```

### База данных не инициализируется

```bash
cd ~/projects/pip_builder

# Пересоздай БД
docker compose down -v
docker compose up -d
sleep 10
docker compose exec app-dev npx prisma migrate deploy
docker compose exec app-dev npx prisma generate
docker compose restart app-dev
```

---

## 📞 Нужна помощь?

Пришли мне вывод команды:

```bash
cd ~/projects/pip_builder
docker compose logs app-dev --tail=50
docker compose ps
```
