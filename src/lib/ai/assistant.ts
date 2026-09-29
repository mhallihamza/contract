import { classifyIntentSafely } from "@/lib/ai";
import { db } from "@/lib/db/prisma";
import { logger } from "@/lib/logging";

/**
 * "I don't know which document I need" (§28).
 *
 * The assistant understands the sentence and points at a *catalogue entry*. It
 * never decides a legal question: it does not say which rules apply, whether a
 * lawyer is required or whether a document is valid. Those answers come from the
 * verified rule engine after the questionnaire, and the routing decision is what
 * the user actually sees (§45).
 */

export interface AssistantSuggestion {
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  category: string;
}

export interface AssistantAnswer {
  /** False when no catalogue entry matched the sentence. */
  understood: boolean;
  intentCode: string;
  confidence: number;
  language: string;
  dialect: string;
  summaryFr: string;
  summaryAr: string;
  suggestions: AssistantSuggestion[];
  providerName: string;
  fellBack: boolean;
  /** True when the platform prefers to ask a clarifying question (§45). */
  needsClarification: boolean;
}

/** Below this score the assistant says so instead of guessing. */
export const ASSISTANT_MIN_CONFIDENCE = 0.35;

export async function askAssistant(params: { text: string; locale: "fr" | "ar" }): Promise<AssistantAnswer> {
  const text = params.text.trim();
  if (text.length < 3) throw new Error("INTENT_TEXT_TOO_SHORT");

  const types = await db.contractType.findMany({
    where: { active: true, status: "ACTIVE" },
    orderBy: { nameFr: "asc" },
    select: {
      code: true,
      slug: true,
      nameFr: true,
      nameAr: true,
      descriptionFr: true,
      descriptionAr: true,
      category: true,
      intents: true,
    },
  });

  const { classification, providerName, fellBack } = await classifyIntentSafely({
    text,
    locale: params.locale,
    catalog: types.map((type) => ({
      code: type.code,
      nameFr: type.nameFr,
      nameAr: type.nameAr,
      category: type.category,
      intents: type.intents,
    })),
  });

  const byCode = new Map(types.map((type) => [type.code, type]));
  const suggestions: AssistantSuggestion[] = classification.candidateContractTypes
    .map((code) => byCode.get(code))
    .filter((type): type is NonNullable<typeof type> => Boolean(type))
    .slice(0, 3)
    .map((type) => ({
      code: type.code,
      slug: type.slug,
      nameFr: type.nameFr,
      nameAr: type.nameAr,
      descriptionFr: type.descriptionFr ?? "",
      descriptionAr: type.descriptionAr ?? "",
      category: type.category,
    }));

  const needsClarification = suggestions.length === 0 || classification.confidence < ASSISTANT_MIN_CONFIDENCE;

  logger.info("assistant.intent", {
    intentCode: classification.intentCode,
    confidence: classification.confidence,
    providerName,
    fellBack,
    suggestions: suggestions.length,
  });

  return {
    understood: suggestions.length > 0 && !needsClarification,
    intentCode: classification.intentCode,
    confidence: classification.confidence,
    language: classification.language,
    dialect: classification.dialect,
    summaryFr: classification.summaryFr,
    summaryAr: classification.summaryAr,
    suggestions,
    providerName,
    fellBack,
    needsClarification,
  };
}
