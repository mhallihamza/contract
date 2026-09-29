import { randomUUID } from "node:crypto";
import type { ContractDocument, DocumentType, UserRole } from "@prisma/client";
import { db } from "@/lib/db/prisma";
import { recordAudit } from "@/lib/audit/logger";
import { logger, LOG_EVENTS } from "@/lib/logging";
import { buildStorageKey, getStorageProvider, sha256 } from "./storage";
import { renderDocumentFile, type DocumentFormat } from "./renderers";

/**
 * Document service (§23, §24).
 *
 * Every generated or uploaded file becomes a ContractDocument row with its
 * checksum and version. Signed/final documents are marked immutable and are
 * never overwritten — a new version is created instead.
 */

export interface GenerateDocumentParams {
  contractId: string;
  /** Owner of the file: null for an anonymous (guest) case (§8). */
  ownerId: string | null;
  actorId?: string | null;
  actorRole?: UserRole | null;
  documentType: DocumentType;
  contractVersionId?: string | null;
  format: DocumentFormat;
  title: string;
  body: string;
  language: "fr" | "ar";
  reference: string;
  contractTypeFr: string;
  contractTypeAr: string;
  versionNumber: number;
  immutable?: boolean;
  filenameSuffix?: string;
}

export async function generateAndStoreDocument(params: GenerateDocumentParams): Promise<ContractDocument> {
  const storage = getStorageProvider();
  const generatedAt = new Date();

  const file = await renderDocumentFile(params.format, {
    title: params.title,
    body: params.body,
    language: params.language,
    metadata: {
      reference: params.reference,
      contractTypeFr: params.contractTypeFr,
      contractTypeAr: params.contractTypeAr,
      versionNumber: params.versionNumber,
      generatedAt,
    },
  });

  const documentId = randomUUID();
  const filename = params.filenameSuffix ? `${params.filenameSuffix}-${file.filename}` : file.filename;
  const stored = await storage.put({
    key: buildStorageKey(params.contractId, documentId, filename),
    bytes: file.bytes,
    mimeType: file.mimeType,
  });

  const existingVersions = await db.contractDocument.count({
    where: { contractId: params.contractId, documentType: params.documentType },
  });

  const document = await db.contractDocument.create({
    data: {
      id: documentId,
      contractId: params.contractId,
      contractVersionId: params.contractVersionId ?? null,
      ownerId: params.ownerId,
      uploadedById: params.actorId ?? null,
      documentType: params.documentType,
      storageProvider: stored.storageProvider,
      storagePath: stored.storagePath,
      filename,
      mimeType: file.mimeType,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      version: existingVersions + 1,
      immutable: params.immutable ?? false,
    },
  });

  logger.info(LOG_EVENTS.documentGenerated, {
    contractId: params.contractId,
    documentId: document.id,
    format: params.format,
    sizeBytes: stored.sizeBytes,
  });

  await recordAudit({
    action: "DRAFT_GENERATED",
    entityType: "ContractDocument",
    entityId: document.id,
    actorId: params.actorId ?? null,
    actorRole: params.actorRole ?? null,
    metadata: {
      contractId: params.contractId,
      documentType: params.documentType,
      format: params.format,
      checksum: stored.checksum,
      version: document.version,
    },
  });

  return document;
}

export interface UploadDocumentParams {
  contractId: string;
  ownerId: string | null;
  actorId: string;
  actorRole: UserRole;
  documentType: DocumentType;
  filename: string;
  mimeType: string;
  bytes: Buffer;
}

export const ALLOWED_UPLOAD_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export async function storeUploadedDocument(params: UploadDocumentParams): Promise<ContractDocument> {
  if (!ALLOWED_UPLOAD_MIME.includes(params.mimeType as (typeof ALLOWED_UPLOAD_MIME)[number])) {
    throw new Error("UNSUPPORTED_MIME_TYPE");
  }
  const storage = getStorageProvider();
  const documentId = randomUUID();
  const stored = await storage.put({
    key: buildStorageKey(params.contractId, documentId, params.filename),
    bytes: params.bytes,
    mimeType: params.mimeType,
  });

  const count = await db.contractDocument.count({
    where: { contractId: params.contractId, documentType: params.documentType },
  });

  const document = await db.contractDocument.create({
    data: {
      id: documentId,
      contractId: params.contractId,
      ownerId: params.ownerId,
      uploadedById: params.actorId,
      documentType: params.documentType,
      storageProvider: stored.storageProvider,
      storagePath: stored.storagePath,
      filename: params.filename,
      mimeType: params.mimeType,
      sizeBytes: stored.sizeBytes,
      checksum: stored.checksum,
      version: count + 1,
      immutable: false,
    },
  });

  await recordAudit({
    action: "DOCUMENT_UPLOADED",
    entityType: "ContractDocument",
    entityId: document.id,
    actorId: params.actorId,
    actorRole: params.actorRole,
    metadata: { contractId: params.contractId, filename: params.filename, checksum: stored.checksum },
  });

  return document;
}

export async function readDocument(documentId: string): Promise<{ document: ContractDocument; bytes: Buffer; verified: boolean }> {
  const document = await db.contractDocument.findUnique({ where: { id: documentId } });
  if (!document) throw new Error("DOCUMENT_NOT_FOUND");
  const bytes = await getStorageProvider().get(document.storagePath);
  return { document, bytes, verified: sha256(bytes) === document.checksum };
}

/** Documents of a contract, newest first — used by the workspace and admin UI. */
export async function listContractDocuments(contractId: string): Promise<ContractDocument[]> {
  return db.contractDocument.findMany({ where: { contractId }, orderBy: [{ createdAt: "desc" }] });
}
