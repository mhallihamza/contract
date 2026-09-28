import Link from "next/link";
import type { ContractStatus, RoutingRoute } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { StatusTone } from "@/lib/contracts/state-machine";

/**
 * Semantic tones coming from the state machine are mapped onto the concrete
 * Badge variants here, so no page has to know the palette.
 */
const TONE_VARIANT: Record<StatusTone, "outline" | "info" | "success" | "warning" | "destructive"> = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
};
import { formatDate, formatMoney } from "@/lib/format";
import type { AppLocale } from "@/lib/i18n/config";

/**
 * Shared contract list (§28, §31).
 *
 * Presentational only: the pages own the queries and pass the localised labels,
 * so the same list renders for a client, a lawyer or an administrator.
 */
export interface ContractListItem {
  id: string;
  reference: string;
  typeName: string;
  status: ContractStatus;
  route: RoutingRoute | null;
  updatedAt: Date;
  href: string;
  amount?: string | number | null;
  currency?: string;
  extraLabel?: string | null;
}

export function ContractList({
  items,
  locale,
  emptyLabel,
  statusLabel,
  routeLabel,
  toneForStatus,
}: {
  items: readonly ContractListItem[];
  locale: AppLocale;
  emptyLabel: string;
  statusLabel: (status: ContractStatus) => string;
  routeLabel: (route: RoutingRoute) => string;
  toneForStatus: (status: ContractStatus) => StatusTone;
}) {
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">{emptyLabel}</CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={item.href}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40"
          >
            <span className="flex min-w-0 flex-col">
              <span className="truncate font-medium" dir="auto">
                {item.typeName}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{item.reference}</span>
            </span>
            <span className="flex flex-wrap items-center gap-2">
              {item.extraLabel ? (
                <span className="text-xs text-muted-foreground" dir="auto">
                  {item.extraLabel}
                </span>
              ) : null}
              {item.amount !== null && item.amount !== undefined ? (
                <span className="text-xs font-medium">{formatMoney(item.amount, item.currency ?? "MAD", locale)}</span>
              ) : null}
              {item.route ? (
                <Badge variant="outline" className="text-[10px]">
                  {routeLabel(item.route)}
                </Badge>
              ) : null}
              <Badge variant={TONE_VARIANT[toneForStatus(item.status)]}>{statusLabel(item.status)}</Badge>
              <span className="text-xs text-muted-foreground">{formatDate(item.updatedAt, locale)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
