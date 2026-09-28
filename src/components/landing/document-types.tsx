import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface SupportedContractType {
  code: string;
  nameFr: string;
  nameAr: string;
  descriptionFr: string | null;
  descriptionAr: string | null;
  category: string;
}

/**
 * Catalogue preview (§14, §62).
 *
 * Only active contract types are shown: the platform never advertises a document
 * it cannot actually prepare. When the database is empty the section is skipped
 * rather than filled with placeholders.
 */
export function DocumentTypes({
  title,
  subtitle,
  more,
  moreBody,
  locale,
  types,
}: {
  title: string;
  subtitle: string;
  more: string;
  moreBody: string;
  locale: "fr" | "ar";
  types: readonly SupportedContractType[];
}) {
  if (types.length === 0) return null;

  return (
    <section id="types" className="py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
        <header className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </header>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {types.map((type) => {
            const name = locale === "ar" ? type.nameAr : type.nameFr;
            const description = locale === "ar" ? type.descriptionAr : type.descriptionFr;
            return (
              <li key={type.code}>
                <Card className="h-full">
                  <CardHeader className="space-y-2">
                    <CardTitle className="text-base" dir="auto">
                      {name}
                    </CardTitle>
                    <Badge variant="outline" className="w-fit font-mono text-[10px] uppercase">
                      {type.category.toLowerCase()}
                    </Badge>
                  </CardHeader>
                  {description ? (
                    <CardContent>
                      <p className="text-sm text-muted-foreground" dir="auto">
                        {description}
                      </p>
                    </CardContent>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>

        <Card className="border-dashed bg-muted/20">
          <CardContent className="space-y-1 p-5">
            <p className="text-sm font-semibold">{more}</p>
            <p className="text-sm text-muted-foreground" dir="auto">
              {moreBody}
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
