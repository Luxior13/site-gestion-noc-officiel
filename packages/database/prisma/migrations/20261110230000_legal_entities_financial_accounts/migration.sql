-- 10 November 2026: the legal entities of the structure (owner, « ok pour
-- moi ») and their financial accounts, first stones of the treasury. Additive
-- only: no existing row is touched.

-- The form an entity has in law. NONE is the period before the association
-- (« Sans forme juridique »): no identifier, no account, never principal.
CREATE TYPE "public"."LegalForm" AS ENUM (
    'NONE', 'ASSOCIATION', 'SAS', 'SASU', 'SARL', 'EURL', 'OTHER'
);

CREATE TABLE "public"."LegalEntity" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "normalizedName" VARCHAR(240) NOT NULL,
    "form" "public"."LegalForm" NOT NULL,
    "otherForm" VARCHAR(60),
    "startOn" DATE NOT NULL,
    "startPrecision" "public"."DatePrecision" NOT NULL DEFAULT 'DAY',
    "endOn" DATE,
    "endPrecision" "public"."DatePrecision",
    "rnaNumber" VARCHAR(10),
    "siretNumber" VARCHAR(14),
    "headOffice" VARCHAR(300),
    "isPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalEntity_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "LegalEntity_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 120),
    CONSTRAINT "LegalEntity_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    -- « Autre » carries the name of its form, and only it does.
    CONSTRAINT "LegalEntity_otherForm_check"
        CHECK (
            ("form" = 'OTHER') = ("otherForm" IS NOT NULL)
            AND ("otherForm" IS NULL OR (
                "otherForm" = btrim("otherForm")
                AND char_length("otherForm") >= 1
            ))
        ),
    -- A start sits at the start of its period, an end at its last day, as a
    -- passage's (registre historique).
    CONSTRAINT "LegalEntity_start_precision_check"
        CHECK (
            ("startPrecision" <> 'YEAR' OR (
                EXTRACT(MONTH FROM "startOn") = 1
                AND EXTRACT(DAY FROM "startOn") = 1
            ))
            AND ("startPrecision" <> 'MONTH'
                OR EXTRACT(DAY FROM "startOn") = 1)
        ),
    CONSTRAINT "LegalEntity_end_pair_check"
        CHECK (("endOn" IS NULL) = ("endPrecision" IS NULL)),
    CONSTRAINT "LegalEntity_end_precision_check"
        CHECK (
            "endOn" IS NULL OR (
                ("endPrecision" <> 'YEAR' OR (
                    EXTRACT(MONTH FROM "endOn") = 12
                    AND EXTRACT(DAY FROM "endOn") = 31
                ))
                AND ("endPrecision" <> 'MONTH'
                    OR EXTRACT(DAY FROM ("endOn" + 1)) = 1)
            )
        ),
    CONSTRAINT "LegalEntity_dates_check"
        CHECK ("endOn" IS NULL OR "endOn" >= "startOn"),
    -- RNA: W and nine digits; SIRET: fourteen digits.
    CONSTRAINT "LegalEntity_rnaNumber_check"
        CHECK ("rnaNumber" IS NULL OR "rnaNumber" ~ '^W[0-9]{9}$'),
    CONSTRAINT "LegalEntity_siretNumber_check"
        CHECK ("siretNumber" IS NULL OR "siretNumber" ~ '^[0-9]{14}$'),
    CONSTRAINT "LegalEntity_headOffice_check"
        CHECK ("headOffice" IS NULL OR (
            "headOffice" = btrim("headOffice")
            AND char_length("headOffice") >= 1
        )),
    -- The period before the association has neither identifier nor seat, and
    -- is never the principal entity.
    CONSTRAINT "LegalEntity_none_check"
        CHECK (
            "form" <> 'NONE' OR (
                "rnaNumber" IS NULL
                AND "siretNumber" IS NULL
                AND "headOffice" IS NULL
                AND NOT "isPrincipal"
            )
        ),
    CONSTRAINT "LegalEntity_version_check" CHECK ("version" >= 1)
);

CREATE UNIQUE INDEX "LegalEntity_normalizedName_key"
ON "public"."LegalEntity"("normalizedName");

-- One principal entity at most (cadrage, règle 3).
CREATE UNIQUE INDEX "LegalEntity_principal_key"
ON "public"."LegalEntity"("isPrincipal") WHERE "isPrincipal";

CREATE INDEX "LegalEntity_startOn_idx" ON "public"."LegalEntity"("startOn");

-- A bank account, an online account (PayPal, HelloAsso…) or a cash box.
CREATE TYPE "public"."FinancialAccountKind" AS ENUM ('BANK', 'ONLINE', 'CASH');

CREATE TABLE "public"."FinancialAccount" (
    "id" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "normalizedName" VARCHAR(160) NOT NULL,
    "kind" "public"."FinancialAccountKind" NOT NULL,
    "institution" VARCHAR(80),
    "openingOn" DATE NOT NULL,
    "openingBalanceCents" INTEGER NOT NULL,
    "closedOn" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "FinancialAccount_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 80),
    CONSTRAINT "FinancialAccount_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    -- A cash box has no bank behind it.
    CONSTRAINT "FinancialAccount_institution_check"
        CHECK (
            ("kind" <> 'CASH' OR "institution" IS NULL)
            AND ("institution" IS NULL OR (
                "institution" = btrim("institution")
                AND char_length("institution") >= 1
            ))
        ),
    -- Ten million euros either way; a cash box is never below zero.
    CONSTRAINT "FinancialAccount_openingBalance_check"
        CHECK (
            "openingBalanceCents" BETWEEN -1000000000 AND 1000000000
            AND ("kind" <> 'CASH' OR "openingBalanceCents" >= 0)
        ),
    CONSTRAINT "FinancialAccount_dates_check"
        CHECK ("closedOn" IS NULL OR "closedOn" >= "openingOn"),
    CONSTRAINT "FinancialAccount_version_check" CHECK ("version" >= 1)
);

-- Each entity may have its own « Compte courant », never two.
CREATE UNIQUE INDEX "FinancialAccount_entityId_normalizedName_key"
ON "public"."FinancialAccount"("entityId", "normalizedName");

-- An entity that has accounts cannot be deleted: its end date is set instead.
ALTER TABLE "public"."FinancialAccount" ADD CONSTRAINT "FinancialAccount_entityId_fkey"
FOREIGN KEY ("entityId") REFERENCES "public"."LegalEntity"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- An account keeps the entity that opened it (cadrage, règle 2), and only an
-- entity with a legal form holds one. The service checks both; the base
-- refuses them anyway.
CREATE FUNCTION "public"."check_financial_account_entity"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD."entityId" IS DISTINCT FROM NEW."entityId" THEN
        RAISE EXCEPTION 'An account keeps its entity (FinancialAccount_entityId_immutable)'
            USING ERRCODE = 'check_violation';
    END IF;
    IF EXISTS (
        SELECT 1 FROM "public"."LegalEntity"
        WHERE "id" = NEW."entityId" AND "form" = 'NONE'
    ) THEN
        RAISE EXCEPTION 'An entity without a legal form holds no account (FinancialAccount_entity_form)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "FinancialAccount_entity_check"
BEFORE INSERT OR UPDATE OF "entityId"
ON "public"."FinancialAccount"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_financial_account_entity"();

-- The reverse: an entity that holds accounts keeps a legal form.
CREATE FUNCTION "public"."check_legal_entity_form"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW."form" = 'NONE' AND EXISTS (
        SELECT 1 FROM "public"."FinancialAccount" WHERE "entityId" = NEW."id"
    ) THEN
        RAISE EXCEPTION 'An entity holding accounts keeps a legal form (LegalEntity_form_accounts)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "LegalEntity_form_check"
BEFORE UPDATE OF "form"
ON "public"."LegalEntity"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_legal_entity_form"();

-- Journal of entities and accounts; values are only added, never reordered.
ALTER TYPE "public"."AuditAction" ADD VALUE 'LEGAL_ENTITY_CREATE' AFTER 'PASSAGE_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'LEGAL_ENTITY_UPDATE' AFTER 'LEGAL_ENTITY_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'LEGAL_ENTITY_DELETE' AFTER 'LEGAL_ENTITY_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_ACCOUNT_CREATE' AFTER 'LEGAL_ENTITY_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_ACCOUNT_UPDATE' AFTER 'FINANCIAL_ACCOUNT_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_ACCOUNT_DELETE' AFTER 'FINANCIAL_ACCOUNT_UPDATE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'LEGAL_ENTITY' AFTER 'PASSAGE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'FINANCIAL_ACCOUNT' AFTER 'LEGAL_ENTITY';
