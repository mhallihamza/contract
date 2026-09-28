import Link from "next/link";
import { Plus } from "lucide-react";
import type { ContractStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ContractList, type ContractListItem } from "@/components/app/contract-list";
import { requireUser } from "@/lib/auth/session";
import { CONTRACT_STATUS_TONE } from "@/lib/contracts/state-machine";
import { db } from "@/lib/db/prisma";
import { getServerI18n } from "@/lib/i18n/server";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Mes contrats" };

/** All client cases with an optional status filter (§28). */
export default async function ContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();
  const { status } = await searchParams;

  const statusLabel = (value: keyof typeof d.statuses.contractStatus) => d.statuses.contractStatus[value];
  const statuses = Object.keys(d.statuses.contractStatus) as ContractStatus[];
  const active = status && statuses.includes(status as ContractStatus) ? (status as ContractStatus) : null;

  const contracts = await db.contract.findMany({
    where: { clientId: user.id, ...(active ? { status: active } : {}) },
    orderBy: [{ updatedAt: "desc" }],
    include: { contractType: true },
    take: 100,
  });

  const items: ContractListItem[] = contracts.map((contract) => ({
    id: contract.id,
    reference: contract.reference,
    typeName: locale === "ar" ? contract.contractType.nameAr : contract.contractType.nameFr,
    status: contract.status,
    route: contract.route,
    updatedAt: contract.updatedAt,
    href: `/app/contracts/${contract.id}`,
    amount: contract.priceAmount === null ? null : Number(contract.priceAmount),
    currency: contract.priceCurrency,
    extraLabel: formatDate(contract.createdAt, locale),
  }));

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{d.common.nav.contracts}</h1>
          <p className="text-sm text-muted-foreground">{d.client.dashboardSubtitle}</p>
        </div>
        <Button asChild>
          <Link href="/app/contracts/new">
            <Plus className="h-4 w-4" aria-hidden />
            {d.client.startRequest}
          </Link>
        </Button>
      </header>

      <nav className="flex flex-wrap gap-2" aria-label={d.common.status}>
        <Link
          href="/app/contracts"
          className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
            active === null ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {d.common.all}
        </Link>
        {(["DRAFT", "INFORMATION_REQUIRED", "PAYMENT_REQUIRED", "DRAFT_READY", "LAWYER_REVIEW", "FINAL", "CANCELLED"] as ContractStatus[]).map(
          (candidate) => (
            <Link
              key={candidate}
              href={`/app/contracts?status=${candidate}`}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                active === candidate
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {statusLabel(candidate)}
            </Link>
          ),
        )}
      </nav>

      <ContractList
        items={items}
        locale={locale}
        emptyLabel={d.client.inProgressEmpty}
        statusLabel={statusLabel}
        routeLabel={(route) => d.statuses.contractRouteShort[route]}
        toneForStatus={(value) => CONTRACT_STATUS_TONE[value]}
      />
    </div>
  );
}
