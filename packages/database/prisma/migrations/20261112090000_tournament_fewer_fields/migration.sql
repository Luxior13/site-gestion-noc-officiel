-- 12 November 2026: a tournament asks only what helps prepare it (owner,
-- « ok go »): the public site keeps the rest. Its dates become optional,
-- known to the day or only to the month (« mars 2027 »); the circuit, the
-- roster deadline and the check-in leave. « Annulé » stays as an action of
-- the record, for a tournament whose fee was paid.

ALTER TABLE "public"."Tournament" DROP CONSTRAINT "Tournament_dates_check";
ALTER TABLE "public"."Tournament" DROP CONSTRAINT "Tournament_deadlines_check";
ALTER TABLE "public"."Tournament" DROP CONSTRAINT "Tournament_circuit_check";

ALTER TABLE "public"."Tournament"
    DROP COLUMN "circuit",
    DROP COLUMN "rosterDeadlineOn",
    DROP COLUMN "checkInOn",
    ALTER COLUMN "startOn" DROP NOT NULL,
    ALTER COLUMN "endOn" DROP NOT NULL,
    ADD COLUMN "datePrecision" "public"."DatePrecision" NOT NULL DEFAULT 'DAY';

-- Known to the day, a last day may follow; known to the month, the date is
-- the first day of that month, without a last day; unknown, neither.
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_dates_check"
    CHECK (
        "datePrecision" IN ('DAY', 'MONTH')
        AND ("startOn" IS NOT NULL OR "endOn" IS NULL)
        AND ("endOn" IS NULL OR ("datePrecision" = 'DAY' AND "endOn" >= "startOn"))
        AND ("datePrecision" = 'DAY' OR EXTRACT(DAY FROM "startOn") = 1)
    );

-- The registration closes before the tournament ends, when that is known:
-- its last day, its first day, or the last day of its month.
ALTER TABLE "public"."Tournament" ADD CONSTRAINT "Tournament_deadlines_check"
    CHECK (
        "registrationDeadlineOn" IS NULL
        OR "registrationDeadlineOn" <= COALESCE(
            "endOn",
            CASE
                WHEN "datePrecision" = 'MONTH'
                    THEN ("startOn" + INTERVAL '1 month' - INTERVAL '1 day')::date
                ELSE "startOn"
            END,
            "registrationDeadlineOn"
        )
    );

-- Undated tournaments first: they are to be scheduled.
DROP INDEX "public"."Tournament_startOn_idx";
CREATE INDEX "Tournament_startOn_idx"
ON "public"."Tournament"("startOn" DESC NULLS FIRST);
