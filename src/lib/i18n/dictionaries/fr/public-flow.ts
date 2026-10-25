/** French dictionary — public catalogue, product pages, assistant, guest journey. */
export const publicFr = {
  nav: {
    home: "Accueil",
    contracts: "Contrats",
    how: "Comment ça marche",
    catalogue: "Documents",
    pricing: "Services & Tarifs",
    why: "Pourquoi nous",
    faq: "FAQ",
    help: "Aide",
    assistant: "Assistant",
    signIn: "Se connecter",
    mySpace: "Mon espace",
    services: "Services",
    businesses: "Entreprises",
    resources: "Ressources",
    start: "Commencer",
    createActe: "Créer mon acte",
    whatsappDirect: "Assistance WhatsApp Directe",
    brand: "Wathiqa",
    tagline: "Mon Juriste & Fiduciaire en ligne",
    skipToContent: "Aller au contenu",
  },

  home: {
    // §33 — SEO metadata (no technology wording).
    metaTitle: "Contrats et documents juridiques au Maroc",
    metaDescription:
      "Préparez vos actes juridiques et administratifs à partir de modèles approuvés, faites-les vérifier et finalisez-les en ligne : une équipe basée au Maroc, un cadre basé sur le droit marocain.",
    // §6 — announcement strip above the sticky bar.
    announcement: {
      badge: "Cadre Légal Marocain",
      note: "Option de relecture par un avocat disponible sur chaque document",
      whatsapp: "Une question ? Contactez-nous sur WhatsApp",
      hours: "Lu - Sa : 8h30 - 19h00",
    },
    // §6 — hero: the promise on the left, a typeset bail on the right.
    hero: {
      badge: "En Ligne • Juristes et Fiduciaires Basés au Maroc",
      titleLine1: "Votre juriste & fiduciaire",
      titleAccent: "100% en ligne au Maroc.",
      subtitle:
        "Accompagnement professionnel basé au Maroc pour rédiger, vérifier et formaliser vos actes juridiques et administratifs.",
      chips: ["Dahir Obligations & Contrats", "Loi 65-99 Code du Travail", "Conformité Données CNDP"],
      primaryCta: "Générer un acte immédiatement",
      secondaryCta: "Parler à notre équipe sur WhatsApp",
      metrics: [
        { value: "2 400+", label: "Actes Traités" },
        { value: "100%", label: "Plateforme Numérique" },
        { value: "4.9/5", label: "Satisfaction Clients" },
      ],
      // The dense paper mockup: the first page of a multi-page residential
      // bail. No heading of a State document, no conformity stamp — a neutral
      // "type template" sheet, with a summary of the whole contract under the
      // first two articles and a "page 1 / 8" footer.
      document: {
        ref: "N° WQ-2026-0321",
        title: "CONTRAT DE BAIL À USAGE D'HABITATION",
        law: "Modèle basé sur la loi 67-12 (dahir n° 1-13-111, 19 novembre 2013)",
        badge: "Modèle type",
        pages: "Page 1 / 8",
        partiesLabel: "ENTRE LES SOUSSIGNÉS :",
        party1: "1. Le Bailleur : M. Omar Benjelloun (CIN N° AB123456)",
        party2: "2. Le Preneur : Mme Sarah Tazi (CIN N° CD789012)",
        articles: [
          {
            title: "Article 1 — Objet du contrat",
            body: "Le bailleur donne à bail d'habitation au preneur le bien situé à Casablanca, quartier Gauthier, à usage exclusif d'habitation.",
          },
          {
            title: "Article 2 — Loyer et charges",
            body: "Le loyer mensuel est fixé à la somme de 6 500 DH, payable d'avance le 1er du mois, charges locatives en sus.",
          },
        ],
        sommaireLabel: "Sommaire des articles",
        sommaireItems: [
          "Article 1 — Objet du contrat",
          "Article 2 — Loyer et charges",
          "Article 3 — Durée du bail",
          "Article 4 — Dépôt de garantie",
          "Article 5 — État des lieux",
          "Article 6 — Obligations du bailleur",
          "Article 7 — Obligations du preneur",
          "Article 8 — Sous-location et cession",
          "Article 9 — Résiliation",
          "Article 10 — Restitution des lieux",
          "Article 11 — Litiges et juridiction",
        ],
        timestamp: "Document préparé à partir de modèles approuvés — à valider selon votre situation",
      },
    },
    // §6b — the category row: one card per database category, deep-linking
    // the catalogue's ?category= filter, plus the verification path.
    categories: {
      eyebrow: "Vos documents",
      title: "Choisissez votre catégorie",
      subtitle: "Chaque groupe rassemble les documents correspondant à votre situation.",
      countLabel: "{count} documents",
      browse: "Voir les documents",
      verifyCard: {
        title: "J'ai déjà un document — le faire vérifier",
        body: "Téléversez votre PDF ou Word, choisissez le niveau de contrôle et recevez le résultat par email.",
        cta: "Faire vérifier",
      },
    },
    // §14 — how it works: the two parcours, one per starting point.
    howItWorks: {
      eyebrow: "Simplicité Absolue",
      title: "Deux parcours, selon ce que vous avez déjà",
      subtitle:
        "Vous choisissez d'abord votre besoin : créer un document, ou faire contrôler celui que vous possédez. Chaque parcours ne vous montre que ses propres étapes.",
      createTrack: {
        title: "Je crée un document",
        price: "À partir de 290 DH HT / acte",
        steps: [
          {
            title: "Choisissez votre type d'acte",
            body: "Bail d'habitation, CDI/CDD ou prestation de service.",
          },
          {
            title: "Répondez aux questions guidées",
            body: "Vos réponses remplissent le document en temps réel, sous vos yeux.",
          },
          {
            title: "Choisissez : avec ou sans avocat",
            body: "",
          },
          {
            title: "Signez et recevez votre document",
            body: "PDF prêt à signer avec votre cocontractant. Avec avocat, l'attestation arrive par email et le paiement n'est capturé qu'après validation.",
          },
        ],
        tierBox: {
          left: {
            title: "Sans avocat",
            price: "290 DH",
            body: "Téléchargement immédiat, sans relecture.",
          },
          right: {
            title: "Avec avocat",
            price: "990 DH",
            body: "Relecture et attestation signée par un avocat.",
          },
        },
        cta: "Créer un document",
        ctaHref: "/contracts",
      },
      verifyTrack: {
        title: "J'ai déjà un document",
        price: "À partir de 79 DH HT",
        steps: [
          {
            title: "Téléversez votre document",
            body: "PDF ou Word. Rien n'est rédigé : nous contrôlons le vôtre.",
          },
          {
            title: "Choisissez le niveau de contrôle",
            body: "",
          },
          {
            title: "Recevez le résultat par email",
            body: "En quelques minutes (assistée) ou sous 24h ouvrées (avocat). Paiement avocat capturé uniquement après validation effective.",
          },
        ],
        tierBox: {
          left: {
            title: "Vérification assistée",
            price: "79 DH",
            body: "Contrôle automatisé de complétude (ne constitue pas un avis juridique).",
          },
          right: {
            title: "Validation Avocat",
            price: "990 DH",
            body: "Relecture par un avocat au barreau marocain et attestation signée.",
          },
        },
        cta: "Vérifier un document",
        ctaHref: "/verify",
      },
    },

    // §9 — services & pricing: three cards, every fee announced upfront.
    pricing: {
      eyebrow: "Transparence Totale",
      title: "Des tarifs clairs, sans aucuns frais cachés.",
      subtitle: "Créez un document, ou faites contrôler celui que vous avez déjà.",
      recommended: "Recommandé",
      tiers: [
        {
          badge: "Niveau 1",
          title: "Génération Simple",
          sub: "Formule Libre-service",
          price: "290 DH",
          unit: "HT / acte",
          applies: "Pour un nouveau document",
          features: [
            { text: "Création guidée du document", included: true },
            { text: "Format PDF téléchargeable", included: true },
            { text: "Modèle standardisé", included: true },
            { text: "Sans relecture par un avocat", included: false },
          ],
          cta: "Créer un document",
          ctaHref: "/contracts",
          tone: "sand",
        },
        {
          badge: "Option Complétude",
          title: "Vérification Assistée",
          sub: "Contrôle automatisé de cohérence",
          price: "79 DH",
          unit: "HT / acte",
          applies: "Pour un document que vous avez déjà",
          features: [
            { text: "Sur un document que vous avez déjà (PDF ou Word)", included: true },
            { text: "Détection des erreurs de saisie d'identité", included: true },
            { text: "Vérification d'absence de champs omis", included: true },
            { text: "Rapport de cohérence immédiat", included: true },
          ],
          cta: "Vérifier un document",
          ctaHref: "/verify?tier=assistee",
          tone: "accent",
        },
        {
          badge: "Validation Légale",
          title: "Validation Avocat",
          sub: "Relecture par un professionnel",
          price: "990 DH",
          unit: "HT / acte",
          applies: "Pour un nouveau document, ou un document que vous avez déjà",
          features: [
            { text: "Relecture par un Avocat au Barreau (document créé ici ou déjà en votre possession)", included: true },
            { text: "Attestation officielle de validation signée", included: true },
            { text: "Ajustements personnalisés inclus", included: true },
            { text: "Paiement débité après validation", included: true },
          ],
          cta: "Choisir la validation avocat",
          ctaHref: "/contracts?tier=avocat",
          tone: "dark",
        },
      ],
    },

    // §10 — the comparison a visitor makes before committing.
    comparison: {
      eyebrow: "Comparatif Majeur",
      title: "Pourquoi choisir Wathiqa plutôt qu'un cabinet classique ?",
      columns: {
        criteria: "Critères d'évaluation",
        them: "Cabinet Traditionnel / Écrivain Public",
        us: "Wathiqa (En Ligne)",
      },
      rows: [
        { criterion: "Déplacement physique", bad: "Multiple (3 à 5 rendez-vous)", good: "0 Déplacement (100% en ligne)", kind: "check" },
        { criterion: "Délai moyen d'obtention de l'acte", bad: "1 à 2 semaines de délai", good: "Instantané à 24h ouvrées", kind: "bolt" },
        { criterion: "Transparence des tarifs", bad: "Honoraires flous & imprévus", good: "Tarifs fixes annoncés à l'avance", kind: "check" },
        { criterion: "Choix du niveau de validation", bad: "Non disponible (tarif unique)", good: "3 niveaux au choix (Self, Vérification, Avocat)", kind: "check" },
      ],
    },

    // §11 — frequently asked questions.
    faqTitle: "Questions fréquentes",
    faq: [
      {
        q: "Les documents générés ont-ils une vraie valeur juridique au Maroc ?",
        a: "Nos modèles sont basés sur des textes de loi marocains identifiés (notamment le Dahir des Obligations et Contrats et le Code du Travail Loi 65-99), et la source de chaque règle est enregistrée. Un contrat reste à valider selon votre situation : si vous souhaitez une assurance supplémentaire, vous pouvez opter pour la validation par un avocat qui délivre une attestation de relecture signée.",
      },
      {
        q: "Quelle est la différence entre Libre-Service, Vérification Assistée et Validation Avocat ?",
        a: "Libre-service (290 DH) : vous créez un document en répondant aux questions et vous le téléchargez prêt à signer, sans avocat. Vérification assistée (79 DH) : un contrôle automatisé vérifie la cohérence des dates, des identités et l'absence de champs omis avant signature. Validation Avocat (990 DH) : un avocat inscrit au barreau marocain examine votre document et, s'il est conforme, émet une attestation de relecture officielle signée.",
      },
      {
        q: "Dois-je me déplacer physiquement pour obtenir mon document ?",
        a: "Non, la procédure est 100% en ligne. Vous répondez au questionnaire, signez votre document de manière électronique et recevez la version finale ainsi que l'attestation de l'avocat (si sélectionnée) directement dans votre boîte email.",
      },
      {
        q: "L'avocat signe-t-il directement mon contrat ?",
        a: "Non. Seules les parties contractantes (par exemple le bailleur et le locataire) constituent les signataires du contrat. Lorsque vous choisissez la validation par avocat, ce dernier établit et signe un document séparé : une attestation officielle de relecture juridique qui atteste de la validité de l'acte.",
      },
    ],


    // §17 — footer: brand, popular services, the legal framework, contact.
    footer: {
      tagline:
        "Votre juriste & fiduciaire en ligne au Maroc. Rédaction, vérification et formalisation d'actes juridiques en quelques clics.",
      popular: "SERVICES POPULAIRES",
      compliance: "CONFORMITÉ & LOIS",
      contact: "CONTACT & ASSISTANCE",
      popularLinks: [
        { label: "Contrat de Bail d'Habitation", target: "bail" },
        { label: "Contrat de Travail CDI/CDD", target: "cdi" },
        { label: "Prestation de Service / Freelance", target: "prestation" },
        { label: "Vérifier un document existant", target: "verify" },
      ],
      laws: [
        "Dahir des Obligations et Contrats (DOC)",
        "Loi 67-12 relative aux Baux d'habitation",
        "Loi 65-99 formant Code du Travail",
        "Conformité Données Personnelles CNDP",
      ],
      address: "Siège social : exemple — à compléter par l'exploitant",
      hours: "Du Lundi au Samedi : 8h30 - 19h00",
      whatsapp: "WhatsApp",
      legal: "Mentions Légales",
      privacy: "Politique de Confidentialité",
      copyright:
        "© 2026 Wathiqa. Tous droits réservés. Plateforme juridique marocaine indépendante.",
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
          "wathiqa.session : maintient votre session ouverte (cookie httpOnly, inaccessible au script).",
          "wathiqa.locale : mémorise la langue choisie, français ou arabe.",
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
    // Public metadata (§33): the same rule as the landing page — the catalogue
    // must not advertise itself with the wrong language when served in Arabic.
    metaTitle: "Tous les documents",
    metaDescription:
      "Trouvez le document juridique adapté à votre situation : immobilier, travail, business, vente. Sans création de compte.",
    subtitle:
      "Choisissez un document pour commencer. Aucun compte n'est nécessaire : vous ne le créez, si vous le souhaitez, qu'après le paiement.",
    start: "Commencer",
    from: "À partir de",
    questions: "{count} questions",
    estimatedTime: "Environ {minutes} min",
    lawyerBadge: "Validation par avocat disponible",
    signatureBadge: "Signature électronique disponible",
    documentsAtHand: "À avoir : {items}",
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
    pages: "Environ {count} pages",
    basedOn: "Modèle basé sur",
    basedOnNote: "à valider selon votre situation",
    lawyerMandatoryTitle: "Validation par un avocat obligatoire pour ce type de document.",
    lawyerMandatoryBody:
      "Les règles vérifiées applicables excluent ici le parcours sans avocat : le dossier passera par la validation d'un professionnel avant d'être finalisé.",
    preselected: "Déjà sélectionné",
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

  // §7b — the verification journey: no questionnaire, one file + one tier.
  verify: {
    metaTitle: "Faire vérifier un document existant",
    metaDescription:
      "Téléversez le contrat que vous avez déjà et choisissez votre niveau de contrôle : vérification automatisée ou relecture par un avocat.",
    eyebrow: "Vous avez déjà le document",
    title: "Faites-le contrôler avant de le signer",
    subtitle: "Un seul écran : votre fichier, votre niveau de contrôle.",
    uploadTitle: "Votre document",
    uploadArea: "Glissez votre fichier ici, ou cliquez pour le choisir",
    noFileChosen: "Aucun fichier choisi",
    chooseFile: "Choisir un fichier",
    emptyPlaceholder: "Votre document s'affichera ici",
    removeFile: "Retirer",
    producesTitle: "Ce que la vérification produit",
    producesAssisted:
      "Une vérification automatisée de complétude et de cohérence : une liste de points à contrôler (champs manquants, dates, identités d'écriture). Ce n'est pas un avis juridique.",
    producesLawyer:
      "Un avocat au barreau marocain relit votre document et délivre une attestation de relecture signée, séparée du document.",
    tierTitle: "Niveau de contrôle",
    tierAssistedTitle: "Vérification assistée",
    tierAssistedBody: "Contrôle automatisé de complétude et de cohérence.",
    tierAssistedPrice: "79 DH",
    tierLawyerTitle: "Validation Avocat",
    tierLawyerBody: "Relecture par un professionnel et attestation signée.",
    tierLawyerPrice: "990 DH",
    tierNote: "Prix hors taxes",
    tierLawyerNote: "Le paiement de la validation avocat est encaissé uniquement après la validation du dossier.",
    delayTitle: "Délai annoncé",
    delayAssisted: "Rapport généralement sous 48 h ouvrées",
    delayLawyer: "Attestation généralement sous 3 jours ouvrés",
    priceLabel: "Prix du niveau choisi",
    submit: "Envoyer pour vérification",
    submitting: "Envoi en cours…",
    errorsTitle: "Envoi impossible",
    errorTooLarge: "Fichier trop lourd : la taille maximale est {size}.",
    errorUnsupportedType: "Type de fichier non pris en charge.",
    errorExecutable: "Les fichiers exécutables ne sont jamais acceptés.",
    errorMacros: "Les documents contenant des macros sont refusés.",
    errorTypeMismatch: "Le contenu du fichier ne correspond pas au type annoncé.",
    errorTier: "Choisissez d'abord un niveau de contrôle.",
    errorEmpty: "Le fichier est vide.",
    errorSelectTier: "Choisissez un niveau de contrôle avant l'envoi.",
    errorGeneric: "L'envoi a échoué. Vérifiez le fichier et essayez à nouveau.",
    confirmationTitle: "Votre document a bien été reçu",
    confirmationSubtitle: "Conservez cette référence : elle vous donne accès au suivi de la vérification.",
    referenceLabel: "Référence",
    fileLabel: "Fichier",
    sizeLabel: "Taille",
    tierLabel: "Niveau choisi",
    delayLabel: "Délai annoncé",
    priceLabelConfirm: "Montant à payer à l'étape suivante",
    statusLabel: "Statut",
    statusReceived: "Reçu — en attente de traitement",
    statusChecking: "En cours de vérification",
    caseLabel: "Dossier",
    checkoutTitle: "Valider et payer la vérification",
    checkoutEmailTitle: "Votre e-mail",
    checkoutEmailHint: "Le rapport est envoyé à cette adresse : elle sera aussi votre référence de suivi.",
    checkoutEmailPlaceholder: "prenom.nom@example.ma",
    checkoutPay: "Payer et lancer la vérification",
    checkoutPaying: "Préparation du paiement…",
    checkoutSettle: "Régler maintenant",
    checkoutSettling: "Règlement en cours…",
    checkoutSimulatedNote: "Espace de démonstration : aucun paiement réel n'est encaissé.",
    checkoutDoneTitle: "Vérification lancée",
    checkoutDoneBody: "Votre dossier est passé sous vérification. Vous serez notifié(e) à l'adresse indiquée.",
    checkoutErrorEmail: "Indiquez une adresse e-mail valide.",
    checkoutErrorGeneric: "Impossible de démarrer le paiement. Réessayez dans un instant.",
    retentionNote:
      "Votre fichier est conservé de manière privée et supprimé au plus tard {days} jours après son envoi.",
    verifyAnother: "Envoyer un autre document",
    notFoundTitle: "Référence introuvable",
    notFoundBody:
      "Ce lien de suivi est invalide ou expiré. Retournez sur la page de vérification pour envoyer votre document à nouveau.",
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
    partiesStep: "Les parties",
    reviewStep: "Vérification",
    progressSaved: "Votre progression est enregistrée. Vous pouvez fermer cette page et reprendre plus tard avec ce lien.",
    copyLink: "Copier le lien",
    copied: "Copié",
    timeLeft: "≈ {minutes} min restantes",
    stepsAria: "Étapes du dossier",
  },

  // §10b — the wizard's live preview panel: reused checkout strings for the
  // locked note and the page estimate, plus tab labels for the mobile shell.
  wizardPreview: {
    formTab: "Formulaire",
    previewTab: "Aperçu du document",
    previewAria: "Basculer entre le formulaire et l'aperçu",
    empty: "L'aperçu du document s'affichera ici dès que le modèle approuvé est prêt.",
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
    modifyChoice: "Modifier",
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
