import { AlertTriangle } from "lucide-react";
import { AssistantPanel } from "@/components/marketing/assistant-panel";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = {
  title: "Trouver mon document — assistant",
  description:
    "Décrivez votre situation et découvrez le document juridique correspondant. L'assistant ne décide jamais du droit applicable.",
};

/**
 * Assistant page (§28).
 *
 * Deliberately *not* the homepage and deliberately not a chat product: one input,
 * a handful of examples, and a route into the catalogue.
 */
export default async function AssistantPage() {
  const { locale, d } = await getServerI18n();
  const t = d.public.assistant;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{t.eyebrow}</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.title}</h1>
        <p className="text-sm text-muted-foreground sm:text-base" dir="auto">
          {t.subtitle}
        </p>
      </div>

      <div className="mt-10">
        <AssistantPanel
          locale={locale}
          labels={{
            placeholder: t.placeholder,
            cta: t.cta,
            analyzing: t.analyzing,
            resultTitle: t.resultTitle,
            viewDocument: t.viewDocument,
            clarify: t.clarify,
            browse: t.browse,
            error: t.error,
            summaryLabel: t.summaryLabel,
          }}
          examples={d.landing.examples}
        />
      </div>

      <p className="mt-10 flex items-start gap-2 text-xs text-muted-foreground" dir="auto">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {t.disclaimer}
      </p>
    </div>
  );
}
