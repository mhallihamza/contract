/** French dictionary — review step and legal path UI (§30, §53). */
export const flowFr = {
  reviewTitle: "Vérifiez les informations",
  reviewSubtitle: "Ces informations servent à préparer le document et à déterminer le parcours.",
  reviewEditAnswers: "Modifier les réponses",
  reviewContinue: "Continuer vers le parcours juridique",
  reviewIncomplete: "Complétez les informations obligatoires pour continuer.",

  routeTitle: "Parcours juridique",
  routeSubtitle: "Déterminé par les règles configurées pour ce type de dossier.",
  routePredicted: "Parcours déterminé",
  routePathTitle: "Votre parcours",
  routePath: {
    information: "Informations collectées",
    route: "Parcours déterminé",
    draft: "Projet préparé",
    lawyerReviewOptional: "Revue par un avocat (facultative)",
    lawyerReviewRequired: "Revue par un avocat (obligatoire)",
    lawyerSignature: "Signature de l'avocat requise",
    payment: "Paiement",
    final: "Document final",
  },
  routeReasonsTitle: "Pourquoi ce parcours ?",
  routeRulesTitle: "Règles appliquées",
  routeGapsTitle: "Points non déterminés",
  routeSelfServiceTitle: "Préparer vous-même",
  routeSelfServiceBody: "Votre dossier peut être préparé directement, sans intervention d'un avocat.",
  routeLawyerOptionalTitle: "Revue par un avocat (facultative)",
  routeLawyerOptionalBody:
    "Vous pouvez finaliser vous-même ou demander une vérification par un avocat avant finalisation.",
  routeLawyerRequiredTitle: "Revue par un avocat requise",
  routeLawyerRequiredBody:
    "Pour ce dossier, l'intervention d'un avocat est prévue par les règles configurées. Elle ne peut pas être ignorée.",
  routeSignatureTitle: "Revue et signature de l'avocat",
  routeSignatureBody:
    "Le document ne peut pas être finalisé avant la signature de l'avocat selon le mécanisme configuré.",
  routeSpecialistTitle: "Un professionnel spécialisé est nécessaire",
  routeSpecialistBody: "Ce dossier relève d'une spécialité que la plateforme ne traite pas en ligne.",
  routeUnsupportedTitle: "Non pris en charge en ligne",
  routeUnsupportedBody:
    "Ce dossier nécessite une formalité que la plateforme ne peut pas préparer. Nous vous indiquons la suite à donner.",
  routeUndeterminedTitle: "Parcours à déterminer",
  routeUndeterminedBody:
    "Les règles configurées ne permettent pas de déterminer automatiquement le parcours. Notre équipe examine le dossier.",
  routeChooseLawyer: "Demander la revue par un avocat",
  routeChooseSelf: "Continuer sans avocat",
  routeLawyerSelected: "Revue par un avocat demandée",
  routeNoLawyerSelection:
    "L'avocat est attribué automatiquement par la plateforme — vous n'avez pas à le choisir.",
  routeFeedback: "Signaler une incohérence",
} as const;
