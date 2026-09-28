import { Card, CardContent } from "@/components/ui/card";

/**
 * "One path, six steps" (§62).
 *
 * Purely presentational: the six steps are dictionary content, so the section
 * never drifts from the promise made by the product.
 */
export function ProcessSteps({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: readonly { title: string; body: string }[];
}) {
  return (
    <section id="process" className="border-y border-border/60 bg-muted/20 py-16">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="mb-10 max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </header>

        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <Card className="h-full">
                <CardContent className="space-y-2 p-5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {index + 1}
                  </span>
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground" dir="auto">
                    {step.body}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
