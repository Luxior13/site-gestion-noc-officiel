-- 11 November 2026: the tournaments of the structure, first lot (owner,
-- « ok go »): a tournament of a game, its organiser (a record of the
-- organisations), its circuit, online or LAN, its dates, rules, fee and
-- deadlines; each of our teams engaged with its line-up, taken from its
-- Roster or a stand-in from the Répertoire, and its final placement, one
-- place or a shared range (« 3e–4e », « 5e–8e »). An operation may name the
-- tournament it concerns. Gains and Suivi come with the second lot.
-- Additive only: no existing row is touched.

CREATE TYPE "public"."TournamentFormat" AS ENUM ('ONLINE', 'LAN');

CREATE TABLE "public"."Tournament" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(240) NOT NULL,
    "gameId" TEXT NOT NULL,
    "organizerId" TEXT,
    "circuit" VARCHAR(120),
    "format" "public"."TournamentFormat" NOT NULL DEFAULT 'ONLINE',
    "location" VARCHAR(200),
    "startOn" DATE NOT NULL,
    "endOn" DATE NOT NULL,
    "rulesUrl" VARCHAR(500),
    "entryFeeCents" INTEGER,
    "registrationDeadlineOn" DATE,
    "rosterDeadlineOn" DATE,
    "checkInOn" DATE,
    -- Called off or withdrawn: kept for the history, said apart.
    "isCancelled" BOOLEAN NOT NULL DEFAULT false,
    -- Name, circuit and place in the site's search form.
    "searchText" VARCHAR(700) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Tournament_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 120),
    CONSTRAINT "Tournament_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    CONSTRAINT "Tournament_circuit_check"
        CHECK ("circuit" IS NULL OR (
            "circuit" = btrim("circuit") AND char_length("circuit") >= 1
        )),
    -- A place only for a LAN.
    CONSTRAINT "Tournament_location_check"
        CHECK ("location" IS NULL OR (
            "format" = 'LAN'
            AND "location" = btrim("location") AND char_length("location") >= 1
        )),
    CONSTRAINT "Tournament_dates_check" CHECK ("endOn" >= "startOn"),
    CONSTRAINT "Tournament_rulesUrl_check"
        CHECK ("rulesUrl" IS NULL OR "rulesUrl" ~ '^https?://[^[:space:]]+$'),
    -- Per team, free or up to ten million euros.
    CONSTRAINT "Tournament_entryFeeCents_check"
        CHECK ("entryFeeCents" IS NULL OR "entryFeeCents" BETWEEN 0 AND 1000000000),
    -- The deadlines fall before the tournament ends.
    CONSTRAINT "Tournament_deadlines_check"
        CHECK (
            COALESCE("registrationDeadlineOn", "endOn") <= "endOn"
            AND COALESCE("rosterDeadlineOn", "endOn") <= "endOn"
            AND COALESCE("checkInOn", "endOn") <= "endOn"
        ),
    CONSTRAINT "Tournament_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "Tournament_startOn_idx" ON "public"."Tournament"("startOn" DESC);
CREATE INDEX "Tournament_gameId_idx" ON "public"."Tournament"("gameId");
CREATE INDEX "Tournament_organizerId_idx" ON "public"."Tournament"("organizerId");

-- A game or an organisation that has tournaments stays.
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_organizerId_fkey"
FOREIGN KEY ("organizerId") REFERENCES "public"."Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- One of our teams engaged in a tournament, with its final placement: one
-- place (« 1er ») or a shared range (« 3e–4e »).
CREATE TABLE "public"."TournamentEntry" (
    "id" TEXT NOT NULL,
    "tournamentId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "placementFrom" INTEGER,
    "placementTo" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentEntry_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TournamentEntry_placement_check"
        CHECK (
            ("placementFrom" IS NULL) = ("placementTo" IS NULL)
            AND COALESCE("placementFrom", 1) BETWEEN 1 AND 10000
            AND COALESCE("placementTo", 1) BETWEEN COALESCE("placementFrom", 1) AND 10000
        ),
    CONSTRAINT "TournamentEntry_version_check" CHECK ("version" >= 1)
);

CREATE UNIQUE INDEX "TournamentEntry_tournamentId_teamId_key"
ON "public"."TournamentEntry"("tournamentId", "teamId");
CREATE INDEX "TournamentEntry_teamId_idx" ON "public"."TournamentEntry"("teamId");

-- The entries leave with their tournament; a team that played stays.
ALTER TABLE "public"."TournamentEntry" ADD CONSTRAINT "TournamentEntry_tournamentId_fkey"
FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentEntry" ADD CONSTRAINT "TournamentEntry_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- A person of the Répertoire in the line-up of an engaged team. Their
-- function is read from the team's Roster at the tournament's dates; none
-- there: a stand-in.
CREATE TABLE "public"."TournamentLineupMember" (
    "id" TEXT NOT NULL,
    "entryId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentLineupMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TournamentLineupMember_entryId_personId_key"
ON "public"."TournamentLineupMember"("entryId", "personId");
CREATE INDEX "TournamentLineupMember_personId_idx"
ON "public"."TournamentLineupMember"("personId");

-- A record that played stays, as one that has passages.
ALTER TABLE "public"."TournamentLineupMember" ADD CONSTRAINT "TournamentLineupMember_entryId_fkey"
FOREIGN KEY ("entryId") REFERENCES "public"."TournamentEntry"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentLineupMember" ADD CONSTRAINT "TournamentLineupMember_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- A tournament's game is fixed at its creation, as a team's: its entries
-- are teams of that game, which the base checks too.
CREATE FUNCTION "public"."check_tournament_game"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."gameId" IS DISTINCT FROM NEW."gameId" THEN
        RAISE EXCEPTION 'A tournament keeps its game (Tournament_gameId_immutable)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "Tournament_gameId_immutable"
BEFORE UPDATE OF "gameId"
ON "public"."Tournament"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_tournament_game"();

CREATE FUNCTION "public"."check_tournament_entry_team"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "public"."Tournament" AS tournament
        JOIN "public"."Team" AS team ON team."gameId" = tournament."gameId"
        WHERE tournament."id" = NEW."tournamentId" AND team."id" = NEW."teamId"
    ) THEN
        RAISE EXCEPTION 'An engaged team plays the tournament''s game (TournamentEntry_team_game)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "TournamentEntry_team_check"
BEFORE INSERT OR UPDATE OF "tournamentId", "teamId"
ON "public"."TournamentEntry"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_tournament_entry_team"();

-- An operation may name the tournament it concerns (an entry fee, a gain, a
-- trip); a tournament that has operations stays.
ALTER TABLE "public"."FinancialOperation" ADD COLUMN "tournamentId" TEXT;

CREATE INDEX "FinancialOperation_tournamentId_idx"
ON "public"."FinancialOperation"("tournamentId");

ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_tournamentId_fkey"
FOREIGN KEY ("tournamentId") REFERENCES "public"."Tournament"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Money that stays in the structure names no tournament either.
ALTER TABLE "public"."FinancialOperation" DROP CONSTRAINT "FinancialOperation_transfer_check";
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_transfer_check"
    CHECK (
        "kind" <> 'TRANSFER' OR (
            "paymentMethodId" IS NULL
            AND "organizationId" IS NULL
            AND "personId" IS NULL
            AND "teamId" IS NULL
            AND "gameId" IS NULL
            AND "tournamentId" IS NULL
        )
    );

-- The tournament of an operation is one of its team's or game's.
CREATE FUNCTION "public"."check_financial_operation_tournament"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    tournament_game TEXT;
BEGIN
    IF NEW."tournamentId" IS NULL THEN
        RETURN NEW;
    END IF;
    SELECT "gameId" INTO tournament_game
    FROM "public"."Tournament" WHERE "id" = NEW."tournamentId";
    IF NEW."gameId" IS NOT NULL AND NEW."gameId" IS DISTINCT FROM tournament_game THEN
        RAISE EXCEPTION 'An operation''s tournament is of its game (FinancialOperation_tournament_game)'
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."teamId" IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM "public"."Team"
        WHERE "id" = NEW."teamId" AND "gameId" = tournament_game
    ) THEN
        RAISE EXCEPTION 'An operation''s tournament is of its team''s game (FinancialOperation_tournament_game)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "FinancialOperation_tournament_check"
BEFORE INSERT OR UPDATE OF "tournamentId", "teamId", "gameId"
ON "public"."FinancialOperation"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_financial_operation_tournament"();

ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_CREATE' AFTER 'TREASURY_CHOICE_REORDER';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_UPDATE' AFTER 'TOURNAMENT_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_DELETE' AFTER 'TOURNAMENT_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_ENTRY_CREATE' AFTER 'TOURNAMENT_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_ENTRY_UPDATE' AFTER 'TOURNAMENT_ENTRY_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TOURNAMENT_ENTRY_DELETE' AFTER 'TOURNAMENT_ENTRY_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'TOURNAMENT' AFTER 'TREASURY_CHOICE';
