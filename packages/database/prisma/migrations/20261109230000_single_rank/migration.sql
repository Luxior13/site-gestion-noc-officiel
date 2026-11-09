-- 9 November 2026: one order per list, active and inactive items mixed (owner:
-- « je n'arrive pas à échanger deux jeux »; an inactive item never blocks).
-- The ranks become one sequence per list, keeping the order shown until now:
-- the active items first, then the inactive ones, each in its rank.

UPDATE "public"."Game" AS g
SET "position" = ranked."rank"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (ORDER BY "isActive" DESC, "position", "name") - 1 AS "rank"
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
            ORDER BY "isActive" DESC, "position", "name"
        ) - 1 AS "rank"
    FROM "public"."Team"
) AS ranked
WHERE t."id" = ranked."id";

UPDATE "public"."MemberFunction" AS f
SET "position" = ranked."rank"
FROM (
    SELECT
        "id",
        ROW_NUMBER() OVER (
            PARTITION BY "gameId", "kind"
            ORDER BY "isActive" DESC, "position", "name"
        ) - 1 AS "rank"
    FROM "public"."MemberFunction"
) AS ranked
WHERE f."id" = ranked."id";
