"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { createIntakeAction } from "@/app/app/actions";
import type { ActionState } from "@/lib/actions/state";

/**
 * Intake form (§30, §41).
 *
 * The client describes the need in their own words; the contract type is optional
 * and only used to force a type when the classifier is ambiguous. Classification
 * happens server-side (see `createIntakeAction`).
 */
export function NewRequestForm({
  initialText,
  suggestions,
  types,
  labels,
}: {
  initialText: string;
  suggestions: readonly string[];
  types: readonly { code: string; name: string }[];
  labels: {
    title: string;
    subtitle: string;
    placeholder: string;
    cta: string;
    analyzing: string;
    suggestionsTitle: string;
    typeLabel: string;
    noneOption: string;
    errorUnexpected: string;
  };
}) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [contractTypeCode, setContractTypeCode] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(createIntakeAction, {
    ok: false,
  });

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.push(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.title}</CardTitle>
        <CardDescription dir="auto">{labels.subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive-foreground">
              {labels.errorUnexpected}
            </p>
          ) : null}

          <Textarea
            name="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={5}
            required
            dir="auto"
            placeholder={labels.placeholder}
            className="resize-none text-base"
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">{labels.suggestionsTitle}</p>
            <ul className="flex flex-wrap gap-2">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    dir="auto"
                    onClick={() => setText(suggestion)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {types.length > 0 ? (
            <div className="space-y-1">
              <label htmlFor="contractTypeCode" className="text-xs font-medium text-muted-foreground">
                {labels.typeLabel}
              </label>
              <select
                id="contractTypeCode"
                name="contractTypeCode"
                value={contractTypeCode}
                onChange={(event) => setContractTypeCode(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{labels.noneOption}</option>
                {types.map((type) => (
                  <option key={type.code} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <Button type="submit" disabled={pending || text.trim().length < 3} className="w-full sm:w-auto">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
            {pending ? labels.analyzing : labels.cta}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
