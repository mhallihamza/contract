import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AnswersForm, type FieldSection } from "@/components/app/answers-form";
import {
  ContractActions,
  type ContractActionLabels,
  type ContractCapabilities,
} from "@/components/app/contract-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { rowsToStructuredCase } from "@/lib/contracts/fields";
import { buildQuestionSetFor } from "@/lib/contracts/service";
import { CONTRACT_STATUS_TONE, type StatusTone } from "@/lib/contracts/state-machine";
import { db } from "@/lib/db/prisma";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";
import { getPaymentProvider } from "@/lib/payments/provider";

/**
 * Contract detail (§30, §37).
 *
 * The page is a read-only projection of the persisted case plus the actions the
 * current status allows. Every capability flag here mirrors a server-side rule:
 * the actions re-check authorization and the state machine on submit.
 */

export const metadata = { title: "Dossier" };

const TONE_VARIANT: Record<StatusTone, "outline" | "info" | "success" | "warning" | "destructive"> = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
};

const ROUTABLE_STATUSES = ["DRAFT", "INFORMATION_REQUIRED", "READY_FOR_ROUTING"];
const ANSWER_EDITABLE_STATUSES = ["DRAFT", "INFORMATION_REQUIRED", "READY_FOR_ROUTING"];
const FINALIZABLE_STATUSES = ["DRAFT_READY", "VALIDATED", "SIGNED"];

/** Localised label for a status code found in audit metadata. */
function localizedStatus(statuses: Record<string, string>, value: unknown): string | null {
  return typeof value === "string" && value in statuses ? (statuses[value] ?? null) : null;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium" dir="auto">
        {value}
      </p>
    </div>
  );
}

export default async function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const [{ locale, d }, { id }] = await Promise.all([getServerI18n(), params]);

  const contract = await db.contract.findUnique({ where: { id }, include: { contractType: true } });
  if (!contract || contract.clientId !== user.id) notFound();

  const [fields, documents, payments, decisions, lawyerRequest, assignedLawyer, timeline] = await Promise.all([
    db.contractField.findMany({ where: { contractId: contract.id } }),
    db.contractDocument.findMany({ where: { contractId: contract.id }, orderBy: { createdAt: "desc" } }),
    db.payment.findMany({ where: { contractId: contract.id }, orderBy: { createdAt: "desc" } }),
    db.routingDecision.findMany({ where: { contractId: contract.id }, orderBy: { decidedAt: "desc" }, take: 1 }),
    db.lawyerRequest.findFirst({ where: { contractId: contract.id } }),
    contract.assignedLawyerId
      ? db.user.findUnique({ where: { id: contract.assignedLawyerId }, select: { fullName: true, email: true } })
      : Promise.resolve(null),
    db.auditLog.findMany({
      where: { entityType: "Contract", entityId: contract.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  const caseData = rowsToStructuredCase(fields);
  const questionSet = await buildQuestionSetFor(contract.id, contract.contractType);
  const decision = decisions[0] ?? null;
  const provider = getPaymentProvider();
  const paidPayment = payments.find((payment) => payment.status === "PAID");
  const pendingPayment = payments.find((payment) => payment.status === "PENDING");
  const signatureRoute = contract.route === "LAWYER_SIGNATURE_REQUIRED";

  const sections: FieldSection[] = questionSet.sections.map((section) => ({
    group: section.group,
    label: section.label[locale],
    fields: section.specs.map((spec) => ({
      key: spec.key,
      label: locale === "ar" ? spec.labelAr : spec.labelFr,
      type: spec.type,
      required: spec.required || questionSet.requiredKeys.includes(spec.key),
      help: locale === "ar" ? spec.helpAr : spec.helpFr,
      options: spec.options?.map((option) => ({
        value: option.value,
        label: locale === "ar" ? option.ar : option.fr,
      })),
      value: caseData[spec.key],
    })),
  }));

  const capabilities: ContractCapabilities = {
    canRoute:
      ROUTABLE_STATUSES.includes(contract.status) && questionSet.missingKeys.length === 0,
    canChooseService: contract.status === "ROUTED" && contract.route === "LAWYER_OPTIONAL",
    canPay: !paidPayment && (contract.status === "ROUTED" || contract.status === "PAYMENT_REQUIRED"),
    canSettle: Boolean(pendingPayment) && provider.simulated,
    canFinalize:
      FINALIZABLE_STATUSES.includes(contract.status) &&
      (!signatureRoute || contract.status === "SIGNED"),
    canCancel: !["FINAL", "CANCELLED", "SIGNED"].includes(contract.status),
    awaitingInformation:
      contract.status === "INFORMATION_REQUIRED" ||
      lawyerRequest?.status === "INFORMATION_REQUESTED" ||
      Boolean(lawyerRequest?.informationRequest && !lawyerRequest.informationProvidedAt),
    paymentSimulated: provider.simulated,
  };

  const actionLabels: ContractActionLabels = {
    routeTitle: d.client.routeTitle,
    routeSubtitle: d.client.routeSubtitle,
    routeContinue: d.client.reviewContinue,
    routeChooseLawyer: d.client.routeChooseLawyer,
    routeChooseSelf: d.client.routeChooseSelf,
    paymentTitle: d.client.paymentTitle,
    paymentSubtitle: d.client.paymentSubtitle,
    paymentPay: d.client.paymentPay,
    paymentSimulate: d.client.paymentSimulate,
    paymentSimulateHint: d.client.paymentSimulateHint,
    paymentMockNotice: d.client.paymentMockNotice,
    finalTitle: d.client.finalTitle,
    finalNotYet: d.client.finalNotYet,
    finalizeCta: d.client.finalCta,
    cancelLabel: d.client.contractDetailCancel,
    cancelConfirm: d.client.contractDetailCancelConfirm,
    infoTitle: d.client.contractDetailInfoRequest,
    infoSubtitle: lawyerRequest?.informationRequest ?? d.client.questionsSubtitle,
    infoPlaceholder: d.client.contractDetailInfoPlaceholder,
    infoSubmit: d.client.contractDetailProvideInfo,
    working: d.common.saving,
    errorUnexpected: d.common.unexpectedError,
  };

  const answersEditable = ANSWER_EDITABLE_STATUSES.includes(contract.status);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/app/contracts"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            {d.common.nav.contracts}
          </Link>
          <h1 className="text-xl font-semibold" dir="auto">
            {contract.title}
          </h1>
          <p className="font-mono text-xs text-muted-foreground">{contract.reference}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={TONE_VARIANT[CONTRACT_STATUS_TONE[contract.status]]}>
            {d.statuses.contractStatus[contract.status]}
          </Badge>
          {contract.route ? (
            <Badge variant="outline">{d.statuses.contractRoute[contract.route]}</Badge>
          ) : null}
          {contract.priceAmount ? (
            <Badge variant="secondary">
              {formatMoney(contract.priceAmount, contract.priceCurrency, locale)}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d.client.contractDetailTitle}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Meta
            label={d.client.contractDetailType}
            value={locale === "ar" ? contract.contractType.nameAr : contract.contractType.nameFr}
          />
          <Meta label={d.client.contractDetailLanguage} value={contract.language} />
          <Meta
            label={d.client.contractDetailCreated}
            value={formatDate(contract.createdAt, locale)}
          />
          <Meta
            label={d.client.contractDetailLawyer}
            value={
              assignedLawyer
                ? `${assignedLawyer.fullName} — ${assignedLawyer.email}`
                : d.client.contractDetailLawyerNone
            }
          />
          {lawyerRequest ? (
            <Meta
              label={d.client.lawyerStatus}
              value={d.statuses.lawyerRequestStatus[lawyerRequest.status]}
            />
          ) : null}
          {contract.routedAt ? (
            <Meta label={d.client.contractDetailRoute} value={formatDateTime(contract.routedAt, locale)} />
          ) : null}
        </CardContent>
      </Card>

      <ContractActions contractId={contract.id} capabilities={capabilities} labels={actionLabels} />

      {answersEditable && sections.length > 0 ? (
        <AnswersForm
          contractId={contract.id}
          sections={sections}
          missingKeys={questionSet.missingKeys}
          labels={{
            title: d.client.questionsTitle,
            subtitle: d.client.questionsSubtitle,
            requiredHint: d.client.questionsRequiredHint,
            save: d.common.save,
            saving: d.common.saving,
            incomplete: d.client.reviewIncomplete,
            saved: d.common.success,
            errorUnexpected: d.common.unexpectedError,
            optionalLabel: d.common.optional,
            yesLabel: d.common.yes,
            noLabel: d.common.no,
          }}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{d.client.contractDetailTimeline}</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">{d.common.empty}</p>
          ) : (
            <ol className="space-y-3">
              {timeline.map((entry) => {
                const metadata = (entry.metadata ?? {}) as Record<string, unknown>;
                const status = localizedStatus(d.statuses.contractStatus, metadata.to);
                const reason = typeof metadata.reason === "string" ? metadata.reason : null;
                return (
                  <li
                    key={entry.id}
                    className="flex flex-wrap items-baseline gap-2 border-s-2 border-border ps-3 text-sm"
                  >
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {formatDateTime(entry.createdAt, locale)}
                    </span>
                    <span className="font-medium" dir="auto">
                      {status ?? entry.action}
                    </span>
                    {reason ? (
                      <span className="text-xs text-muted-foreground" dir="auto">
                        {reason}
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {decision ? (
        <Card>
          <CardHeader>
            <CardTitle>{d.client.routePathTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{d.statuses.contractRoute[decision.route]}</Badge>
              <Badge variant="outline">{d.statuses.requirement[decision.lawyerReviewRequirement]}</Badge>
              <Badge variant="outline">
                {d.statuses.signatureRequirement[decision.lawyerSignatureRequirement]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground" dir="auto">
              {decision.reason}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Meta
                label={d.client.routeRulesTitle}
                value={
                  decision.matchedRuleIds.length > 0
                    ? decision.matchedRuleIds.length.toString()
                    : d.common.none
                }
              />
              <Meta
                label={d.client.routeGapsTitle}
                value={
                  decision.missingRuleContext.length > 0
                    ? decision.missingRuleContext.join(", ")
                    : d.common.none
                }
              />
            </div>
            {decision.reasonCodes.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {decision.reasonCodes.map((code) => (
                  <span
                    key={code}
                    className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
                  >
                    {code}
                  </span>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{d.common.nav.documents}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{d.client.documentsNone}</p>
          ) : (
            <ul className="space-y-2">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate font-medium" dir="auto">
                      {document.filename}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {d.statuses.documentType[document.documentType]} · {d.common.version}{" "}
                      {document.version} · {document.checksum.slice(0, 12)}…
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {document.immutable ? (
                      <Badge variant="success" className="text-[10px]">
                        {d.client.documentsImmutable}
                      </Badge>
                    ) : null}
                    <a
                      href={`/api/documents/${document.id}`}
                      className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {d.common.download}
                    </a>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {payments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{d.client.paymentHistory}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {payments.map((payment) => (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="font-medium">{d.statuses.paymentType[payment.type]}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {formatDateTime(payment.paidAt ?? payment.createdAt, locale)} · {payment.provider}
                    </span>
                    {payment.failureReason ? (
                      <span className="text-[11px] text-destructive-foreground" dir="auto">
                        {payment.failureReason}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium">
                      {formatMoney(payment.amount, payment.currency, locale)}
                    </span>
                    <Badge
                      variant={
                        payment.status === "PAID"
                          ? "success"
                          : payment.status === "FAILED"
                            ? "destructive"
                            : "outline"
                      }
                      className="text-[10px]"
                    >
                      {d.statuses.paymentStatus[payment.status]}
                    </Badge>
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-dashed bg-muted/20">
        <CardContent className="space-y-2 p-5 text-xs text-muted-foreground">
          <p dir="auto">{d.common.disclaimers.aiAssisted}</p>
          <p dir="auto">{d.common.disclaimers.routingBasedOnRules}</p>
          <p dir="auto">{d.common.disclaimers.notLegalAdvice}</p>
        </CardContent>
      </Card>
    </div>
  );
}

