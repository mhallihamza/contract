import { getServerI18n } from "@/lib/i18n/server";
import Link from "next/link";

/**
 * Expired or unknown guest token (§37).
 *
 * One card for every public page that needs a valid session: it never reveals
 * whether the case ever existed, and always offers the way back to the
 * catalogue.
 */
export async function GuestUnavailableCard() {
  const { d } = await getServerI18n();
  const t = d.public.order;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="rounded-lg border border-border bg-card p-6 space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">{t.notFoundTitle}</h1>
        <p className="text-sm text-muted-foreground" dir="auto">
          {t.notFoundBody}
        </p>
        <Link href="/contracts" className="inline-block pt-2 text-sm font-medium text-primary hover:underline">
          {d.public.product.backToCatalogue}
        </Link>
      </div>
    </div>
  );
}