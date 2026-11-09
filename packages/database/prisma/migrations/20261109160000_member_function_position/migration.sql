-- 9 November 2026: the functions of a game keep the order their managers set by
-- dragging, within each kind, the same on every page (owner: « on devrait
-- mettre du drag and drop sur les placements pour l'importance », « ok go »).

ALTER TABLE "public"."MemberFunction"
ADD COLUMN "position" INTEGER NOT NULL DEFAULT 0;

-- Existing functions keep the order they were shown in: active ones first,
-- then by name, within each game and kind.
UPDATE "public"."MemberFunction" AS f
SET "position" = ranked."rank"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "gameId", "kind"
            ORDER BY "isActive" DESC, "name"
        ) - 1 AS "rank"
    FROM "public"."MemberFunction"
) AS ranked
WHERE f."id" = ranked."id";

ALTER TABLE "public"."MemberFunction"
ADD CONSTRAINT "MemberFunction_position_check" CHECK ("position" >= 0);

-- The order is read by game and kind; the former index sorted by state and name.
DROP INDEX "public"."MemberFunction_gameId_kind_isActive_name_idx";
CREATE INDEX "MemberFunction_gameId_kind_position_idx"
ON "public"."MemberFunction"("gameId", "kind", "position");

-- One trace for a new order, its before and after; values are only added.
ALTER TYPE "public"."AuditAction" ADD VALUE 'FUNCTION_REORDER' AFTER 'FUNCTION_DELETE';
