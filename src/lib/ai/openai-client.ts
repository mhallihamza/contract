import { AIProviderError } from "./ai-provider";
import { LOG_EVENTS, logger } from "@/lib/logging";

/**
 * Thin OpenAI-compatible JSON chat client.
 *
 * Kept separate from the provider so a failure mode (network, timeout, invalid
 * JSON) is handled in exactly one place.
 */
export class OpenAIJsonClient {
  constructor(
    private readonly apiKey: string,
    readonly model: string,
    private readonly baseUrl = "https://api.openai.com/v1",
    private readonly timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 20000),
  ) {}

  static readonly SYSTEM_PROMPT = [
    "Tu es un assistant d'ingénierie documentaire pour une plateforme juridique marocaine.",
    "Tu comprends le français, l'arabe standard et la darija marocaine.",
    "Règles absolues :",
    "- Tu ne donnes jamais de conclusion juridique et tu n'inventes jamais de loi, d'article, de numéro de texte ou de citation.",
    "- Tu ne décides jamais si un avocat, une signature ou un autre professionnel est nécessaire.",
    "- Tu ne produis aucun texte contractuel en dehors du canevas approuvé fourni par la plateforme.",
    "- Tu réponds uniquement par un objet JSON valide conforme au schéma demandé.",
  ].join("\n");

  async json(messages: { role: "system" | "user"; content: string }[], maxTokens = 900): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    const started = Date.now();
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        signal: controller.signal,
        headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.1,
          max_tokens: maxTokens,
          response_format: { type: "json_object" },
          messages,
        }),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new AIProviderError(`Provider responded ${response.status}: ${text.slice(0, 180)}`);
      }
      const payload = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const content = payload.choices?.[0]?.message?.content;
      if (!content) throw new AIProviderError("Empty completion");
      logger.info(LOG_EVENTS.aiCall, { provider: `openai:${this.model}`, ms: Date.now() - started });
      try {
        return JSON.parse(content);
      } catch {
        throw new AIProviderError("Completion was not valid JSON");
      }
    } catch (error) {
      logger.error(LOG_EVENTS.aiCall, {
        provider: `openai:${this.model}`,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error instanceof AIProviderError ? error : new AIProviderError("AI request failed", error);
    } finally {
      clearTimeout(timer);
    }
  }
}
