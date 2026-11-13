-- 13 November 2026 (owner: « seulement les équipes suffisent… pour éviter
-- de remplir trop de choses inutilement et de mettre à jour tout le temps »,
-- then « ok go »): a tournament keeps its engaged teams and their placement,
-- no line-up any more. Who played reads in the team's Roster at the
-- tournament's dates, and on the public site. The line-ups and the roles
-- held in them leave; the journal keeps their past traces.

DROP TRIGGER IF EXISTS "TournamentLineupRole_function_check" ON "public"."TournamentLineupRole";
DROP FUNCTION IF EXISTS "public"."check_tournament_lineup_role"();
DROP TABLE IF EXISTS "public"."TournamentLineupRole";
DROP TABLE IF EXISTS "public"."TournamentLineupMember";
