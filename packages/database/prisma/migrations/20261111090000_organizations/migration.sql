-- 11 November 2026: the organisations the structure deals with (owner,
-- « oui go »): one list for sponsors, partners, suppliers, clients,
-- tournament organisers and public funders, an organisation holding several
-- kinds at once, and the people to reach there. Additive only: no existing
-- row is touched.

-- What an organisation is to the structure; several at once, never twice.
CREATE TYPE "public"."OrganizationKind" AS ENUM (
    'SPONSOR', 'PARTNER', 'SUPPLIER', 'CLIENT', 'ORGANIZER', 'FUNDER'
);

-- One kind at least, each once.
CREATE FUNCTION "public"."organization_kinds_are_valid"(
    "kinds" "public"."OrganizationKind"[]
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT cardinality($1) BETWEEN 1 AND 6
        AND cardinality($1) = (SELECT count(DISTINCT "kind") FROM unnest($1) AS "kind")
$$;

CREATE TABLE "public"."Organization" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(240) NOT NULL,
    "kinds" "public"."OrganizationKind"[] NOT NULL,
    "website" VARCHAR(200),
    "siretNumber" VARCHAR(14),
    "address" VARCHAR(300),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Organization_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 120),
    CONSTRAINT "Organization_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    CONSTRAINT "Organization_kinds_check"
        CHECK ("public"."organization_kinds_are_valid"("kinds")),
    CONSTRAINT "Organization_website_check"
        CHECK ("website" IS NULL OR "website" ~ '^https?://[^[:space:]]+$'),
    CONSTRAINT "Organization_siretNumber_check"
        CHECK ("siretNumber" IS NULL OR "siretNumber" ~ '^[0-9]{14}$'),
    CONSTRAINT "Organization_address_check"
        CHECK ("address" IS NULL OR (
            "address" = btrim("address")
            AND char_length("address") >= 1
        )),
    CONSTRAINT "Organization_version_check" CHECK ("version" >= 1)
);

-- One record per organisation: a sponsor that also supplies keeps one.
CREATE UNIQUE INDEX "Organization_normalizedName_key"
ON "public"."Organization"("normalizedName");

-- A person to reach at an organisation. Linked to a record of the Répertoire
-- only when the person already has one; the name is then the record's, kept
-- here for who cannot read the Répertoire and after the record is deleted.
CREATE TABLE "public"."OrganizationContact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "personId" TEXT,
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(80),
    "email" VARCHAR(254),
    "phone" VARCHAR(16),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationContact_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OrganizationContact_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 100),
    CONSTRAINT "OrganizationContact_role_check"
        CHECK ("role" IS NULL OR (
            "role" = btrim("role")
            AND char_length("role") >= 1
        )),
    -- Stored in lower case, as the other emails of the site.
    CONSTRAINT "OrganizationContact_email_check"
        CHECK ("email" IS NULL OR (
            "email" = lower("email")
            AND "email" ~ '^[^@[:space:]]+@[^@[:space:]]+$'
        )),
    -- International form, « +33612345678 ».
    CONSTRAINT "OrganizationContact_phone_check"
        CHECK ("phone" IS NULL OR "phone" ~ '^\+[1-9][0-9]{6,14}$'),
    CONSTRAINT "OrganizationContact_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "OrganizationContact_organizationId_idx"
ON "public"."OrganizationContact"("organizationId");

-- A record of the Répertoire is one contact of an organisation, never two.
CREATE UNIQUE INDEX "OrganizationContact_organizationId_personId_key"
ON "public"."OrganizationContact"("organizationId", "personId")
WHERE "personId" IS NOT NULL;

CREATE INDEX "OrganizationContact_personId_idx"
ON "public"."OrganizationContact"("personId");

-- The contacts leave with their organisation.
ALTER TABLE "public"."OrganizationContact" ADD CONSTRAINT "OrganizationContact_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

-- A deleted record of the Répertoire leaves the contact with its name.
ALTER TABLE "public"."OrganizationContact" ADD CONSTRAINT "OrganizationContact_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_CREATE' AFTER 'FINANCIAL_ACCOUNT_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_UPDATE' AFTER 'ORGANIZATION_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_DELETE' AFTER 'ORGANIZATION_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_CONTACT_CREATE' AFTER 'ORGANIZATION_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_CONTACT_UPDATE' AFTER 'ORGANIZATION_CONTACT_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'ORGANIZATION_CONTACT_DELETE' AFTER 'ORGANIZATION_CONTACT_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'ORGANIZATION' AFTER 'FINANCIAL_ACCOUNT';
