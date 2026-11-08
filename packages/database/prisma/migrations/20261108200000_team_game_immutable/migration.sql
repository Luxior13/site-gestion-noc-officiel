-- 8 November 2026: a team keeps the game it was created for (owner: « le jeu
-- ne doit pas être modifiable une fois l'équipe créée »). Its roster will use
-- the functions of that game; another game means another team. The service
-- never sends a new game; the base refuses one anyway.

CREATE FUNCTION "public"."prevent_team_game_change"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."gameId" IS DISTINCT FROM NEW."gameId" THEN
        RAISE EXCEPTION 'A team keeps its game (Team_gameId_immutable)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "Team_gameId_immutable"
BEFORE UPDATE OF "gameId"
ON "public"."Team"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_team_game_change"();
