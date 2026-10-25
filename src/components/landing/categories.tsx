import Link from "next/link";
import {
  ArrowRight,
  Building,
  Columns3,
  FileCheck,
  FileText,
  FileUp,
  Handshake,
  KeyRound,
  Lock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { interpolate } from "@/lib/i18n/dictionaries";

/** Copy shape of `d.public.home.categories` — FR reference, AR mirror. */
export interface CategoriesCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  countLabel: string;
  browse: string;
  verifyCard: {
    title: string;
    body: string;
    cta: string;
  };
}

/** One landing category card: a database category that has published documents. */
export interface CategoryCard {
  category: string;
  labelFr: string;
  labelAr: string;
  count: number;
}

/** One icon family per catalogue category code, same mapping as the cards. */
const CATEGORY_ICON: Record<string, LucideIcon> = {
  RENTAL: Building,
  SERVICES: Columns3,
  EMPLOYMENT: Columns3,
  CONFIDENTIALITY: Lock,
  SALE: KeyRound,
  PARTNERSHIP: Handshake,
  LOAN: FileText,
  AUTHORIZATION: FileCheck,
  OTHER: FileText,
};

/**
 * The category row of the homepage — one card per category that actually has
 * published documents, deep-linking into the catalogue's existing `?category=`
 * filter, next to the "J'ai déjà un document" verification card. Creates and
 * verification are the two visible paths; neither starts on this page.
 */
export function CategoriesSection({
  copy,
  groups,
  locale,
}: {
  copy: CategoriesCopy;
  groups: readonly CategoryCard[];
  locale: "fr" | "ar";
}) {
  return (
    <section
      id="categories"
      data-landing-section="categories"
      className="border-b border-hairline bg-white py-16"
    >
      <div className="container-page">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="mb-2 block font-mono text-xs font-bold uppercase tracking-widest text-accent-strong" dir="auto">
            {copy.eyebrow}
          </span>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-navy sm:text-4xl" dir="auto">
            {copy.title}
          </h2>
          <p className="mt-3 text-base text-ink-muted" dir="auto">
            {copy.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {groups.map((group) => {
            const Icon = CATEGORY_ICON[group.category] ?? FileText;
            return (
              <Link
                key={group.category}
                href={`/contracts?category=${group.category}`}
                className="group flex flex-col rounded-xl border border-hairline bg-canvas p-4 transition-all hover:border-accent/60 hover:shadow-md"
              >
                <Icon className="mb-3 h-5 w-5 text-accent-strong" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-bold text-navy" dir="auto">
                  {locale === "ar" ? group.labelAr : group.labelFr}
                </span>
                <span className="mt-1 text-[11px] text-ink-muted" dir="auto">
                  {interpolate(copy.countLabel, { count: group.count })}
                </span>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-all group-hover:gap-2">
                  {copy.browse}
                  <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
                </span>
              </Link>
            );
          })}

          {/* The second path: verify a document you already hold. */}
          <Link
            href="/verify"
            className="group flex flex-col rounded-xl border-2 border-accent bg-accent-soft/40 p-4 transition-all hover:border-accent hover:shadow-md sm:col-span-2"
          >
            <FileUp className="mb-3 h-5 w-5 text-accent-strong" strokeWidth={1.75} aria-hidden />
            <span className="text-sm font-bold text-navy" dir="auto">
              {copy.verifyCard.title}
            </span>
            <span className="mt-1 text-[11px] leading-relaxed text-ink-muted" dir="auto">
              {copy.verifyCard.body}
            </span>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent transition-all group-hover:gap-2">
              {copy.verifyCard.cta}
              <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
