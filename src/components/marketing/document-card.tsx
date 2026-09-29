import type { ReactNode } from "react";
import Link from "next/link";
import { Clock, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { interpolate } from "@/lib/i18n/dictionaries";

/**
 * Product card of the catalogue (§5, §6).
 *
 * Presentational only and safe in both server and client trees: every value
 * comes from the database (name, description, category, price) and from the
 * dictionary — no hardcoded document content in JSX.
 */
export interface DocumentCardItem {
  code: string;
  slug: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  categoryLabelFr: string;
  categoryLabelAr: string;
  completionMinutes: number;
  startingPrice: number;
  currency: string;
  lawyerReviewAvailable: boolean;
}

export interface DocumentCardLabels {
  from: string;
  estimatedTime: string;
  lawyerBadge: string;
}

export function DocumentCard({
  item,
  locale,
  labels,
  footer,
  showCategory = true,
}: {
  item: DocumentCardItem;
  locale: "fr" | "ar";
  labels: DocumentCardLabels;
  footer?: ReactNode;
  showCategory?: boolean;
}) {
  const name = locale === "ar" ? item.nameAr : item.nameFr;
  const description = locale === "ar" ? item.descriptionAr : item.descriptionFr;

  return (
    <Card className="flex h-full flex-col transition-all hover:border-primary/40 hover:shadow-md">
      <CardHeader className="space-y-2">
        {showCategory ? (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {locale === "ar" ? item.categoryLabelAr : item.categoryLabelFr}
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
          <span className="flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            {labels.from} {item.startingPrice} {item.currency}
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