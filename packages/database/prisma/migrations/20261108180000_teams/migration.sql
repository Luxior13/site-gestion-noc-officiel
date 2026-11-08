-- 8 November 2026: the teams of each game, shown under it on the Jeux page.
-- Additive only: no existing row is touched.

CREATE TABLE "public"."Team" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "foundedOn" DATE NOT NULL,
    "foundedPrecision" "public"."DatePrecision" NOT NULL DEFAULT 'DAY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id"),
    -- The service trims; the base refuses a blank or padded name anyway.
    CONSTRAINT "Team_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 60),
    CONSTRAINT "Team_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    -- A date known to the year sits on 1 January, to the month on its first
    -- day: no invented day (registre historique).
    CONSTRAINT "Team_founded_precision_check"
        CHECK (
            ("foundedPrecision" <> 'YEAR' OR (
                EXTRACT(MONTH FROM "foundedOn") = 1
                AND EXTRACT(DAY FROM "foundedOn") = 1
            ))
            AND ("foundedPrecision" <> 'MONTH'
                OR EXTRACT(DAY FROM "foundedOn") = 1)
        ),
    CONSTRAINT "Team_version_check" CHECK ("version" >= 1)
);

-- Each game may have its own « Noctambule », never two.
CREATE UNIQUE INDEX "Team_gameId_normalizedName_key"
ON "public"."Team"("gameId", "normalizedName");

CREATE INDEX "Team_gameId_isActive_name_idx"
ON "public"."Team"("gameId", "isActive", "name");

-- A game that has teams cannot be deleted: it is made inactive instead. Never
-- CASCADE, which erased the teams of a deleted game in the January 2026 schema.
ALTER TABLE "public"."Team" ADD CONSTRAINT "Team_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Journal of the teams; values are only added, never reordered.
ALTER TYPE "public"."AuditAction" ADD VALUE 'TEAM_CREATE' AFTER 'GAME_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TEAM_UPDATE' AFTER 'TEAM_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TEAM_DELETE' AFTER 'TEAM_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'TEAM' AFTER 'GAME';
