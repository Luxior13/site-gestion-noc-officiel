-- 9 November 2026: Bureau & staff, the roster of the structure (owner: « ok
-- go »). Its functions have no game; they are of two kinds: the board (elected
-- mandates: président, trésorier, secrétaire) and the staff (graphiste,
-- monteur, bénévole…). A game's functions keep « Joueur » and « Encadrement ».
-- Additive only: no existing row changes. The existing indexes serve the
-- structure too: a b-tree finds an empty `gameId` or `teamId`.

ALTER TYPE "public"."MemberFunctionKind" ADD VALUE 'BOARD' BEFORE 'PLAYER';

-- The board belongs to the structure, the players to a game; the staff to
-- both. Compared as text: a value added by this migration cannot be used as
-- an enum literal before it commits.
ALTER TABLE "public"."MemberFunction" ADD CONSTRAINT "MemberFunction_kind_scope_check"
    CHECK (
        ("gameId" IS NULL AND "kind"::text <> 'PLAYER')
        OR ("gameId" IS NOT NULL AND "kind"::text <> 'BOARD')
    );
