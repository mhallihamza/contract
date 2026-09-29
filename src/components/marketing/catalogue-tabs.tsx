"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentCard, type DocumentCardItem, type DocumentCardLabels } from "./document-card";

/**
 * Homepage catalogue (§4, §6).
 *
 * Category tabs are fed from `ContractCategory` groups computed server-side
 * from real `ContractType` rows — the visitor browses documents immediately,
 * without typing anything, and every CTA opens the product page.
 */
export interface CatalogueTabGroup {
  category: string;
  labelFr: string;
  labelAr: string;
  items: DocumentCardItem[];
}

export function CatalogueTabs({
  locale,
  groups,
  labels,
  startLabel,
  maxPerTab = 6,
}: {
  locale: "fr" | "ar";
  groups: CatalogueTabGroup[];
  labels: DocumentCardLabels;
  startLabel: string;
  maxPerTab?: number;
}) {
  if (groups.length === 0) return null;

  return (
    <Tabs defaultValue={groups[0]!.category}>
      <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0 sm:inline-flex">
        {groups.map((group) => (
          <TabsTrigger
            key={group.category}
            value={group.category}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            {locale === "ar" ? group.labelAr : group.labelFr}
          </TabsTrigger>
        ))}
      </TabsList>

      {groups.map((group) => (
        <TabsContent key={group.category} value={group.category} className="mt-6 ring-0">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.slice(0, maxPerTab).map((item) => (
              <DocumentCard
                key={item.code}
                item={item}
                locale={locale}
                labels={labels}
                showCategory={false}
                footer={
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link href={`/contracts/${item.slug}`}>
                      {startLabel}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                    </Link>
                  </Button>
                }
              />
            ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
}