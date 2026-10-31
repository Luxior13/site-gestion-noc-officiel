-- 31 October 2026: the retention cleanup now leaves one « Journal purgé »
-- event when it deletes journal events, instead of deleting them silently.
-- Additive value only; existing events and their classification are unchanged.
ALTER TYPE "public"."AuditAction" ADD VALUE 'AUDIT_PURGE' AFTER 'AUDIT_VIEW';
