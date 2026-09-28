"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import {
  cancelContractAction,
  chooseServiceAction,
  finalizeContractAction,
  provideInformationAction,
  runRoutingAction,
  settlePaymentAction,
  startPaymentAction,
} from "@/app/app/actions";
import type { ActionState } from "@/lib/actions/state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Contract actions (§30, §37).
 *
 * Each action posts to a server action; buttons only appear when the current
 * status allows the operation, and the server re-checks the authorization and the
 * state machine anyway.
 */

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
      <p className="rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs">
        <ShieldCheck className="me-1 inline h-3.5 w-3.5" aria-hidden />
        {state.message}
      </p>
    );
  }
  return null;
}

export interface ContractCapabilities {
  canRoute: boolean;
  canChooseService: boolean;
  canPay: boolean;
  canSettle: boolean;
  canFinalize: boolean;
  canCancel: boolean;
  awaitingInformation: boolean;
  paymentSimulated: boolean;
}

export interface ContractActionLabels {
  routeTitle: string;
  routeSubtitle: string;
  routeContinue: string;
  routeChooseLawyer: string;
  routeChooseSelf: string;
  paymentTitle: string;
  paymentSubtitle: string;
  paymentPay: string;
  paymentSimulate: string;
  paymentSimulateHint: string;
  paymentMockNotice: string;
  finalTitle: string;
  finalNotYet: string;
  finalizeCta: string;
  cancelLabel: string;
  cancelConfirm: string;
  infoTitle: string;
  infoSubtitle: string;
  infoPlaceholder: string;
  infoSubmit: string;
  working: string;
  errorUnexpected: string;
}

export function ContractActions({
  contractId,
  capabilities,
  labels,
}: {
  contractId: string;
  capabilities: ContractCapabilities;
  labels: ContractActionLabels;
}) {
  const [routeState, routeAction] = useActionState<ActionState, FormData>(runRoutingAction, { ok: false });
  const [choiceState, choiceAction] = useActionState<ActionState, FormData>(chooseServiceAction, { ok: false });
  const [paymentState, paymentAction] = useActionState<ActionState, FormData>(startPaymentAction, { ok: false });
  const [settleState, settleAction] = useActionState<ActionState, FormData>(settlePaymentAction, { ok: false });
  const [finalState, finalAction] = useActionState<ActionState, FormData>(finalizeContractAction, { ok: false });
  const [infoState, infoAction] = useActionState<ActionState, FormData>(provideInformationAction, { ok: false });
  const [cancelState, cancelAction] = useActionState<ActionState, FormData>(cancelContractAction, { ok: false });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {capabilities.canRoute || capabilities.canChooseService ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.routeTitle}</CardTitle>
            <CardDescription>{labels.routeSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={routeState} errorLabel={labels.errorUnexpected} />
            <Feedback state={choiceState} errorLabel={labels.errorUnexpected} />
            {capabilities.canRoute ? (
              <form action={routeAction}>
                <input type="hidden" name="contractId" value={contractId} />
                <SubmitButton pendingLabel={labels.working}>{labels.routeContinue}</SubmitButton>
              </form>
            ) : null}
            {capabilities.canChooseService ? (
              <div className="flex flex-wrap gap-2">
                <form action={choiceAction}>
                  <input type="hidden" name="contractId" value={contractId} />
                  <input type="hidden" name="lawyerServiceSelected" value="true" />
                  <SubmitButton pendingLabel={labels.working} variant="outline">
                    {labels.routeChooseLawyer}
                  </SubmitButton>
                </form>
                <form action={choiceAction}>
                  <input type="hidden" name="contractId" value={contractId} />
                  <input type="hidden" name="lawyerServiceSelected" value="false" />
                  <SubmitButton pendingLabel={labels.working} variant="ghost">
                    {labels.routeChooseSelf}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canPay ? (
        <Card>
          <CardHeader>
            <CardTitle>{labels.paymentTitle}</CardTitle>
            <CardDescription>{labels.paymentSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={paymentState} errorLabel={labels.errorUnexpected} />
            <Feedback state={settleState} errorLabel={labels.errorUnexpected} />
            {capabilities.paymentSimulated ? (
              <p className="rounded-md border border-dashed bg-muted/20 p-3 text-xs text-muted-foreground">
                {labels.paymentMockNotice}
              </p>
            ) : null}
            <form action={paymentAction}>
              <input type="hidden" name="contractId" value={contractId} />
              <SubmitButton pendingLabel={labels.working}>{labels.paymentPay}</SubmitButton>
            </form>
            {capabilities.canSettle ? (
              <div className="space-y-2 border-t pt-3">
                <p className="text-[11px] text-muted-foreground">{labels.paymentSimulateHint}</p>
                <form action={settleAction}>
                  <input type="hidden" name="contractId" value={contractId} />
                  <SubmitButton pendingLabel={labels.working} variant="secondary">
                    {labels.paymentSimulate}
                  </SubmitButton>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{labels.finalTitle}</CardTitle>
          {capabilities.canFinalize ? null : <CardDescription>{labels.finalNotYet}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-3">
          <Feedback state={finalState} errorLabel={labels.errorUnexpected} />
          {capabilities.canFinalize ? (
            <form action={finalAction}>
              <input type="hidden" name="contractId" value={contractId} />
              <SubmitButton pendingLabel={labels.working}>{labels.finalizeCta}</SubmitButton>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">{labels.finalNotYet}</p>
          )}
        </CardContent>
      </Card>

      {capabilities.awaitingInformation ? (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle>{labels.infoTitle}</CardTitle>
            <CardDescription>{labels.infoSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={infoState} errorLabel={labels.errorUnexpected} />
            <form action={infoAction} className="space-y-3">
              <input type="hidden" name="contractId" value={contractId} />
              <Textarea name="information" rows={4} dir="auto" placeholder={labels.infoPlaceholder} required />
              <SubmitButton pendingLabel={labels.working} variant="outline">
                {labels.infoSubmit}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {capabilities.canCancel ? (
        <Card className="border-destructive/30 lg:col-span-2">
          <CardHeader>
            <CardTitle>{labels.cancelLabel}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Feedback state={cancelState} errorLabel={labels.errorUnexpected} />
            <form
              action={cancelAction}
              className="flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                if (!window.confirm(labels.cancelConfirm)) event.preventDefault();
              }}
            >
              <input type="hidden" name="contractId" value={contractId} />
              <Input name="reason" placeholder={labels.cancelConfirm} maxLength={200} className="max-w-sm" dir="auto" />
              <SubmitButton pendingLabel={labels.working} variant="destructive">
                {labels.cancelLabel}
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
