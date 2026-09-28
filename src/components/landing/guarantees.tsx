import { FileSignature, ShieldCheck, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * What the platform does and does not promise (§62, §63).
 *
 * Three capability cards plus the disclaimers that must always accompany them:
 * the platform is not a law firm, the AI does not replace a lawyer, and no
 * blanket validity is claimed.
 */
export function Guarantees({
  selfService,
  lawyer,
  secure,
  disclaimers,
}: {
  selfService: { title: string; body: string };
  lawyer: { title: string; body: string };
  secure: { title: string; body: string };
  disclaimers: readonly string[];
}) {
  const cards = [
    { key: "self", icon: FileSignature, ...selfService },
    { key: "lawyer", icon: UserCheck, ...lawyer },
    { key: "secure", icon: ShieldCheck, ...secure },
  ];

  return (
    <section id="guarantees" className="py-16">
      <div className="mx-auto w-full max-w-6xl space-y-8 px-4 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.key} className="h-full">
              <CardHeader className="space-y-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground" dir="auto">
                  {card.body}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <ul className="space-y-2 rounded-xl border border-dashed border-border bg-muted/20 p-5 text-xs text-muted-foreground">
          {disclaimers.map((disclaimer) => (
            <li key={disclaimer} dir="auto" className="flex gap-2">
              <span aria-hidden>·</span>
              <span>{disclaimer}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
