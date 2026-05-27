CREATE TABLE IF NOT EXISTS "point_redemptions" (
  "id" TEXT NOT NULL,
  "player_id" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "celo_amount" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'mocked',
  "tx_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "point_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "point_redemptions_player_id_created_at_idx"
  ON "point_redemptions"("player_id", "created_at");

ALTER TABLE "point_redemptions"
  ADD CONSTRAINT "point_redemptions_player_id_fkey"
  FOREIGN KEY ("player_id") REFERENCES "players"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
