import type { ComponentType, ReactNode, SVGProps } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building,
  Clock,
  FileCheck,
  FileText,
  Handshake,
  KeyRound,
  ListChecks,
  Lock,
  UserRound,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interpolate } from "@/lib/i18n/dictionaries";
import { DOCUMENT_IMAGE_FALLBACK } from "@/lib/marketing/mock-data";

/**
 * Product card of the catalogue (§4, §5).
 *
 * Presentational only and safe in both server and client trees: every value
 * comes from the database (name, description, category, price) and from the
 * dictionary — no hardcoded document content in JSX.
 *
 * Two layouts share the same component:
 *   - compact (default) → the `/contracts` list: price/time line + custom footer
 *   - `marketing` labels → the homepage card: photo, category badge, meta line,
 *     lawyer trust line and a visually separated "Commencer →" link.
 */
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** One icon family for every category badge, resolved from the database code. */
const CATEGORY_ICON: Record<string, IconComponent> = {
  RENTAL: Building,
  SERVICES: Briefcase,
  EMPLOYMENT: Users,
  CONFIDENTIALITY: Lock,
  SALE: KeyRound,
  PARTNERSHIP: Handshake,
  LOAN: Banknote,
  AUTHORIZATION: FileCheck,
  OTHER: FileText,
};

export interface DocumentCardItem {
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  /** Database category code — drives the badge icon. Optional for compatibility. */
  category?: string;
  categoryLabelFr: string;
  categoryLabelAr: string;
  completionMinutes: number;
  /** Optional: number of questions the wizard will actually ask. */
  questionCount?: number;
  startingPrice: number;
  currency: string;
  lawyerReviewAvailable: boolean;
  /** Optional: documents the user should have at hand before starting. */
  requiredDocuments?: string[];
}

export interface DocumentCardLabels {
  from: string;
  estimatedTime: string;
  /** "{count} questions" — shown beside the estimated time when known. */
  questions?: string;
  lawyerBadge: string;
  /** "À avoir : {items}" — composed with the first few required documents. */
  documentsAtHand?: string;
}

/** Labels of the homepage card (§4). */
export interface DocumentCardMarketingLabels {
  /** "Quelques minutes" */
  timeText: string;
  /** "Dès" — composed with the price and the currency. */
  pricePrefix: string;
  /** "Relu par un avocat partenaire" */
  lawyerReview: string;
  /** "Relu par {name}" — used when a partner lawyer name is available. */
  lawyerReviewByName: string;
  /** "Commencer" */
  cta: string;
}

export function DocumentCard({
  item,
  locale,
  labels,
  marketing,
  imageSrc,
  lawyerName,
  footer,
  showCategory = true,
}: {
  item: DocumentCardItem;
  locale: "fr" | "ar";
  labels: DocumentCardLabels;
  /** Enables the homepage layout (photo, badges, trust line, CTA link). */
  marketing?: DocumentCardMarketingLabels;
  imageSrc?: string;
  /** Optional partner lawyer shown on the trust line — dynamic once wired. */
  lawyerName?: string;
  footer?: ReactNode;
  showCategory?: boolean;
}) {
  const name = locale === "ar" ? item.nameAr : item.nameFr;
  const description = locale === "ar" ? item.descriptionAr : item.descriptionFr;
  const categoryLabel = locale === "ar" ? item.categoryLabelAr : item.categoryLabelFr;
  const atHand =
    item.requiredDocuments && item.requiredDocuments.length > 0
      ? [item.requiredDocuments.slice(0, 3).join(" · "), item.requiredDocuments.length > 3 ? "…" : ""]
          .join(" ")
          .trim()
      : "";

  if (marketing) {
    const Icon = CATEGORY_ICON[item.category ?? "OTHER"] ?? FileText;
    const image = imageSrc ?? DOCUMENT_IMAGE_FALLBACK;

    return (
      <Card
        className="group flex h-full flex-col overflow-hidden rounded-xl border-hairline bg-white shadow-[0_1px_2px_rgba(30,58,110,0.04)] transition-all hover:border-navy/25 hover:shadow-md"
        data-document-card={item.slug}
      >
        {/* Placeholder art while the photo bank is pending — swap `imageSrc` only. */}
        <div
          role="img"
          aria-label={name}
          className="aspect-video w-full rounded-t-xl bg-navy-soft bg-cover bg-center"
          style={{ backgroundImage: `url(${image})` }}
        />

        <CardHeader className="space-y-2 p-5 pb-3">
          {showCategory ? (
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-navy">
              <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {categoryLabel}
            </p>
          ) : null}
          <CardTitle className="line-clamp-2 text-lg font-bold leading-snug text-navy">
            <Link href={`/contracts/${item.slug}`} className="transition-colors hover:text-navy-deep">
              {name}
            </Link>
          </CardTitle>
          <CardDescription className="line-clamp-2 text-sm leading-relaxed text-ink-muted" dir="auto">
            {description}
          </CardDescription>
        </CardHeader>

        <CardContent className="mt-auto space-y-4 p-5 pt-0">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {marketing.timeText}
            </span>
            <span className="flex items-center gap-1.5">
              <Banknote className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
              {marketing.pricePrefix} {item.startingPrice} {item.currency}
            </span>
          </div>

          <p className="flex items-center gap-2 text-xs text-ink-muted">
            <span
              aria-hidden
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-soft text-[10px] font-semibold text-navy"
            >
              {lawyerName ? (
                lawyerName.replace(/^Me\s+/, "").charAt(0)
              ) : (
                <UserRound className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </span>
            <span dir="auto">
              {lawyerName
                ? interpolate(marketing.lawyerReviewByName, { name: lawyerName })
                : marketing.lawyerReview}
            </span>
          </p>

          <div className="border-t border-hairline pt-3">
            <Link
              href={`/contracts/${item.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-all hover:gap-2.5"
            >
              {marketing.cta}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex h-full flex-col transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="space-y-2">
        {showCategory ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {categoryLabel}
          </p>
        ) : null}
        <CardTitle className="text-base leading-snug">
          <Link href={`/contracts/${item.slug}`} className="transition-colors hover:text-primary">
            {name}
          </Link>
        </CardTitle>
        <CardDescription dir="auto">{description}</CardDescription>
      </CardHeader>

      <CardContent className="mt-auto space-y-4">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden />
            {interpolate(labels.estimatedTime, { minutes: item.completionMinutes })}
          </span>
          {labels.questions && item.questionCount ? (
            <span className="flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" aria-hidden />
              {interpolate(labels.questions, { count: item.questionCount })}
            </span>
          ) : null}
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {labels.from} {item.startingPrice} {item.currency}
          </span>
          <span className="flex items-center gap-1.5">
            <FileCheck className="h-3.5 w-3.5" aria-hidden />
            {interpolate(labels.documentsAtHand ?? "", { items: atHand })}
          </span>
        </div>

        {item.lawyerReviewAvailable ? (
          <Badge variant="secondary" className="gap-1 text-[11px]">
            {labels.lawyerBadge}
          </Badge>
        ) : null}

        {footer}
      </CardContent>
    </Card>
  );
}