import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { ACTIVE_WORKLOAD_STATUSES, lawyerWorkload } from "@/lib/lawyers/assignment";
import { db } from "@/lib/db/prisma";
import { formatDate } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";

/**
 * Lawyer workspace overview (§20).
 *
 * Only the cases assigned to the signed-in lawyer are listed; the workload counter
 * uses the same statuses as the assignment algorithm, so what the lawyer sees and
 * what the platform measures cannot drift apart.
 */
export const metadata = { title: "Espace avocat" };

export default async function LawyerWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();
  const { filter } = await searchParams;
  const activeOnly = filter === "review";

  const [requests, workload, profile] = await Promise.all([
    db.lawyerRequest.findMany({
      where: {
        lawyerId: user.id,
        ...(activeOnly ? { status: { in: [...ACTIVE_WORKLOAD_STATUSES] } } : {}),
      },
      include: {
        contract: {
          include: { contractType: true, client: { select: { fullName: true, email: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    lawyerWorkload(user.id),
    db.lawyerProfile.findFirst({ where: { userId: user.id } }),
  ]);

  const maximum = profile?.maxConcurrentCases ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">{d.lawyer.workspaceTitle}</h1>
          <p className="text-sm text-muted-foreground">{d.lawyer.workspaceSubtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/lawyer/workspace"
            className={`text-xs ${activeOnly ? "text-muted-foreground hover:text-foreground" : "font-semibold"}`}
          >
            {d.lawyer.assignedCases}
          </Link>
          <Link
            href="/lawyer/workspace?filter=review"
            className={`text-xs ${activeOnly ? "font-semibold" : "text-muted-foreground hover:text-foreground"}`}
          >
            {d.lawyer.myWorkload}
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d.lawyer.myWorkload}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-6 text-sm">
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">{d.lawyer.workloadLoad}</span>
            <span className="text-lg font-semibold">{workload}</span>
          </span>
          <span className="flex flex-col">
            <span className="text-xs text-muted-foreground">{d.lawyer.workloadMax}</span>
            <span className="text-lg font-semibold">{maximum ?? "—"}</span>
          </span>
          {profile?.specializations?.length ? (
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground">{d.admin.lawyers.specializations}</span>
              <span className="font-medium" dir="auto">
                {profile.specializations.join(", ")}
              </span>
            </span>
          ) : null}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">{d.lawyer.assignedCases}</h2>
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-sm text-muted-foreground">
              {d.lawyer.assignedCasesEmpty}
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-2">
            {requests.map((request) => (
              <li key={request.id}>
                <Link
                  href={`/lawyer/workspace/${request.contractId}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium" dir="auto">
                      {request.contract.title}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {request.contract.reference}
                    </span>
                  </span>
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-muted-foreground" dir="auto">
                      {request.contract.client?.fullName ?? request.contract.customerEmail ?? d.lawyer.guestClient}
                    </span>
                    {request.requiresSignature ? (
                      <Badge variant="outline" className="text-[10px]">
                        {d.statuses.signatureRequirement.REQUIRED}
                      </Badge>
                    ) : null}
                    <Badge variant="info" className="text-[10px]">
                      {d.statuses.lawyerRequestStatus[request.status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(request.dueAt ?? request.createdAt, locale)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
