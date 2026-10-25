"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

/**
 * Language switch as the Wathiqa header wears it: a bordered pill reading
 * "FR | العربية" with the active locale carrying the action colour. The
 * mechanism is unchanged — a locale cookie then a refresh — so the control
 * still works from every public route.
 */
export function LanguageSwitcher({ currentLocale }: { currentLocale: "fr" | "ar" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const toggle = async () => {
    const nextLocale = currentLocale === "fr" ? "ar" : "fr";
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: nextLocale }),
    });
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={isPending}
      aria-label={currentLocale === "fr" ? "Passer en arabe" : "Switch to French"}
      className="gap-1.5 rounded border border-line-strong bg-muted px-2.5 py-1 text-xs font-semibold text-ink-soft transition-colors hover:bg-hairline hover:text-ink-deep"
    >
      <span className={currentLocale === "fr" ? "font-bold text-accent" : undefined} lang="fr">
        FR
      </span>
      <span aria-hidden className="text-ink-faint">
        |
      </span>
      <span className={currentLocale === "ar" ? "font-bold text-accent" : undefined} lang="ar">
        العربية
      </span>
    </Button>
  );
}
