-- 8 November 2026: the games of the structure, one section per game, first
-- page of the Esport pole. Additive only: no existing row is touched.

CREATE TYPE "public"."DatePrecision" AS ENUM ('YEAR', 'MONTH', 'DAY');

CREATE TABLE "public"."Game" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "shortName" VARCHAR(12),
    "firstOpenedOn" DATE NOT NULL,
    "firstOpenedPrecision" "public"."DatePrecision" NOT NULL DEFAULT 'DAY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id"),
    -- The service trims; the base refuses a blank or padded name anyway.
    CONSTRAINT "Game_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 60),
    CONSTRAINT "Game_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    CONSTRAINT "Game_shortName_check"
        CHECK ("shortName" IS NULL OR (
            "shortName" = btrim("shortName")
            AND char_length("shortName") BETWEEN 1 AND 12
        )),
    -- A date known to the year sits on 1 January, to the month on its first
    -- day: no invented day (registre historique).
    CONSTRAINT "Game_firstOpened_precision_check"
        CHECK (
            ("firstOpenedPrecision" <> 'YEAR' OR (
                EXTRACT(MONTH FROM "firstOpenedOn") = 1
                AND EXTRACT(DAY FROM "firstOpenedOn") = 1
            ))
            AND ("firstOpenedPrecision" <> 'MONTH'
                OR EXTRACT(DAY FROM "firstOpenedOn") = 1)
        ),
    CONSTRAINT "Game_version_check" CHECK ("version" >= 1)
);

CREATE UNIQUE INDEX "Game_normalizedName_key"
ON "public"."Game"("normalizedName");

CREATE INDEX "Game_isActive_name_idx"
ON "public"."Game"("isActive", "name");

-- Journal of the new page; values are only added, never reordered.
ALTER TYPE "public"."AuditAction" ADD VALUE 'GAME_CREATE' AFTER 'PERSON_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'GAME_UPDATE' AFTER 'GAME_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'GAME_DELETE' AFTER 'GAME_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'GAME' AFTER 'PERSON';
