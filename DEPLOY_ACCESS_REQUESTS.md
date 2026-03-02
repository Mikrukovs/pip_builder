# Деплой системы запросов доступа

## Что нового

1. **Исправлено добавление пользователей в проекты вне папок**
   - Теперь корректно определяется владелец проекта через `ProjectCollaborator`

2. **Система запросов доступа**
   - Пользователь без доступа может запросить его через красивую страницу
   - Owner получает уведомления с бейджем в header
   - Owner может одобрить или отклонить запрос

## Шаги деплоя

### 1. Обновить код на сервере

```bash
cd ~/projects/pip_builder
git pull origin dev
```

### 2. Применить миграцию базы данных

```bash
# Войти в контейнер с БД
docker exec -it pip_builder-postgres-1 psql -U postgres -d prototype_builder

# Выполнить SQL из миграции
\i /path/to/migration.sql

# Или вручную:
```

```sql
-- CreateTable
CREATE TABLE "access_requests" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_requests_project_id_idx" ON "access_requests"("project_id");
CREATE INDEX "access_requests_user_id_idx" ON "access_requests"("user_id");
CREATE INDEX "access_requests_status_idx" ON "access_requests"("status");
CREATE UNIQUE INDEX "access_requests_project_id_user_id_key" ON "access_requests"("project_id", "user_id");

-- AddForeignKey
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "access_requests" ADD CONSTRAINT "access_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

### 3. Перезапустить приложение

```bash
docker-compose restart app-dev
```

### 4. Проверить работу

1. **Добавление пользователей в проекты вне папок:**
   - Откройте проект вне папки
   - Нажмите три точки → "Управление доступом"
   - Добавьте пользователя
   - ✅ Должно работать без ошибок

2. **Запрос доступа:**
   - Скопируйте ссылку на редактор проекта
   - Откройте в другом аккаунте (без доступа)
   - ✅ Должна показаться страница "Доступ запрещён"
   - Нажмите "Запросить доступ"
   - ✅ Должно показать "Запрос отправлен"

3. **Одобрение запроса:**
   - Вернитесь в аккаунт владельца
   - ✅ В header должен появиться колокольчик с красным бейджем
   - Нажмите на колокольчик
   - ✅ Должен открыться модал с запросом
   - Нажмите "Одобрить"
   - ✅ Запрос должен исчезнуть, бейдж обновиться

4. **Проверка доступа:**
   - Вернитесь во второй аккаунт
   - Обновите страницу редактора
   - ✅ Должен открыться редактор проекта

## Новые API endpoints

- `GET /api/access-requests` - Получить pending запросы для owner'а
- `POST /api/access-requests` - Создать запрос доступа
- `PUT /api/access-requests/:id` - Одобрить/отклонить (action: 'approve' | 'reject')
- `DELETE /api/access-requests/:id` - Удалить запрос

## Новые компоненты

- `AccessDenied` - Страница запроса доступа
- `AccessRequestsModal` - Модал для owner'а с запросами
- Bell icon в dashboard header с бейджем

## Изменения в существующих компонентах

- `GET /api/projects/:id` - Теперь возвращает `projectName` даже при 403
- `GET /api/projects` - Добавлено поле `userRole` в ответ
- Dashboard - Исправлена проверка `isOwner` для проектов вне папок
