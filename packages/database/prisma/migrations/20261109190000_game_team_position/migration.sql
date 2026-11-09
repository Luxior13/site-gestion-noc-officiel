-- 9 November 2026: one rule for every list ordered by importance (owner: « pense
-- long terme », then « ok go »): the active games, the active teams of each game
-- and the active functions of each kind are ranked by dragging; the inactive
-- ones keep their last rank and show below.

ALTER TABLE "public"."Game" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "public"."Team" ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Existing rows keep the order they were shown in: active first, then by name.
UPDATE "public"."Game" AS g
SET "position" = ranked."rank"
FROM (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "isActive" DESC, "name") - 1 AS "rank"
    FROM "public"."Game"
) AS ranked
WHERE g."id" = ranked."id";

UPDATE "public"."Team" AS t
SET "position" = ranked."rank"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "gameId"
            ORDER BY "isActive" DESC, "name"
        ) - 1 AS "rank"
    FROM "public"."Team"
) AS ranked
WHERE t."id" = ranked."id";

ALTER TABLE "public"."Game"
ADD CONSTRAINT "Game_position_check" CHECK ("position" >= 0);
ALTER TABLE "public"."Team"
ADD CONSTRAINT "Team_position_check" CHECK ("position" >= 0);

-- Lists are read active first, then by rank.
DROP INDEX "public"."Game_isActive_name_idx";
CREATE INDEX "Game_isActive_position_idx" ON "public"."Game"("isActive", "position");
DROP INDEX "public"."Team_gameId_isActive_name_idx";
CREATE INDEX "Team_gameId_isActive_position_idx"
ON "public"."Team"("gameId", "isActive", "position");

-- One trace for a new order, its before and after; values are only added.
ALTER TYPE "public"."AuditAction" ADD VALUE 'GAME_REORDER' AFTER 'GAME_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TEAM_REORDER' AFTER 'TEAM_DELETE';
