/**
 * Verification intake rules (§8b).
 *
 * Almost dependency-free — pure functions for the type/size/retention rules of
 * the "check an existing document" journey, plus the token hash helper, so they
 * are unit-testable and shared by the (server-only) service and the API route.
 * The upload is a stranger's file: type and size are decided here, never by the
 * browser.
 */
import { createHash } from "node:crypto";

export type VerificationTierValue = "ASSISTED" | "LAWYER";

/** Published tiers of the verification journey. */
export const VERIFICATION_TIERS: readonly VerificationTierValue[] = ["ASSISTED", "LAWYER"];

export function verificationTierFor(value: string | undefined | null): VerificationTierValue | null {
  return value === "ASSISTED" || value === "LAWYER" ? value : null;
}

/** Bytes per intake — 10 MB covers scanned contracts and phone photos. */
export const DEFAULT_VERIFY_MAX_BYTES = 10 * 1024 * 1024;

export function verifyMaxBytes(source: Record<string, string | undefined> = process.env): number {
  const raw = Number(source.VERIFY_MAX_BYTES ?? DEFAULT_VERIFY_MAX_BYTES);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_VERIFY_MAX_BYTES;
}

/** Retention of a received file, in days. Shown to the user before upload. */
export const DEFAULT_VERIFY_RETENTION_DAYS = 90;

export function verifyRetentionDays(source: Record<string, string | undefined> = process.env): number {
  const raw = Number(source.VERIFY_RETENTION_DAYS ?? DEFAULT_VERIFY_RETENTION_DAYS);
  return Number.isFinite(raw) && raw > 0 && raw <= 365 ? Math.floor(raw) : DEFAULT_VERIFY_RETENTION_DAYS;
}

/** Human MIME types the journey accepts. The file type is re-sniffed server-side. */
export const VERIFICATION_MIME_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "image/jpeg": "JPEG",
  "image/png": "PNG",
  "image/webp": "WEBP",
  "image/heic": "HEIC",
};

export const VERIFICATION_ACCEPTED_MIMES = Object.keys(VERIFICATION_MIME_LABELS);

export type SniffedKind = "pdf" | "docx" | "doc" | "jpeg" | "png" | "webp" | "heic";

/**
 * Magic-byte sniffing. The declared Content-Type is untrustworthy; the check
 * is: what does the file actually look like?
 */
export function sniffFileKind(bytes: Buffer): SniffedKind | null {
  if (bytes.length < 8) return null;
  const head = bytes.subarray(0, 16);

  if (head.subarray(0, 5).toString("latin1") === "%PDF-") return "pdf";

  // Executables are never accepted, whatever they claim to be.
  if (head[0] === 0x4d && head[1] === 0x5a) return null; // PE/MZ (often DOC-lookalike)
  if (head.subarray(0, 4).toString("latin1") === "\x7fELF") return null;

  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return "jpeg";
  if (
    head[0] === 0x89 &&
    head[1] === 0x50 &&
    head[2] === 0x4e &&
    head[3] === 0x47 &&
    head[4] === 0x0d &&
    head[5] === 0x0a
  )
    return "png";

  if (
    head.subarray(0, 4).toString("latin1") === "RIFF" &&
    head.subarray(8, 12).toString("latin1") === "WEBP"
  )
    return "webp";

  // HEIF/HEIC crops (brand at offset 8).
  const brand = head.subarray(8, 12).toString("latin1");
  if (["heic", "heix", "hevc", "hevx", "heif", "mif1", "msf1"].includes(brand)) return "heic";

  // Microsoft Office Open XML starts with a ZIP local-file header.
  if (head[0] === 0x50 && head[1] === 0x4b) {
    // A DOCX carries a word/ part in the first entries; anything else claiming
    // to be a document is refused — a plain ZIP is not a Word document.
    if (bytes.subarray(0, 3072).includes(Buffer.from("word/"))) return "docx";
    return null;
  }

  // Legacy OLE2 container (old .doc). The magic is 8 bytes — `head` is longer,
  // so the comparison must be length-matched or the branch is unreachable.
  const ole2 = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  if (head.subarray(0, ole2.length).equals(ole2)) return "doc";

  return null;
}

/** MIME types whose signatures must be present in the raw bytes. */
const MIME_BY_KIND: Record<SniffedKind, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  heic: "image/heic",
};

export type IntakeRejection =
  | "FILE_EMPTY"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "EXECUTABLE_NOT_ALLOWED"
  | "MACROS_NOT_ALLOWED"
  | "TYPE_MISMATCH";

/** The full gate the service applies before anything is stored. */
export function validateVerificationUpload(params: {
  filename: string;
  mimeType: string;
  bytes: Buffer;
  maxBytes: number;
}): IntakeRejection | null {
  if (params.bytes.length === 0) return "FILE_EMPTY";
  if (params.bytes.length > params.maxBytes) return "FILE_TOO_LARGE";
  if (!VERIFICATION_ACCEPTED_MIMES.includes(params.mimeType)) return "UNSUPPORTED_FILE_TYPE";

  const kind = sniffFileKind(params.bytes);
  if (!kind) {
    // A declared-but-fake type is refused outright: at least one family of
    // executables should never reach storage.
    if (params.bytes.length >= 2 && params.bytes[0] === 0x4d && params.bytes[1] === 0x5a) {
      return "EXECUTABLE_NOT_ALLOWED";
    }
    return "UNSUPPORTED_FILE_TYPE";
  }
  if (MIME_BY_KIND[kind] !== params.mimeType) return "TYPE_MISMATCH";

  // Legacy OLE2 documents: refuse anything that carries VBA macros.
  if (kind === "doc" && matchesVbaMarkers(params.bytes)) return "MACROS_NOT_ALLOWED";

  // A DOCX is a ZIP too; refuse the container when it hides macro payloads.
  if (kind === "docx" && matchesVbaMarkers(params.bytes)) return "MACROS_NOT_ALLOWED";

  return null;
}

/** ASCII markers of VBA macro projects inside OLE2/ZIP containers. */
function matchesVbaMarkers(bytes: Buffer): boolean {
  return (
    bytes.includes(Buffer.from("_VBA_PROJECT", "latin1")) ||
    bytes.includes(Buffer.from("vbaProject", "latin1"))
  );
}

/** Human-readable size ("10 Mo"), French decimal convention for the copy. */
export function formatHumanBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  const mb = bytes / (1024 * 1024);
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1).toString().replace(".", ",")} Mo`;
}

/** Bearer token → stored hash. Domain-separated from the guest session hashes. */
export function verifyTokenHash(token: string, secret: string): string {
  return createHash("sha256").update(`verify:${secret}:${token}`).digest("hex");
}
