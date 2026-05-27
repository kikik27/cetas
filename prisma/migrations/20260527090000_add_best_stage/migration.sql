ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "best_stage" INTEGER NOT NULL DEFAULT 1;

UPDATE "players"
SET "best_stage" = GREATEST("best_stage", "endless_stage");
