import type { ReactNode } from "react";

/**
 * TrustBadge (§2 hero).
 *
 * Reusable trust item of the marketing pages: one outline icon, one short
 * title line and a two-line explanation. Icons are passed as nodes so the
 * component stays a plain server component and can be used anywhere.
 */
export function TrustBadge({
  icon,
  title,
  body,
  className = "",
}: {
  icon: ReactNode;
  title: string;
  body?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
        aria-hidden
      >
        {icon}
      </span>
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold leading-snug text-navy">{title}</p>
        {body ? (
          <p className="text-xs leading-relaxed text-ink-muted" dir="auto">
            {body}
          </p>
        ) : null}
      </div>
    </div>
  );
}
