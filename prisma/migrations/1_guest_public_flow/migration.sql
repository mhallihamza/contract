-- =============================================================================
-- Guest-first public flow (§8, §14, §26, §37)
-- -----------------------------------------------------------------------------
-- The platform is catalogue-first: a visitor must be able to browse documents,
-- answer the questionnaire, see the preview and pay **without creating an
-- account**. Until now every case was owned by a `User`, which forced a signup
-- before the questionnaire. This migration introduces the anonymous owner:
--
--   • GuestSession        — token-hashed intake session (raw token is never stored)
--   • ContractType.slug   — stable public URL segment (/contracts/<slug>)
--   • Contract            — clientId becomes optional; guestSessionId + customerEmail
--   • ContractDocument    — ownerId optional (documents of a guest case)
--   • Payment             — userId optional (a guest pays for their own case)
--   • LawyerRequest       — clientId optional (a guest case can require a lawyer)
--
-- Nothing is dropped: existing rows keep their owner and simply gain NULLs in the
-- new columns. `slug` is backfilled deterministically before being made NOT NULL.
-- =============================================================================

-- ── GuestSession ────────────────────────────────────────────────────────────
CREATE TABLE "legal_platform"."GuestSession" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "contractTypeId" UUID,
    "locale" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "email" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "convertedUserId" UUID,
    "revokedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestSession_tokenHash_key" ON "legal_platform"."GuestSession"("tokenHash");
CREATE INDEX "GuestSession_expiresAt_idx" ON "legal_platform"."GuestSession"("expiresAt");
CREATE INDEX "GuestSession_email_idx" ON "legal_platform"."GuestSession"("email");

-- ── ContractType.slug (nullable → backfilled → NOT NULL → unique) ───────────
ALTER TABLE "legal_platform"."ContractType" ADD COLUMN "slug" TEXT;

UPDATE "legal_platform"."ContractType"
SET "slug" = CASE "code"
    WHEN 'RESIDENTIAL_LEASE' THEN 'contrat-location-habitation'
    WHEN 'FREELANCE_SERVICE' THEN 'contrat-prestation-services'
    WHEN 'NDA'               THEN 'accord-confidentialite-nda'
    WHEN 'COMMERCIAL_LEASE'  THEN 'bail-commercial'
    WHEN 'VEHICLE_SALE'      THEN 'contrat-vente-vehicule'
    WHEN 'EMPLOYMENT_CDD'    THEN 'contrat-travail-cdd'
    WHEN 'REAL_ESTATE_SALE'  THEN 'compromis-vente-immobiliere'
    ELSE regexp_replace(lower("code"), '[^a-z0-9]+', '-', 'g')
END;

-- Any row that would still collide falls back to its own code, lowercased.
UPDATE "legal_platform"."ContractType"
SET "slug" = regexp_replace(lower("code"), '[^a-z0-9]+', '-', 'g')
WHERE "slug" IS NULL OR "slug" = '';

ALTER TABLE "legal_platform"."ContractType" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "ContractType_slug_key" ON "legal_platform"."ContractType"("slug");

-- ── Contract: anonymous owner ───────────────────────────────────────────────
ALTER TABLE "legal_platform"."Contract"
    ADD COLUMN "guestSessionId" UUID,
    ADD COLUMN "customerEmail" TEXT,
    ALTER COLUMN "clientId" DROP NOT NULL;

CREATE UNIQUE INDEX "Contract_guestSessionId_key" ON "legal_platform"."Contract"("guestSessionId");
CREATE INDEX "Contract_customerEmail_idx" ON "legal_platform"."Contract"("customerEmail");

ALTER TABLE "legal_platform"."Contract"
    ADD CONSTRAINT "Contract_guestSessionId_fkey"
    FOREIGN KEY ("guestSessionId") REFERENCES "legal_platform"."GuestSession"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_platform"."GuestSession"
    ADD CONSTRAINT "GuestSession_contractTypeId_fkey"
    FOREIGN KEY ("contractTypeId") REFERENCES "legal_platform"."ContractType"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_platform"."GuestSession"
    ADD CONSTRAINT "GuestSession_convertedUserId_fkey"
    FOREIGN KEY ("convertedUserId") REFERENCES "legal_platform"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ── Documents, payments and lawyer requests of a guest case ─────────────────
ALTER TABLE "legal_platform"."ContractDocument" ALTER COLUMN "ownerId" DROP NOT NULL;

ALTER TABLE "legal_platform"."Payment" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "legal_platform"."Payment" DROP CONSTRAINT "Payment_userId_fkey";
ALTER TABLE "legal_platform"."Payment"
    ADD CONSTRAINT "Payment_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "legal_platform"."LawyerRequest" ALTER COLUMN "clientId" DROP NOT NULL;
ALTER TABLE "legal_platform"."LawyerRequest" DROP CONSTRAINT "LawyerRequest_clientId_fkey";
ALTER TABLE "legal_platform"."LawyerRequest"
    ADD CONSTRAINT "LawyerRequest_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "legal_platform"."User"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
