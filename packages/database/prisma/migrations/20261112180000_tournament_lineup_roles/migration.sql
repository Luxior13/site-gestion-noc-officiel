-- 12 November 2026 (owner: « ceux qui sont dans l’équipe ont déjà un rôle,
-- il faudrait lui mettre celui-là, mais je dois pouvoir le changer au cas où
-- la personne change son rôle pour le tournoi », « ceux qui ont plusieurs
-- rôles dans l’équipe, coach, analyste… »): the roles a person of a line-up
-- holds in a tournament are kept, one or several functions of the
-- tournament's game, instead of being read from the Roster each time.

CREATE TABLE "public"."TournamentLineupRole" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "functionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentLineupRole_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TournamentLineupRole_memberId_functionId_key"
ON "public"."TournamentLineupRole"("memberId", "functionId");
CREATE INDEX "TournamentLineupRole_functionId_idx"
ON "public"."TournamentLineupRole"("functionId");

-- A role goes with its line-up; a function that served stays, as for a
-- passage.
ALTER TABLE "public"."TournamentLineupRole" ADD CONSTRAINT "TournamentLineupRole_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "public"."TournamentLineupMember"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TournamentLineupRole" ADD CONSTRAINT "TournamentLineupRole_functionId_fkey"
FOREIGN KEY ("functionId") REFERENCES "public"."MemberFunction"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- A role is a function of the tournament's game, never of another game nor
-- of the structure.
CREATE FUNCTION "public"."check_tournament_lineup_role"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM "public"."TournamentLineupMember" AS member
        JOIN "public"."TournamentEntry" AS entry ON entry."id" = member."entryId"
        JOIN "public"."Tournament" AS tournament ON tournament."id" = entry."tournamentId"
        JOIN "public"."MemberFunction" AS fn ON fn."gameId" = tournament."gameId"
        WHERE member."id" = NEW."memberId" AND fn."id" = NEW."functionId"
    ) THEN
        RAISE EXCEPTION 'A role is a function of the tournament''s game (TournamentLineupRole_function_game)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "TournamentLineupRole_function_check"
BEFORE INSERT OR UPDATE OF "memberId", "functionId"
ON "public"."TournamentLineupRole"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_tournament_lineup_role"();

-- The line-ups already kept take the functions held in the team's Roster
-- during the tournament, as they showed until now: its days, its whole
-- month when only the month is known, today without a date. A stand-in
-- keeps no role: its role is chosen at the next change.
INSERT INTO "public"."TournamentLineupRole" ("id", "memberId", "functionId")
SELECT DISTINCT ON (member."id", passage."functionId")
    'role_' || md5(member."id" || ':' || passage."functionId"),
    member."id",
    passage."functionId"
FROM "public"."TournamentLineupMember" AS member
JOIN "public"."TournamentEntry" AS entry ON entry."id" = member."entryId"
JOIN "public"."Tournament" AS tournament ON tournament."id" = entry."tournamentId"
CROSS JOIN LATERAL (
    SELECT
        COALESCE(tournament."startOn", CURRENT_DATE) AS from_day,
        CASE
            WHEN tournament."startOn" IS NULL THEN CURRENT_DATE
            WHEN tournament."datePrecision" = 'MONTH'
                THEN (date_trunc('month', tournament."startOn") + INTERVAL '1 month - 1 day')::date
            ELSE COALESCE(tournament."endOn", tournament."startOn")
        END AS to_day
) AS period
JOIN "public"."PersonPassage" AS passage
    ON passage."teamId" = entry."teamId"
    AND passage."personId" = member."personId"
    AND passage."startOn" <= period.to_day
    AND (passage."endOn" IS NULL OR passage."endOn" >= period.from_day);
