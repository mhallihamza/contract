import Link from "next/link";
import { Scale } from "lucide-react";
import type { UserRole } from "@prisma/client";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/lib/config";
import type { AppLocale } from "@/lib/i18n/config";
import { roleHome } from "@/lib/nav/role-home";

/**
 * Header of the public experience (§35).
 *
 * Like the landing header it is auth-aware on the server, but its navigation is
 * catalogue-first: the two primary entries are the documents and the assistant,
 * not a chat box.
 */
export function PublicHeader({
  locale,
  nav,
  user,
}: {
  locale: AppLocale;
  nav: {
    contracts: string;
    assistant: string;
    signIn: string;
    mySpace: string;
  };
  user: { fullName: string; role: UserRole; status: string } | null;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">{appConfig.name}</span>
            <span className="text-[11px] text-muted-foreground" dir="auto">
              {appConfig.logo.text}
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Navigation">
          <Link href="/contracts" className="transition-colors hover:text-foreground">
            {nav.contracts}
          </Link>
          <Link href="/assistant" className="transition-colors hover:text-foreground">
            {nav.assistant}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher currentLocale={locale} />
          {user ? (
            <Button asChild size="sm">
              <Link href={roleHome(user.role)}>{nav.mySpace}</Link>
            </Button>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/sign-in">{nav.signIn}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
