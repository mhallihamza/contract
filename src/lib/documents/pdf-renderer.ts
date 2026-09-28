import { encodeWinAnsi, escapePdfText, PdfUnsupportedTextError, wrapPdfLine } from "./pdf-text";

/**
 * Minimal but genuine PDF writer (PDF 1.4, Helvetica, WinAnsi).
 *
 * Produces a real, openable PDF produced entirely server-side with no external
 * service. Arabic content is refused with an explicit message (see pdf-text).
 */
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const FONT_SIZE = 11;
const LEADING = 15.5;
const MAX_CHARS = Math.floor((PAGE_WIDTH - MARGIN * 2) / (FONT_SIZE * 0.5));

export interface PdfRenderInput {
  title: string;
  body: string;
  language: "fr" | "ar";
  metadata: { reference: string; subtitle: string; generatedAt: Date };
}

export function renderPdf(input: PdfRenderInput): Buffer {
  if (input.language === "ar") throw new PdfUnsupportedTextError("Arabic script");

  const source = [input.metadata.reference, input.metadata.subtitle, "", ...input.body.split("\n")];
  const encodedLines: string[] = [];
  const unsupported = new Set<string>();
  for (const line of source) {
    for (const segment of wrapPdfLine(line.trimEnd(), MAX_CHARS)) {
      const { encoded, unsupported: bad } = encodeWinAnsi(segment);
      bad.forEach((char) => unsupported.add(char));
      encodedLines.push(encoded);
    }
  }
  if (unsupported.size > 0) throw new PdfUnsupportedTextError([...unsupported].join(""));

  // ── Pagination ───────────────────────────────────────────────────────────
  const pageStreams: string[] = [];
  let operators: string[] = [];
  let y = PAGE_HEIGHT - MARGIN;
  for (const line of encodedLines) {
    if (y < MARGIN + LEADING) {
      pageStreams.push(operators.join("\n"));
      operators = [];
      y = PAGE_HEIGHT - MARGIN;
    }
    operators.push(`BT /F1 ${FONT_SIZE} Tf ${MARGIN} ${y.toFixed(2)} Td (${escapePdfText(line)}) Tj ET`);
    y -= LEADING;
  }
  pageStreams.push(operators.join("\n"));

  // ── Objects (explicit numbering: 1 catalog, 2 pages, 3/4 fonts, 5+ pages) ─
  const objects = new Map<number, string>();
  const pageIds: number[] = [];
  const contentIds: number[] = [];
  pageStreams.forEach((_stream, index) => {
    pageIds.push(5 + index * 2);
    contentIds.push(6 + index * 2);
  });

  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageStreams.length} >>`);
  objects.set(3, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  objects.set(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");

  pageStreams.forEach((stream, index) => {
    const pageId = pageIds[index]!;
    const contentId = contentIds[index]!;
    objects.set(
      pageId,
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.set(contentId, `<< /Length ${Buffer.byteLength(stream, "latin1")} >>\nstream\n${stream}\nendstream`);
  });

  // ── Serialisation ────────────────────────────────────────────────────────
  const maxId = Math.max(...objects.keys());
  const chunks: string[] = ["%PDF-1.4\n"];
  const offsets = new Map<number, number>();
  let offset = Buffer.byteLength(chunks[0]!, "latin1");

  for (let id = 1; id <= maxId; id += 1) {
    const body = objects.get(id);
    if (!body) continue;
    const serialized = `${id} 0 obj\n${body}\nendobj\n`;
    offsets.set(id, offset);
    offset += Buffer.byteLength(serialized, "latin1");
    chunks.push(serialized);
  }

  const xrefOffset = offset;
  let xref = `xref\n0 ${maxId + 1}\n0000000000 65535 f \n`;
  for (let id = 1; id <= maxId; id += 1) {
    xref += `${String(offsets.get(id) ?? 0).padStart(10, "0")} 00000 n \n`;
  }
  chunks.push(xref, `trailer\n<< /Size ${maxId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`);

  return Buffer.from(chunks.join(""), "latin1");
}

export { PdfUnsupportedTextError } from "./pdf-text";
