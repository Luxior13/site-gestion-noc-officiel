-- 10 November 2026: the person record is completed (owner: « fais la 2B
-- d'abord et la nationalité »). A nationality on the identity; emergency
-- contacts and legal representatives with the coordinates. A representative
-- is another record of the Répertoire, linked explicitly (cadrage of
-- 7 November 2026), never a copy of their name and number.

ALTER TABLE "public"."Person"
ADD COLUMN "nationality" VARCHAR(2),
ADD CONSTRAINT "Person_nationality_check"
CHECK ("nationality" IS NULL OR "nationality" ~ '^[A-Z]{2}$');

-- Who to call in an emergency: a name, an optional link, a valid number.
CREATE TABLE "public"."PersonEmergencyContact" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "relation" VARCHAR(40),
    "phone" VARCHAR(40) NOT NULL,
    "normalizedPhone" VARCHAR(16) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonEmergencyContact_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PersonEmergencyContact_version_check" CHECK ("version" >= 1),
    CONSTRAINT "PersonEmergencyContact_values_check" CHECK (
        "name" = btrim("name") AND "name" <> ''
        AND ("relation" IS NULL OR ("relation" = btrim("relation") AND "relation" <> ''))
        AND "phone" = btrim("phone") AND "phone" <> ''
        AND "normalizedPhone" ~ '^\+[1-9][0-9]{1,14}$'
    )
);

CREATE INDEX "PersonEmergencyContact_personId_idx"
ON "public"."PersonEmergencyContact"("personId");

ALTER TABLE "public"."PersonEmergencyContact"
ADD CONSTRAINT "PersonEmergencyContact_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- Kept on its person, as the emails, phones and profiles.
CREATE TRIGGER "PersonEmergencyContact_prevent_person_reassignment"
BEFORE UPDATE OF "personId"
ON "public"."PersonEmergencyContact"
FOR EACH ROW
EXECUTE FUNCTION "prevent_person_coordinate_reassignment"();

-- A legal representative: another record, linked with its relation.
CREATE TYPE "public"."LegalGuardianRelation" AS ENUM ('PARENT', 'TUTOR', 'OTHER');

CREATE TABLE "public"."PersonLegalGuardian" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "relation" "public"."LegalGuardianRelation" NOT NULL DEFAULT 'PARENT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PersonLegalGuardian_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "PersonLegalGuardian_version_check" CHECK ("version" >= 1),
    CONSTRAINT "PersonLegalGuardian_not_self_check" CHECK ("personId" <> "guardianId")
);

CREATE UNIQUE INDEX "PersonLegalGuardian_personId_guardianId_key"
ON "public"."PersonLegalGuardian"("personId", "guardianId");

CREATE INDEX "PersonLegalGuardian_guardianId_idx"
ON "public"."PersonLegalGuardian"("guardianId");

-- The link goes with the represented person; the representative's record
-- stays while it represents someone.
ALTER TABLE "public"."PersonLegalGuardian"
ADD CONSTRAINT "PersonLegalGuardian_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."PersonLegalGuardian"
ADD CONSTRAINT "PersonLegalGuardian_guardianId_fkey"
FOREIGN KEY ("guardianId") REFERENCES "public"."Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Both ends stay fixed: another representative is another link, and the
-- journal reads each link from its creation to its removal.
CREATE FUNCTION "public"."prevent_person_guardian_reassignment"()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    IF NEW."personId" IS DISTINCT FROM OLD."personId"
        OR NEW."guardianId" IS DISTINCT FROM OLD."guardianId" THEN
        RAISE EXCEPTION 'A legal representative link cannot be moved'
            USING
                ERRCODE = '23514',
                CONSTRAINT = 'PersonLegalGuardian_ends_immutable';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "PersonLegalGuardian_prevent_reassignment"
BEFORE UPDATE OF "personId", "guardianId"
ON "public"."PersonLegalGuardian"
FOR EACH ROW
EXECUTE FUNCTION "public"."prevent_person_guardian_reassignment"();
