# Changelog: Docker Support

## Добавлено

### 🐳 Docker поддержка

Полная Docker конфигурация для development и production режимов.

### Новые файлы

#### Docker конфигурация
- `Dockerfile` - multi-stage build для production (nginx)
- `Dockerfile.dev` - образ для development с hot reload
- `docker-compose.yml` - оркестрация с профилями (dev/prod)
- `docker-compose.override.yml` - дефолтный dev режим
- `.dockerignore` - исключение ненужных файлов из образа
- `nginx.conf` - конфигурация nginx для production

#### Документация
- `DOCKER_QUICK_START.md` - быстрый старт с Docker
- `docs/docker-guide.md` - подробная документация

### Обновленные файлы

- `README.md` - добавлена информация о Docker

## Использование

### Development режим (hot reload)

```bash
docker-compose up
```

Приложение доступно на `http://localhost:3000`

### Production режим (nginx)

```bash
docker-compose --profile production up
```

Приложение доступно на `http://localhost:8080`

## Технические детали

### Размеры образов

- **Development**: ~500-600 MB (Node.js + зависимости)
- **Production**: ~50-80 MB (nginx + статика)

### Возможности

- ✅ Hot reload в dev режиме
- ✅ Multi-stage build для production
- ✅ Nginx с оптимизацией (gzip, кеширование)
- ✅ Security headers
- ✅ Поддержка переменных окружения
- ✅ CI/CD готовность
