/** French dictionary — public catalogue, product pages, assistant, guest journey. */
export const publicFr = {
  nav: {
    home: "Accueil",
    contracts: "Contrats",
    how: "Comment ça marche",
    help: "Aide",
    assistant: "Assistant",
    signIn: "Se connecter",
    mySpace: "Mon espace",
    solutions: "Nos services",
    businesses: "Entreprises",
    professionals: "Professionnels",
    resources: "Ressources",
    start: "Commencer",
    skipToContent: "Aller au contenu",
  },

  home: {
    // §33 — SEO metadata (no technology wording).
    metaTitle: "Contrats et documents juridiques au Maroc",
    metaDescription:
      "Préparez, faites vérifier et gérez vos contrats et documents juridiques au Maroc : du besoin au document final, avec validation professionnelle lorsque votre situation l'exige.",

    // §8 — hero.
    eyebrow: "CONTRATS & DOCUMENTS JURIDIQUES — MAROC",
    heroTitle: "Vos contrats, en toute sérénité.",
    heroSubtitle:
      "Préparez, faites vérifier et gérez vos contrats et documents juridiques depuis un seul espace.",
    heroCta: "Commencer une demande",
    heroCtaSecondary: "Découvrir nos services",
    heroReassurance: "Pour particuliers, entrepreneurs et entreprises.",
    // §9 — contract-workspace mockup on the right of the hero (pure UI, no photo).
    workspace: {
      ref: "Dossier #CM-0248",
      status: "En cours",
      sidebarLabel: "DOSSIER",
      sidebar: ["Informations", "Contrat", "Vérification", "Validation", "Signature", "Documents"],
      docTitle: "Contrat de prestation de services",
      docMeta: ["Version 02", "Mis à jour aujourd'hui"],
      sections: ["Objet", "Parties", "Prestations", "Durée", "Conditions de paiement", "Résiliation"],
      statesLabel: "ÉTAT DU DOSSIER",
      states: [
        { label: "Informations recueillies", state: "done" },
        { label: "Document préparé", state: "done" },
        { label: "Vérification en cours", state: "current" },
        { label: "Validation professionnelle", state: "pending" },
        { label: "Signature", state: "pending" },
      ],
      card: {
        label: "VALIDATION",
        subject: "Contrat de prestation",
        status: "Prêt pour vérification",
        cta: "Voir le dossier",
      },
    },

    // §10 — trust strip.
    trustStrip: [
      "Documents confidentiels",
      "Processus transparent",
      "Validation professionnelle",
      "Suivi du dossier",
    ],

    // §11 — from the need to the structured request.
    needTitle: "Le juridique commence par votre besoin.",
    needSubtitle:
      "Pas besoin de connaître le jargon juridique. Expliquez simplement votre situation et nous vous guidons vers la bonne démarche.",
    need: {
      inputLabel: "Votre besoin",
      platformLabel: "PLATEFORME",
      platformMessage: "Nous avons identifié votre demande",
      userMessage: "Je dois faire un contrat avec un client pour une prestation.",
      fields: [
        { label: "TYPE", value: "Contrat de prestation" },
        { label: "PARTIES", value: "Prestataire / Client" },
        { label: "OBJET", value: "Prestation de services" },
        { label: "ÉTAPE SUIVANTE", value: "Informations complémentaires" },
      ],
      cta: "Continuer",
      note: "Exemple de traitement — aucune donnée réelle.",
    },
    // §12 — services catalogue.
    servicesEyebrow: "NOS SERVICES",
    servicesTitle: "Des contrats adaptés à chaque situation.",
    servicesSubtitle:
      "Des contrats et documents adaptés à votre situation, avec un parcours clair du besoin jusqu'à la finalisation.",
    services: [
      {
        n: "01",
        title: "Contrats de prestation",
        body: "Encadrez clairement vos missions, obligations, délais et conditions de paiement.",
      },
      {
        n: "02",
        title: "Contrats commerciaux",
        body: "Structurez vos relations avec vos clients et partenaires : périmètre, engagements et durées.",
      },
      {
        n: "03",
        title: "Contrats de travail",
        body: "Encadrez vos recrutements et collaborations avec des clauses claires et complètes.",
      },
      {
        n: "04",
        title: "Immobilier",
        body: "Bail d'habitation ou bail commercial : loyer, durée, dépôt de garantie et obligations.",
      },
      {
        n: "05",
        title: "Documents d'entreprise",
        body: "Accords de confidentialité et documents de société pour sécuriser vos échanges.",
      },
      {
        n: "06",
        title: "Relecture de contrats",
        body: "Identifiez les points qui méritent votre attention avant de vous engager.",
      },
    ],

    // §13 — contract review.
    reviewTitle: "Vous avez déjà un contrat ?",
    reviewStatement: "Comprenez ce que vous vous apprêtez à signer.",
    reviewText:
      "Déposez votre document pour identifier les points qui méritent votre attention avant de vous engager.",
    review: {
      docLabel: "DOCUMENT",
      fileName: "Contrat_de_prestation.pdf",
      pages: "12 pages",
      statusLabel: "Statut",
      status: "À vérifier",
      pointsLabel: "POINTS À VÉRIFIER",
      note: "Aperçu de démonstration — aucune analyse juridique n'est affichée.",
      rows: [
        { label: "Objet du contrat", state: "ok" },
        { label: "Durée", state: "ok" },
        { label: "Conditions de paiement", state: "alert" },
        { label: "Résiliation", state: "alert" },
        { label: "Confidentialité", state: "ok" },
        { label: "Responsabilités", state: "alert" },
      ],
    },

    // §14 — contract lifecycle.
    lifecycleTitle: "Un contrat ne s'arrête pas à sa rédaction.",
    lifecycleSubtitle:
      "De la préparation au suivi, chaque étape reste claire et sous votre contrôle.",
    lifecycle: [
      { n: "01", title: "PRÉPARER", body: "Votre besoin est structuré et le document est préparé." },
      { n: "02", title: "VÉRIFIER", body: "Les points qui méritent votre attention sont repérés." },
      { n: "03", title: "APPROUVER", body: "Vous relisez et approuvez chaque version." },
      { n: "04", title: "SIGNER", body: "La signature intervient lorsque votre parcours le prévoit." },
      { n: "05", title: "SUIVRE", body: "Votre dossier reste consultable, étape par étape." },
    ],

    // §16 — professional validation (white section).
    validationTitle: "Certains dossiers nécessitent une attention particulière.",
    validationText:
      "Lorsque votre situation le nécessite, votre dossier peut être orienté vers une validation professionnelle.",
    validationPoints: [
      {
        title: "Expertise",
        body: "Votre dossier est préparé à partir de modèles éprouvés et de règles tracées.",
      },
      {
        title: "Contexte",
        body: "Votre situation est lue dans son contexte avant d'être structurée.",
      },
      {
        title: "Contrôle",
        body: "Rien n'est final sans votre relecture et votre approbation.",
      },
    ],
    dossier: {
      label: "DOSSIER",
      type: "Contrat commercial",
      statusLabel: "Statut",
      status: "Validation en cours",
      infoLabel: "ÉTAPES",
      items: [
        { label: "Parties identifiées", done: true },
        { label: "Objet du contrat", done: true },
        { label: "Conditions principales", done: true },
        { label: "Validation professionnelle", done: false },
        { label: "Finalisation", done: false },
      ],
    },

    // §17 — entrepreneurs.
    entrepreneurTitle: "Votre activité évolue. Vos contrats aussi.",
    entrepreneurText:
      "Premier client, nouveau partenaire, recrutement, location, prestation : les besoins juridiques changent avec votre activité.",
    entrepreneurCases: [
      { tag: "PREMIER CLIENT", doc: "Contrat de prestation" },
      { tag: "NOUVEAU PARTENAIRE", doc: "Accord commercial" },
      { tag: "NOUVELLE ÉQUIPE", doc: "Contrat de travail" },
    ],

    // §18 — companies (dashboard preview).
    businessTitle: "Pour les entreprises qui veulent garder leurs contrats sous contrôle.",
    businessSubtitle:
      "Centralisez vos demandes, documents, validations et contrats dans un même espace.",
    business: {
      previewNote: "Aperçu de démonstration — données fictives.",
      stats: [
        { label: "Demandes en cours", value: "8" },
        { label: "Contrats actifs", value: "12" },
        { label: "À valider", value: "3" },
        { label: "Documents", value: "24" },
      ],
      activityLabel: "Activité récente",
      activity: [
        "Contrat de prestation créé",
        "Document envoyé pour validation",
        "Version 02 approuvée",
        "Contrat finalisé",
      ],
    },

    // §19 — document management (product preview).
    documentsTitle: "Tous vos documents. Au même endroit.",
    documentsText:
      "Contrats, versions et validations restent réunis dans un seul espace : chaque document garde son statut et son historique.",
    documents: {
      previewNote: "Aperçu de démonstration — données fictives.",
      sidebar: ["Accueil", "Demandes", "Contrats", "Documents", "Validations", "Historique"],
      title: "Mes contrats",
      filters: ["Tous", "Actifs", "En validation", "À signer"],
      columns: ["DOCUMENT", "TYPE", "STATUT", "DATE"],
      rows: [
        { name: "Contrat de prestation", type: "Commercial", status: "Actif", date: "12/03", tone: "active" },
        { name: "Contrat fournisseur", type: "Commercial", status: "À valider", date: "10/03", tone: "review" },
        { name: "Contrat de travail", type: "RH", status: "Brouillon", date: "08/03", tone: "pending" },
      ],
    },

    // §19 — principles.
    whyTitle: "Le juridique, pensé autour de votre besoin.",
    why: [
      {
        n: "01",
        title: "Comprendre",
        body: "Nous partons de votre situation, pas d'un formulaire juridique complexe.",
      },
      {
        n: "02",
        title: "Structurer",
        body: "Chaque demande est organisée pour rendre les prochaines étapes claires.",
      },
      {
        n: "03",
        title: "Garder le contrôle",
        body: "Vous restez décisionnaire à chaque étape importante.",
      },
    ],

    // §20 — confidentiality.
    confidentialityTitle: "Vos documents méritent de la discrétion.",
    confidentialityText:
      "Les contrats et informations juridiques nécessitent un niveau de confidentialité élevé. L'expérience doit donc inspirer discrétion et contrôle.",
    confidentialityPoints: [
      {
        title: "Accès contrôlé",
        body: "Un dossier ne s'ouvre qu'avec son accès : aucun lien public.",
      },
      {
        title: "Documents centralisés",
        body: "Vos contrats sont réunis au même endroit, plutôt que dispersés.",
      },
      {
        title: "Historique des actions",
        body: "Chaque étape est datée : vous voyez ce qui a été fait et quand.",
      },
    ],

    // §22 — final call to action.
    finalCtaTitle: "Un contrat à préparer ?",
    finalCtaSubtitle: "Commencez simplement par nous expliquer votre besoin.",
    finalCtaPrimary: "Commencer une demande",
    finalCtaSecondary: "Particuliers · Entrepreneurs · Entreprises",

    // §23 — footer.
    footer: {
      tagline:
        "Plateforme de services juridiques : du besoin au document final, avec une validation professionnelle lorsque votre situation l'exige.",
      services: "SERVICES",
      platform: "PLATEFORME",
      company: "ENTREPRISE",
      legal: "LÉGAL",
      links: {
        servicePrestation: "Contrats de prestation",
        serviceCommercial: "Contrats commerciaux",
        serviceTravail: "Contrats de travail",
        serviceRelecture: "Relecture de contrats",
        serviceEntreprise: "Documents d'entreprise",
        howItWorks: "Comment ça marche",
        businesses: "Entreprises",
        professionals: "Professionnels",
        resources: "Ressources",
        about: "À propos",
        contact: "Contact",
        faq: "FAQ",
        notice: "Mentions légales",
        privacy: "Confidentialité",
        terms: "Conditions d'utilisation",
      },
    },
  },

  legalDoc: {
    eyebrow: "Informations légales",
    title: "Ce que cette plateforme fait — et ce qu'elle ne fait pas.",
    intro:
      "Cette page décrit l'environnement tel qu'il fonctionne réellement. Les informations d'identification de l'exploitant ne sont pas encore publiées : elles doivent être complétées avant toute mise en production.",
    sections: [
      {
        id: "mentions",
        title: "Éditeur et objet",
        body: "Cet environnement est un déploiement de démonstration de la plateforme. Aucune donnée d'identification d'entreprise n'est affichée tant qu'elle n'a pas été fournie par l'exploitant.",
        bullets: [
          "Objet : préparer des documents juridiques structurés à partir de modèles approuvés et des informations que vous fournissez.",
          "Marché visé : Maroc — les règles appliquées sont enregistrées avec leur source.",
          "La plateforme n'exerce pas elle-même la profession d'avocat : la revue est réalisée par un professionnel habilité.",
        ],
      },
      {
        id: "demonstration",
        title: "Environnement de démonstration",
        body: "Le prestataire de paiement est simulé : la confirmation est reproduite côté serveur et aucun montant réel n'est prélevé.",
        bullets: [
          "Les aperçus chiffrés (tableau de bord, exemples de dossiers) sont fictifs et signalés comme tels.",
          "Les documents produits ici ne doivent pas être utilisés comme actes authentiques.",
          "Les écrans concernés portent une mention « démonstration » visible.",
        ],
      },
      {
        id: "terms",
        title: "Conditions d'utilisation",
        body: "Le service prépare un document à partir de vos réponses, puis sollicite un professionnel lorsque les règles configurées l'exigent.",
        bullets: [
          "L'exactitude des informations fournies conditionne la validité du document préparé.",
          "La revue ou la signature par un avocat n'intervient que si le dossier le prévoit.",
          "Aucun conseil juridique personnalisé n'est délivré en dehors de cette revue.",
        ],
      },
      {
        id: "privacy",
        title: "Données et confidentialité",
        body: "Vos documents ne sont jamais exposés par un lien public : chaque dossier s'ouvre par un lien privé remis au client, chaque accès est vérifié côté serveur et chaque étape est horodatée.",
        bullets: [
          "Accès par rôle : chaque intervenant ne voit que les dossiers liés à sa mission.",
          "Suppression sur demande : écrivez au support pour demander la suppression des données d'un dossier.",
          "Les versions validées et signées sont conservées pour la traçabilité du dossier.",
        ],
      },
      {
        id: "cookies",
        title: "Cookies",
        body: "Deux cookies strictement nécessaires sont posés : la session et la préférence de langue. Aucun cookie publicitaire ni de mesure d'audience n'est utilisé.",
        bullets: [
          "mlp.session : maintient votre session ouverte (cookie httpOnly, inaccessible au script).",
          "mlp.locale : mémorise la langue choisie, français ou arabe.",
          "Vous pouvez les supprimer depuis votre navigateur à tout moment.",
        ],
      },
    ],
  },

  catalogue: {
    eyebrow: "Catalogue",
    title: "Vos documents juridiques, simplement.",
    pageTitle: "Tous les documents",
    pageSubtitle: "Trouvez le document adapté à votre situation.",
    subtitle:
      "Choisissez un document pour commencer. Aucun compte n'est nécessaire : vous ne le créez, si vous le souhaitez, qu'après le paiement.",
    start: "Commencer",
    from: "À partir de",
    questions: "{count} questions",
    estimatedTime: "Environ {minutes} min",
    lawyerBadge: "Validation par avocat disponible",
    signatureBadge: "Signature électronique disponible",
    empty: "Aucun document n'est publié pour le moment.",
    unavailable: "Le document demandé n'est pas disponible actuellement.",
    needHelp: "Vous ne savez pas quel document choisir ?",
    needHelpCta: "Trouver mon document",
    noAccount: "Sans création de compte",
    searchLabel: "Rechercher un document",
    searchPlaceholder: "Ex. : location, prestation de services, NDA…",
    allCategories: "Tous",
    noResult: "Aucun document ne correspond à votre recherche.",
    details: "Détails",
    legalNote:
      "Documents générés à partir de modèles approuvés. Aucune exigence légale n'est affirmée sans source vérifiée.",
  },

  product: {
    home: "Accueil",
    contracts: "Documents",
    title: "Préparez votre contrat à partir des informations de votre situation.",
    start: "Commencer mon contrat",
    time: "Temps estimé",
    price: "À partir de",
    whatYouNeedTitle: "Ce qu'il vous faut",
    whatYouNeedBody: "Vos informations, celles de l'autre partie, et un e-mail pour recevoir le document.",
    documentsTitle: "Pièces utiles",
    documentsEmpty: "Aucune pièce justificative n'est indispensable pour commencer.",
    journeyTitle: "Ce que vous allez faire",
    journeySteps: [
      "Répondre à quelques questions",
      "Vérifier vos informations",
      "Prévisualiser votre document",
      "Choisir votre service",
      "Payer",
      "Recevoir votre document",
    ],
    neededTitle: "Ce dont vous aurez besoin",
    neededIntro: "Ces informations alimentent le questionnaire : seules les questions du document choisi vous seront posées.",
    servicesTitle: "Options de service",
    selfServiceTitle: "Document seul",
    selfServiceBody: "Document généré à partir d'un modèle approuvé, utilisable immédiatement.",
    lawyerTitle: "Document + validation par avocat",
    lawyerBody: "Un avocat de la plateforme relit le dossier et le document avant finalisation.",
    lawyerConditional:
      "La validation par un avocat n'est proposée ou imposée que si les règles configurées le prévoient pour votre situation.",
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Dois-je créer un compte ?",
        a: "Non. Vous répondez au questionnaire et vous payez sans compte ; votre dossier reste accessible via le lien sécurisé que vous recevez.",
      },
      {
        q: "Quand un avocat intervient-il ?",
        a: "Un avocat intervient si vous le demandez, ou si les règles vérifiées applicables l'exigent. Le parcours est déterminé par ces règles, jamais par l'assistant.",
      },
      {
        q: "Puis-je modifier mes réponses après paiement ?",
        a: "Vous pouvez transmettre des informations complémentaires à tout moment, et les demandes d'un avocat sont tracées dans le dossier.",
      },
    ],
    notFoundTitle: "Document indisponible",
    notFoundBody: "Ce document n'existe pas ou n'est plus publié. Parcourez le catalogue pour trouver l'équivalent.",
    backToCatalogue: "Retour au catalogue",
    disclaimer:
      "La plateforme ne délivre pas de conseil juridique : les exigences applicables proviennent des règles vérifiées, et un professionnel intervient lorsque le parcours l'exige.",
  },

  assistant: {
    eyebrow: "Assistant",
    title: "Vous ne savez pas quel document choisir ?",
    subtitle:
      "Décrivez simplement votre situation, en français, en arabe ou en darija : nous vous orientons vers le document correspondant.",
    placeholder: "Ex. : je veux louer mon appartement à Casablanca pour un an",
    cta: "Trouver mon document",
    analyzing: "Analyse…",
    resultTitle: "Vous cherchez probablement",
    viewDocument: "Voir le document",
    clarify:
      "Nous n'avons pas identifié de document précis. Ajoutez un détail (logement, prestation, vente…) ou parcourez le catalogue.",
    browse: "Parcourir les documents",
    error: "L'analyse n'a pas abouti. Réessayez ou parcourez le catalogue.",
    summaryLabel: "Ce que nous avons compris",
    disclaimer:
      "L'assistant aide à choisir un document. Il ne détermine jamais si un avocat ou une signature est requis : cette décision appartient aux règles vérifiées de la plateforme et, au besoin, à un professionnel du droit.",
  },

  wizard: {
    title: "Votre dossier",
    step: "Étape {current} / {total}",
    questionsSubtitle: "Seules les questions utiles à votre dossier sont posées.",
    partiesSubtitle: "Indiquez qui sont les personnes ou entreprises concernées par le contrat.",
    you: "vous",
    partyName: "Nom complet / raison sociale",
    partyTypeCompany: "Société",
    partyTypeIndividual: "Personne physique",
    partyCompanyName: "Dénomination sociale",
    partyCompanyTaxId: "ICE / identifiant fiscal",
    partyAddress: "Adresse",
    partyCity: "Ville",
    partyEmail: "E-mail (facultatif)",
    partyPhone: "Téléphone (facultatif)",
    continue: "Continuer",
    back: "Retour",
    saving: "Enregistrement…",
    saved: "Enregistré",
    validate: "Valider mes réponses",
    validating: "Vérification des règles applicables…",
    missing: "Complétez les champs obligatoires pour continuer.",
    errorGeneric: "Une erreur est survenue. Vos réponses déjà saisies ont été conservées.",
    expired: "Ce dossier n'est plus accessible (session expirée).",
    required: "obligatoire",
    optional: "facultatif",
    reviewTitle: "Voici ce que nous avons compris",
    reviewSubtitle: "Relisez ces informations : elles servent à déterminer les règles applicables à votre dossier.",
    reviewEmpty: "Aucune réponse enregistrée pour l'instant.",
  },

  checkout: {
    title: "Votre document est prêt",
    subtitle: "Cet aperçu est généré à partir du modèle approuvé et de vos propres réponses.",
    sections: "{count} sections",
    pages: "{count} page(s) estimée(s)",
    personalized: "Vos informations reprises dans le document",
    clauses: "Clauses principales",
    locked: "Le document complet (téléchargeable) reste verrouillé jusqu'au paiement.",
    servicesTitle: "Choisissez votre service",
    requiredNotice: "Ce dossier nécessite une intervention juridique avant finalisation.",
    blockedNotice:
      "Ce dossier doit d'abord être examiné par un professionnel : aucun paiement n'est possible à ce stade, notre équipe vous contacte.",
    included: "Inclus dans ce parcours",
    choose: "Choisir",
    chosen: "Service choisi",
    emailTitle: "Où devons-nous envoyer votre document ?",
    emailHint: "Aucun compte n'est créé : l'e-mail sert uniquement à vous livrer le document et le lien de suivi.",
    emailLabel: "Votre e-mail",
    emailCta: "Continuer vers le paiement",
    summary: "Récapitulatif",
    total: "Total",
    payCta: "Payer et obtenir mon document",
    paying: "Paiement en cours…",
    simulated:
      "Prestataire de paiement simulé : la confirmation est reproduite côté serveur (callback signé). Aucun débit réel n'a lieu dans cet environnement.",
    paidNotice: "Paiement confirmé. Le document est en préparation.",
    errorGeneric: "L'opération n'a pas abouti. Aucun montant n'a été prélevé.",
    missingEmail: "Indiquez un e-mail valide.",
    openOrder: "Suivre mon dossier",
  },

  order: {
    title: "Votre dossier",
    reference: "Référence",
    status: "Statut",
    timeline: "Suivi",
    documents: "Documents",
    download: "Télécharger",
    noDocuments: "Aucun document n'est encore disponible.",
    finalReady: "Votre document final est disponible au téléchargement.",
    inProgress: "Votre dossier avance. Vous serez notifié à chaque étape.",
    routeTitle: "Parcours déterminé par les règles",
    routeReason: "Motif",
    routeCodes: "Codes de décision",
    missingRuleContext: "Éléments manquants dans la base de règles",
    notFoundTitle: "Dossier introuvable",
    notFoundBody: "Ce lien n'est plus valide ou la session a expiré.",
    guestNotice:
      "Vous suivez ce dossier sans compte. Conservez le lien reçu par e-mail pour le retrouver, ou créez un compte plus tard si vous le souhaitez.",
    steps: {
      INFORMATION: "Informations complétées",
      PAYMENT: "Paiement confirmé",
      DRAFT: "Document en préparation",
      LAWYER: "Validation juridique",
      SIGNATURE: "Signature",
      FINAL: "Document final",
    },
    stepState: {
      DONE: "terminé",
      CURRENT: "en cours",
      UPCOMING: "à venir",
      SKIPPED: "non requis",
    },
    statuses: {
      PENDING_PAYMENT: "En attente de paiement",
      PAID: "Payé",
      PROCESSING: "En préparation",
      AWAITING_LAWYER: "Chez l'avocat",
      AWAITING_SIGNATURE: "En attente de signature",
      COMPLETED: "Terminé",
      CANCELLED: "Annulé",
      REFUNDED: "Remboursé",
    },
    resume: "Reprendre le questionnaire",
    accountTitle: "Votre document vous a été envoyé par e-mail",
    accountBody:
      "Conservez ce lien de suivi pour reprendre votre dossier sans compte. Vous avez déjà un espace personnel ? Connectez-vous pour retrouver toutes vos commandes.",
    accountCta: "Se connecter",
  },
} as const;
