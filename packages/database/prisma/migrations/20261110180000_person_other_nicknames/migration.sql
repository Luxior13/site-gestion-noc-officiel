-- 10 November 2026: the other pseudos of a person (owner: « ok go »), a
-- former one, a second account, a name in a game. The Répertoire's search
-- finds a record by them, to recognize someone who changed names, for
-- instance someone banned who comes back under another pseudo.

CREATE TABLE "public"."PersonOtherNickname" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "nickname" VARCHAR(80) NOT NULL,
    "normalizedNickname" VARCHAR(160) NOT NULL,
    "note" VARCHAR(40),
    "untilOn" DATE,
    "untilPrecision" "public"."DatePrecision",
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonOtherNickname_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PersonOtherNickname_version_check" CHECK ("version" >= 1),
    CONSTRAINT "PersonOtherNickname_values_check" CHECK (
        "nickname" = btrim("nickname") AND "nickname" <> ''
        AND "normalizedNickname" <> ''
        AND ("note" IS NULL OR ("note" = btrim("note") AND "note" <> ''))
        AND (("untilOn" IS NULL) = ("untilPrecision" IS NULL))
    )
);

CREATE UNIQUE INDEX "PersonOtherNickname_personId_normalizedNickname_key"
ON "public"."PersonOtherNickname"("personId", "normalizedNickname");

-- The same two search indexes as the main pseudo of `Person`.
CREATE INDEX "PersonOtherNickname_normalizedNickname_trgm_idx"
ON "public"."PersonOtherNickname" USING GIN ("normalizedNickname" gin_trgm_ops);

CREATE INDEX "PersonOtherNickname_normalizedNickname_prefix_idx"
ON "public"."PersonOtherNickname"("normalizedNickname" varchar_pattern_ops);

ALTER TABLE "public"."PersonOtherNickname"
ADD CONSTRAINT "PersonOtherNickname_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Kept on its person, as the coordinates.
CREATE TRIGGER "PersonOtherNickname_prevent_person_reassignment"
BEFORE UPDATE OF "personId"
ON "public"."PersonOtherNickname"
FOR EACH ROW
EXECUTE FUNCTION "prevent_person_coordinate_reassignment"();
