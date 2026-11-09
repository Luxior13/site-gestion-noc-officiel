-- 9 November 2026: the functions of each game (Joueur, Coach…), managed in its
-- record; the passages of the roster will use them. Additive only: no existing
-- row is touched.

CREATE TYPE "public"."MemberFunctionKind" AS ENUM ('PLAYER', 'STAFF');

CREATE TABLE "public"."MemberFunction" (
    "id" TEXT NOT NULL,
    "gameId" TEXT,
    "name" VARCHAR(40) NOT NULL,
    "normalizedName" VARCHAR(80) NOT NULL,
    "kind" "public"."MemberFunctionKind" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberFunction_pkey" PRIMARY KEY ("id"),
    -- The service trims; the base refuses a blank or padded name anyway.
    CONSTRAINT "MemberFunction_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 40),
    CONSTRAINT "MemberFunction_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    CONSTRAINT "MemberFunction_version_check" CHECK ("version" >= 1)
);

-- One « Coach » per game, whatever the case or the accents.
CREATE UNIQUE INDEX "MemberFunction_gameId_normalizedName_key"
ON "public"."MemberFunction"("gameId", "normalizedName");

-- The functions of the structure (no game) are unique among themselves too:
-- a plain unique index lets several empty games through.
CREATE UNIQUE INDEX "MemberFunction_structure_normalizedName_key"
ON "public"."MemberFunction"("normalizedName")
WHERE "gameId" IS NULL;

CREATE INDEX "MemberFunction_gameId_kind_isActive_name_idx"
ON "public"."MemberFunction"("gameId", "kind", "isActive", "name");

-- Never CASCADE: deleting a game created by mistake removes its functions
-- explicitly, in its traced transaction, and only while it has no team.
ALTER TABLE "public"."MemberFunction" ADD CONSTRAINT "MemberFunction_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Journal of the functions; values are only added, never reordered.
ALTER TYPE "public"."AuditAction" ADD VALUE 'FUNCTION_CREATE' AFTER 'TEAM_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FUNCTION_UPDATE' AFTER 'FUNCTION_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FUNCTION_DELETE' AFTER 'FUNCTION_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'FUNCTION' AFTER 'TEAM';
