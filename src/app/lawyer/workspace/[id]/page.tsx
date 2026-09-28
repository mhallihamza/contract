import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  LawyerCaseActions,
  type LawyerCaseCapabilities,
  type LawyerCaseLabels,
} from "@/components/app/lawyer-case-actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { roleAtLeast } from "@/lib/auth/session";
import { CONTRACT_STATUS_TONE, type StatusTone } from "@/lib/contracts/state-machine";
import { rowsToStructuredCase } from "@/lib/contracts/fields";
import { db } from "@/lib/db/prisma";
import { formatMoney } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";

/**
 * Lawyer review package (§20, §21).
 *
 * Everything the lawyer needs is assembled server-side: the client's objective, the
 * structured facts, the parties, the documents, the draft and the routing rules.
 * Actions are only offered to the assigned lawyer; reviewers get a read-only view.
 */
export const metadata = { title: "Dossier" };

const TONE_VARIANT: Record<StatusTone, "outline" | "info" | "success" | "warning" | "destructive"> = {
  neutral: "outline",
  info: "info",
  success: "success",
  warning: "warning",
  danger: "destructive",
};

const CLOSED_SIGNATURE_STATUSES = ["SIGNED", "CANCELLED", "DECLINED", "EXPIRED", "FAILED"];
const VALIDATABLE_REQUEST_STATUSES = ["UNDER_REVIEW", "CHANGES_REQUESTED", "READY_FOR_VALIDATION"];

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium" dir="auto">
        {value}
      </p>
    </div>
  );
}

export default async function LawyerCasePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const [{ locale, d }, { id }] = await Promise.all([getServerI18n(), params]);

  const contract = await db.contract.findUnique({
    where: { id },
    include: {
      contractType: true,
      lawyerRequest: true,
      currentVersion: true,
      client: { select: { fullName: true, email: true } },
    },
  });
  if (!contract) notFound();

  const request = contract.lawyerRequest;
  const isAssignedLawyer = Boolean(request && request.lawyerId === user.id);
  if (!isAssignedLawyer && !roleAtLeast(user.role, "LEGAL_REVIEWER")) notFound();

  const [fields, parties, documents, versions, signatureRequests, decision] = await Promise.all([
    db.contractField.findMany({ where: { contractId: contract.id } }),
    db.contractParty.findMany({ where: { contractId: contract.id }, orderBy: { position: "asc" } }),
    db.contractDocument.findMany({ where: { contractId: contract.id }, orderBy: { createdAt: "desc" } }),
    db.contractVersion.findMany({ where: { contractId: contract.id }, orderBy: { versionNumber: "desc" }, take: 5 }),
    db.signatureRequest.findMany({ where: { contractId: contract.id } }),
    db.routingDecision.findFirst({ where: { contractId: contract.id }, orderBy: { decidedAt: "desc" } }),
  ]);

  const caseData = rowsToStructuredCase(fields);
  const pendingSignature = signatureRequests.find(
    (signature) => !CLOSED_SIGNATURE_STATUSES.includes(signature.status),
  );

  const capabilities: LawyerCaseCapabilities = {
    canAccept: isAssignedLawyer && request?.status === "ASSIGNED",
    canDecline: isAssignedLawyer && request?.status === "ASSIGNED",
    canRequestInformation:
      isAssignedLawyer && Boolean(request) && VALIDATABLE_REQUEST_STATUSES.includes(request!.status),
    canEditDraft: isAssignedLawyer && (contract.status === "LAWYER_REVIEW" || contract.status === "CHANGES_REQUESTED"),
    canMarkReady: isAssignedLawyer && request?.status === "UNDER_REVIEW",
    canValidate: isAssignedLawyer && Boolean(request) && VALIDATABLE_REQUEST_STATUSES.includes(request!.status),
    canReject: isAssignedLawyer && Boolean(request) && !["REJECTED", "CANCELLED", "COMPLETED"].includes(request!.status),
    canRequestSignature: isAssignedLawyer && Boolean(request?.requiresSignature) && contract.status === "VALIDATED",
    canCompleteSignature: isAssignedLawyer && Boolean(pendingSignature),
    signatureRequestId: pendingSignature?.id ?? null,
  };

  const labels: LawyerCaseLabels = {
    actionsTitle: d.lawyer.actionsTitle,
    acceptCase: d.lawyer.acceptCase,
    declineCase: d.lawyer.declineCase,
    declineReason: d.lawyer.declineReason,
    declineReasonHint: d.lawyer.declineReasonHint,
    requestInfo: d.lawyer.actionRequestInfo,
    requestInfoPlaceholder: d.lawyer.actionRequestInfoPlaceholder,
    editDraft: d.lawyer.actionEditDraft,
    editDraftHint: d.lawyer.actionEditDraftHint,
    saveDraft: d.lawyer.actionSaveDraft,
    changeSummary: d.lawyer.actionChangeSummary,
    markReady: d.lawyer.actionReadyForValidation,
    validate: d.lawyer.actionValidate,
    validateHint: d.lawyer.actionValidateHint,
    reject: d.lawyer.actionReject,
    rejectReason: d.lawyer.actionRejectReason,
    requestSignature: d.lawyer.actionRequestSignature,
    completeSignature: d.lawyer.actionSign,
    sandboxNotice: d.lawyer.sandboxNotice,
    validationKindNotice: d.lawyer.validationKindNotice,
    working: d.common.saving,
    errorUnexpected: d.common.unexpectedError,
  };

  const sections = decision
    ? [
        {
          title: d.lawyer.reviewRules,
          value: `${d.statuses.contractRoute[decision.route]} — ${d.statuses.requirement[decision.lawyerReviewRequirement]}`,
        },
        {
          title: d.admin.routing.matchedRules,
          value: decision.matchedRuleIds.length > 0 ? decision.matchedRuleIds.join(", ") : d.common.none,
        },
        {
          title: d.admin.routing.sources,
          value: decision.legalSourceIds.length > 0 ? decision.legalSourceIds.join(", ") : d.common.none,
        },
        {
          title: d.admin.routing.gaps,
          value: decision.missingRuleContext.length > 0 ? decision.missingRuleContext.join(", ") : d.common.none,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/lawyer/workspace"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
            {d.lawyer.workspaceTitle}
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
          {request ? (
            <Badge variant="info">{d.statuses.lawyerRequestStatus[request.status]}</Badge>
          ) : null}
          {contract.priceAmount ? (
            <Badge variant="secondary">{formatMoney(contract.priceAmount, contract.priceCurrency, locale)}</Badge>
          ) : null}
          {!isAssignedLawyer ? (
            <Badge variant="warning" className="text-[10px]">
              {d.lawyer.noAccess}
            </Badge>
          ) : null}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{d.lawyer.reviewObjective}</CardTitle>
          <CardDescription>{d.lawyer.reviewAiNotice}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="rounded-md border border-dashed bg-muted/20 p-3" dir="auto">
            {contract.rawIntentText ?? d.common.notProvided}
          </p>
          {contract.summaryFr || contract.summaryAr ? (
            <p className="text-xs text-muted-foreground" dir="auto">
              {locale === "ar" ? contract.summaryAr : contract.summaryFr}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label={d.lawyer.reviewFacts} value={`${Object.keys(caseData).length}`} />
            <Fact label="Intent" value={contract.intentCode ?? d.common.notProvided} />
            <Fact label={d.lawyer.reviewParties} value={`${parties.length}`} />
            <Fact label={d.lawyer.reviewDocuments} value={`${documents.length}`} />
          </div>
          {Object.keys(caseData).length > 0 ? (
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(caseData).map(([key, value]) => (
                <Fact key={key} label={key} value={Array.isArray(value) ? value.join(", ") : String(value ?? "—")} />
              ))}
            </dl>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{d.lawyer.reviewParties}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {parties.length === 0 ? (
            <p className="text-sm text-muted-foreground">{d.common.empty}</p>
          ) : (
            <ul className="space-y-2">
              {parties.map((party) => (
                <li key={party.id} className="rounded-lg border border-border bg-card px-4 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium" dir="auto">
                      {party.fullName}
                    </span>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {party.role}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {party.partyType}
                      </Badge>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                    {[party.companyTaxId, party.nationalId, party.email, party.phone, party.address, party.city]
                      .filter(Boolean)
                      .join(" · ") || d.common.notProvided}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{d.lawyer.reviewDocuments}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">{d.common.empty}</p>
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
                      {d.statuses.documentType[document.documentType]} · {d.common.version} {document.version}
                    </span>
                  </span>
                  <a
                    href={`/api/documents/${document.id}`}
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {d.common.download}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {sections.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{d.lawyer.reviewRules}</CardTitle>
            {decision ? (
              <CardDescription>
                {d.admin.routing.engineVersion}: {decision.engineVersion}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <Fact key={section.title} label={section.title} value={section.value} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{d.lawyer.reviewDraft}</CardTitle>
          <CardDescription>
            {d.lawyer.reviewHistory}: {versions.map((version) => `v${version.versionNumber}`).join(", ") || d.common.none}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contract.currentVersion?.content ? (
            <pre
              dir="auto"
              className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/20 p-3 text-xs"
            >
              {contract.currentVersion.content}
            </pre>
          ) : (
            <p className="text-sm text-muted-foreground">{d.client.draftPending}</p>
          )}
          <ul className="space-y-1 text-xs text-muted-foreground">
            {versions.map((version) => (
              <li key={version.id} className="flex flex-wrap items-center gap-2">
                <span className="font-mono">v{version.versionNumber}</span>
                <span>{version.kind}</span>
                {version.changeSummary ? <span dir="auto">— {version.changeSummary}</span> : null}
                {version.immutable ? (
                  <Badge variant="success" className="text-[10px]">
                    {d.client.documentsImmutable}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
          {!capabilities.canEditDraft && isAssignedLawyer ? (
            <p className="rounded-md border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
              {d.lawyer.contractReadOnly}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {isAssignedLawyer ? (
        <LawyerCaseActions
          contractId={contract.id}
          lawyerRequestId={request?.id ?? null}
          draftContent={contract.currentVersion?.content ?? ""}
          capabilities={capabilities}
          labels={labels}
        />
      ) : null}

      <Card className="border-dashed bg-muted/20">
        <CardContent className="space-y-2 p-5 text-xs text-muted-foreground">
          <p dir="auto">{d.lawyer.reviewAiNotice}</p>
          <p dir="auto">{d.lawyer.validationKindNotice}</p>
          <p dir="auto">{d.lawyer.sandboxNotice}</p>
          <p dir="auto">{d.common.disclaimers.notLegalAdvice}</p>
        </CardContent>
      </Card>
    </div>
  );
}

