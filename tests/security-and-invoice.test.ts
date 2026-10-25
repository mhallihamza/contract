import { describe, expect, it, beforeEach } from "vitest";
import {
  checkRateLimit,
  clientIpFromHeaders,
  resetRateLimitsForTesting,
  RATE_RULES,
} from "@/lib/security/rate-limit";
import {
  formatHumanBytes,
  sniffFileKind,
  validateVerificationUpload,
  verifyRetentionDays,
  verifyMaxBytes,
} from "@/lib/verification/rules";
import { formatInvoiceNumber, renderInvoiceBody } from "@/lib/payments/invoice-format";

/**
 * Phase 5 security & invoicing invariants.
 *
 * These pin the pure cores that the public endpoints delegate to: the rate
 * limiter's window semantics, the upload gate (magic bytes — a browser
 * declaration is never trusted), and the invoice numbering/VAT body.
 */

// ── Rate limiting ────────────────────────────────────────────────────────────

describe("checkRateLimit", () => {
  beforeEach(() => resetRateLimitsForTesting());

  it("allows up to the limit, then blocks with a retry-after", () => {
    const rule = { limit: 3, windowMs: 60_000 };
    const t0 = 1_000_000;

    expect(checkRateLimit("bucket:a", rule, t0).ok).toBe(true);
    expect(checkRateLimit("bucket:a", rule, t0 + 1).ok).toBe(true);
    expect(checkRateLimit("bucket:a", rule, t0 + 2).ok).toBe(true);

    const blocked = checkRateLimit("bucket:a", rule, t0 + 3);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("opens a fresh window after the previous one elapses", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    const t0 = 2_000_000;

    expect(checkRateLimit("bucket:b", rule, t0).ok).toBe(true);
    expect(checkRateLimit("bucket:b", rule, t0 + 30_000).ok).toBe(false);
    expect(checkRateLimit("bucket:b", rule, t0 + 60_001).ok).toBe(true);
  });

  it("counts sources independently", () => {
    const rule = { limit: 1, windowMs: 60_000 };
    const t0 = 3_000_000;

    expect(checkRateLimit("bucket:c", rule, t0).ok).toBe(true);
    expect(checkRateLimit("bucket:d", rule, t0).ok).toBe(true);
  });

  it("never lets an aggressive key evict the whole table", () => {
    const rule = { limit: 1, windowMs: 0 };
    const t0 = 4_000_000;
    // windowMs 0 means every call after the first sees an expired window; the
    // sweep path must not break correctness.
    for (let i = 0; i < 50; i += 1) {
      expect(checkRateLimit("bucket:e", rule, t0 + i).ok).toBe(true);
    }
  });

  it("published rules keep the expensive anonymous surfaces the tightest", () => {
    expect(RATE_RULES.verifyUpload.limit).toBeLessThanOrEqual(RATE_RULES.guestStart.limit);
    expect(RATE_RULES.guestStart.limit).toBeLessThanOrEqual(RATE_RULES.signIn.limit);
    expect(RATE_RULES.guestStart.windowMs).toBeGreaterThanOrEqual(RATE_RULES.signIn.windowMs);
  });

  it("reads the client address from the forwarded chain, not the proxy", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" });
    expect(clientIpFromHeaders(headers)).toBe("203.0.113.7");

    const realIp = new Headers({ "x-real-ip": "198.51.100.2" });
    expect(clientIpFromHeaders(realIp)).toBe("198.51.100.2");

    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});

// ── Upload gate (§8b) ────────────────────────────────────────────────────────

describe("validateVerificationUpload", () => {
  const maxBytes = 10 * 1024 * 1024;
  const pdfMime = "application/pdf";
  const docxMime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  const docMime = "application/msword";
  const jpegMime = "image/jpeg";

  it("accepts a real PDF regardless of a spoofed name", () => {
    const bytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(64, "a")]);
    expect(validateVerificationUpload({ filename: "cv.exe", mimeType: pdfMime, bytes, maxBytes })).toBeNull();
    expect(sniffFileKind(bytes)).toBe("pdf");
  });

  it("refuses an empty file", () => {
    expect(
      validateVerificationUpload({ filename: "x.pdf", mimeType: pdfMime, bytes: Buffer.alloc(0), maxBytes }),
    ).toBe("FILE_EMPTY");
  });

  it("refuses an oversized file before any sniffing", () => {
    const bytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(128)]);
    expect(
      validateVerificationUpload({ filename: "x.pdf", mimeType: pdfMime, bytes, maxBytes: 64 }),
    ).toBe("FILE_TOO_LARGE");
  });

  it("refuses a Windows executable even when it claims to be a document", () => {
    const bytes = Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(128, 0)]);
    expect(
      validateVerificationUpload({ filename: "fake.doc", mimeType: docMime, bytes, maxBytes }),
    ).toBe("EXECUTABLE_NOT_ALLOWED");
    expect(sniffFileKind(bytes)).toBeNull();
  });

  it("refuses a plain ZIP that is not a Word document", () => {
    const bytes = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(256, 0)]);
    expect(
      validateVerificationUpload({ filename: "archive.docx", mimeType: docxMime, bytes, maxBytes }),
    ).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("accepts a DOCX container that carries word/ parts", () => {
    const bytes = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from("word/document.xml"),
      Buffer.alloc(256, 0),
    ]);
    expect(validateVerificationUpload({ filename: "doc.docx", mimeType: docxMime, bytes, maxBytes })).toBeNull();
  });

  it("refuses macro carriers in both legacy and OOXML containers", () => {
    const doc = Buffer.concat([
      Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
      Buffer.from("_VBA_PROJECT"),
      Buffer.alloc(64, 0),
    ]);
    expect(validateVerificationUpload({ filename: "macro.doc", mimeType: docMime, bytes: doc, maxBytes })).toBe(
      "MACROS_NOT_ALLOWED",
    );

    const docx = Buffer.concat([
      Buffer.from([0x50, 0x4b, 0x03, 0x04]),
      Buffer.from("word/vbaProject.bin"),
      Buffer.alloc(64, 0),
    ]);
    expect(validateVerificationUpload({ filename: "macro.docx", mimeType: docxMime, bytes: docx, maxBytes })).toBe(
      "MACROS_NOT_ALLOWED",
    );
  });

  it("refuses a declared type that contradicts the actual bytes", () => {
    const bytes = Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(64)]);
    expect(validateVerificationUpload({ filename: "x.jpg", mimeType: jpegMime, bytes, maxBytes })).toBe(
      "TYPE_MISMATCH",
    );
  });

  it("refuses a declared MIME type outside the accepted list", () => {
    const bytes = Buffer.from("%PDF-1.4\n");
    expect(
      validateVerificationUpload({ filename: "x.zip", mimeType: "application/zip", bytes, maxBytes }),
    ).toBe("UNSUPPORTED_FILE_TYPE");
  });

  it("configures size and retention from the environment", () => {
    expect(verifyMaxBytes({ VERIFY_MAX_BYTES: "2048" })).toBe(2048);
    expect(verifyMaxBytes({ VERIFY_MAX_BYTES: "nonsense" })).toBe(10 * 1024 * 1024);
    expect(verifyRetentionDays({ VERIFY_RETENTION_DAYS: "30" })).toBe(30);
    expect(verifyRetentionDays({ VERIFY_RETENTION_DAYS: "4000" })).toBe(90);
    expect(formatHumanBytes(10 * 1024 * 1024)).toBe("10 Mo");
  });
});

// ── Invoices ─────────────────────────────────────────────────────────────────

describe("invoice numbering and body", () => {
  it("numbers sequentially with zero padding", () => {
    expect(formatInvoiceNumber(2026, 1)).toBe("WQI-2026-0001");
    expect(formatInvoiceNumber(2026, 1247)).toBe("WQI-2026-1247");
  });

  const basePayment = {
    id: "pay-1",
    amount: 348,
    currency: "MAD",
    paidAt: new Date("2026-10-25T12:00:00Z"),
    provider: "mock",
  };

  it("prints the HT / VAT / TTC ladder from the stored metadata", () => {
    const body = renderInvoiceBody({
      invoiceNumber: "WQI-2026-0001",
      issuedAt: new Date("2026-10-25T12:00:00Z"),
      payment: {
        ...basePayment,
        metadata: {
          lines: [{ labelFr: "Vérification assistée d'un document existant", amount: 290 }],
          vat: { subtotal: 290, vatAmount: 58, total: 348, labelFr: "TVA 20 %", rate: 0.2 },
        },
      },
      caseReference: "WQC-2026-001",
      caseTypeFr: "Contrat de bail",
      buyerEmail: "client@example.ma",
      buyerName: null,
    });

    expect(body).toContain("Facture WQI-2026-0001");
    expect(body).toContain("Vérification assistée d'un document existant : 290.00 MAD HT");
    expect(body).toContain("Total HT : 290.00 MAD");
    expect(body).toContain("TVA 20 % : 58.00 MAD");
    expect(body).toContain("Total TTC : 348.00 MAD");
    expect(body).toContain("Dossier WQC-2026-001 — Contrat de bail");
  });

  it("falls back to the charged amount when metadata is missing", () => {
    const body = renderInvoiceBody({
      invoiceNumber: "WQI-2026-0002",
      issuedAt: new Date(),
      payment: { ...basePayment, metadata: null },
      caseReference: null,
      caseTypeFr: null,
      buyerEmail: null,
      buyerName: null,
    });

    expect(body).toContain("Prestation : 348.00 MAD HT");
    expect(body).toContain("Courriel : (à compléter)");
  });

  it("never presents the invoice as a conformity notice or an official act", () => {
    const body = renderInvoiceBody({
      invoiceNumber: "WQI-2026-0003",
      issuedAt: new Date(),
      payment: { ...basePayment, metadata: null },
      caseReference: "WQV-2026-009",
      caseTypeFr: null,
      buyerEmail: "a@b.ma",
      buyerName: null,
    });

    expect(body).toMatch(/à valider selon votre situation/);
    expect(body).not.toMatch(/conforme/i);
    expect(body).not.toMatch(/Royaume du Maroc/);
  });
});
