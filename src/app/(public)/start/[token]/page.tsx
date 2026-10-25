import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { WizardPartyDraft, WizardSection } from "@/components/guest/questionnaire-wizard";
import { WizardWithPreview } from "@/components/guest/wizard-preview-panel";
import { GuestUnavailableCard } from "@/components/guest/unavailable-card";
import { estimateMinutes } from "@/lib/contracts/catalogue";
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
 * stopped. The wizard sits in the `WizardWithPreview` shell, which shows the
 * live, always-locked document preview beside the form on desktop and as a
 * tab on mobile.
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

  // Remaining-time source: the catalogue's own estimate, driven by the number
  // of questions the server actually asks (parties step included implicitly).
  const questionCount = Math.max(sections.reduce((sum, section) => sum + section.fields.length, 0), 1);
  const estimatedMinutes = estimateMinutes(questionCount, view.lawyerRequested);

  // The preview labels reuse the checkout wording — one voice, one source.
  const previewLabels = {
    ...d.public.wizardPreview,
    lockedNote: d.public.checkout.locked,
    pageEstimate: d.public.checkout.pages,
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:max-w-6xl lg:py-16">
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

      <WizardWithPreview
        wizard={{
          token,
          labels: t,
          sections,
          savedAnswers: view.answers,
          roles: view.partyRoles,
          existingParties,
          estimatedMinutes,
        }}
        preview={view.preview}
        locale={locale}
        previewLabels={previewLabels}
      />
    </div>
  );
}
