"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import {
  acceptCaseAction,
  completeSignatureAction,
  declineCaseAction,
  markReadyAction,
  rejectCaseAction,
  requestInformationAction,
  requestSignatureAction,
  saveDraftAction,
  validateCaseAction,
} from "@/app/lawyer/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/lib/actions/state";

/**
 * Lawyer case actions (§20, §21, §22).
 *
 * The component only renders the operations the current state allows; every form
 * posts to a server action that re-checks the role, the assignment and the state
 * machines. Internal validation and electronic signature stay separate forms.
 */

export interface LawyerCaseCapabilities {
  canAccept: boolean;
  canDecline: boolean;
  canRequestInformation: boolean;
  canEditDraft: boolean;
  canMarkReady: boolean;
  canValidate: boolean;
  canReject: boolean;
  canRequestSignature: boolean;
  canCompleteSignature: boolean;
  signatureRequestId: string | null;
}

export interface LawyerCaseLabels {
  actionsTitle: string;
  acceptCase: string;
  declineCase: string;
  declineReason: string;
  declineReasonHint: string;
  requestInfo: string;
  requestInfoPlaceholder: string;
  editDraft: string;
  editDraftHint: string;
  saveDraft: string;
  changeSummary: string;
  markReady: string;
  validate: string;
  validateHint: string;
  reject: string;
  rejectReason: string;
  requestSignature: string;
  completeSignature: string;
  sandboxNotice: string;
  validationKindNotice: string;
  working: string;
  errorUnexpected: string;
}

function SubmitButton({
  children,
  pendingLabel,
  variant = "default",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  variant?: "default" | "outline" | "destructive" | "secondary" | "ghost";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}

function Feedback({ state, errorLabel }: { state: ActionState; errorLabel: string }) {
  if (state.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive-foreground">
        {errorLabel} ({state.error})
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">{state.message}</p>
    );
  }
  return null;
}

export function LawyerCaseActions({
  contractId,
  lawyerRequestId,
  draftContent,
  capabilities,
  labels,
}: {
  contractId: string;
  lawyerRequestId: string | null;
  draftContent: string;
  capabilities: LawyerCaseCapabilities;
  labels: LawyerCaseLabels;
}) {
  const [acceptState, acceptAction] = useActionState<ActionState, FormData>(acceptCaseAction, { ok: false });
  const [declineState, declineAction] = useActionState<ActionState, FormData>(declineCaseAction, { ok: false });
  const [infoState, infoAction] = useActionState<ActionState, FormData>(requestInformationAction, { ok: false });
  const [draftState, draftAction] = useActionState<ActionState, FormData>(saveDraftAction, { ok: false });
  const [readyState, readyAction] = useActionState<ActionState, FormData>(markReadyAction, { ok: false });
  const [validateState, validateAction] = useActionState<ActionState, FormData>(validateCaseAction, { ok: false });
  const [rejectState, rejectAction] = useActionState<ActionState, FormData>(rejectCaseAction, { ok: false });
  const [signatureState, signatureAction] = useActionState<ActionState, FormData>(requestSignatureAction, { ok: false });
  const [completeState, completeAction] = useActionState<ActionState, FormData>(completeSignatureAction, { ok: false });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {capabilities.canAccept || capabilities.canDecline ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.actionsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Feedback state={acceptState} errorLabel={labels.errorUnexpected} />
            <Feedback state={declineState} errorLabel={labels.errorUnexpected} />
            {capabilities.canAccept ? (
              <form action={acceptAction}>
                <input type="hidden" name="contractId" value={contractId} />
                <SubmitButton pendingLabel={labels.working}>{labels.acceptCase}</SubmitButton>
              </form>
            ) : null}
            {capabilities.canDecline ? (
              <form action={declineAction} className="space-y-2 border-t pt-3">
                <p className="text-[11px] text-muted-foreground">{labels.declineReasonHint}</p>
                <Input name="reason" placeholder={labels.declineReason} maxLength={200} dir="auto" required />
                <SubmitButton pendingLabel={labels.working} variant="ghost">
                  {labels.declineCase}
                </SubmitButton>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canRequestInformation ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.requestInfo}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={infoState} errorLabel={labels.errorUnexpected} />
            <form action={infoAction} className="space-y-3">
              <input type="hidden" name="contractId" value={contractId} />
              <Textarea name="message" rows={4} dir="auto" placeholder={labels.requestInfoPlaceholder} required />
              <SubmitButton pendingLabel={labels.working} variant="outline">
                {labels.requestInfo}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canEditDraft ? (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{labels.editDraft}</CardTitle>
            <CardDescription>{labels.editDraftHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={draftState} errorLabel={labels.errorUnexpected} />
            <form action={draftAction} className="space-y-3">
              <input type="hidden" name="contractId" value={contractId} />
              <Textarea name="content" rows={18} dir="auto" defaultValue={draftContent} className="font-mono text-xs" />
              <Input name="changeSummary" placeholder={labels.changeSummary} maxLength={200} dir="auto" />
              <SubmitButton pendingLabel={labels.working}>{labels.saveDraft}</SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canMarkReady || capabilities.canValidate ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.validate}</CardTitle>
            <CardDescription>{labels.validateHint}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={readyState} errorLabel={labels.errorUnexpected} />
            <Feedback state={validateState} errorLabel={labels.errorUnexpected} />
            <p className="rounded-md border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
              {labels.validationKindNotice}
            </p>
            <div className="flex flex-wrap gap-2">
              {capabilities.canMarkReady ? (
                <form action={readyAction}>
                  <input type="hidden" name="contractId" value={contractId} />
                  <SubmitButton pendingLabel={labels.working} variant="outline">
                    {labels.markReady}
                  </SubmitButton>
                </form>
              ) : null}
              {capabilities.canValidate ? (
                <form action={validateAction}>
                  <input type="hidden" name="contractId" value={contractId} />
                  <SubmitButton pendingLabel={labels.working}>{labels.validate}</SubmitButton>
                </form>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canRequestSignature || capabilities.canCompleteSignature ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.requestSignature}</CardTitle>
            <CardDescription>{labels.sandboxNotice}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={signatureState} errorLabel={labels.errorUnexpected} />
            <Feedback state={completeState} errorLabel={labels.errorUnexpected} />
            {capabilities.canRequestSignature && lawyerRequestId ? (
              <form action={signatureAction}>
                <input type="hidden" name="contractId" value={contractId} />
                <input type="hidden" name="lawyerRequestId" value={lawyerRequestId} />
                <SubmitButton pendingLabel={labels.working}>{labels.requestSignature}</SubmitButton>
              </form>
            ) : null}
            {capabilities.canCompleteSignature && capabilities.signatureRequestId ? (
              <form action={completeAction} className="border-t pt-3">
                <input type="hidden" name="contractId" value={contractId} />
                <input type="hidden" name="signatureRequestId" value={capabilities.signatureRequestId} />
                <SubmitButton pendingLabel={labels.working} variant="secondary">
                  {labels.completeSignature}
                </SubmitButton>
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canReject ? (
        <Card className="border-destructive/30 lg:col-span-2">
          <CardHeader>
            <CardTitle>{labels.reject}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={rejectState} errorLabel={labels.errorUnexpected} />
            <form action={rejectAction} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="contractId" value={contractId} />
              <Input name="reason" placeholder={labels.rejectReason} maxLength={200} className="max-w-sm" dir="auto" required />
              <SubmitButton pendingLabel={labels.working} variant="destructive">
                {labels.reject}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

