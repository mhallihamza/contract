import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  QuestionnaireWizard,
  type WizardPartyDraft,
  type WizardSection,
} from "@/components/guest/questionnaire-wizard";
import { GuestUnavailableCard } from "@/components/guest/unavailable-card";
import { requireGuestCase, type GuestCaseView } from "@/lib/guest/service";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata = {
  title: "Questionnaire — dossier",
  description:
    "Complétez les informations de votre dossier : seules les questions utiles sont posées, puis les règles applicables sont déterminées.",
};

/**
 * Guest questionnaire host (§9, §36).
 *
 * A thin server shell around the wizard: it resolves the token, refuses to
 * render once the routing engine already ran (the questionnaire is closed
 * then) and pre-fills everything from the stored case — answers, parties and
 * the field catalogue — so an interrupted session resumes exactly where it
 * stopped.
 */
export default async function GuestStartPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  let view: GuestCaseView | null = null;
  try {
    const context = await requireGuestCase(token);
    view = context.view;
  } catch {
    view = null;
  }

  if (!view) return <GuestUnavailableCard />;

  // Closed case: the wizard only applies before the deterministic router ran.
  if (view.route || view.status === "CANCELLED" || view.status === "FINAL") {
    redirect(`/dossier/${token}`);
  }

  // The wizard speaks the language the case was started in (§6) — not the
  // visitor's current language cookie, which may have changed mid-journey.
  const locale = view.language;
  const d = getDictionary(locale);
  const t = d.public.wizard;

  const sections: WizardSection[] = view.questionSections.map((section) => ({
    group: section.group,
    labelFr: section.labelFr,
    labelAr: section.labelAr,
    fields: section.fields.map((field) => ({
      key: field.key,
      labelFr: field.labelFr,
      labelAr: field.labelAr,
      type: field.type,
      required: field.required,
      helpFr: field.helpFr,
      helpAr: field.helpAr,
      options: field.options,
    })),
  }));

  const existingParties: WizardPartyDraft[] = view.parties.map((party) => ({
    role: party.role,
    partyType: party.partyType === "COMPANY" ? "COMPANY" : "INDIVIDUAL",
    fullName: party.fullName,
    companyTaxId: "",
    address: party.address ?? "",
    city: party.city ?? "",
    email: party.email ?? "",
    phone: party.phone ?? "",
  }));

  const contractTypeName = locale === "ar" ? view.contractType.nameAr : view.contractType.nameFr;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <div className="mb-8 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3.5 w-3.5" aria-hidden />
            <span dir="auto">{contractTypeName}</span>
          </Badge>
          <Badge variant="secondary">{view.reference}</Badge>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{t.title}</h1>
        <p className="text-sm text-muted-foreground" dir="auto">
          {t.questionsSubtitle}
        </p>
      </div>

      <QuestionnaireWizard
        token={token}
        locale={locale}
        labels={t}
        sections={sections}
        savedAnswers={view.answers}
        roles={view.partyRoles}
        existingParties={existingParties}
      />
    </div>
  );
}