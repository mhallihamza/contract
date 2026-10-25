# Wathiqa — plateforme de documents juridiques pour le Maroc

Wathiqa (« وثيقة », le document) prépare, fait vérifier et formalise des documents
juridiques marocains en ligne, en français et en arabe. Trois prestations, trois
prix, un seul moteur de décision juridique.

> **Avertissement honnête** : ce dépôt est un produit en cours de mise sur le
> marché. La liste des décisions restant à prendre par un humain figure en
> bas de ce fichier — lire avant tout déploiement réel.

## What it does / Ce que fait la plateforme

| Prestation | Prix (HT) | Ce qui se passe |
| --- | --- | --- |
| **Libre-service** | 290 DH | Questionnaire guidé → document rédigé depuis les modèles approuvés → téléchargement. |
| **Vérification assistée** | + 79 DH | Le client dépose un document existant ; contrôle automatisé de complétude et de cohérence, rapport livré (`WQV-…`). |
| **Validation Avocat** | 990 DH | Revue et validation par un avocat agréé ; attestation **séparée** signée par l'avocat, jamais par la plateforme. |

Règles produit non négociables (inchangées depuis la conception) :

1. **Trois prix, une seule source** — `src/lib/config.ts` (`SERVICE_PRICING`) ;
   la TVA (20 %, configurable via `VAT_RATE`) est appliquée et affichée au
   règlement, jamais inventée par l'interface.
2. **Le client ne choisit jamais la route** — le moteur de décision
   (`src/lib/legal-routing/`) applique exclusivement des règles vérifiées ;
   sans règle vérifiée, cas humain (`ROUTING_UNDETERMINED`), jamais de supposition.
3. **Jamais d'« IA »** — on dit *vérification automatisée*, *modèles approuvés* ;
   le modèle ne décide jamais du droit applicable.
4. **Aucune promesse de validité** — pas de « conforme », pas de conseil
   juridique ; l'avocat signe une attestation séparée, la plateforme ne délivre
   aucun document ressemblant à un acte de l'État.
5. **La prestation avocat n'est encaissée qu'après validation** (dans
   l'implémentation actuelle par le prestataire simulé, la capture réelle
   authorize/capture est une étape du prestataire réel — voir plus bas).

## Stack

- **Next.js 16 / React 19 / TypeScript** (App Router, Server Components)
- **Prisma + PostgreSQL** (Supabase, schéma dédié `legal_platform`)
- **Tailwind CSS 4** — design system émeraude/sable/or, RTL natif (ar = `dir="rtl"`)
- **Vitest** pour les invariants métier (état, prix, routage)
- Une langue de référence (**français**) ; le dictionnaire arabe
  (`src/lib/i18n/dictionaries/ar/`) est vérifié structurellement identique au
  français par le typecheck (`DeepWiden`) — toute clé ajoutée doit exister des
  deux côtés.

## Arborescence

```
src/app/(public)/        → pages publiques : accueil, catalogue, /[slug], /verify, /assistant, /legal
src/app/(public)/start/  → parcours questionnaire anonyme (token)
src/app/(public)/dossier/→ suivi de dossier (token)
src/app/app/             → espace client
src/app/admin|lawyer/    → back-offices
src/app/api/             → endpoints publics (guest, verify) et privés ; le payload ne porte jamais un prix ni un statut
src/lib/legal-routing/   → moteur de décision (fonction pure, règles vérifiées uniquement)
src/lib/payments/        → quotes, TVA, prestataire de paiement (interface + mock signé)
src/lib/verification/    → dépôt de document, cycle de vie, encaissement (§8b)
src/lib/i18n/            → dictionnaires FR (référence) + AR (miroir structurel)
prisma/schema.prisma     → schéma ; scripts/seed.ts → catalogue, règles, démo
tests/                   → pricing, state machine, routage, frontières client
```

## Scripts

```bash
npm run dev          # serveur de développement
npm run build        # build de production
npm run typecheck    # tsc --noEmit (inclut la symétrie FR/AR des dictionnaires)
npm run lint         # eslint
npm run test         # vitest
npx prisma migrate deploy   # migrations (aucune générée : base créée par db push)
npm run seed         # catalogue, règles légales, comptes et cas de démonstration
```

## Variables d'environnement

Voir `.env.example` — les valeurs publiquement visibles (nom, e-mail et
téléphone de support, numéro WhatsApp) sont **vides par défaut** : tant que
l'exploitant ne les fournit pas, l'interface n'affiche aucun canal de contact
fictif, et la mention « Démonstration — données fictives » reste visible
(fail-safe, `NEXT_PUBLIC_DEMO_MODE=false` pour la désactiver).

## Ce qu'il reste à décider (humain requis)

- Données marchandes réelles : identité de l'exploitant, siège, SIRE/RC, TVA,
  mentions légales complètes, enregistrement CNDP (loi 09-08).
- Contrat de prestation avec le(s) avocat(s) agréé(s) + assurances.
- Prestataire de paiement réel (CMI / Payzone…) avec autorisation/capture
  séparée pour la prestation avocat ; signature électronique qualifiée réelle ;
  envoi d'e-mails transactionnels réels (Resend prêt côté code).
- Modèles approuvés (`status: VERIFIED`) **par un juriste** pour chaque type de
  contrat commercialisé ; les types de catalogue actuels sont ceux dont la règle
  de routage a pu être posée honnêtement (bail d'habitation, prestation de
  services, NDA, bail commercial, vente de véhicule, CDD, compromis immobilier).
- Délais annoncés (48 h / 3 jours) : à confirmer par l'exploitant.
- Migration de base (`prisma db push/migrate`) et seed sur la base réelle.
