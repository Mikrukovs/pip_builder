# Multi-stage build для Next.js приложения

# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

# Копируем package файлы
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Копируем зависимости из предыдущего stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Переменные окружения для build time
ARG NEXT_PUBLIC_TELEGRAM_BOT_NAME
ENV NEXT_PUBLIC_TELEGRAM_BOT_NAME=$NEXT_PUBLIC_TELEGRAM_BOT_NAME

# Собираем приложение
RUN npm run build

# Stage 3: Production с nginx
FROM nginx:alpine AS production
WORKDIR /usr/share/nginx/html

# Удаляем дефолтные файлы nginx
RUN rm -rf ./*

# Копируем собранное приложение
COPY --from=builder /app/out .

# Копируем nginx конфиг
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
