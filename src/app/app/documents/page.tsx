import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { formatDate, formatNumber } from "@/lib/format";
import { getServerI18n } from "@/lib/i18n/server";

export const metadata = { title: "Documents" };

/** Every file the client owns, with version, checksum and download link (§24). */
export default async function DocumentsPage() {
  const user = await requireUser();
  const { locale, d } = await getServerI18n();

  const documents = await db.contractDocument.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { contract: { select: { id: true, reference: true } } },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{d.client.documentsPageTitle}</h1>
        <p className="text-sm text-muted-foreground">{d.client.documentsPageSubtitle}</p>
      </header>

      {documents.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">{d.common.empty}</CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {documents.map((document) => (
            <li key={document.id}>
              <Card>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-medium" dir="auto">
                        {document.filename}
                      </span>
                      {document.immutable ? (
                        <Badge variant="success" className="text-[10px]">
                          {d.client.documentsImmutable}
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {d.statuses.documentType[document.documentType]} ·{" "}
                      <Link href={`/app/contracts/${document.contract.id}`} className="underline">
                        {document.contract.reference}
                      </Link>{" "}
                      · {formatDate(document.createdAt, locale)} · {formatNumber(document.sizeBytes, locale)} B
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground" dir="ltr">
                      {d.client.documentsChecksum}: {document.checksum.slice(0, 16)}…
                    </span>
                  </span>
                  <a
                    href={`/api/documents/${document.id}`}
                    className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-sm transition-colors hover:bg-accent-soft"
                  >
                    {d.common.download}
                  </a>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
