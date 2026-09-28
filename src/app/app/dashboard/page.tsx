import Link from "next/link";
import { ArrowRight, FileCheck2, FileClock, Plus, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ContractList, type ContractListItem } from "@/components/app/contract-list";
import { requireUser } from "@/lib/auth/session";
import { CONTRACT_STATUS_TONE, OPEN_STATUSES, needsClientAction } from "@/lib/contracts/state-machine";
import { db } from "@/lib/db/prisma";
import { formatDate, formatMoney } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = { title: "Tableau de bord" };

/**
 * Client dashboard (§28).
 *
 * "What needs you" comes first, then open work, then finished documents and
 * payments. Nothing here is computed client-side.
 */
export default async function ClientDashboardPage() {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();

  const contracts = await db.contract.findMany({
    where: { clientId: user.id },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      contractType: true,
      payments: { orderBy: { createdAt: "desc" }, take: 2 },
    },
  });

  const needsYou = contracts.filter((contract) => needsClientAction(contract.status));
  const inProgress = contracts.filter(
    (contract) => !needsClientAction(contract.status) && (OPEN_STATUSES as readonly string[]).includes(contract.status),
  );
  const completed = contracts.filter((contract) => contract.status === "FINAL");
  const payments = contracts
    .flatMap((contract) => contract.payments.map((payment) => ({ payment, reference: contract.reference })))
    .slice(0, 5);

  const statusLabel = (status: keyof typeof d.statuses.contractStatus) => d.statuses.contractStatus[status];
  const toneForStatus = (status: keyof typeof CONTRACT_STATUS_TONE) => CONTRACT_STATUS_TONE[status];
  const routeLabel = (route: keyof typeof d.statuses.contractRouteShort) => d.statuses.contractRouteShort[route];

  const toItems = (
    source: typeof contracts,
    extra?: (contract: (typeof contracts)[number]) => string | null,
  ): ContractListItem[] =>
    source.map((contract) => ({
      id: contract.id,
      reference: contract.reference,
      typeName: locale === "ar" ? contract.contractType.nameAr : contract.contractType.nameFr,
      status: contract.status,
      route: contract.route,
      updatedAt: contract.updatedAt,
      href: `/app/contracts/${contract.id}`,
      amount: contract.priceAmount === null ? null : Number(contract.priceAmount),
      currency: contract.priceCurrency,
      extraLabel: extra ? extra(contract) : null,
    }));

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {d.client.dashboardGreeting}, {user.fullName}
          </h1>
          <p className="text-sm text-muted-foreground">{d.client.dashboardSubtitle}</p>
        </div>
        <Button asChild>
          <Link href="/app/contracts/new">
            <Plus className="h-4 w-4" aria-hidden />
            {d.client.startRequest}
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: d.client.statsContracts, value: contracts.length, icon: FileClock },
          { label: d.client.statsAwaitingYou, value: needsYou.length, icon: ArrowRight },
          { label: d.client.statsAwaitingReview, value: inProgress.length, icon: FileClock },
          { label: d.client.statsDocuments, value: completed.length, icon: FileCheck2 },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center justify-between gap-3 p-5">
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
              <stat.icon className="h-5 w-5 text-muted-foreground" aria-hidden />
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{d.client.needsYouTitle}</h2>
        <ContractList
          items={toItems(needsYou)}
          locale={locale}
          emptyLabel={d.client.needsYouEmpty}
          statusLabel={statusLabel}
          routeLabel={routeLabel}
          toneForStatus={toneForStatus}
        />
      </section>


      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">{d.client.inProgressTitle}</h2>
          <ContractList
            items={toItems(inProgress)}
            locale={locale}
            emptyLabel={d.client.inProgressEmpty}
            statusLabel={statusLabel}
            routeLabel={routeLabel}
            toneForStatus={toneForStatus}
          />

          <h2 className="pt-4 text-lg font-semibold">{d.client.completedTitle}</h2>
          <ContractList
            items={toItems(completed, (contract) => formatDate(contract.finalizedAt ?? contract.updatedAt, locale))}
            locale={locale}
            emptyLabel={d.client.completedEmpty}
            statusLabel={statusLabel}
            routeLabel={routeLabel}
            toneForStatus={toneForStatus}
          />
        </div>

        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Wallet className="h-4 w-4 text-muted-foreground" aria-hidden />
            {d.client.paymentsTitle}
          </h2>
          {payments.length === 0 ? (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">{d.client.paymentsEmpty}</CardContent>
            </Card>
          ) : (
            <ul className="space-y-2">
              {payments.map(({ payment, reference }) => (
                <li
                  key={payment.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="flex flex-col">
                    <span className="font-mono text-xs text-muted-foreground">{reference}</span>
                    <span>{d.statuses.paymentType[payment.type]}</span>
                  </span>
                  <span className="flex flex-col items-end">
                    <span className="font-medium">{formatMoney(payment.amount, payment.currency, locale)}</span>
                    <Badge
                      variant={payment.status === "PAID" ? "success" : payment.status === "FAILED" ? "destructive" : "outline"}
                      className="text-[10px]"
                    >
                      {d.statuses.paymentStatus[payment.status]}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Card className="border-dashed bg-muted/20">
            <CardContent className="space-y-2 p-5 text-xs text-muted-foreground">
              <p dir="auto">{d.common.disclaimers.aiAssisted}</p>
              <p dir="auto">{d.common.disclaimers.routingBasedOnRules}</p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
