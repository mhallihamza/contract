import {
  AIInvalidOutputError,
  intentClassificationSchema,
  type AIProvider,
  type ClassifyIntentInput,
  type ExtractStructuredDataInput,
  type GenerateDraftInput,
  type GenerateQuestionsInput,
  type IntentClassification,
  type LawyerSummary,
  type SummarizeForLawyerInput,
} from "./ai-provider";
import { extractKnownFields } from "./extract-facts";
import { buildLawyerSummary } from "./lawyer-summary";
import { OpenAIJsonClient } from "./openai-client";

/**
 * OpenAI-compatible provider.
 *
 * Every response is validated with Zod; invalid or out-of-contract output is
 * rejected so the caller can fall back to the deterministic provider (§40).
 */
export class OpenAIProvider implements AIProvider {
  readonly name: string;
  readonly kind = "openai" as const;
  private readonly client: OpenAIJsonClient;

  constructor(apiKey: string, model: string, baseUrl?: string, timeoutMs?: number) {
    this.client = new OpenAIJsonClient(apiKey, model, baseUrl, timeoutMs);
    this.name = `openai:${model}`;
  }

  async classifyIntent(input: ClassifyIntentInput): Promise<IntentClassification> {
    const catalog = input.catalog
      .map((entry) => `- ${entry.code} | FR: ${entry.nameFr} | AR: ${entry.nameAr} | catégorie: ${entry.category}`)
      .join("\n");

    const parsed = await this.client.json([
      { role: "system", content: OpenAIJsonClient.SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          "Classe la demande du client dans UN SEUL type de document de la liste ci-dessous (ou UNKNOWN).",
          "Liste autorisée :",
          catalog,
          "",
          `Langue détectée de la demande : ${input.locale}`,
          `Demande du client : """${input.text}"""`,
          "",
          "Réponds en JSON avec exactement ces clés :",
          '{"intentCode": string, "confidence": number, "language": "ar"|"fr"|"en",',
          ' "dialect": "darija"|"standard"|"na", "summaryFr": string, "summaryAr": string,',
          ' "extractedFacts": object, "missingInformation": string[], "ambiguities": string[],',
          ' "candidateContractTypes": string[]}',
          "N'utilise que les informations explicitement présentes ; ne devine aucun montant, date ou durée.",
        ].join("\n"),
      },
    ]);

    const result = intentClassificationSchema.safeParse(parsed);
    if (!result.success) {
      throw new AIInvalidOutputError(result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`));
    }

    // Cross-check: only keep facts that can be traced back to the text.
    const verified = extractKnownFields(input.text, []);
    const extracted: Record<string, string | number | boolean> = {};
    for (const [key, value] of Object.entries(result.data.extractedFacts)) {
      if (key in verified || (typeof value !== "number" && String(input.text).includes(String(value)))) {
        extracted[key] = value;
      }
    }
    return { ...result.data, extractedFacts: { ...verified, ...extracted } };
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<{ questionFr: string; questionAr: string }[]> {
    void input; // Advisory only — the questionnaire is deterministic (§41).
    return [];
  }

  async extractStructuredData(input: ExtractStructuredDataInput): Promise<Record<string, string | number | boolean>> {
    const parsed = (await this.client.json([
      { role: "system", content: OpenAIJsonClient.SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          `Extrais uniquement les valeurs explicitement présentes pour ces clés : ${input.fieldKeys.join(", ")}.`,
          `Texte : """${input.text}"""`,
          "Réponds par un objet JSON sans aucune clé non demandée, et sans clé dont la valeur est absente du texte.",
        ].join("\n"),
      },
    ])) as Record<string, unknown> | null;

    if (!parsed || typeof parsed !== "object") throw new AIInvalidOutputError(["Objet JSON attendu"]);
    const verified = extractKnownFields(input.text, input.fieldKeys);
    const output: Record<string, string | number | boolean> = {};
    for (const key of input.fieldKeys) {
      const value = (parsed as Record<string, unknown>)[key];
      if (value === undefined || value === null) continue;
      if (typeof value === "string" && value.trim() === "") continue;
      output[key] = value as string | number | boolean;
    }
    return { ...verified, ...output };
  }

  async generateDraft(input: GenerateDraftInput): Promise<{ introduction: string[]; notes: string[] }> {
    const parsed = (await this.client.json([
      { role: "system", content: OpenAIJsonClient.SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          "Rédige un court paragraphe d'introduction (3 phrases maximum) et des notes internes.",
          "Aucune clause, aucun numéro d'article, aucune référence légale ne doit être créé.",
          `Langue de sortie : ${input.language === "ar" ? "arabe" : "français"}.`,
          `Faits : ${JSON.stringify(input.facts)}`,
          `Canevas approuvé (ne pas modifier) : """${input.approvedBody.slice(0, 1500)}"""`,
          'Réponds en JSON : {"introduction": string[], "notes": string[]}',
        ].join("\n"),
      },
    ])) as { introduction?: unknown; notes?: unknown } | null;

    if (!parsed || typeof parsed !== "object") throw new AIInvalidOutputError(["Objet JSON attendu"]);
    const introduction = Array.isArray(parsed.introduction) ? parsed.introduction.map(String) : [];
    const notes = Array.isArray(parsed.notes) ? parsed.notes.map(String) : [];
    if (introduction.length === 0) throw new AIInvalidOutputError(["Introduction manquante"]);
    return { introduction, notes };
  }

  async summarizeForLawyer(input: SummarizeForLawyerInput): Promise<LawyerSummary> {
    // The lawyer summary is assembled from structured facts only (§42): the
    // model is deliberately not involved in legal content.
    return buildLawyerSummary(input);
  }
}
