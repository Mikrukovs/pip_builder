-- Таблица для сессий аналитики
CREATE TABLE "analytics_sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "project_id" TEXT NOT NULL,
  "start_time" BIGINT NOT NULL,
  "end_time" BIGINT,
  "user_agent" TEXT,
  "clicks" JSONB NOT NULL DEFAULT '[]',
  "screen_times" JSONB NOT NULL DEFAULT '{}',
  "transitions" JSONB NOT NULL DEFAULT '[]',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "analytics_sessions_project_id_idx" ON "analytics_sessions"("project_id");
