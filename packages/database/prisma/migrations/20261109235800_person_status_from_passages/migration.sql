-- 9 November 2026: whether a person is in the structure is computed from its
-- passages, never chosen nor stored (owner's decision of 7 November 2026,
-- built on 9 November: « fais 1 »). A record is in the structure when one of
-- its passages, in a team or in the structure, has begun and not ended.
-- The manual marker goes, with its three indexes and its type. The working
-- data hold only trials (owner, 9 November 2026); the journal keeps the past
-- changes of the marker, read under their former label.

DROP INDEX IF EXISTS "public"."Person_structureStatus_createdAt_id_idx";
DROP INDEX IF EXISTS "public"."Person_structureStatus_updatedAt_id_idx";
DROP INDEX IF EXISTS "public"."Person_structureStatus_sortName_id_idx";

ALTER TABLE "public"."Person" DROP COLUMN "structureStatus";

DROP TYPE "public"."PersonStructureStatus";
