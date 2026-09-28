import { z } from "zod";

/**
 * AI provider abstraction (§9) and structured output contract (§40).
 *
 * The model understands language, extracts facts, phrases prose and summarises.
 * It never decides a legal route, never invents a legal source and never
 * overrides configured rules — those live in the routing engine.
 */

export const intentClassificationSchema = z.object({
  intentCode: z.string().min(1),
  confidence: z.number().min(0).max(1),
  language: z.enum(["ar", "fr", "en"]),
  dialect: z.enum(["darija", "standard", "na"]).default("na"),
  summaryFr: z.string().min(1),
  summaryAr: z.string().min(1),
  extractedFacts: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).default({}),
  missingInformation: z.array(z.string()).default([]),
  ambiguities: z.array(z.string()).default([]),
  candidateContractTypes: z.array(z.string()).default([]),
});

export type IntentClassification = z.infer<typeof intentClassificationSchema>;

export const lawyerSummarySchema = z.object({
  objective: z.string(),
  parties: z.array(z.string()),
  facts: z.array(z.string()),
  keyTerms: z.array(z.string()),
  documents: z.array(z.string()),
  missingInformation: z.array(z.string()),
  routingSummary: z.string(),
  configuredRules: z.array(z.string()),
  draftSummary: z.string(),
  reviewAreas: z.array(z.string()),
  aiGenerated: z.literal(true),
});

export type LawyerSummary = z.infer<typeof lawyerSummarySchema>;

export interface ClassifyIntentInput {
  text: string;
  locale: "fr" | "ar";
  /** Contract types the platform can prepare (code + bilingual names + intents). */
  catalog: {
    code: string;
    nameFr: string;
    nameAr: string;
    category: string;
    intents: string[];
  }[];
}

export interface GenerateQuestionsInput {
  contractTypeCode: string;
  /** Deterministic questions already produced by the question engine. */
  knownQuestions: { key: string; labelFr: string; labelAr: string }[];
  caseData: Record<string, unknown>;
}

export interface ExtractStructuredDataInput {
  text: string;
  contractTypeCode: string;
  fieldKeys: string[];
}

export interface GenerateDraftInput {
  contractTypeCode: string;
  language: "fr" | "ar";
  facts: Record<string, unknown>;
  /** Rendered template body — the model may add nothing beyond approved text. */
  approvedBody: string;
}

export interface SummarizeForLawyerInput {
  objective: string;
  facts: Record<string, unknown>;
  parties: { role: string; name: string; type: string }[];
  documents: string[];
  missingInformation: string[];
  routingSummary: string;
  configuredRules: string[];
  draftSummary: string;
}

export interface AIProvider {
  readonly name: string;
  readonly kind: "mock" | "openai";
  /** Natural-language understanding of the client's objective. */
  classifyIntent(input: ClassifyIntentInput): Promise<IntentClassification>;
  /** Advisory clarifications only — never the authoritative questionnaire. */
  generateQuestions(input: GenerateQuestionsInput): Promise<{ questionFr: string; questionAr: string }[]>;
  extractStructuredData(input: ExtractStructuredDataInput): Promise<Record<string, string | number | boolean>>;
  /** Prose assistance inside the approved template architecture (§15). */
  generateDraft(input: GenerateDraftInput): Promise<{ introduction: string[]; notes: string[] }>;
  summarizeForLawyer(input: SummarizeForLawyerInput): Promise<LawyerSummary>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly cause2?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}

export class AIInvalidOutputError extends AIProviderError {
  constructor(readonly issues: string[]) {
    super(`AI output failed validation: ${issues.join("; ")}`);
    this.name = "AIInvalidOutputError";
  }
}
