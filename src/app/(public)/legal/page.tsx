import type { Metadata } from "next";
import { appConfig } from "@/lib/config";
import { getServerI18n } from "@/lib/i18n/server";

/** Legal information is read in the visitor's own language (§38). */
export async function generateMetadata(): Promise<Metadata> {
  const { d } = await getServerI18n();
  const t = d.public.legalDoc;

  return {
    title: t.title,
    description: t.intro,
    alternates: { canonical: "/legal" },
    robots: { index: true, follow: true },
  };
}

/**
 * Legal information (§18 links, §38 transparency).
 *
 * Deliberately descriptive: it states what the deployment *is* (a demonstration
 * environment with a simulated payment provider), what the platform does with a
 * case (private link, role-scoped access, timestamped history, deletion on
 * request) and which two cookies are actually set. No company identity is
 * invented — the page says so, and asks the operator to complete it.
 */
export default async function LegalPage() {
  const { d } = await getServerI18n();
  const t = d.public.legalDoc;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6 lg:py-20">
      <header className="space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">{t.eyebrow}</p>
        <h1 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-navy sm:text-[2.5rem]">
          {t.title}
        </h1>
        <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
          {t.intro}
        </p>
      </header>

      <div className="mt-12 space-y-10">
        {t.sections.map((section) => (
          <section key={section.id} id={section.id} className="space-y-3">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-navy" dir="auto">
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted" dir="auto">
              {section.body}
            </p>
            <ul className="space-y-2">
              {section.bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2.5 text-sm leading-relaxed text-navy" dir="auto">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-navy/30" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-12 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-hairline pt-6 text-xs text-ink-muted">
        <span dir="auto">{d.public.home.footer.links.contact} :</span>
        <a
          href={`mailto:${appConfig.supportEmail}`}
          className="font-medium text-navy underline-offset-2 hover:underline"
          dir="ltr"
        >
          {appConfig.supportEmail}
        </a>
      </p>
    </div>
  );
}
