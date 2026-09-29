-- =============================================================================
-- Guest audit vocabulary (§8, §33)
-- -----------------------------------------------------------------------------
-- The audit trail must describe what actually happened. A visitor working from
-- the catalogue is not a signed-in user, so their session lifecycle gets its own
-- append-only vocabulary instead of being recorded under a misleading action.
-- =============================================================================

ALTER TYPE "legal_platform"."AuditAction" ADD VALUE IF NOT EXISTS 'GUEST_SESSION_CREATED';
ALTER TYPE "legal_platform"."AuditAction" ADD VALUE IF NOT EXISTS 'GUEST_SESSION_CONVERTED';
ALTER TYPE "legal_platform"."AuditAction" ADD VALUE IF NOT EXISTS 'GUEST_SESSION_EXPIRED';
ALTER TYPE "legal_platform"."AuditAction" ADD VALUE IF NOT EXISTS 'SERVICE_OFFER_SELECTED';
