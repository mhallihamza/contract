import { AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";

/**
 * DOCX renderer — a real Office Open XML document (no placeholder download).
 *
 * DOCX is the reference export format because it handles both Latin and Arabic
 * script (including RTL) without font embedding.
 */
export interface DocxRenderInput {
  title: string;
  body: string;
  language: "fr" | "ar";
  metadata: { reference: string; contractTypeFr: string; contractTypeAr: string; createdAt: Date; versionNumber: number };
}

export async function renderDocx(input: DocxRenderInput): Promise<Buffer> {
  const rtl = input.language === "ar";
  const lines = input.body.split("\n");

  const header = new Paragraph({
    alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
    bidirectional: rtl,
    spacing: { after: 240 },
    children: [
      new TextRun({
        text: input.title,
        bold: true,
        size: 32,
        rightToLeft: rtl,
      }),
    ],
  });

  const metadata = new Paragraph({
    alignment: rtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
    bidirectional: rtl,
    spacing: { after: 320 },
    children: [
      new TextRun({
        text: `Réf. ${input.metadata.reference} · ${rtl ? input.metadata.contractTypeAr : input.metadata.contractTypeFr} · v${input.metadata.versionNumber}`,
        size: 18,
        color: "555555",
        rightToLeft: rtl,
      }),
    ],
  });

  const paragraphs = lines.map((line) => {
    const trimmed = line.trim();
    const isHeading = /^\d+(\.\d+)*\.\s/.test(trimmed) && trimmed.length < 140;
    return new Paragraph({
      alignment: rtl ? AlignmentType.RIGHT : AlignmentType.JUSTIFIED,
      bidirectional: rtl,
      heading: isHeading ? HeadingLevel.HEADING_3 : undefined,
      spacing: { after: trimmed === "" ? 120 : 160 },
      children: [
        new TextRun({
          text: trimmed,
          bold: isHeading,
          size: isHeading ? 24 : 22,
          rightToLeft: rtl,
        }),
      ],
    });
  });

  const document = new Document({
    creator: "MOROCCO_LEGAL_PLATFORM",
    title: input.title,
    description: `${input.metadata.contractTypeFr} / ${input.metadata.contractTypeAr}`,
    styles: {
      default: {
        document: {
          run: { font: rtl ? "Arial" : "Calibri", size: 22 },
          paragraph: { spacing: { line: 320 } },
        },
      },
    },
    sections: [{ properties: {}, children: [header, metadata, ...paragraphs] }],
  });

  return Packer.toBuffer(document);
}
