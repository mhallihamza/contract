import Link from "next/link";
import { appConfig } from "@/lib/config";

/**
 * Public footer (§62, §63).
 *
 * Branding, support contact and the mandatory disclosure that this environment
 * is a demonstration. The disclaimer text is dictionary-driven so both locales
 * carry the same legal wording.
 */
export function SiteFooter({
  product,
  legal,
  support,
  rights,
  disclaimer,
  nav,
}: {
  product: string;
  legal: string;
  support: string;
  rights: string;
  disclaimer: string;
  nav: { contracts: string; requests: string; documents: string; signIn: string };
}) {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/20">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-2">
          <p className="text-sm font-semibold">{appConfig.name}</p>
          <p className="text-xs text-muted-foreground" dir="auto">
            {disclaimer}
          </p>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{product}</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <Link href="/app/contracts" className="hover:text-foreground">
                {nav.contracts}
              </Link>
            </li>
            <li>
              <Link href="/app/contracts/new" className="hover:text-foreground">
                {nav.requests}
              </Link>
            </li>
            <li>
              <Link href="/app/documents" className="hover:text-foreground">
                {nav.documents}
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{support}</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>
              <a href={`mailto:${appConfig.supportEmail}`} className="hover:text-foreground" dir="ltr">
                {appConfig.supportEmail}
              </a>
            </li>
            <li>
              <Link href="/sign-in" className="hover:text-foreground">
                {legal} · {nav.signIn}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60 py-4">
        <p className="mx-auto w-full max-w-6xl px-4 text-xs text-muted-foreground sm:px-6" dir="auto">
          {rights}
        </p>
      </div>
    </footer>
  );
}
