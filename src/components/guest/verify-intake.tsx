"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  FileText,
  FileUp,
  Loader2,
  ShieldCheck,
  UserRoundCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { VerifyTier } from "@/lib/verify/tiers";

/**
 * Verification intake (§8b) — the whole journey is one screen: a file, a tier.
 *
 * No questionnaire, no name, no e-mail before payment. The browser-side checks
 * mirror the server's (type, size) so obvious mistakes never round-trip, but
 * the server re-judges everything — this UI is a convenience, never the gate.
 */

export interface VerifyIntakeLabels {
  uploadTitle: string;
  uploadArea: string;
  chooseFile: string;
  emptyPlaceholder: string;
  removeFile: string;
  tierTitle: string;
  tierAssistedTitle: string;
  tierAssistedBody: string;
  tierAssistedPrice: string;
  tierLawyerTitle: string;
  tierLawyerBody: string;
  tierLawyerPrice: string;
  tierNote: string;
  tierLawyerNote: string;
  submit: string;
  submitting: string;
  errorTooLarge: string;
  errorUnsupportedType: string;
  errorExecutable: string;
  errorMacros: string;
  errorTypeMismatch: string;
  errorEmpty: string;
  errorSelectTier: string;
  errorGeneric: string;
}

export interface VerifyIntakeConfig {
  /** Presented tiers, keyed like the dictionary labels. */
  maxBytes: number;
  /** Human size for copy ("10 Mo"). */
  maxSizeText: string;
  /** Accepted extension hints for the file dialog. */
  accept: string;
}

type PickedFile = {
  file: File;
  previewUrl: string | null;
  kind: "pdf" | "image" | "document";
};

function clientKindFor(file: File): PickedFile["kind"] {
  const type = file.type.toLowerCase();
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  return "document";
}

function errorFor(code: string, labels: VerifyIntakeLabels, maxSizeText: string): string {
  switch (code) {
    case "FILE_TOO_LARGE":
      return labels.errorTooLarge.replace("{size}", maxSizeText);
    case "UNSUPPORTED_FILE_TYPE":
      return labels.errorUnsupportedType;
    case "EXECUTABLE_NOT_ALLOWED":
      return labels.errorExecutable;
    case "MACROS_NOT_ALLOWED":
      return labels.errorMacros;
    case "TYPE_MISMATCH":
      return labels.errorTypeMismatch;
    case "FILE_EMPTY":
      return labels.errorEmpty;
    default:
      return labels.errorGeneric;
  }
}

export function VerifyIntakeForm({
  labels,
  config,
  retentionNote,
  delayHint,
  priceUnit,
  initialTier,
}: {
  labels: VerifyIntakeLabels;
  config: VerifyIntakeConfig;
  /** Retention sentence with {days} resolved server-side. */
  retentionNote: string;
  /** "Délai annoncé : …" per tier key. */
  delayHint: { ASSISTED: string; LAWYER: string };
  /** Tax suffix rendered next to each price ("HT"). */
  priceUnit: string;
  /** Tier pre-picked on a marketing entry point (pricing card). */
  initialTier?: VerifyTier | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [tier, setTier] = useState<VerifyTier | null>(initialTier ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const acceptPicked = useCallback(
    (file: File) => {
      setError(null);
      if (!config.accept.includes(file.type.toLowerCase())) {
        setError(labels.errorUnsupportedType);
        setPicked(null);
        return;
      }
      if (file.size === 0) {
        setError(labels.errorEmpty);
        setPicked(null);
        return;
      }
      if (file.size > config.maxBytes) {
        setError(labels.errorTooLarge.replace("{size}", config.maxSizeText));
        setPicked(null);
        return;
      }
      const kind = clientKindFor(file);
      const previewUrl = kind === "image" || kind === "pdf" ? URL.createObjectURL(file) : null;
      setPicked({ file, kind, previewUrl });
    },
    [config.accept, config.maxBytes, config.maxSizeText, labels.errorUnsupportedType, labels.errorEmpty, labels.errorTooLarge],
  );

  function removePicked() {
    if (picked?.previewUrl) URL.revokeObjectURL(picked.previewUrl);
    setPicked(null);
    setError(null);
  }

  async function submit() {
    if (!picked) return;
    if (!tier) {
      setError(labels.errorSelectTier);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", picked.file);
      form.append("tier", tier);
      const response = await fetch("/api/verify/upload", { method: "POST", body: form });
      const body = (await response.json().catch(() => null)) as
        | { ok: true; data: { token: string } }
        | { ok: false; error: string }
        | null;
      if (response.ok && body && "ok" in body && body.ok) {
        router.push(`/verify/${body.data.token}`);
        return;
      }
      setError(errorFor(body && "error" in body ? body.error : "GENERIC", labels, config.maxSizeText));
    } catch {
      setError(labels.errorGeneric);
    } finally {
      setBusy(false);
    }
  }

  const tierLabel = (value: VerifyTier) =>
    value === "ASSISTED" ? labels.tierAssistedTitle : labels.tierLawyerTitle;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="space-y-6">
        {/* Upload area — drag & drop plus plain click. */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg" dir="auto">
              {labels.uploadTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              role="button"
              tabIndex={0}
              aria-label={labels.uploadArea}
              onClick={() => inputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const dropped = event.dataTransfer.files?.[0];
                if (dropped) acceptPicked(dropped);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-muted/50",
                picked && "border-primary/60 bg-primary/5",
              )}
            >
              <FileUp className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm font-medium" dir="auto">
                {labels.uploadArea}
              </p>
              {picked ? (
                <p className="text-xs text-muted-foreground" dir="auto">
                  {picked.file.name}
                </p>
              ) : null}
              <Input
                ref={inputRef}
                type="file"
                accept={config.accept}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) acceptPicked(file);
                  event.target.value = "";
                }}
              />
            </div>

            {picked ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2">
                <span className="flex min-w-0 items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate" dir="auto">
                    {picked.file.name}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {(picked.file.size / (1024 * 1024)).toFixed(2).replace(".", ",")} Mo
                  </span>
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={removePicked}>
                  <X className="h-4 w-4" aria-hidden />
                  <span className="sr-only">{labels.removeFile}</span>
                </Button>
              </div>
            ) : null}

            {error ? (
              <p className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive" dir="auto">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {/* Tier choice — asked once, right before the send. */}
        <Card id="verify-tier">
          <CardHeader>
            <CardTitle className="text-lg" dir="auto">
              {labels.tierTitle}
            </CardTitle>
            <p className="text-xs text-muted-foreground" dir="auto">
              {labels.tierNote}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                { key: "ASSISTED" as const, title: labels.tierAssistedTitle, body: labels.tierAssistedBody, price: labels.tierAssistedPrice, delay: delayHint.ASSISTED, icon: ShieldCheck },
                { key: "LAWYER" as const, title: labels.tierLawyerTitle, body: labels.tierLawyerBody, price: labels.tierLawyerPrice, delay: delayHint.LAWYER, note: labels.tierLawyerNote, icon: UserRoundCheck },
              ]
            ).map((option) => {
              const selected = tier === option.key;
              const Icon = option.icon;
              return (
                <label
                  key={option.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40",
                  )}
                >
                  <input
                    type="radio"
                    name="verification-tier"
                    value={option.key}
                    checked={selected}
                    onChange={() => setTier(option.key)}
                    className="sr-only"
                  />
                  <Icon className={cn("mt-0.5 h-5 w-5", selected ? "text-primary" : "text-muted-foreground")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold" dir="auto">
                        {option.title}
                      </span>
                      <span className="text-sm font-bold" dir="auto">
                        {option.price}
                        {priceUnit ? ` ${priceUnit}` : ""}
                      </span>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground" dir="auto">
                      {option.body}
                    </span>
                    <span className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground" dir="auto">
                      <Check className="h-3 w-3" aria-hidden />
                      {option.delay}
                    </span>
                    {"note" in option && option.note ? (
                      <span className="mt-1 block text-[11px] font-medium text-amber-700 dark:text-amber-400" dir="auto">
                        {option.note}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </CardContent>
        </Card>

        <Button
          type="button"
          size="lg"
          className="w-full"
          disabled={!picked || busy}
          onClick={submit}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              {labels.submitting}
            </>
          ) : (
            labels.submit
          )}
        </Button>

        <p className="text-[11px] text-muted-foreground" dir="auto">
          {retentionNote}
        </p>
      </div>

      {/* Right column: empty placeholder until a file is picked — the panel
                   never shows any sample contract. */}
      <div className="lg:sticky lg:top-24">
        {picked?.previewUrl && picked.kind === "image" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={picked.previewUrl} alt={picked.file.name} className="mx-auto max-h-[60vh] w-auto" />
          </div>
        ) : picked?.previewUrl && picked.kind === "pdf" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <iframe src={`${picked.previewUrl}#page=1`} title={picked.file.name} className="h-[60vh] w-full" />
          </div>
        ) : picked ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-muted/30 px-4 py-10 text-center">
            <FileText className="h-10 w-10 text-muted-foreground" aria-hidden />
            <p className="break-all text-sm font-medium" dir="auto">
              {picked.file.name}
            </p>
            <p className="text-xs text-muted-foreground" dir="auto">
              {tierLabel(tier ?? "ASSISTED")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-16 text-center">
            <FileUp className="h-8 w-8 text-muted-foreground/60" aria-hidden />
            <p className="text-sm text-muted-foreground" dir="auto">
              {labels.emptyPlaceholder}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

