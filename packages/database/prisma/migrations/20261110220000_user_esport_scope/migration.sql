-- 10 November 2026: which games and teams an account reaches in the Esport
-- pole (owner: « c'est l'utilisateur et ses autorisations qui font, pas un
-- rôle dans une équipe »). Every game, chosen games (their teams, future ones
-- included) or chosen teams, set in the account's authorizations. A function
-- held in a roster never opens anything.

CREATE TYPE "public"."EsportScope" AS ENUM ('ALL', 'GAMES', 'TEAMS');

ALTER TABLE "public"."User"
ADD COLUMN "esportScope" "public"."EsportScope" NOT NULL DEFAULT 'ALL';

-- An administrator holds every administrative access by role, the root
-- included: they always see every game.
ALTER TABLE "public"."User"
ADD CONSTRAINT "User_esportScope_admin_check"
CHECK ("role" <> 'ADMIN' OR "esportScope" = 'ALL');

-- A game or a team chosen in a scope, exactly one of the two. The scope's
-- kind says which rows count; an empty list opens nothing, never everything.
CREATE TABLE "public"."UserEsportScopeItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gameId" TEXT,
    "teamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserEsportScopeItem_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserEsportScopeItem_target_check"
    CHECK (num_nonnulls("gameId", "teamId") = 1)
);

CREATE UNIQUE INDEX "UserEsportScopeItem_userId_gameId_key"
ON "public"."UserEsportScopeItem"("userId", "gameId");

CREATE UNIQUE INDEX "UserEsportScopeItem_userId_teamId_key"
ON "public"."UserEsportScopeItem"("userId", "teamId");

CREATE INDEX "UserEsportScopeItem_gameId_idx"
ON "public"."UserEsportScopeItem"("gameId");

CREATE INDEX "UserEsportScopeItem_teamId_idx"
ON "public"."UserEsportScopeItem"("teamId");

ALTER TABLE "public"."UserEsportScopeItem"
ADD CONSTRAINT "UserEsportScopeItem_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- A game or a team deleted (only one never used can be) leaves the scopes
-- that named it; a scope left empty opens nothing.
ALTER TABLE "public"."UserEsportScopeItem"
ADD CONSTRAINT "UserEsportScopeItem_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."UserEsportScopeItem"
ADD CONSTRAINT "UserEsportScopeItem_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
