-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "legal_platform";

-- CreateEnum
CREATE TYPE "legal_platform"."UserRole" AS ENUM ('CLIENT', 'LAWYER', 'LEGAL_REVIEWER', 'ADMIN', 'SUPER_ADMIN');

-- CreateEnum
CREATE TYPE "legal_platform"."UserStatus" AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "legal_platform"."Language" AS ENUM ('AR', 'FR', 'EN');

-- CreateEnum
CREATE TYPE "legal_platform"."ContractCategory" AS ENUM ('RENTAL', 'SERVICES', 'EMPLOYMENT', 'CONFIDENTIALITY', 'SALE', 'PARTNERSHIP', 'LOAN', 'AUTHORIZATION', 'OTHER');

-- CreateEnum
CREATE TYPE "legal_platform"."RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "legal_platform"."RecordStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "legal_platform"."TemplateVersionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'RETIRED');

-- CreateEnum
CREATE TYPE "legal_platform"."ClauseRequirement" AS ENUM ('REQUIRED', 'OPTIONAL', 'CONDITIONAL');

-- CreateEnum
CREATE TYPE "legal_platform"."RoutingRoute" AS ENUM ('SELF_SERVICE', 'LAWYER_OPTIONAL', 'LAWYER_REQUIRED', 'LAWYER_SIGNATURE_REQUIRED', 'SPECIALIST_REQUIRED', 'UNSUPPORTED', 'ROUTING_UNDETERMINED');

-- CreateEnum
CREATE TYPE "legal_platform"."RequirementLevel" AS ENUM ('NOT_REQUIRED', 'OPTIONAL', 'REQUIRED');

-- CreateEnum
CREATE TYPE "legal_platform"."SignatureRequirement" AS ENUM ('NOT_REQUIRED', 'REQUIRED');

-- CreateEnum
CREATE TYPE "legal_platform"."RuleKind" AS ENUM ('LEGAL_REQUIREMENT', 'PLATFORM_POLICY');

-- CreateEnum
CREATE TYPE "legal_platform"."RuleStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'VERIFIED', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "legal_platform"."VerificationStatus" AS ENUM ('DRAFT', 'UNDER_REVIEW', 'VERIFIED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "legal_platform"."LegalSourceType" AS ENUM ('LAW', 'DECREE', 'REGULATION', 'OFFICIAL_GUIDANCE', 'COURT_DECISION', 'OTHER');

-- CreateEnum
CREATE TYPE "legal_platform"."ConditionOperator" AS ENUM ('EQUALS', 'NOT_EQUALS', 'GREATER_THAN', 'GREATER_THAN_OR_EQUAL', 'LESS_THAN', 'LESS_THAN_OR_EQUAL', 'IN', 'NOT_IN', 'EXISTS', 'NOT_EXISTS');

-- CreateEnum
CREATE TYPE "legal_platform"."RoutingDecisionStatus" AS ENUM ('PROPOSED', 'CONFIRMED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "legal_platform"."ContractStatus" AS ENUM ('DRAFT', 'INFORMATION_REQUIRED', 'READY_FOR_ROUTING', 'ROUTED', 'PAYMENT_REQUIRED', 'PAYMENT_CONFIRMED', 'DOCUMENT_GENERATING', 'DRAFT_READY', 'LAWYER_PENDING', 'LAWYER_REVIEW', 'CHANGES_REQUESTED', 'MANUAL_REVIEW_REQUIRED', 'VALIDATED', 'SIGNATURE_PENDING', 'SIGNED', 'FINAL', 'CANCELLED');

-- CreateEnum
CREATE TYPE "legal_platform"."PartyRole" AS ENUM ('LANDLORD', 'TENANT', 'SERVICE_PROVIDER', 'CLIENT', 'CUSTOMER', 'DISCLOSING_PARTY', 'RECEIVING_PARTY', 'SELLER', 'BUYER', 'EMPLOYER', 'EMPLOYEE', 'LENDER', 'BORROWER', 'OTHER');

-- CreateEnum
CREATE TYPE "legal_platform"."PartyType" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "legal_platform"."FieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'BOOLEAN', 'SELECT', 'LIST');

-- CreateEnum
CREATE TYPE "legal_platform"."FieldSource" AS ENUM ('CLIENT_ANSWER', 'AI_EXTRACTED', 'LAWYER_EDITED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "legal_platform"."DocumentType" AS ENUM ('CLIENT_DOCUMENT', 'DRAFT_CONTRACT', 'LAWYER_REVISED_DRAFT', 'FINAL_CONTRACT', 'SIGNED_CONTRACT', 'OTHER');

-- CreateEnum
CREATE TYPE "legal_platform"."EmailStatus" AS ENUM ('LOGGED', 'SENT', 'FAILED');

-- CreateEnum
CREATE TYPE "legal_platform"."VersionKind" AS ENUM ('AI_DRAFT', 'CLIENT_EDIT', 'LAWYER_REVISED', 'VALIDATED', 'FINAL', 'SIGNED');

-- CreateEnum
CREATE TYPE "legal_platform"."LawyerRequestStatus" AS ENUM ('CREATED', 'ASSIGNMENT_PENDING', 'ASSIGNED', 'UNDER_REVIEW', 'INFORMATION_REQUESTED', 'CHANGES_REQUESTED', 'READY_FOR_VALIDATION', 'VALIDATED', 'SIGNATURE_PENDING', 'SIGNED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "legal_platform"."AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'DECLINED', 'REASSIGNED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "legal_platform"."PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "legal_platform"."PaymentType" AS ENUM ('SELF_SERVICE_CONTRACT', 'LAWYER_REVIEW', 'LAWYER_REQUIRED_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "legal_platform"."SignatureRequestStatus" AS ENUM ('CREATED', 'SENT', 'VIEWED', 'SIGNED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "legal_platform"."SignatureMethod" AS ENUM ('MOCK_SANDBOX', 'QUALIFIED_PROVIDER');

-- CreateEnum
CREATE TYPE "legal_platform"."AuditAction" AS ENUM ('USER_SIGNED_IN', 'USER_SIGNED_OUT', 'CONTRACT_CREATED', 'CONTRACT_UPDATED', 'CONTRACT_STATUS_CHANGED', 'CONTRACT_CANCELLED', 'INTENT_CLASSIFIED', 'QUESTIONNAIRE_UPDATED', 'ROUTING_DECIDED', 'ROUTING_SUPERSEDED', 'ROUTING_UNDETERMINED', 'LAWYER_SERVICE_SELECTED', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED', 'DRAFT_GENERATED', 'DRAFT_EDITED', 'LAWYER_ASSIGNED', 'LAWYER_ACCEPTED', 'LAWYER_DECLINED', 'ASSIGNMENT_REASSIGNED', 'LAWYER_REQUESTED_INFORMATION', 'INFORMATION_PROVIDED', 'LAWYER_VALIDATED', 'LAWYER_REJECTED', 'SIGNATURE_REQUESTED', 'SIGNATURE_COMPLETED', 'SIGNATURE_DECLINED', 'SIGNATURE_FAILED', 'CONTRACT_FINALIZED', 'DOCUMENT_UPLOADED', 'DOCUMENT_DOWNLOADED', 'LEGAL_SOURCE_CREATED', 'LEGAL_SOURCE_UPDATED', 'LEGAL_SOURCE_VERIFIED', 'LEGAL_RULE_CREATED', 'LEGAL_RULE_UPDATED', 'LEGAL_RULE_STATUS_CHANGED', 'LEGAL_RULE_VERIFIED', 'TEMPLATE_VERSION_ACTIVATED', 'CONTRACT_TYPE_UPDATED', 'LAWYER_PROFILE_UPDATED', 'AI_PROVIDER_FALLBACK', 'EMAIL_LOGGED', 'SEED_RUN');

-- CreateEnum
CREATE TYPE "legal_platform"."NotificationType" AS ENUM ('DRAFT_READY', 'PAYMENT_REQUIRED', 'PAYMENT_CONFIRMED', 'LAWYER_ASSIGNED', 'LAWYER_ACCEPTED', 'INFORMATION_REQUESTED', 'CHANGES_REQUESTED', 'CONTRACT_VALIDATED', 'SIGNATURE_REQUIRED', 'DOCUMENT_FINALIZED', 'ASSIGNMENT_FAILED', 'OVERDUE_LAWYER_REQUEST', 'RULE_EXPIRED', 'SIGNATURE_FAILED');

-- CreateEnum
CREATE TYPE "legal_platform"."NotificationChannel" AS ENUM ('IN_APP', 'EMAIL');

-- CreateTable
CREATE TABLE "legal_platform"."User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "role" "legal_platform"."UserRole" NOT NULL DEFAULT 'CLIENT',
    "status" "legal_platform"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "preferredLanguage" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Profile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "partyType" "legal_platform"."PartyType" NOT NULL DEFAULT 'INDIVIDUAL',
    "nationalId" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'MA',
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "legalForm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LawyerProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "barNumber" TEXT,
    "specializations" TEXT[],
    "languages" "legal_platform"."Language"[],
    "jurisdictions" TEXT[],
    "city" TEXT,
    "maxConcurrentCases" INTEGER NOT NULL DEFAULT 10,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Session" (
    "id" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."RoutingProfile" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "jurisdiction" TEXT NOT NULL DEFAULT 'MA',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractType" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionFr" TEXT,
    "category" "legal_platform"."ContractCategory" NOT NULL,
    "riskLevel" "legal_platform"."RiskLevel" NOT NULL DEFAULT 'LOW',
    "status" "legal_platform"."RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "defaultLanguage" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "supportedLanguages" "legal_platform"."Language"[],
    "requiredFields" TEXT[],
    "requiredDocuments" TEXT[],
    "intents" TEXT[],
    "routingProfileId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractTemplate" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "contractTypeId" UUID NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionFr" TEXT,
    "activeVersionId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractTemplateVersion" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "language" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "status" "legal_platform"."TemplateVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "variables" JSONB NOT NULL,
    "sections" JSONB,
    "notes" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractTemplateVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Clause" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameFr" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "bodyFr" TEXT NOT NULL,
    "category" TEXT,
    "variables" TEXT[],
    "status" "legal_platform"."RecordStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."TemplateClause" (
    "id" UUID NOT NULL,
    "templateVersionId" UUID NOT NULL,
    "clauseId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "sectionNumber" TEXT,
    "requirement" "legal_platform"."ClauseRequirement" NOT NULL DEFAULT 'REQUIRED',
    "condition" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateClause_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Contract" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "clientId" UUID NOT NULL,
    "contractTypeId" UUID NOT NULL,
    "templateVersionId" UUID,
    "title" TEXT NOT NULL,
    "language" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "jurisdiction" TEXT NOT NULL DEFAULT 'MA',
    "status" "legal_platform"."ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "route" "legal_platform"."RoutingRoute",
    "intentCode" TEXT,
    "intentConfidence" DOUBLE PRECISION,
    "rawIntentText" TEXT,
    "intentJson" JSONB,
    "summaryFr" TEXT,
    "summaryAr" TEXT,
    "priceAmount" DECIMAL(12,2),
    "priceCurrency" TEXT NOT NULL DEFAULT 'MAD',
    "assignedLawyerId" UUID,
    "currentVersionId" UUID,
    "routedAt" TIMESTAMP(3),
    "paymentConfirmedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractParty" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "role" "legal_platform"."PartyRole" NOT NULL,
    "partyType" "legal_platform"."PartyType" NOT NULL DEFAULT 'INDIVIDUAL',
    "fullName" TEXT NOT NULL,
    "isUser" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID,
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "nationalId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "representative" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractField" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "labelFr" TEXT,
    "labelAr" TEXT,
    "fieldType" "legal_platform"."FieldType" NOT NULL DEFAULT 'TEXT',
    "source" "legal_platform"."FieldSource" NOT NULL DEFAULT 'CLIENT_ANSWER',
    "required" BOOLEAN NOT NULL DEFAULT false,
    "valueText" TEXT,
    "valueNumber" DECIMAL(14,2),
    "valueDate" TIMESTAMP(3),
    "valueBoolean" BOOLEAN,
    "valueList" TEXT[],
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractField_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractVersion" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "kind" "legal_platform"."VersionKind" NOT NULL,
    "createdById" UUID,
    "createdByRole" "legal_platform"."UserRole",
    "content" TEXT NOT NULL,
    "variablesJson" JSONB,
    "templateVersionId" UUID,
    "changeSummary" TEXT,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."ContractDocument" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "contractVersionId" UUID,
    "ownerId" UUID NOT NULL,
    "uploadedById" UUID,
    "documentType" "legal_platform"."DocumentType" NOT NULL,
    "storageProvider" TEXT NOT NULL DEFAULT 'local',
    "storagePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "checksum" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "immutable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."RoutingDecision" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "route" "legal_platform"."RoutingRoute" NOT NULL,
    "lawyerReviewRequirement" "legal_platform"."RequirementLevel" NOT NULL,
    "lawyerSignatureRequirement" "legal_platform"."SignatureRequirement" NOT NULL,
    "specialistRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialistType" TEXT,
    "writtenContractRequired" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "reasonCodes" TEXT[],
    "matchedRuleIds" TEXT[],
    "legalSourceIds" TEXT[],
    "missingRuleContext" TEXT[],
    "engineVersion" TEXT NOT NULL,
    "ruleSnapshot" JSONB NOT NULL,
    "status" "legal_platform"."RoutingDecisionStatus" NOT NULL DEFAULT 'PROPOSED',
    "decidedByRuleId" UUID,
    "requestedByUserId" UUID,
    "overrideNote" TEXT,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmedAt" TIMESTAMP(3),
    "supersededById" UUID,

    CONSTRAINT "RoutingDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LawyerRequest" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "clientId" UUID NOT NULL,
    "lawyerId" UUID,
    "draftVersionId" UUID,
    "serviceType" "legal_platform"."PaymentType" NOT NULL DEFAULT 'LAWYER_REVIEW',
    "status" "legal_platform"."LawyerRequestStatus" NOT NULL DEFAULT 'CREATED',
    "requiresSignature" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "summaryJson" JSONB,
    "reviewAreas" TEXT[],
    "missingInformation" TEXT[],
    "informationRequest" TEXT,
    "informationProvidedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "validatedById" UUID,
    "signatureRequiredAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "dueAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LawyerAssignment" (
    "id" UUID NOT NULL,
    "lawyerRequestId" UUID NOT NULL,
    "lawyerId" UUID NOT NULL,
    "assignedById" UUID,
    "status" "legal_platform"."AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignmentReason" TEXT NOT NULL,
    "scoreDetails" JSONB,
    "workloadAtAssignment" INTEGER NOT NULL,
    "maxConcurrentAtAssignment" INTEGER NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LawyerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Payment" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "contractId" UUID,
    "lawyerRequestId" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MAD',
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" "legal_platform"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "type" "legal_platform"."PaymentType" NOT NULL,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "failureReason" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."PaymentEvent" (
    "id" UUID NOT NULL,
    "paymentId" UUID,
    "provider" TEXT NOT NULL,
    "externalEventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."SignatureRequest" (
    "id" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "lawyerRequestId" UUID,
    "documentId" UUID,
    "contractVersionId" UUID,
    "signerUserId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "method" "legal_platform"."SignatureMethod" NOT NULL DEFAULT 'MOCK_SANDBOX',
    "providerRequestId" TEXT NOT NULL,
    "status" "legal_platform"."SignatureRequestStatus" NOT NULL DEFAULT 'CREATED',
    "signedDocumentId" UUID,
    "signedAt" TIMESTAMP(3),
    "declinedAt" TIMESTAMP(3),
    "declineReason" TEXT,
    "verificationMetadata" JSONB,
    "providerAuditTrail" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LegalSource" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "sourceType" "legal_platform"."LegalSourceType" NOT NULL,
    "lawNumber" TEXT,
    "article" TEXT,
    "officialUrl" TEXT,
    "publisher" TEXT,
    "publicationDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "jurisdiction" TEXT NOT NULL DEFAULT 'MA',
    "language" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "notes" TEXT,
    "tags" TEXT[],
    "verificationStatus" "legal_platform"."VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LegalRule" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "titleAr" TEXT,
    "description" TEXT,
    "ruleKind" "legal_platform"."RuleKind" NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'MA',
    "contractTypeId" UUID,
    "scope" TEXT,
    "status" "legal_platform"."RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "route" "legal_platform"."RoutingRoute" NOT NULL,
    "lawyerReview" "legal_platform"."RequirementLevel" NOT NULL DEFAULT 'NOT_REQUIRED',
    "lawyerSignature" "legal_platform"."SignatureRequirement" NOT NULL DEFAULT 'NOT_REQUIRED',
    "specialistRequired" BOOLEAN NOT NULL DEFAULT false,
    "specialistType" TEXT,
    "writtenContractRequired" BOOLEAN NOT NULL DEFAULT false,
    "manualReviewRequired" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "reasonCode" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "legalSourceId" UUID,
    "article" TEXT,
    "internalPolicyRef" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LegalRuleCondition" (
    "id" UUID NOT NULL,
    "legalRuleId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "operator" "legal_platform"."ConditionOperator" NOT NULL,
    "valueText" TEXT,
    "valueNumber" DECIMAL(14,2),
    "valueBoolean" BOOLEAN,
    "valueList" TEXT[],
    "groupIndex" INTEGER NOT NULL DEFAULT 0,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalRuleCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."LegalRuleVersion" (
    "id" UUID NOT NULL,
    "legalRuleId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "changeSummary" TEXT,
    "changedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalRuleVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorRole" "legal_platform"."UserRole",
    "action" "legal_platform"."AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "legal_platform"."NotificationType" NOT NULL,
    "channel" "legal_platform"."NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "locale" "legal_platform"."Language" NOT NULL DEFAULT 'FR',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "contractId" UUID,
    "emailMessageId" UUID,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "legal_platform"."EmailMessage" (
    "id" UUID NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "legal_platform"."EmailStatus" NOT NULL DEFAULT 'LOGGED',
    "provider" TEXT NOT NULL,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "legal_platform"."User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "legal_platform"."User"("role", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Profile_userId_key" ON "legal_platform"."Profile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerProfile_userId_key" ON "legal_platform"."LawyerProfile"("userId");

-- CreateIndex
CREATE INDEX "LawyerProfile_active_idx" ON "legal_platform"."LawyerProfile"("active");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "legal_platform"."Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_expiresAt_idx" ON "legal_platform"."Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingProfile_code_key" ON "legal_platform"."RoutingProfile"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ContractType_code_key" ON "legal_platform"."ContractType"("code");

-- CreateIndex
CREATE INDEX "ContractType_category_active_idx" ON "legal_platform"."ContractType"("category", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_code_key" ON "legal_platform"."ContractTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplate_activeVersionId_key" ON "legal_platform"."ContractTemplate"("activeVersionId");

-- CreateIndex
CREATE INDEX "ContractTemplate_contractTypeId_idx" ON "legal_platform"."ContractTemplate"("contractTypeId");

-- CreateIndex
CREATE INDEX "ContractTemplateVersion_status_idx" ON "legal_platform"."ContractTemplateVersion"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ContractTemplateVersion_templateId_versionNumber_key" ON "legal_platform"."ContractTemplateVersion"("templateId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Clause_code_key" ON "legal_platform"."Clause"("code");

-- CreateIndex
CREATE INDEX "Clause_status_idx" ON "legal_platform"."Clause"("status");

-- CreateIndex
CREATE INDEX "TemplateClause_templateVersionId_position_idx" ON "legal_platform"."TemplateClause"("templateVersionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateClause_templateVersionId_clauseId_key" ON "legal_platform"."TemplateClause"("templateVersionId", "clauseId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_reference_key" ON "legal_platform"."Contract"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_currentVersionId_key" ON "legal_platform"."Contract"("currentVersionId");

-- CreateIndex
CREATE INDEX "Contract_clientId_status_idx" ON "legal_platform"."Contract"("clientId", "status");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "legal_platform"."Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_assignedLawyerId_idx" ON "legal_platform"."Contract"("assignedLawyerId");

-- CreateIndex
CREATE INDEX "ContractParty_contractId_idx" ON "legal_platform"."ContractParty"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractParty_contractId_role_fullName_key" ON "legal_platform"."ContractParty"("contractId", "role", "fullName");

-- CreateIndex
CREATE INDEX "ContractField_contractId_idx" ON "legal_platform"."ContractField"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractField_contractId_key_key" ON "legal_platform"."ContractField"("contractId", "key");

-- CreateIndex
CREATE INDEX "ContractVersion_contractId_idx" ON "legal_platform"."ContractVersion"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractVersion_contractId_versionNumber_key" ON "legal_platform"."ContractVersion"("contractId", "versionNumber");

-- CreateIndex
CREATE INDEX "ContractDocument_contractId_documentType_idx" ON "legal_platform"."ContractDocument"("contractId", "documentType");

-- CreateIndex
CREATE INDEX "ContractDocument_ownerId_idx" ON "legal_platform"."ContractDocument"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingDecision_supersededById_key" ON "legal_platform"."RoutingDecision"("supersededById");

-- CreateIndex
CREATE INDEX "RoutingDecision_contractId_decidedAt_idx" ON "legal_platform"."RoutingDecision"("contractId", "decidedAt");

-- CreateIndex
CREATE INDEX "RoutingDecision_route_idx" ON "legal_platform"."RoutingDecision"("route");

-- CreateIndex
CREATE UNIQUE INDEX "LawyerRequest_contractId_key" ON "legal_platform"."LawyerRequest"("contractId");

-- CreateIndex
CREATE INDEX "LawyerRequest_lawyerId_status_idx" ON "legal_platform"."LawyerRequest"("lawyerId", "status");

-- CreateIndex
CREATE INDEX "LawyerRequest_status_idx" ON "legal_platform"."LawyerRequest"("status");

-- CreateIndex
CREATE INDEX "LawyerAssignment_lawyerId_status_idx" ON "legal_platform"."LawyerAssignment"("lawyerId", "status");

-- CreateIndex
CREATE INDEX "LawyerAssignment_lawyerRequestId_idx" ON "legal_platform"."LawyerAssignment"("lawyerRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "legal_platform"."Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "legal_platform"."Payment"("userId", "status");

-- CreateIndex
CREATE INDEX "Payment_contractId_idx" ON "legal_platform"."Payment"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentEvent_externalEventId_key" ON "legal_platform"."PaymentEvent"("externalEventId");

-- CreateIndex
CREATE INDEX "PaymentEvent_provider_eventType_idx" ON "legal_platform"."PaymentEvent"("provider", "eventType");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureRequest_providerRequestId_key" ON "legal_platform"."SignatureRequest"("providerRequestId");

-- CreateIndex
CREATE INDEX "SignatureRequest_contractId_status_idx" ON "legal_platform"."SignatureRequest"("contractId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LegalSource_code_key" ON "legal_platform"."LegalSource"("code");

-- CreateIndex
CREATE INDEX "LegalSource_verificationStatus_idx" ON "legal_platform"."LegalSource"("verificationStatus");

-- CreateIndex
CREATE INDEX "LegalSource_jurisdiction_sourceType_idx" ON "legal_platform"."LegalSource"("jurisdiction", "sourceType");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRule_code_key" ON "legal_platform"."LegalRule"("code");

-- CreateIndex
CREATE INDEX "LegalRule_status_active_jurisdiction_idx" ON "legal_platform"."LegalRule"("status", "active", "jurisdiction");

-- CreateIndex
CREATE INDEX "LegalRule_contractTypeId_priority_idx" ON "legal_platform"."LegalRule"("contractTypeId", "priority");

-- CreateIndex
CREATE INDEX "LegalRuleCondition_legalRuleId_groupIndex_idx" ON "legal_platform"."LegalRuleCondition"("legalRuleId", "groupIndex");

-- CreateIndex
CREATE UNIQUE INDEX "LegalRuleVersion_legalRuleId_versionNumber_key" ON "legal_platform"."LegalRuleVersion"("legalRuleId", "versionNumber");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "legal_platform"."AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "legal_platform"."AuditLog"("action", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "legal_platform"."AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "legal_platform"."Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "legal_platform"."Notification"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_to_createdAt_idx" ON "legal_platform"."EmailMessage"("to", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_status_idx" ON "legal_platform"."EmailMessage"("status");

-- AddForeignKey
ALTER TABLE "legal_platform"."Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerProfile" ADD CONSTRAINT "LawyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractType" ADD CONSTRAINT "ContractType_routingProfileId_fkey" FOREIGN KEY ("routingProfileId") REFERENCES "legal_platform"."RoutingProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "legal_platform"."ContractType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractTemplate" ADD CONSTRAINT "ContractTemplate_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "legal_platform"."ContractTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractTemplateVersion" ADD CONSTRAINT "ContractTemplateVersion_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "legal_platform"."ContractTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."TemplateClause" ADD CONSTRAINT "TemplateClause_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "legal_platform"."ContractTemplateVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."TemplateClause" ADD CONSTRAINT "TemplateClause_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "legal_platform"."Clause"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Contract" ADD CONSTRAINT "Contract_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Contract" ADD CONSTRAINT "Contract_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "legal_platform"."ContractType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Contract" ADD CONSTRAINT "Contract_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "legal_platform"."ContractTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Contract" ADD CONSTRAINT "Contract_assignedLawyerId_fkey" FOREIGN KEY ("assignedLawyerId") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Contract" ADD CONSTRAINT "Contract_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "legal_platform"."ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractParty" ADD CONSTRAINT "ContractParty_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractField" ADD CONSTRAINT "ContractField_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractVersion" ADD CONSTRAINT "ContractVersion_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractVersion" ADD CONSTRAINT "ContractVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractVersion" ADD CONSTRAINT "ContractVersion_templateVersionId_fkey" FOREIGN KEY ("templateVersionId") REFERENCES "legal_platform"."ContractTemplateVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractDocument" ADD CONSTRAINT "ContractDocument_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractDocument" ADD CONSTRAINT "ContractDocument_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "legal_platform"."ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractDocument" ADD CONSTRAINT "ContractDocument_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."ContractDocument" ADD CONSTRAINT "ContractDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."RoutingDecision" ADD CONSTRAINT "RoutingDecision_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "legal_platform"."RoutingDecision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."RoutingDecision" ADD CONSTRAINT "RoutingDecision_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."RoutingDecision" ADD CONSTRAINT "RoutingDecision_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerRequest" ADD CONSTRAINT "LawyerRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerRequest" ADD CONSTRAINT "LawyerRequest_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerRequest" ADD CONSTRAINT "LawyerRequest_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerRequest" ADD CONSTRAINT "LawyerRequest_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerRequest" ADD CONSTRAINT "LawyerRequest_draftVersionId_fkey" FOREIGN KEY ("draftVersionId") REFERENCES "legal_platform"."ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerAssignment" ADD CONSTRAINT "LawyerAssignment_lawyerRequestId_fkey" FOREIGN KEY ("lawyerRequestId") REFERENCES "legal_platform"."LawyerRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LawyerAssignment" ADD CONSTRAINT "LawyerAssignment_lawyerId_fkey" FOREIGN KEY ("lawyerId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Payment" ADD CONSTRAINT "Payment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Payment" ADD CONSTRAINT "Payment_lawyerRequestId_fkey" FOREIGN KEY ("lawyerRequestId") REFERENCES "legal_platform"."LawyerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."PaymentEvent" ADD CONSTRAINT "PaymentEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "legal_platform"."Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_lawyerRequestId_fkey" FOREIGN KEY ("lawyerRequestId") REFERENCES "legal_platform"."LawyerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_contractVersionId_fkey" FOREIGN KEY ("contractVersionId") REFERENCES "legal_platform"."ContractVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."SignatureRequest" ADD CONSTRAINT "SignatureRequest_signerUserId_fkey" FOREIGN KEY ("signerUserId") REFERENCES "legal_platform"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalSource" ADD CONSTRAINT "LegalSource_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalSource" ADD CONSTRAINT "LegalSource_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRule" ADD CONSTRAINT "LegalRule_contractTypeId_fkey" FOREIGN KEY ("contractTypeId") REFERENCES "legal_platform"."ContractType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRule" ADD CONSTRAINT "LegalRule_legalSourceId_fkey" FOREIGN KEY ("legalSourceId") REFERENCES "legal_platform"."LegalSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRule" ADD CONSTRAINT "LegalRule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRule" ADD CONSTRAINT "LegalRule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRuleCondition" ADD CONSTRAINT "LegalRuleCondition_legalRuleId_fkey" FOREIGN KEY ("legalRuleId") REFERENCES "legal_platform"."LegalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRuleVersion" ADD CONSTRAINT "LegalRuleVersion_legalRuleId_fkey" FOREIGN KEY ("legalRuleId") REFERENCES "legal_platform"."LegalRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."LegalRuleVersion" ADD CONSTRAINT "LegalRuleVersion_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "legal_platform"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "legal_platform"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Notification" ADD CONSTRAINT "Notification_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "legal_platform"."Contract"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "legal_platform"."Notification" ADD CONSTRAINT "Notification_emailMessageId_fkey" FOREIGN KEY ("emailMessageId") REFERENCES "legal_platform"."EmailMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

