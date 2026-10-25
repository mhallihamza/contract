"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth/demo-accounts";
import { appConfig } from "@/lib/config";

/** Quick demo access bar (§51) — emails mirror the seeded accounts. */
const QUICK_ACCESS = [
  { email: DEMO_ACCOUNTS.client1, fr: "👤 Client 1 (Individuel)", ar: "👤 عميل 1 (فرد)" },
  { email: DEMO_ACCOUNTS.client2, fr: "🏢 Client 2 (SARL)", ar: "🏢 عميل 2 (شركة SARL)" },
  { email: DEMO_ACCOUNTS.lawyerA, fr: "⚖️ Avocat A (FR/AR)", ar: "⚖️ محامٍ أ (فرنسية/عربية)" },
  { email: DEMO_ACCOUNTS.admin, fr: "🛡️ Administrateur", ar: "🛡️ مسؤول المنصة" },
] as const;

export function SignInForm({
  locale,
  dict,
}: {
  locale: "fr" | "ar";
  dict: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    submit: string;
    demoAccounts: string;
    demoNotice: string;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { ok: boolean; redirectUrl?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error === "INVALID_CREDENTIALS" ? "Identifiants invalides." : "Erreur de connexion.");
        setLoading(false);
        return;
      }

      router.push(data.redirectUrl ?? "/app/dashboard");
      router.refresh();
    } catch {
      setError("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6" dir={locale === "ar" ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle>{dict.title}</CardTitle>
          <CardDescription>{dict.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/15 rounded-md border border-destructive/30">
                {error}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{dict.email}</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@example.test"
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{dict.password}</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : dict.submit}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Demo Access Bar (§51) — demo mode only: the seeded accounts and
          their one-click disclosure must never reach a live deployment. */}
      {appConfig.demoMode ? (
        <Card className="bg-muted/40 border-dashed">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{dict.demoAccounts}</span>
              <Badge variant="outline" className="text-[10px]">
                DEMO
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">{dict.demoNotice}</p>
          </CardHeader>
        <CardContent className="px-4 pb-3 pt-0 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {QUICK_ACCESS.map((account) => (
              <Button
                key={account.email}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo(account.email)}
              >
                {locale === "ar" ? account.ar : account.fr}
              </Button>
            ))}
          </div>
        </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
