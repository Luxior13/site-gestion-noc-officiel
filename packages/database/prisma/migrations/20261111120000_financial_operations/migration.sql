-- 11 November 2026: the operations of the treasury (owner, « ok go »): money
-- received, money paid and transfers between two accounts of the structure,
-- each with its category and, if wanted, its payment method, the organisation
-- or the record of the Répertoire that paid or was paid, and the team or game
-- it concerns. The categories and payment methods are lists kept on the site.
-- Additive only: no existing row is touched.

-- A value of a list of the treasury: a category of money received, of money
-- paid, or a payment method.
CREATE TYPE "public"."TreasuryChoiceKind" AS ENUM (
    'INCOME_CATEGORY', 'EXPENSE_CATEGORY', 'PAYMENT_METHOD'
);

CREATE TABLE "public"."TreasuryChoice" (
    "id" TEXT NOT NULL,
    "kind" "public"."TreasuryChoiceKind" NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryChoice_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "TreasuryChoice_name_check"
        CHECK ("name" = btrim("name") AND char_length("name") BETWEEN 1 AND 60),
    CONSTRAINT "TreasuryChoice_normalizedName_check"
        CHECK (char_length("normalizedName") >= 1),
    CONSTRAINT "TreasuryChoice_position_check" CHECK ("position" >= 0),
    CONSTRAINT "TreasuryChoice_version_check" CHECK ("version" >= 1)
);

-- One « Matériel » among the categories of money paid, never two.
CREATE UNIQUE INDEX "TreasuryChoice_kind_normalizedName_key"
ON "public"."TreasuryChoice"("kind", "normalizedName");

CREATE INDEX "TreasuryChoice_kind_position_idx"
ON "public"."TreasuryChoice"("kind", "position");

CREATE TYPE "public"."FinancialOperationKind" AS ENUM (
    'INCOME', 'EXPENSE', 'TRANSFER'
);

CREATE TABLE "public"."FinancialOperation" (
    "id" TEXT NOT NULL,
    "kind" "public"."FinancialOperationKind" NOT NULL,
    "occurredOn" DATE NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "toAccountId" TEXT,
    "label" VARCHAR(120),
    "categoryId" TEXT,
    "paymentMethodId" TEXT,
    "organizationId" TEXT,
    "personId" TEXT,
    "teamId" TEXT,
    "gameId" TEXT,
    "note" VARCHAR(500),
    -- Label and note in the site's search form (accents and case ignored).
    "searchText" VARCHAR(700) NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialOperation_pkey" PRIMARY KEY ("id"),
    -- Always positive: the kind gives the sign. Ten million euros at most.
    CONSTRAINT "FinancialOperation_amountCents_check"
        CHECK ("amountCents" BETWEEN 1 AND 1000000000),
    CONSTRAINT "FinancialOperation_label_check"
        CHECK ("label" IS NULL OR (
            "label" = btrim("label") AND char_length("label") >= 1
        )),
    CONSTRAINT "FinancialOperation_note_check"
        CHECK ("note" IS NULL OR (
            "note" = btrim("note") AND char_length("note") >= 1
        )),
    -- A transfer goes to another account, without label nor category; money
    -- received or paid has both, and no second account.
    CONSTRAINT "FinancialOperation_kind_check"
        CHECK (
            ("kind" = 'TRANSFER') = ("toAccountId" IS NOT NULL)
            AND ("kind" = 'TRANSFER') = ("label" IS NULL)
            AND ("kind" = 'TRANSFER') = ("categoryId" IS NULL)
        ),
    -- Money that stays in the structure has no payer, payee nor team.
    CONSTRAINT "FinancialOperation_transfer_check"
        CHECK (
            "kind" <> 'TRANSFER' OR (
                "paymentMethodId" IS NULL
                AND "organizationId" IS NULL
                AND "personId" IS NULL
                AND "teamId" IS NULL
                AND "gameId" IS NULL
            )
        ),
    CONSTRAINT "FinancialOperation_accounts_check"
        CHECK ("toAccountId" IS NULL OR "toAccountId" <> "accountId"),
    -- One payer or payee at most, an organisation or a record.
    CONSTRAINT "FinancialOperation_counterparty_check"
        CHECK (num_nonnulls("organizationId", "personId") <= 1),
    -- A team, or a whole game, at most.
    CONSTRAINT "FinancialOperation_assignment_check"
        CHECK (num_nonnulls("teamId", "gameId") <= 1),
    CONSTRAINT "FinancialOperation_version_check" CHECK ("version" >= 1)
);

CREATE INDEX "FinancialOperation_occurredOn_createdAt_idx"
ON "public"."FinancialOperation"("occurredOn" DESC, "createdAt" DESC);
CREATE INDEX "FinancialOperation_accountId_idx"
ON "public"."FinancialOperation"("accountId");
CREATE INDEX "FinancialOperation_toAccountId_idx"
ON "public"."FinancialOperation"("toAccountId");
CREATE INDEX "FinancialOperation_categoryId_idx"
ON "public"."FinancialOperation"("categoryId");
CREATE INDEX "FinancialOperation_paymentMethodId_idx"
ON "public"."FinancialOperation"("paymentMethodId");
CREATE INDEX "FinancialOperation_organizationId_idx"
ON "public"."FinancialOperation"("organizationId");
CREATE INDEX "FinancialOperation_personId_idx"
ON "public"."FinancialOperation"("personId");
CREATE INDEX "FinancialOperation_teamId_idx"
ON "public"."FinancialOperation"("teamId");
CREATE INDEX "FinancialOperation_gameId_idx"
ON "public"."FinancialOperation"("gameId");

-- What an operation names stays: an account, a value of a list, an
-- organisation, a record, a team or a game that has operations is kept.
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_accountId_fkey"
FOREIGN KEY ("accountId") REFERENCES "public"."FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_toAccountId_fkey"
FOREIGN KEY ("toAccountId") REFERENCES "public"."FinancialAccount"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "public"."TreasuryChoice"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_paymentMethodId_fkey"
FOREIGN KEY ("paymentMethodId") REFERENCES "public"."TreasuryChoice"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "public"."Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_personId_fkey"
FOREIGN KEY ("personId") REFERENCES "public"."Person"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."FinancialOperation" ADD CONSTRAINT "FinancialOperation_gameId_fkey"
FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- An operation falls within the period of its accounts; a transfer stays in
-- one entity; a category matches the kind of the operation and a payment
-- method is one. The service checks all of it; the base refuses it anyway.
CREATE FUNCTION "public"."check_financial_operation"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    source RECORD;
    target RECORD;
    choice "public"."TreasuryChoiceKind";
BEGIN
    SELECT "entityId", "openingOn", "closedOn" INTO source
    FROM "public"."FinancialAccount" WHERE "id" = NEW."accountId";
    IF FOUND AND (NEW."occurredOn" < source."openingOn"
        OR NEW."occurredOn" > COALESCE(source."closedOn", NEW."occurredOn")) THEN
        RAISE EXCEPTION 'An operation falls within its account''s period (FinancialOperation_account_period)'
            USING ERRCODE = 'check_violation';
    END IF;
    IF NEW."toAccountId" IS NOT NULL THEN
        SELECT "entityId", "openingOn", "closedOn" INTO target
        FROM "public"."FinancialAccount" WHERE "id" = NEW."toAccountId";
        IF FOUND AND (NEW."occurredOn" < target."openingOn"
            OR NEW."occurredOn" > COALESCE(target."closedOn", NEW."occurredOn")) THEN
            RAISE EXCEPTION 'A transfer falls within its second account''s period (FinancialOperation_account_period)'
                USING ERRCODE = 'check_violation';
        END IF;
        IF FOUND AND source."entityId" IS DISTINCT FROM target."entityId" THEN
            RAISE EXCEPTION 'A transfer links two accounts of one entity (FinancialOperation_transfer_entity)'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    IF NEW."categoryId" IS NOT NULL THEN
        SELECT "kind" INTO choice FROM "public"."TreasuryChoice"
        WHERE "id" = NEW."categoryId";
        IF FOUND AND choice IS DISTINCT FROM (CASE NEW."kind"
            WHEN 'INCOME' THEN 'INCOME_CATEGORY'
            ELSE 'EXPENSE_CATEGORY'
        END)::"public"."TreasuryChoiceKind" THEN
            RAISE EXCEPTION 'A category matches the kind of its operation (FinancialOperation_category_kind)'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;
    IF NEW."paymentMethodId" IS NOT NULL THEN
        SELECT "kind" INTO choice FROM "public"."TreasuryChoice"
        WHERE "id" = NEW."paymentMethodId";
        IF FOUND AND choice <> 'PAYMENT_METHOD' THEN
            RAISE EXCEPTION 'A payment method is one (FinancialOperation_payment_method_kind)'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "FinancialOperation_check"
BEFORE INSERT OR UPDATE
ON "public"."FinancialOperation"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_financial_operation"();

-- A value of a list keeps its kind once an operation uses it: a category of
-- money paid never becomes one of money received under its operations.
CREATE FUNCTION "public"."check_treasury_choice_kind"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD."kind" IS DISTINCT FROM NEW."kind" AND EXISTS (
        SELECT 1 FROM "public"."FinancialOperation"
        WHERE "categoryId" = NEW."id" OR "paymentMethodId" = NEW."id"
    ) THEN
        RAISE EXCEPTION 'A used value keeps its kind (TreasuryChoice_kind_used)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "TreasuryChoice_kind_check"
BEFORE UPDATE OF "kind"
ON "public"."TreasuryChoice"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_treasury_choice_kind"();

-- An account's period keeps covering its operations: its opening day never
-- moves after one, its closing day never before one.
CREATE FUNCTION "public"."check_financial_account_operations"()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "public"."FinancialOperation"
        WHERE ("accountId" = NEW."id" OR "toAccountId" = NEW."id")
          AND ("occurredOn" < NEW."openingOn"
            OR "occurredOn" > COALESCE(NEW."closedOn", "occurredOn"))
    ) THEN
        RAISE EXCEPTION 'An account''s period covers its operations (FinancialAccount_operations_period)'
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "FinancialAccount_operations_check"
BEFORE UPDATE OF "openingOn", "closedOn"
ON "public"."FinancialAccount"
FOR EACH ROW
EXECUTE FUNCTION "public"."check_financial_account_operations"();

ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_OPERATION_CREATE' AFTER 'ORGANIZATION_CONTACT_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_OPERATION_UPDATE' AFTER 'FINANCIAL_OPERATION_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'FINANCIAL_OPERATION_DELETE' AFTER 'FINANCIAL_OPERATION_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TREASURY_CHOICE_CREATE' AFTER 'FINANCIAL_OPERATION_DELETE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TREASURY_CHOICE_UPDATE' AFTER 'TREASURY_CHOICE_CREATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TREASURY_CHOICE_DELETE' AFTER 'TREASURY_CHOICE_UPDATE';
ALTER TYPE "public"."AuditAction" ADD VALUE 'TREASURY_CHOICE_REORDER' AFTER 'TREASURY_CHOICE_DELETE';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'FINANCIAL_OPERATION' AFTER 'ORGANIZATION';
ALTER TYPE "public"."AuditCategory" ADD VALUE 'TREASURY_CHOICE' AFTER 'FINANCIAL_OPERATION';
