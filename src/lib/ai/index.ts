import { AIProviderError, type AIProvider, type ClassifyIntentInput, type IntentClassification } from "./ai-provider";
import { MockAIProvider } from "./mock-provider";
import { OpenAIProvider } from "./openai-provider";
import { LOG_EVENTS, logger } from "@/lib/logging";

/**
 * Provider selection and safe execution (§9, §40, §48).
 *
 * AI_PROVIDER selects the implementation. When a remote provider is configured
 * but fails (network, invalid JSON, timeout), the call transparently falls back
 * to the deterministic provider and records an audit-friendly log line — the
 * product keeps working instead of showing a dead end.
 */

let cached: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  if (cached) return cached;
  const configured = (process.env.AI_PROVIDER ?? "mock").toLowerCase();
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (configured === "openai" && apiKey) {
    cached = new OpenAIProvider(
      apiKey,
      process.env.AI_MODEL?.trim() || "gpt-4o-mini",
      process.env.OPENAI_BASE_URL?.trim() || undefined,
    );
  } else {
    cached = new MockAIProvider();
  }
  return cached;
}

/** Test helper: injects a provider (or resets to the configured one). */
export function setAIProviderForTesting(provider: AIProvider | null): void {
  cached = provider;
}

export interface ClassifyIntentResult {
  classification: IntentClassification;
  providerName: string;
  fellBack: boolean;
}

/** Classifies intent with automatic, logged fallback on any provider failure. */
export async function classifyIntentSafely(input: ClassifyIntentInput): Promise<ClassifyIntentResult> {
  const provider = getAIProvider();
  try {
    const classification = await provider.classifyIntent(input);
    return { classification, providerName: provider.name, fellBack: false };
  } catch (error) {
    if (provider.kind === "mock") throw error;
    logger.warn(LOG_EVENTS.aiFallback, {
      provider: provider.name,
      reason: error instanceof AIProviderError ? error.message : String(error),
    });
    const fallback = new MockAIProvider();
    const classification = await fallback.classifyIntent(input);
    return { classification, providerName: fallback.name, fellBack: true };
  }
}

export { AIInvalidOutputError, AIProviderError } from "./ai-provider";
export type { AIProvider, IntentClassification } from "./ai-provider";
