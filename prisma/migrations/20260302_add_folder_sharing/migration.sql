-- Создание таблицы доступа к папкам
CREATE TABLE "folder_collaborators" (
  "id" SERIAL PRIMARY KEY,
  "folder_id" INTEGER NOT NULL,
  "user_id" INTEGER NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'editor',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT "folder_collaborators_folder_id_user_id_key" UNIQUE ("folder_id", "user_id"),
  CONSTRAINT "folder_collaborators_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "folders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "folder_collaborators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Создание индексов для folder_collaborators
CREATE INDEX "folder_collaborators_folder_id_idx" ON "folder_collaborators"("folder_id");
CREATE INDEX "folder_collaborators_user_id_idx" ON "folder_collaborators"("user_id");

-- Добавление поля accessType в shared_projects
ALTER TABLE "shared_projects" ADD COLUMN "access_type" VARCHAR(20) NOT NULL DEFAULT 'view';

-- Создание индекса для accessType
CREATE INDEX "shared_projects_access_type_idx" ON "shared_projects"("access_type");
