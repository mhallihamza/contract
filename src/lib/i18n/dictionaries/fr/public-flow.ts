/** French dictionary — public catalogue, product pages, assistant, guest journey. */
export const publicFr = {
  nav: {
    home: "Accueil",
    contracts: "Contrats",
    how: "Comment ça marche",
    simulator: "Simulateur d'Acte",
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
      "Rédigez, faites vérifier et formalisez vos actes juridiques et administratifs au Maroc : un juriste basé au Maroc, un cadre conforme au droit marocain, en ligne.",
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
      // The dense paper mockup: a residential bail, typeset verbatim.
      document: {
        kingdom: "Royaume du Maroc",
        ref: "N° DM-2026-8849",
        title: "CONTRAT DE BAIL À USAGE D'HABITATION",
        law: "Dahir n° 1-13-111 • Conforme Loi 67-12",
        stamp: "MODÈLE TYPE",
        stampNote: "CONFORME LOI 67-12",
        partiesLabel: "ENTRE LES SOUSSIGNÉS :",
        party1: "1. Le Bailleur : M. Omar Benjelloun (CIN N° AB123456)",
        party2: "2. Le Preneur : Mme Sarah Tazi (CIN N° CD789012)",
        articles: [
          {
            title: "Article 1 — Objet du Contrat",
            body: "Le bailleur donne à bail d'habitation au preneur le bien situé à Casablanca, Quartier Gauthier.",
          },
          {
            title: "Article 2 — Loyer & Charges",
            body: "Le loyer mensuel est fixé à la somme de 6 500 DH, payable d'avance le 1er du mois.",
          },
          {
            title: "Article 3 — Durée du Bail",
            body: "Le présent contrat est conclu pour une durée d'une (1) année renouvelable par tacite reconduction.",
          },
        ],
        sig1Label: "Signature Bailleur:",
        sig1: "O. Benjelloun",
        sig2Label: "Signature Preneur:",
        sig2: "S. Tazi",
        timestamp: "Document généré et horodaté",
        refNote: "Réf. juridique conforme à la Loi 67-12",
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
        ctaHref: "create",
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
        ctaHref: "verify",
      },
    },

    // §8 — the interactive simulator: create a document end-to-end, or verify
    // one already held. The paper templates carry {f0_0}-style tokens that the
    // live sheet fills from the wizard answers.
    simulator: {
      eyebrow: "Testez par vous-même",
      title: "Simulateur & Générateur d'Acte en Direct",
      subtitle:
        "Créez un nouveau document de A à Z, ou téléversez un document que vous avez déjà pour le faire vérifier.",
      choiceLabel: "Que souhaitez-vous faire ?",
      choiceCreate: {
        title: "Créer un nouveau document",
        body: "Choisissez un modèle, répondez aux questions, puis décidez de le faire relire par un avocat ou non.",
      },
      choiceVerify: {
        title: "Vérifier un document existant",
        body: "Vous avez déjà un contrat ? Faites-le examiner avant de le signer.",
      },
      back: "Retour",
      stepsCreate: ["Type d'acte", "Informations", "Accompagnement", "Finalisation"],
      stepsVerify: ["Téléversez", "Contrôle", "Confirmation"],
      labels: {
        createType: "Type d'acte",
        createInfo: "Vos informations",
        createTier: "Accompagnement",
        createFinal: "Finalisation",
        verifyUpload: "Téléversez le document",
        verifyTier: "Niveau de contrôle",
        verifyFinal: "Confirmation",
      },
      continueBtn: "Continuer",
      toTierBtn: "Choisir l'accompagnement",
      prev: "Précédent",
      sendBtn: "Envoyer le document",
      typeIntro: "Choisissez le type d'acte que vous souhaitez rédiger :",
      docTypes: {
        bail: {
          title: "Contrat de Bail d'Habitation",
          sub: "Conforme à la Loi 67-12",
        },
        cdi: {
          title: "Contrat de Travail (CDI / CDD)",
          sub: "Conforme au Code du Travail 65-99",
        },
        prestation: {
          title: "Prestation de Service / Freelance",
          sub: "Conforme au Dahir des Obligations et Contrats",
        },
      },
      tierIntro: "Souhaitez-vous faire relire votre document par un avocat ?",
      tierWarning: "Choisissez un niveau de contrôle pour continuer.",
      createTiers: {
        sans: {
          label: "Sans avocat",
          price: "290 DH",
          desc: "Vous téléchargez votre document prêt à signer, immédiatement. Aucune relecture par un avocat.",
          cta: "Télécharger le PDF",
        },
        avocat: {
          label: "Avec avocat",
          price: "990 DH",
          desc: "Un avocat au barreau marocain examine votre projet. S'il est en ordre, il délivre une attestation de relecture signée.",
          note: "Paiement capturé uniquement après validation effective par l'avocat (24h ouvrées).",
          cta: "Confirmer la demande d'avocat",
        },
      },
      verifyTiers: {
        assistee: {
          label: "Vérification assistée",
          price: "79 DH",
          desc: "Contrôle automatisé de complétude : identités, dates, montants et clauses. Ne constitue pas un avis juridique.",
        },
        avocat: {
          label: "Validation par Avocat",
          price: "990 DH",
          desc: "Un avocat au barreau marocain relit intégralement votre document et délivre une attestation de relecture signée.",
          note: "Paiement capturé uniquement après validation effective par l'avocat.",
        },
      },
      uploadIntro: "Téléversez le document que vous avez déjà (PDF ou Word) :",
      uploadCta: "Cliquez pour téléverser un fichier",
      uploadFormats: "PDF, DOC, DOCX, PNG, JPG",
      uploadWarning: "Veuillez sélectionner un fichier avant de continuer.",
      confirmTitle: "Document transmis",
      confirmBody: "Votre document a bien été transmis pour contrôle. Vous recevrez le résultat par email.",
      launchCta: "Créer un nouveau document",
      previewLabel: "Aperçu du document",
      previewNote: "Les valeurs saisies se mettent à jour en direct.",
      previewWaiting: "Téléversez un fichier pour l'apercevoir ici.",
      fileRemoveLabel: "Retirer le fichier",
      finalRecapLabel: "Récapitulatif",
      finalLawyerTitle: "Validation par un avocat",
      finalLawyerBody:
        "Un avocat au barreau marocain examine votre document et délivre une attestation de relecture signée. Le paiement n'est capturé qu'après validation effective (24h ouvrées).",
      finalReadyTitle: "Téléchargement immédiat",
      finalReadyBody:
        "Votre document est prêt à signer. Vous pouvez le télécharger et le transmettre à votre cocontractant.",
      finalNoReviewNote: "Sans relecture par un avocat.",
      handoffNote: "En continuant, vous ouvrez le questionnaire du document choisi sur la plateforme.",
      liveHint: "Le document ci-contre se met à jour à mesure que vous répondez.",
      kingdomLabel: "Royaume du Maroc",
      stampDraft: "PROJET GÉNÉRÉ",
      stampWaiting: "EN ATTENTE DE VALIDATION",
      stampSealLabel: "MODÈLE TYPE",
      liveBadge: "MISE À JOUR EN DIRECT",
      signaturePlaceholder: "Signature…",
      stampLegalized: "PROJET GÉNÉRÉ",
      identityNote: "Aperçu de démonstration. Les valeurs affichées sont issues de vos réponses.",

      docs: {
        bail: {
          title: "Contrat de Bail d'Habitation",
          kicker: "Soumis à la Loi marocaine n° 67-12",
          heading: "CONTRAT DE BAIL À USAGE D'HABITATION",
          ref: "N° DM-2026-8849",
          sigTokens: ["f0_0", "f1_0"],
          sigLabels: ["Signature du Bailleur", "Signature du Preneur"],
          groups: [
            {
              subLabel: "Identification des Parties (1/2)",
              fields: [
                { label: "Nom Complet du Bailleur (Propriétaire)", value: "Youssef BENNANI" },
                { label: "CIN du Bailleur", value: "AB123456" },
              ],
            },
            {
              subLabel: "Identification des Parties & Bien (2/2)",
              fields: [
                { label: "Nom Complet du Locataire", value: "Karim ALAMI" },
                { label: "CIN du Locataire", value: "CD789012" },
                { label: "Adresse complète du Bien (Ville)", value: "25 Boulevard Massira, Casablanca" },
                { label: "Montant du Loyer Mensuel (en Dirhams - DH)", value: "6500" },
                { label: "Dépôt de Garantie (Nombre de mois - Max 2)", value: "2" },
                { label: "Durée du Bail (Années)", value: "1" },
              ],
            },
          ],
          paper: [
            "ENTRE LES SOUSSIGNÉS :",
            "1. M./Mme {f0_0}, titulaire de la CIN n° {f0_1}, ci-après dénommé « Le Bailleur ».",
            "2. M./Mme {f1_0}, titulaire de la CIN n° {f1_1}, ci-après dénommé « Le Locataire ».",
            "ARTICLE 1 — OBJET ET DÉSIGNATION DU BIEN",
            "Le Bailleur donne à bail à usage exclusif d'habitation au Locataire, qui l'accepte, le local situé à : {f1_2}.",
            "ARTICLE 2 — DURÉE DU BAIL ET RENOUVELLEMENT",
            "Le présent contrat est conclu pour une durée de {f1_5} an(s) à compter de la date de prise de possession. Il est renouvelable par tacite reconduction conformément aux dispositions de la loi 67-12.",
            "ARTICLE 3 — LOYER ET RÉVISION",
            "Le loyer mensuel est fixé à la somme de {loyer} DH payable d'avance le 1er de chaque mois. Toute révision de loyer sera soumise au taux légal en vigueur (8%).",
            "ARTICLE 4 — DÉPÔT DE GARANTIE (CAUTION)",
            "À la signature des présentes, le Locataire verse une somme de {caution_total} DH ({f1_4} mois de loyer) à titre de dépôt de garantie non productif d'intérêts.",
            "ARTICLE 5 — OBLIGATIONS DES PARTIES",
            "Le Bailleur garantit la jouissance paisible des lieux. Le Locataire s'engage à payer le loyer aux échéances, entretenir le bien et souscrire une assurance contre les risques locatifs.",
            "ARTICLE 6 — RÉSILIATION ET PRÉAVIS",
            "Toute résiliation anticipée doit faire l'objet d'un préavis écrit conformément aux articles 44 et suivants de la loi n° 67-12.",
          ],
        },

        cdi: {
          title: "Contrat de Travail (CDI / CDD)",
          kicker: "Conforme au Code du Travail Marocain (Loi 65-99)",
          heading: "CONTRAT DE TRAVAIL À DURÉE INDÉTERMINÉE (CDI)",
          ref: "N° CT-2026-4417",
          sigTokens: ["f0_1", "f0_0"],
          sigLabels: ["Signature du Salarié", "Signature de l'Employeur"],
          groups: [
            {
              subLabel: "Identification de l'Employeur & Salarié (1/2)",
              fields: [
                { label: "Nom de l'Entreprise Employeuse", value: "MAROC LOGISTICS SARL" },
                { label: "Nom Complet du Salarié Embauché", value: "Amina EL FASSI" },
                { label: "CIN du Salarié", value: "EE456789" },
              ],
            },
            {
              subLabel: "Poste & Conditions (2/2)",
              fields: [
                { label: "Intitulé du Poste de travail", value: "Responsable Marketing" },
                { label: "Salaire Mensuel Brut (en DH)", value: "12000" },
                { label: "Période d'Essai (Mois)", value: "3" },
              ],
            },
          ],
          paper: [
            "ENTRE LES SOUSSIGNÉS :",
            "1. La société {f0_0}, ci-après « L'Employeur ».",
            "2. M./Mme {f0_1}, CIN n° {f0_2}, ci-après « Le Salarié ».",
            "ARTICLE 1 — ENGAGEMENT ET FONCTION",
            "Le Salarié est engagé à compter de la date de signature en qualité de {f1_0}.",
            "ARTICLE 2 — PÉRIODE D'ESSAI",
            "Le contrat est conclu sous réserve d'une période d'essai de {f1_2} mois conformément à l'article 13 de la Loi 65-99, renouvelable une fois.",
            "ARTICLE 3 — RÉMUNÉRATION ET HORAIRES",
            "En contrepartie, Le Salarié percevra un salaire mensuel brut de {salaire} DH pour la durée légale du travail (44h/semaine).",
            "ARTICLE 4 — CONGÉS PAYÉS ET COUVERTURE SOCIALE",
            "Le Salarié bénéficie des congés payés réglementaires ainsi que de la déclaration CNSS et AMO dès son entrée en fonction.",
            "ARTICLE 5 — CONFIDENTIALITÉ ET RÉSILIATION",
            "Le Salarié s'engage à la confidentialité absolue quant aux secrets professionnels. Les conditions de préavis sont régies par le Code du Travail.",
          ],
        },
        prestation: {
          title: "Prestation de Service / Freelance",
          kicker: "Conforme au Dahir des Obligations et Contrats (DOC)",
          heading: "CONTRAT DE PRESTATION DE SERVICE",
          ref: "N° PS-2026-2205",
          sigTokens: ["f0_1", "f0_0"],
          sigLabels: ["Signature du Prestataire", "Signature du Client"],
          groups: [
            {
              subLabel: "Client & Prestataire (1/2)",
              fields: [
                { label: "Nom du Client (Société/Particulier)", value: "Maroc Retail Group" },
                { label: "Nom du Prestataire / Consultant", value: "Youssef Bennani Consulting" },
              ],
            },
            {
              subLabel: "Mission & Conditions Financières (2/2)",
              fields: [
                { label: "Nature de la Prestation / Mission", value: "Audits SI & Transformation Digitale" },
                { label: "Montant Total HT (en DH)", value: "25000" },
                { label: "Délai de Paiement (Jours)", value: "30" },
              ],
            },
          ],
          paper: [
            "ENTRE LES SOUSSIGNÉS :",
            "1. {f0_0}, ci-après dénommé « Le Client ».",
            "2. {f0_1}, ci-après dénommé « Le Prestataire ».",
            "ARTICLE 1 — OBJET DE LA MISSION",
            "Le Prestataire s'engage à réaliser en toute indépendance : {f1_0}.",
            "ARTICLE 2 — HONORAIRES ET RÈGLEMENT",
            "Le montant global est fixé à {honoraires} DH HT, réfacturé et payable dans un délai de {f1_2} jours.",
            "ARTICLE 3 — OBLIGATIONS ET LIVRABLES",
            "Le Prestataire est tenu à une obligation de moyens. Le Client s'engage à fournir l'ensemble des informations nécessaires.",
            "ARTICLE 4 — CONFIDENTIALITÉ ET PROPRIÉTÉ INTELLECTUELLE",
            "Chaque partie préserve le secret des données échangées. La propriété des livrables est transférée après paiement intégral.",
            "ARTICLE 5 — RÉSILIATION ET LITIÈGES",
            "En cas de manquement grave, le contrat peut être résilié moyennant un préavis de 15 jours. Tout litige sera soumis au Tribunal de Commerce.",
          ],
        },
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
          features: [
            { text: "Création guidée du document", included: true },
            { text: "Format PDF téléchargeable", included: true },
            { text: "Modèle standardisé", included: true },
            { text: "Sans relecture par un avocat", included: false },
          ],
          cta: "Créer un document",
          ctaHref: "create",
          tone: "sand",
        },
        {
          badge: "Option Complétude",
          title: "Vérification Assistée",
          sub: "Contrôle automatisé de cohérence",
          price: "79 DH",
          unit: "HT / acte",
          features: [
            { text: "Sur un document que vous avez déjà (PDF ou Word)", included: true },
            { text: "Détection des erreurs de saisie d'identité", included: true },
            { text: "Vérification d'absence de champs omis", included: true },
            { text: "Rapport de cohérence immédiat", included: true },
          ],
          cta: "Vérifier un document",
          ctaHref: "verify-assist",
          tone: "accent",
        },
        {
          badge: "Validation Légale",
          title: "Validation Avocat",
          sub: "Relecture par un professionnel",
          price: "990 DH",
          unit: "HT / acte",
          features: [
            { text: "Relecture par un Avocat au Barreau (document créé ici ou déjà en votre possession)", included: true },
            { text: "Attestation officielle de validation signée", included: true },
            { text: "Ajustements personnalisés inclus", included: true },
            { text: "Paiement débité après validation", included: true },
          ],
          cta: "Choisir la validation avocat",
          ctaHref: "create-avocat",
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
        a: "Tous nos modèles sont rédigés en stricte conformité avec les textes de loi marocains (notamment le Dahir des Obligations et Contrats et le Code du Travail Loi 65-99). Si vous souhaitez une assurance supplémentaire pour un contrat complexe, vous pouvez opter pour l'option de validation par un avocat qui délivrera une attestation de relecture signée.",
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
      address: "Siège social : Bd d'Anfa, Casablanca, Maroc",
      hours: "Du Lundi au Samedi : 8h30 - 19h00",
      phone: "+212 5 22 00 00 00",
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
