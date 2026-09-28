"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Public entry point (§62).
 *
 * The visitor describes the need in plain language; the text is carried to the
 * authenticated intake wizard. Nothing is analysed here — the classification
 * (and the routing that follows) happens server-side (§9, §10).
 */
export function HeroIntake({
  label,
  placeholder,
  cta,
  examples,
  authenticated,
}: {
  label: string;
  placeholder: string;
  cta: string;
  examples: readonly string[];
  authenticated: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);

  const start = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPending(true);
    const target = `/app/contracts/new?q=${encodeURIComponent(trimmed)}`;
    router.push(authenticated ? target : `/sign-in?next=${encodeURIComponent(target)}`);
  };

  return (
    <div className="w-full space-y-4">
      <form
        className="space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          start(value);
        }}
      >
        <label htmlFor="hero-intake" className="text-sm font-semibold text-start block">
          {label}
        </label>
        <Textarea
          id="hero-intake"
          name="q"
          rows={3}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="resize-none bg-background text-base"
          dir="auto"
        />
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending || value.trim().length < 3}>
            <Sparkles className="h-4 w-4" aria-hidden />
            {cta}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <ul className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <li key={example}>
              <button
                type="button"
                onClick={() => {
                  setValue(example);
                  start(example);
                }}
                dir="auto"
                className={cn(
                  "rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground",
                  "transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                )}
              >
                {example}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
