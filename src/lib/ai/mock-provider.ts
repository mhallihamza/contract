import {
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
import { INTENT_LEXICON, looksArabic, looksDarija, normalizeText } from "./intent-lexicon";
import { buildLawyerSummary } from "./lawyer-summary";
import { formatCaseValue } from "@/lib/contracts/fields";

/**
 * Deterministic provider (default).
 *
 * Keyword and pattern based, fully offline: the same input always produces the
 * same structured intent. Used in tests, in the demo and as the safe fallback
 * whenever a remote provider fails or returns invalid output (§40).
 */
export class MockAIProvider implements AIProvider {
  readonly name = "mock-deterministic";
  readonly kind = "mock" as const;

  async classifyIntent(input: ClassifyIntentInput): Promise<IntentClassification> {
    const normalized = normalizeText(input.text);
    const allowed = new Set(input.catalog.map((entry) => entry.code));

    const scored = INTENT_LEXICON.filter(
      (entry) => allowed.size === 0 || allowed.has(entry.contractTypeCode),
    )
      .map((entry) => {
        let score = 0;
        for (const keyword of entry.keywords) {
          const normalizedKeyword = normalizeText(keyword);
          if (normalizedKeyword.length > 0 && normalized.includes(normalizedKeyword)) {
            score += 1 + Math.min(1.5, normalizedKeyword.length / 12);
          }
        }
        return { entry, score };
      })
      .filter((candidate) => candidate.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0];
    const language: IntentClassification["language"] = looksArabic(input.text) ? "ar" : input.locale === "ar" ? "ar" : "fr";
    const dialect: IntentClassification["dialect"] = looksDarija(input.text) ? "darija" : language === "ar" ? "standard" : "na";

    if (!best) {
      const unknown: IntentClassification = {
        intentCode: "UNKNOWN",
        confidence: 0.2,
        language,
        dialect,
        summaryFr: "Nous n'avons pas identifié de type de document à partir de cette description.",
        summaryAr: "لم نتعرّف على نوع الوثيقة انطلاقاً من هذا الوصف.",
        extractedFacts: {},
        missingInformation: ["Préciser l'objectif du client"],
        ambiguities: ["Aucun cas d'usage de la plateforme n'a été reconnu"],
        candidateContractTypes: [],
      };
      return intentClassificationSchema.parse(unknown);
    }

    const catalogEntry = input.catalog.find((entry) => entry.code === best.entry.contractTypeCode);
    const facts = extractKnownFields(input.text, []);
    const confidence = Math.min(0.95, 0.5 + best.score * 0.08);
    const alternatives = scored.slice(1, 3).map((candidate) => candidate.entry.contractTypeCode);

    const extractedLines = Object.entries(facts).map(([key, value]) => `${key}: ${formatCaseValue(value as never)}`);
    const summaryFr = [
      catalogEntry ? `Objectif identifié : ${catalogEntry.nameFr}.` : `Objectif identifié : ${best.entry.intentCode}.`,
      extractedLines.length > 0 ? `Éléments reconnus — ${extractedLines.join(", ")}.` : "",
      alternatives.length > 0 ? `Autres pistes possibles : ${alternatives.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const summaryAr = [
      catalogEntry ? `الهدف المحدد: ${catalogEntry.nameAr}.` : `الهدف المحدد: ${best.entry.intentCode}.`,
      extractedLines.length > 0 ? `عناصر مستخلصة — ${extractedLines.join("، ")}.` : "",
      alternatives.length > 0 ? `مسارات أخرى محتملة: ${alternatives.join("، ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");

    const classification: IntentClassification = {
      intentCode: best.entry.intentCode,
      confidence,
      language,
      dialect,
      summaryFr,
      summaryAr,
      extractedFacts: facts,
      missingInformation: confidence < 0.6 ? ["Confirmer le type de document souhaité"] : [],
      ambiguities: alternatives.length > 0 ? [`Plusieurs cas d'usage possibles : ${alternatives.join(", ")}`] : [],
      candidateContractTypes: [best.entry.contractTypeCode, ...alternatives],
    };

    return intentClassificationSchema.parse(classification);
  }

  async generateQuestions(input: GenerateQuestionsInput): Promise<{ questionFr: string; questionAr: string }[]> {
    // The deterministic questionnaire already covers §41; no extra question is
    // invented. Kept as part of the interface for future providers.
    void input;
    return [];
  }

  async extractStructuredData(input: ExtractStructuredDataInput): Promise<Record<string, string | number | boolean>> {
    return extractKnownFields(input.text, input.fieldKeys);
  }

  async generateDraft(input: GenerateDraftInput): Promise<{ introduction: string[]; notes: string[] }> {
    const facts = Object.entries(input.facts).slice(0, 12).map(([key, value]) => `${key} = ${formatCaseValue(value as never)}`);
    const introduction =
      input.language === "ar"
        ? ["أُعِدّ هذا المشروع انطلاقاً من نموذج معتمد ومن المعلومات التي قدّمها الأطراف. تُدرج المواصفات المهنية في الفصول المخصصة لذلك."]
        : ["Ce projet est préparé à partir d'un modèle approuvé et des informations fournies par les parties. Les spécificités professionnelles sont reprises dans les clauses dédiées."];
    return {
      introduction,
      notes: [`Canevas approuvé — ${facts.join(" · ")}`],
    };
  }

  async summarizeForLawyer(input: SummarizeForLawyerInput): Promise<LawyerSummary> {
    return buildLawyerSummary(input);
  }
}
