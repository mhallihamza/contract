"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

/**
 * Assistant panel (§28).
 *
 * Secondary by design: it turns a free-form sentence into catalogue suggestions
 * and nothing more. Suggestions are ordinary links to product pages — the visitor
 * always keeps the catalogue route, and no legal decision is made here.
 */
export interface AssistantSuggestionView {
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
}

interface AssistantAnswerView {
  understood: boolean;
  needsClarification: boolean;
  summaryFr: string;
  summaryAr: string;
  suggestions: AssistantSuggestionView[];
}

export function AssistantPanel({
  locale,
  labels,
  examples,
}: {
  locale: "fr" | "ar";
  labels: {
    placeholder: string;
    cta: string;
    analyzing: string;
    resultTitle: string;
    viewDocument: string;
    clarify: string;
    browse: string;
    error: string;
    summaryLabel: string;
  };
  examples: readonly string[];
}) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [answer, setAnswer] = useState<AssistantAnswerView | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    if (text.trim().length < 3) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/assistant/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const payload = (await response.json()) as { ok: boolean; data?: AssistantAnswerView };
      if (!response.ok || !payload.ok || !payload.data) {
        setAnswer(null);
        setError(labels.error);
        return;
      }
      setAnswer(payload.data);
    } catch {
      setAnswer(null);
      setError(labels.error);
    } finally {
      setPending(false);
    }
  }

  const name = (suggestion: AssistantSuggestionView) => (locale === "ar" ? suggestion.nameAr : suggestion.nameFr);
  const description = (suggestion: AssistantSuggestionView) =>
    locale === "ar" ? suggestion.descriptionAr : suggestion.descriptionFr;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={labels.placeholder}
          rows={3}
          dir="auto"
          aria-label={labels.placeholder}
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" onClick={ask} disabled={pending || text.trim().length < 3}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Search className="h-4 w-4" aria-hidden />}
            {pending ? labels.analyzing : labels.cta}
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/contracts">{labels.browse}</Link>
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setText(example)}
              className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              dir="auto"
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive" dir="auto">
          {error}
        </p>
      ) : null}

      {answer ? (
        <Card>
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">
              {answer.suggestions.length > 0 ? labels.resultTitle : labels.clarify}
            </CardTitle>
            <p className="flex items-start gap-2 text-xs text-muted-foreground" dir="auto">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {locale === "ar" ? answer.summaryAr : answer.summaryFr}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {answer.suggestions.map((suggestion) => (
              <div
                key={suggestion.code}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">{name(suggestion)}</p>
                  <p className="text-xs text-muted-foreground" dir="auto">
                    {description(suggestion)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm">
                    <Link href={`/contracts/${suggestion.slug}`}>
                      {labels.viewDocument}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}

            {answer.suggestions.length === 0 ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/contracts">{labels.browse}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
