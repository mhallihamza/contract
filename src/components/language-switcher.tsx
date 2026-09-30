"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

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
      className="text-xs font-semibold gap-1.5 text-navy hover:bg-accent-soft hover:text-accent"
    >
      <Globe className="h-3.5 w-3.5" />
      {currentLocale === "fr" ? "العربية" : "Français"}
    </Button>
  );
}
