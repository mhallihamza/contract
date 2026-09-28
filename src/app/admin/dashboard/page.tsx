import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { requireUser, roleAtLeast } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { formatDateTime } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";

/**
 * Admin & legal-reviewer console (§31–§35).
 *
 * Read-only operational view: what is waiting, which routing decisions were taken,
 * the state of the legal knowledge base, and the append-only audit trail. Nothing
 * on this page mutates a case — operational actions live in dedicated workflows.
 */
export const metadata = { title: "Administration" };

const OPEN_REQUEST_EXCLUDED = ["FINAL", "CANCELLED"] as const;
const PENDING_REVIEW_STATUSES = [
  "ASSIGNED",
  "UNDER_REVIEW",
  "INFORMATION_REQUESTED",
  "CHANGES_REQUESTED",
  "READY_FOR_VALIDATION",
] as const;
const OPEN_SIGNATURE_STATUSES = ["CREATED", "SENT", "VIEWED"] as const;

function Metric({ label, value, tone }: { label: string; value: number; tone?: "warning" | "destructive" | "info" }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
        {tone && value > 0 ? (
          <Badge variant={tone === "destructive" ? "destructive" : tone} className="text-[10px]">
            {value}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboardPage() {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();

  const [
    pendingReviews,
    pendingSignatures,
    failedAssignments,
    failedPayments,
    manualReview,
    rulesNeedingReview,
    openRequests,
    activeLawyers,
    decisions,
    rules,
    audit,
  ] = await Promise.all([
    db.lawyerRequest.count({ where: { status: { in: [...PENDING_REVIEW_STATUSES] } } }),
    db.signatureRequest.count({ where: { status: { in: [...OPEN_SIGNATURE_STATUSES] } } }),
    db.lawyerRequest.count({ where: { status: "ASSIGNMENT_PENDING" } }),
    db.payment.count({ where: { status: "FAILED" } }),
    db.contract.count({ where: { status: "MANUAL_REVIEW_REQUIRED" } }),
    db.legalRule.count({ where: { status: { in: ["DRAFT", "UNDER_REVIEW"] } } }),
    db.contract.count({ where: { status: { notIn: [...OPEN_REQUEST_EXCLUDED] } } }),
    db.user.count({ where: { role: "LAWYER", status: "ACTIVE" } }),
    db.routingDecision.findMany({ orderBy: { decidedAt: "desc" }, take: 10 }),
    db.legalRule.findMany({
      orderBy: [{ priority: "asc" }, { code: "asc" }],
      take: 12,
      select: {
        id: true,
        code: true,
        title: true,
        ruleKind: true,
        status: true,
        active: true,
        route: true,
        priority: true,
        reasonCode: true,
      },
    }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
  ]);

  const decisionContracts = await db.contract.findMany({
    where: { id: { in: decisions.map((decision) => decision.contractId) } },
    select: { id: true, reference: true },
  });
  const referenceById = new Map(decisionContracts.map((contract) => [contract.id, contract.reference]));

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{d.admin.title}</h1>
        <p className="text-sm text-muted-foreground">{d.admin.subtitle}</p>
        <p className="text-xs text-muted-foreground" dir="auto">
          {user.fullName} · {d.statuses.role[user.role]}
          {roleAtLeast(user.role, "ADMIN") ? null : ` — ${d.admin.settings.rulesPolicyHint}`}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={d.admin.metrics.pendingReviews} value={pendingReviews} tone="warning" />
        <Metric label={d.admin.metrics.pendingSignatures} value={pendingSignatures} tone="warning" />
        <Metric label={d.admin.metrics.failedAssignments} value={failedAssignments} tone="destructive" />
        <Metric label={d.admin.metrics.failedPayments} value={failedPayments} tone="destructive" />
        <Metric label={d.admin.metrics.unsupportedCases} value={manualReview} tone="destructive" />
        <Metric label={d.admin.metrics.rulesNeedingReview} value={rulesNeedingReview} tone="warning" />
        <Metric label={d.admin.metrics.openRequests} value={openRequests} tone="info" />
        <Metric label={d.admin.metrics.activeLawyers} value={activeLawyers} />
      </section>

      <section id="routing" className="space-y-3">
        <h2 className="text-sm font-semibold">{d.admin.nav.routing}</h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.common.empty}</p>
            ) : (
              <ul className="space-y-2">
                {decisions.map((decision) => (
                  <li
                    key={decision.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="font-mono text-xs text-muted-foreground">
                        {referenceById.get(decision.contractId) ?? decision.contractId.slice(0, 8)}
                      </span>
                      <span className="text-xs text-muted-foreground" dir="auto">
                        {decision.reason}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="info" className="text-[10px]">
                        {d.statuses.contractRoute[decision.route]}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {d.statuses.requirement[decision.lawyerReviewRequirement]}
                      </Badge>
                      {decision.missingRuleContext.length > 0 ? (
                        <Badge variant="warning" className="text-[10px]">
                          {d.admin.routing.gaps}: {decision.missingRuleContext.length}
                        </Badge>
                      ) : null}
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {decision.engineVersion}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(decision.decidedAt, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section id="knowledge" className="space-y-3">
        <h2 className="text-sm font-semibold">{d.admin.legalRules.title}</h2>
        <Card>
          <CardHeader>
            <CardDescription>{d.admin.legalRules.subtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.admin.legalRules.noRules}</p>
            ) : (
              <ul className="space-y-2">
                {rules.map((rule) => (
                  <li
                    key={rule.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                  >
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-medium" dir="auto">
                        {rule.title}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {rule.code} · {rule.reasonCode} · {d.admin.legalRules.priority}: {rule.priority}
                      </span>
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {d.statuses.ruleKind[rule.ruleKind]}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {d.statuses.contractRoute[rule.route]}
                      </Badge>
                      <Badge
                        variant={
                          rule.status === "VERIFIED"
                            ? "success"
                            : rule.status === "SUSPENDED" || rule.status === "EXPIRED"
                              ? "destructive"
                              : "warning"
                        }
                        className="text-[10px]"
                      >
                        {d.statuses.ruleStatus[rule.status]}
                      </Badge>
                      {rule.active ? null : (
                        <Badge variant="outline" className="text-[10px]">
                          {d.common.no}
                        </Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-muted-foreground" dir="auto">
              {d.admin.legalRules.policyNotice}
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="audit" className="space-y-3">
        <h2 className="text-sm font-semibold">{d.admin.audit.title}</h2>
        <Card>
          <CardHeader>
            <CardDescription>{d.admin.audit.immutableNotice}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {audit.length === 0 ? (
              <p className="text-sm text-muted-foreground">{d.admin.audit.noLogs}</p>
            ) : (
              <ul className="space-y-2">
                {audit.map((entry) => (
                  <li key={entry.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs">{entry.action}</span>
                      <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {entry.actorRole ? (
                          <Badge variant="outline" className="text-[10px]">
                            {d.statuses.role[entry.actorRole]}
                          </Badge>
                        ) : null}
                        <span>{formatDateTime(entry.createdAt, locale)}</span>
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      <span className="font-medium">{d.admin.audit.entity}:</span> {entry.entityType}
                      {entry.entityId ? ` (${entry.entityId.slice(0, 8)}…)` : ""}
                    </p>
                    {entry.metadata ? (
                      <p className="mt-1 break-all font-mono text-[10px] text-muted-foreground" dir="ltr">
                        {JSON.stringify(entry.metadata)}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <p className="text-[11px] text-muted-foreground" dir="auto">
        <Link href="/lawyer/workspace" className="text-primary underline-offset-4 hover:underline">
          {d.common.nav.lawyerWorkspace}
        </Link>{" "}
        — {d.admin.metrics.pendingReviews}
      </p>
    </div>
  );
}
