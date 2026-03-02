# Исправление WebSocket на production

## Проблема
WebSocket соединение закрывается с ошибкой "Invalid token". Это происходит из-за:
1. Несоответствия секретов JWT между токеном и WebSocket сервером
2. Nginx не настроен для проксирования WebSocket соединений

## Решение

### Шаг 1: Обновите код на сервере

```bash
ssh deploy@85.198.109.41
cd ~/projects/pip_builder
git pull origin dev
docker-compose restart app-dev
```

### Шаг 2: Обновите конфигурацию Nginx

На сервере выполните:

```bash
sudo nano /etc/nginx/sites-available/proto-builder.ru
```

Замените содержимое файла на следующее:

```nginx
server {
    listen 80;
    server_name proto-builder.ru www.proto-builder.ru;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name proto-builder.ru www.proto-builder.ru;

    ssl_certificate /etc/letsencrypt/live/proto-builder.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/proto-builder.ru/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    access_log /var/log/nginx/proto-builder.access.log;
    error_log /var/log/nginx/proto-builder.error.log;

    location / {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        
        # WebSocket заголовки
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Стандартные заголовки
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Таймауты для WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
        
        # Отключение буферизации
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/socket/ {
        proxy_pass http://localhost:8888;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
        
        proxy_buffering off;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Шаг 3: Проверьте и перезапустите Nginx

```bash
# Проверка конфигурации
sudo nginx -t

# Если проверка успешна, перезапустите Nginx
sudo systemctl reload nginx
```

### Шаг 4: Проверьте логи контейнера

```bash
docker-compose logs -f app-dev
```

Вы должны увидеть сообщения о подключении пользователей:
```
User connected: 123
User 123 joined project 456
```

### Шаг 5: Проверьте в браузере

1. Откройте https://proto-builder.ru в браузере
2. Войдите в систему
3. Откройте проект в редакторе
4. Откройте консоль браузера (F12)
5. Вы должны увидеть:
   - `Socket connected`
   - Индикатор "Онлайн" с зеленой точкой в редакторе

## Проверка WebSocket соединения

### В консоли браузера не должно быть ошибок:
- ❌ `WebSocket connection to 'wss://...' failed`
- ❌ `Socket connection error: Invalid token`

### Должны быть сообщения:
- ✅ `Socket connected`
- ✅ Зеленый индикатор "Онлайн" в редакторе

## Устранение проблем

### Ошибка "Invalid token" остается

1. Проверьте переменные окружения в `.env`:
   ```bash
   cd ~/projects/pip_builder
   cat .env | grep NEXTAUTH_SECRET
   ```

2. Перезапустите контейнер:
   ```bash
   docker-compose restart app-dev
   ```

3. Выйдите из аккаунта и войдите заново (чтобы получить новый токен)

### Nginx выдает ошибки

Проверьте логи Nginx:
```bash
sudo tail -f /var/log/nginx/error.log
```

### WebSocket все еще не работает

1. Проверьте, что порт 8888 доступен:
   ```bash
   curl http://localhost:8888
   ```

2. Проверьте, что контейнер запущен:
   ```bash
   docker-compose ps
   ```

3. Проверьте логи контейнера на наличие ошибок:
   ```bash
   docker-compose logs --tail=100 app-dev | grep -i error
   ```

## Важно

После обновления Nginx конфигурации **обязательно**:
1. Перезапустите Nginx: `sudo systemctl reload nginx`
2. Перезапустите контейнер: `docker-compose restart app-dev`
3. Выйдите и войдите заново в приложение (для получения нового токена)

## Тестирование

1. Откройте проект в двух разных браузерах/вкладках
2. Проверьте, что счетчик показывает "2 участника онлайн"
3. В консоли сервера должны быть сообщения о подключении пользователей

Все должно работать! 🚀
