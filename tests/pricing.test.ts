import { describe, expect, it } from "vitest";
import { SERVICE_PRICING, vatRate } from "@/lib/config";
import { applyVat, payableTotal, quoteService, quoteVerification, signatureFee, withVat } from "@/lib/payments/pricing";

/**
 * Pricing invariants (§27).
 *
 * The price is always derived server-side from the routing decision and the
 * service actually requested; there is no code path where an amount comes from the
 * client. These tests pin the mapping down.
 */

const currency = process.env.PAYMENT_CURRENCY?.trim() ?? "MAD";

describe("quoteService", () => {
  it("prices a self-service case with the single preparation line", () => {
    const quote = quoteService({ route: "SELF_SERVICE", lawyerServiceSelected: false, signatureRequired: false });

    expect(quote.payable).toBe(true);
    expect(quote.type).toBe("SELF_SERVICE_CONTRACT");
    expect(quote.amount).toBe(SERVICE_PRICING.selfService);
    expect(quote.lines.map((line) => line.key)).toEqual(["SELF_SERVICE"]);
    expect(quote.currency).toBe(currency);
  });

  it("keeps the self-service price when the client declines the optional review", () => {
    const quote = quoteService({ route: "LAWYER_OPTIONAL", lawyerServiceSelected: false, signatureRequired: true });

    expect(quote.type).toBe("SELF_SERVICE_CONTRACT");
    expect(quote.amount).toBe(SERVICE_PRICING.selfService);
    expect(quote.lines.map((line) => line.key)).toEqual(["SELF_SERVICE"]);
  });

  it("adds the signature line when a reviewed case also needs a signature", () => {
    const quote = quoteService({ route: "LAWYER_OPTIONAL", lawyerServiceSelected: true, signatureRequired: true });

    expect(quote.type).toBe("LAWYER_REVIEW");
    expect(quote.lines.map((line) => line.key)).toEqual(["LAWYER_REVIEW", "SIGNATURE"]);
    expect(quote.amount).toBe(SERVICE_PRICING.lawyerReview + SERVICE_PRICING.signature);
  });

  it("always bills lawyer and signature together on a signature-required route", () => {
    const quote = quoteService({ route: "LAWYER_SIGNATURE_REQUIRED", lawyerServiceSelected: true, signatureRequired: false });

    expect(quote.type).toBe("LAWYER_REQUIRED_SERVICE");
    expect(quote.lines.map((line) => line.key)).toEqual(["LAWYER_REQUIRED", "SIGNATURE"]);
    expect(quote.amount).toBe(SERVICE_PRICING.lawyerRequired + SERVICE_PRICING.signature);
  });

  it("never asks for money on a route the platform cannot serve", () => {
    for (const route of ["SPECIALIST_REQUIRED", "UNSUPPORTED", "ROUTING_UNDETERMINED"] as const) {
      const quote = quoteService({ route, lawyerServiceSelected: false, signatureRequired: false });
      expect(quote.payable, `${route} must not be payable`).toBe(false);
      expect(quote.type).toBeNull();
      expect(quote.amount).toBe(0);
      expect(quote.lines).toHaveLength(0);
    }
  });

  it("derives the total from the quoted lines only", () => {
    const quote = quoteService({ route: "LAWYER_REQUIRED", lawyerServiceSelected: true, signatureRequired: true });
    const sum = quote.lines.reduce((total, line) => total + line.amount, 0);

    expect(quote.amount).toBe(sum);
    expect(signatureFee()).toBe(SERVICE_PRICING.signature);
  });
});

describe("quoteVerification", () => {
  it("prices the assisted tier at the single published verification price", () => {
    const quote = quoteVerification({ tier: "ASSISTED", currency });

    expect(quote.payable).toBe(true);
    expect(quote.type).toBe("VERIFICATION_ASSISTED");
    expect(quote.amount).toBe(SERVICE_PRICING.verificationAssisted);
    expect(quote.lines.map((line) => line.key)).toEqual(["VERIFICATION_ASSISTED"]);
    expect(quote.currency).toBe(currency);
  });

  it("reuses the standard lawyer-review price for the lawyer tier", () => {
    const quote = quoteVerification({ tier: "LAWYER", currency });

    expect(quote.payable).toBe(true);
    expect(quote.type).toBe("LAWYER_REVIEW");
    expect(quote.amount).toBe(SERVICE_PRICING.lawyerReview);
    expect(quote.lines.map((line) => line.key)).toEqual(["LAWYER_REVIEW"]);
  });
});

describe("VAT at checkout", () => {
  it("uses the configurable default rate (Morocco standard: 20 %)", () => {
    expect(vatRate({})).toBe(0.2);
    expect(vatRate({ VAT_RATE: "0.1" })).toBe(0.1);
    // Out-of-range or malformed values fall back to the default, never to 0.
    expect(vatRate({ VAT_RATE: "nonsense" })).toBe(0.2);
    expect(vatRate({ VAT_RATE: "1.5" })).toBe(0.2);
  });

  it("computes the tax-inclusive total from the HT price", () => {
    const vat = withVat(290, "MAD", {});

    expect(vat.rate).toBe(0.2);
    expect(vat.vatAmount).toBe(58);
    expect(vat.total).toBe(348);
  });

  it("never rounds money away: the total keeps two decimals", () => {
    const vat = withVat(79.35, "MAD", {});
    expect(vat.vatAmount).toBe(15.87);
    expect(vat.total).toBe(95.22);
  });

  it("applies VAT only to payable quotes", () => {
    const payable = applyVat(quoteVerification({ tier: "ASSISTED", currency }), {});
    expect(payable.vat?.total).toBe(SERVICE_PRICING.verificationAssisted * 1.2);
    expect(payableTotal(payable)).toBe(SERVICE_PRICING.verificationAssisted * 1.2);

    const unpaid = quoteService({ route: "UNSUPPORTED", lawyerServiceSelected: false, signatureRequired: false });
    expect(applyVat(unpaid, {}).vat).toBeNull();
  });
});
