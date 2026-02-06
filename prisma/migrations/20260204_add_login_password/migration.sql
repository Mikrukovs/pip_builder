-- Делаем telegramId опциональным
ALTER TABLE "users" ALTER COLUMN "telegram_id" DROP NOT NULL;

-- Делаем username обязательным и уникальным
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;

-- Добавляем поле password (опциональное, так как может быть Telegram авторизация)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password" VARCHAR(255);

-- Создаём уникальный индекс на username, если его ещё нет
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_username_key'
    ) THEN
        ALTER TABLE "users" ADD CONSTRAINT "users_username_key" UNIQUE ("username");
    END IF;
END $$;
