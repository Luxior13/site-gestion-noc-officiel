-- 12 November 2026 (owner, « ok go »): two tournaments may share a name, an
-- edition telling them apart (« Saison 2 », « Split 1 », « 2027 »); within a
-- game, a name and its edition are never twice the same, so every tournament
-- can be recognised. One link to the tournament's page (registration, rules,
-- bracket) replaces the link to its rules.

ALTER TABLE "public"."Tournament"
    ADD COLUMN "edition" VARCHAR(40),
    -- The edition in the site's search form; empty without one.
    ADD COLUMN "normalizedEdition" VARCHAR(80) NOT NULL DEFAULT '';

ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_edition_check"
    CHECK ("edition" IS NULL OR (
        "edition" = btrim("edition") AND char_length("edition") BETWEEN 1 AND 40
    ));

ALTER TABLE "public"."Tournament" RENAME COLUMN "rulesUrl" TO "linkUrl";
ALTER TABLE "public"."Tournament" RENAME CONSTRAINT "Tournament_rulesUrl_check" TO "Tournament_linkUrl_check";

-- « Lyon e-Sport » once per game without edition, once per edition with one;
-- case and accents ignored.
CREATE UNIQUE INDEX "Tournament_gameId_normalizedName_normalizedEdition_key"
ON "public"."Tournament"("gameId", "normalizedName", "normalizedEdition");
