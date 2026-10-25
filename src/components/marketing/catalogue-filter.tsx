"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DocumentCard, type DocumentCardItem, type DocumentCardLabels } from "./document-card";

/**
 * Secondary catalogue filtering (§17, §18).
 *
 * The dedicated `/contracts` page is where search belongs: a client-side
 * filter over the same database rows — discovery stays browse-first, and the
 * input never becomes the primary interaction of the product.
 */
export interface FilterableGroup {
  category: string;
  labelFr: string;
  labelAr: string;
  items: DocumentCardItem[];
}

const ALL = "__all__";

export function CatalogueFilter({
  locale,
  groups,
  labels,
  strings,
  initialCategory,
  tier,
}: {
  locale: "fr" | "ar";
  groups: FilterableGroup[];
  labels: DocumentCardLabels;
  strings: {
    searchLabel: string;
    searchPlaceholder: string;
    allCategories: string;
    noResult: string;
    start: string;
    details: string;
  };
  /**
   * Category opened by the link that brought the visitor here (homepage solution
   * card, footer column). Only honoured when the catalogue actually groups that
   * category, so a deep link never lands on an empty page.
   */
  initialCategory?: string;
  /** Tier memory from a pricing card, echoed into every start form. */
  tier?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>(() =>
    initialCategory && groups.some((group) => group.category === initialCategory) ? initialCategory : ALL,
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .filter((group) => category === ALL || group.category === category)
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (!q) return true;
          const haystack = [item.nameFr, item.nameAr, item.descriptionFr, item.descriptionAr]
            .join(" ")
            .toLowerCase();
          return haystack.includes(q);
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, category, query]);

  const total = visible.reduce((sum, group) => sum + group.items.length, 0);

  return (
    <div className="mt-10 space-y-6">
      <div className="space-y-3">
        <label htmlFor="catalogue-search" className="sr-only">
          {strings.searchLabel}
        </label>
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground rtl:right-3 rtl:left-auto"
            aria-hidden
          />
          <Input
            id="catalogue-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={strings.searchPlaceholder}
            className="bg-background ps-9 rtl:ps-3 rtl:pe-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <CategoryChip
            label={strings.allCategories}
            active={category === ALL}
            onClick={() => setCategory(ALL)}
          />
          {groups.map((group) => (
            <CategoryChip
              key={group.category}
              label={locale === "ar" ? group.labelAr : group.labelFr}
              active={category === group.category}
              onClick={() => setCategory(group.category)}
            />
          ))}
        </div>
      </div>

      {total === 0 ? (
        <p className="text-sm text-muted-foreground" dir="auto">
          {strings.noResult}
        </p>
      ) : (
        <div className="space-y-12">
          {visible.map((group) => (
            <section key={group.category} className="space-y-5">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold tracking-tight">
                  {locale === "ar" ? group.labelAr : group.labelFr}
                </h2>
                <span className="text-xs text-muted-foreground">
                  {group.items.length} {locale === "ar" ? "وثائق" : "documents"}
                </span>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <DocumentCard
                    key={item.code}
                    item={item}
                    locale={locale}
                    labels={labels}
                    footer={
                      <div className="flex items-center gap-2">
                        <form action="/api/guest/start" method="post">
                          <input type="hidden" name="slug" value={item.slug} />
                          {tier ? <input type="hidden" name="tier" value={tier} /> : null}
                          {/* Honeypot: invisible to humans, filled only by bots (§48). */}
                          <input
                            type="text"
                            name="company_website"
                            tabIndex={-1}
                            autoComplete="off"
                            aria-hidden="true"
                            className="hidden"
                          />
                          <Button type="submit" size="sm">
                            {strings.start}
                          </Button>
                        </form>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/contracts/${item.slug}`}>{strings.details}</Link>
                        </Button>
                      </div>
                    }
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? "rounded-full border border-primary bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground transition-colors"
          : "rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}