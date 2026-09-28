/**
 * Text encoding helpers for the PDF writer.
 *
 * PDF with the standard Helvetica font uses WinAnsi (a Latin-1 superset), so
 * Arabic script cannot be represented without embedding a shaped font. That is
 * reported explicitly instead of silently corrupting the document.
 */
export class PdfUnsupportedTextError extends Error {
  constructor(readonly characters: string) {
    super(
      "PDF export currently supports Latin script only. Arabic documents must be exported as DOCX, which preserves bilingual formatting.",
    );
    this.name = "PdfUnsupportedTextError";
  }
}

const WINANSI_MAP: Record<number, string> = {
  0x2013: "-",
  0x2014: "-",
  0x2018: "'",
  0x2019: "'",
  0x201c: '"',
  0x201d: '"',
  0x2026: "...",
  0x00a0: " ",
};

export function encodeWinAnsi(text: string): { encoded: string; unsupported: string[] } {
  const unsupported = new Set<string>();
  let encoded = "";
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (code === 9) {
      encoded += "    ";
    } else if (code < 0x80 || (code >= 0xa0 && code <= 0xff)) {
      encoded += char;
    } else if (WINANSI_MAP[code]) {
      encoded += WINANSI_MAP[code];
    } else {
      unsupported.add(char);
      encoded += "?";
    }
  }
  return { encoded, unsupported: [...unsupported] };
}

export function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function wrapPdfLine(line: string, maxChars: number): string[] {
  if (line.length <= maxChars) return [line];
  const output: string[] = [];
  let current = "";
  for (const rawWord of line.split(" ")) {
    let word = rawWord;
    if ((current ? `${current} ${word}` : word).length > maxChars) {
      if (current) output.push(current);
      while (word.length > maxChars) {
        output.push(word.slice(0, maxChars));
        word = word.slice(maxChars);
      }
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) output.push(current);
  return output;
}
