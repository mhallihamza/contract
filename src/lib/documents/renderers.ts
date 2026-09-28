import { renderDocx } from "./docx-renderer";
import { PdfUnsupportedTextError, renderPdf } from "./pdf-renderer";

/**
 * Renderer registry (§16, §54).
 *
 * One real export format (DOCX) is implemented for both languages, plus a real
 * PDF writer for Latin-script content. Formats that cannot faithfully represent
 * a document are reported as unsupported instead of producing a fake file.
 */
export type DocumentFormat = "docx" | "pdf";

export interface DocumentRenderInput {
  title: string;
  body: string;
  language: "fr" | "ar";
  metadata: {
    reference: string;
    contractTypeFr: string;
    contractTypeAr: string;
    versionNumber: number;
    generatedAt: Date;
  };
}

export interface RenderedFile {
  format: DocumentFormat;
  bytes: Buffer;
  mimeType: string;
  extension: string;
  filename: string;
}

export class DocumentFormatUnsupportedError extends Error {
  constructor(
    readonly format: DocumentFormat,
    readonly reason: string,
  ) {
    super(reason);
    this.name = "DocumentFormatUnsupportedError";
  }
}

export function isFormatSupported(format: DocumentFormat, language: "fr" | "ar"): { supported: boolean; reason: string } {
  if (format === "docx") return { supported: true, reason: "" };
  if (language === "ar") {
    return {
      supported: false,
      reason:
        "L'export PDF n'est pas disponible pour les documents en arabe dans cette version : utilisez l'export DOCX.",
    };
  }
  return { supported: true, reason: "" };
}

function safeFilename(base: string, extension: string): string {
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "document";
  return `${cleaned}.${extension}`;
}

export async function renderDocumentFile(format: DocumentFormat, input: DocumentRenderInput): Promise<RenderedFile> {
  const support = isFormatSupported(format, input.language);
  if (!support.supported) throw new DocumentFormatUnsupportedError(format, support.reason);

  if (format === "docx") {
    const bytes = await renderDocx({
      title: input.title,
      body: input.body,
      language: input.language,
      metadata: {
        reference: input.metadata.reference,
        contractTypeFr: input.metadata.contractTypeFr,
        contractTypeAr: input.metadata.contractTypeAr,
        createdAt: input.metadata.generatedAt,
        versionNumber: input.metadata.versionNumber,
      },
    });
    return {
      format,
      bytes,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
      filename: safeFilename(`${input.metadata.reference}-v${input.metadata.versionNumber}`, "docx"),
    };
  }

  try {
    const bytes = renderPdf({
      title: input.title,
      body: input.body,
      language: input.language,
      metadata: {
        reference: input.metadata.reference,
        subtitle: input.metadata.contractTypeFr,
        generatedAt: input.metadata.generatedAt,
      },
    });
    return {
      format,
      bytes,
      mimeType: "application/pdf",
      extension: "pdf",
      filename: safeFilename(`${input.metadata.reference}-v${input.metadata.versionNumber}`, "pdf"),
    };
  } catch (error) {
    if (error instanceof PdfUnsupportedTextError) {
      throw new DocumentFormatUnsupportedError(format, error.message);
    }
    throw error;
  }
}

export { PdfUnsupportedTextError } from "./pdf-renderer";
