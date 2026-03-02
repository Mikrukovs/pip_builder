#!/bin/bash

# 🚀 Автоматическая установка Prototype Builder
# Использование: bash auto-install.sh

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Конфигурация
SERVER_IP="85.198.109.41"
DOMAIN="proto-builder.ru"
REPO_URL="https://github.com/Mikrukovs/pip_builder.git"
BRANCH="dev"
PROJECT_DIR="$HOME/projects/pip_builder"

# Определяем команду docker compose (V2 или V1)
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 Prototype Builder Auto Install   ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Функция для вывода статуса
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Проверка, что скрипт запущен не от root
if [ "$EUID" -eq 0 ]; then
    print_error "Не запускайте этот скрипт от root! Используйте обычного пользователя."
    exit 1
fi

# 1. Обновление системы
print_status "Шаг 1/8: Обновление системы..."
sudo apt update && sudo apt upgrade -y
print_success "Система обновлена"

# 2. Установка Docker
print_status "Шаг 2/8: Проверка Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker не найден. Устанавливаю..."
    
    # Удаляем старые версии
    sudo apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
    
    # Устанавливаем зависимости
    sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
    
    # Добавляем GPG ключ Docker
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Добавляем репозиторий Docker
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Устанавливаем Docker
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Устанавливаем docker-compose (старая версия для совместимости)
    if ! command -v docker-compose &> /dev/null; then
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
    fi
    
    # Добавляем пользователя в группу docker
    sudo usermod -aG docker $USER
    
    print_success "Docker установлен"
    print_warning "Перелогиньтесь после установки: exit, затем снова подключитесь по SSH"
else
    print_success "Docker уже установлен: $(docker --version)"
    
    # Проверяем docker-compose
    if ! command -v docker-compose &> /dev/null; then
        print_warning "docker-compose не найден. Устанавливаю..."
        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose
        print_success "docker-compose установлен"
    fi
fi

# Определяем команду docker compose (V2 или V1)
if docker compose version &>/dev/null; then
    DOCKER_COMPOSE="docker compose"
    print_success "Используется Docker Compose V2"
else
    DOCKER_COMPOSE="docker-compose"
    print_success "Используется Docker Compose V1"
fi

# Проверяем, что пользователь в группе docker
if ! groups | grep -q docker; then
    print_warning "Добавляю пользователя в группу docker..."
    sudo usermod -aG docker $USER
    print_warning "⚠️  Выполните 'newgrp docker' или перелогиньтесь для применения прав!"
fi

# 3. Проверка Git
print_status "Шаг 3/8: Проверка Git..."
if ! command -v git &> /dev/null; then
    print_warning "Git не найден. Устанавливаю..."
    sudo apt install -y git
    print_success "Git установлен"
else
    print_success "Git уже установлен: $(git --version)"
fi

# 4. Клонирование проекта
print_status "Шаг 4/8: Клонирование проекта..."
mkdir -p $(dirname "$PROJECT_DIR")

if [ -d "$PROJECT_DIR" ]; then
    print_warning "Директория проекта уже существует. Обновляю..."
    cd "$PROJECT_DIR"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
    print_success "Проект обновлен"
else
    print_status "Клонирую репозиторий..."
    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
    git checkout $BRANCH
    print_success "Проект клонирован"
fi

# 5. Создание .env файла
print_status "Шаг 5/8: Настройка окружения (.env)..."
if [ ! -f "$PROJECT_DIR/.env" ]; then
    print_status "Генерирую секреты..."
    
    # Генерируем случайные секреты
    JWT_SECRET=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    DB_PASSWORD=$(openssl rand -base64 16)
    
    cat > "$PROJECT_DIR/.env" << EOF
# Database
POSTGRES_DB=prototype_builder
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$DB_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# Next.js Auth
NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXTAUTH_URL=http://${DOMAIN}

# Telegram Bot (опционально)
NEXT_PUBLIC_TELEGRAM_BOT_NAME=
TELEGRAM_BOT_TOKEN=
EOF
    
    print_success ".env файл создан с безопасными секретами"
else
    print_success ".env файл уже существует"
fi

# 6. Настройка файрвола
print_status "Шаг 6/8: Настройка файрвола (UFW)..."
if command -v ufw &> /dev/null; then
    sudo ufw --force enable
    sudo ufw allow 22/tcp  # SSH
    sudo ufw allow 80/tcp  # HTTP
    sudo ufw allow 443/tcp # HTTPS
    sudo ufw allow 8888/tcp # App port
    print_success "Файрвол настроен"
else
    print_warning "UFW не установлен, пропускаю настройку файрвола"
fi

# 7. Запуск Docker контейнеров
print_status "Шаг 7/8: Запуск Docker контейнеров..."
cd "$PROJECT_DIR"

# Останавливаем старые контейнеры (если есть)
$DOCKER_COMPOSE down 2>/dev/null || true

# Собираем образ
print_status "Собираю Docker образ (это может занять несколько минут)..."
$DOCKER_COMPOSE build app-dev

# Запускаем контейнеры
print_status "Запускаю контейнеры..."
$DOCKER_COMPOSE up -d

# Ждём запуска PostgreSQL
print_status "Ожидаю запуска PostgreSQL..."
sleep 10

# Проверяем, что PostgreSQL запущен
MAX_RETRIES=30
RETRY_COUNT=0
while ! $DOCKER_COMPOSE exec postgres pg_isready -U postgres > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        print_error "PostgreSQL не запустился за отведенное время"
        exit 1
    fi
    echo -n "."
    sleep 2
done
echo ""
print_success "PostgreSQL запущен"

# Применяем миграции
print_status "Применяю миграции базы данных..."
$DOCKER_COMPOSE exec -T app-dev npx prisma migrate deploy

# Генерируем Prisma Client
print_status "Генерирую Prisma Client..."
$DOCKER_COMPOSE exec -T app-dev npx prisma generate

# Перезапускаем приложение
print_status "Перезапускаю приложение..."
$DOCKER_COMPOSE restart app-dev

print_success "Docker контейнеры запущены"

# 8. Установка и настройка Nginx на хосте
print_status "Шаг 8/8: Настройка Nginx для домена ${DOMAIN}..."
if ! command -v nginx &> /dev/null; then
    print_status "Устанавливаю Nginx..."
    sudo apt install -y nginx certbot python3-certbot-nginx
    print_success "Nginx установлен"
fi

# Создаем конфигурацию Nginx
print_status "Создаю конфигурацию Nginx..."
sudo tee /etc/nginx/sites-available/prototype-builder > /dev/null << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Активируем конфигурацию
sudo ln -sf /etc/nginx/sites-available/prototype-builder /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Проверяем конфигурацию
if sudo nginx -t; then
    sudo systemctl restart nginx
    print_success "Nginx настроен и запущен"
else
    print_error "Ошибка в конфигурации Nginx"
    exit 1
fi

# Получаем SSL сертификат
print_status "Получаю SSL сертификат от Let's Encrypt..."
print_warning "Убедитесь, что домен ${DOMAIN} указывает на IP ${SERVER_IP}"
read -p "Продолжить? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN} --non-interactive --agree-tos --register-unsafely-without-email || print_warning "Не удалось получить SSL. Можно сделать это позже вручную: sudo certbot --nginx -d ${DOMAIN}"
fi

# Финальная проверка
print_status "Проверяю статус контейнеров..."
$DOCKER_COMPOSE ps

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║            ✅ Установка завершена успешно!            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 Ваше приложение доступно по адресам:${NC}"
echo -e "   • http://${DOMAIN}"
echo -e "   • http://${SERVER_IP}:8888"
echo ""
echo -e "${BLUE}📊 Полезные команды:${NC}"
echo -e "   • Логи приложения:    ${YELLOW}cd $PROJECT_DIR && docker compose logs app-dev -f${NC}"
echo -e "   • Статус контейнеров: ${YELLOW}cd $PROJECT_DIR && docker compose ps${NC}"
echo -e "   • Перезапуск:         ${YELLOW}cd $PROJECT_DIR && docker compose restart app-dev${NC}"
echo -e "   • Обновление проекта: ${YELLOW}cd $PROJECT_DIR && ./deploy.sh${NC}"
echo ""
echo -e "${BLUE}🔐 Для создания первого пользователя:${NC}"
echo -e "   Откройте http://${DOMAIN} и зарегистрируйтесь"
echo ""
echo -e "${YELLOW}⚠️  Важно:${NC}"
echo -e "   • Пароль БД сохранен в ${PROJECT_DIR}/.env"
echo -e "   • Для обновления проекта: cd $PROJECT_DIR && git pull && docker compose up -d --build"
echo ""
