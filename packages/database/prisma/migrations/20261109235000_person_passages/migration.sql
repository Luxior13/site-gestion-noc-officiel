-- 9 November 2026: the passages of the roster (owner: « ok go » on the
-- Roster). A person of the Répertoire in a team, with a function of the
-- team's game, from a start to an end. Additive only.

-- Two identical passages never overlap: an exclusion constraint over a range
-- of dates, which needs equality on text columns in a GiST index.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE "public"."PersonPassage" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "teamId" TEXT,
    "functionId" TEXT NOT NULL,
    "startOn" DATE NOT NULL,
    "startPrecision" "public"."DatePrecision" NOT NULL DEFAULT 'DAY',
    "endOn" DATE,
    "endPrecision" "public"."DatePrecision",
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PersonPassage_pkey" PRIMARY KEY ("id"),
    -- An end comes with its precision, or neither: still there.
    CONSTRAINT "PersonPassage_end_check"
        CHECK (("endOn" IS NULL) = ("endPrecision" IS NULL)),
    -- A start sits on the first day of its period: no invented day.
    CONSTRAINT "PersonPassage_start_precision_check"
        CHECK (
            ("startPrecision" <> 'YEAR' OR (
                EXTRACT(MONTH FROM "startOn") = 1
                AND EXTRACT(DAY FROM "startOn") = 1
            ))
            AND ("startPrecision" <> 'MONTH' OR EXTRACT(DAY FROM "startOn") = 1)
        ),
    -- An end sits on the last day of its period: « 2024 » covers the year.
    CONSTRAINT "PersonPassage_end_precision_check"
        CHECK (
            "endOn" IS NULL OR (
                ("endPrecision" <> 'YEAR' OR (
                    EXTRACT(MONTH FROM "endOn") = 12
                    AND EXTRACT(DAY FROM "endOn") = 31
                ))
                AND ("endPrecision" <> 'MONTH'
                    OR EXTRACT(DAY FROM ("endOn" + 1)) = 1)
            )
        ),
    CONSTRAINT "PersonPassage_order_check"
        CHECK ("endOn" IS NULL OR "endOn" >= "startOn"),
    CONSTRAINT "PersonPassage_version_check" CHECK ("version" >= 1),
    -- The same person, in the same team (or the structure), with the same
    -- function, is never there twice at once.
    CONSTRAINT "PersonPassage_no_overlap" EXCLUDE USING gist (
        "personId" WITH =,
        (COALESCE("teamId", '')) WITH =,
        "functionId" WITH =,
        daterange("startOn", "endOn", '[]') WITH &&
    )
);

CREATE INDEX "PersonPassage_teamId_idx" ON "public"."PersonPassage"("teamId");
CREATE INDEX "PersonPassage_personId_idx" ON "public"."PersonPassage"("personId");
CREATE INDEX "PersonPassage_functionId_idx" ON "public"."PersonPassage"("functionId");

-- Never CASCADE: a person, a team or a function that has passages stays; it
-- is made inactive instead (registre historique).
ALTER TABLE "public"."PersonPassage" ADD CONSTRAINT "PersonPassage_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PersonPassage" ADD CONSTRAINT "PersonPassage_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."PersonPassage" ADD CONSTRAINT "PersonPassage_functionId_fkey"
FOREIGN KEY ("functionId") REFERENCES "public"."MemberFunction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- A passage in a team takes a function of the team's game; one in the
-- structure, a function of the structure.
CREATE FUNCTION "public"."check_passage_function_scope"() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
    function_game TEXT;
    team_game TEXT;
BEGIN
    SELECT "gameId" INTO function_game
    FROM "public"."MemberFunction" WHERE "id" = NEW."functionId";
    IF NEW."teamId" IS NULL THEN
        IF function_game IS NOT NULL THEN
            RAISE EXCEPTION 'A structure passage takes a function of the structure (PersonPassage_function_scope)'
            USING ERRCODE = 'check_violation';
        END IF;
    ELSE
        SELECT "gameId" INTO team_game FROM "public"."Team" WHERE "id" = NEW."teamId";
        IF function_game IS DISTINCT FROM team_game THEN
            RAISE EXCEPTION 'A team passage takes a function of the team''s game (PersonPassage_function_scope)'
            USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "PersonPassage_function_scope"
BEFORE INSERT OR UPDATE OF "teamId", "functionId" ON "public"."PersonPassage"
FOR EACH ROW EXECUTE FUNCTION "public"."check_passage_function_scope"();

-- A function keeps its game, as a team does: its passages rely on it.
CREATE FUNCTION "public"."prevent_member_function_game_change"() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
    IF NEW."gameId" IS DISTINCT FROM OLD."gameId" THEN
        RAISE EXCEPTION 'A function keeps its game (MemberFunction_gameId_immutable)'
        USING ERRCODE = 'check_violation';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER "MemberFunction_gameId_immutable"
BEFORE UPDATE OF "gameId" ON "public"."MemberFunction"
FOR EACH ROW EXECUTE FUNCTION "public"."prevent_member_function_game_change"();

-- Journal of the passages; values are only added, never reordered.
ALTER TYPE "public"."AuditAction" ADD VALUE 'PASSAGE_CREATE' AFTER 'FUNCTION_REORDER';
ALTER TYPE "public"."AuditAction" ADD VALUE 'PASSAGE_UPDATE' AFTER 'PASSAGE_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'PASSAGE_DELETE' AFTER 'PASSAGE_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'PASSAGE' AFTER 'FUNCTION';
