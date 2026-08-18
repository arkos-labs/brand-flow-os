# CLAUDE.md — InvoicePro / Brand Flow OS

> Instructions personnelles pour Claude dans ce projet. À lire en priorité avant toute action.
>
> **Dernière vérification par rapport au code réel : 2026-08-18** (commit `5c5bf2f1`, via analyse de graphe de dépendances Graphify). Après toute évolution significative du code, penser à relancer `graphify update .` en local pour garder le graphe à jour, et à revérifier ce fichier périodiquement — il dérive vite du code réel sinon.

---

## 1. Contexte produit

**Nom :** InvoicePro (nom de code Brand Flow OS)
**Type :** SaaS B2B de gestion commerciale et financière — "Business OS"
**Cibles :** Artisans (BTP, plomberie, électricité, menuiserie…), freelances (créatifs, tech, conseil), agences, TPE de services
**Vision :** Remplacer Word/Excel par un outil professionnel complet : devis web interactifs, facturation conforme Factur-X, CRM Kanban, suivi du temps, trésorerie prédictive

**Routes existantes (vérifié via analyse du code le 2026-08-18, commit `5c5bf2f1`) :**

Marketing / public :

- `/` → Landing page (`index.tsx`)
- `/fonctionnalites`, `/fonctionnement`, `/tarifs`, `/benefices` → Pages marketing
- `/connexion`, `/inscription`, `/mot-de-passe-oublie` → Auth (Supabase Auth + Google OAuth)
- `/centre-aide`, `/contactez-nous`, `/nouveautes`, `/mises-a-jour`, `/plan-site`, `/legal`, `/conditions-utilisation`, `/confidentialite` → Pages support/légales
- `/portail/$id` → Portail client (accès magique, consultation devis/factures)

Application (authentifiée) :

- `/tableau-de-bord` → Dashboard KPIs + graphe CA + conformité
- `/devis` → Gestion des devis
- `/factures` → Factures clients
- `/pipeline` → CRM Kanban (lead → qualifié → devis → gagné)
- `/catalogue` → Catalogue de prestations (import/export Excel)
- `/clients` → Fiches clients
- `/depenses` → Dépenses fournisseurs
- `/paiements` → Suivi paiements + relances
- `/archives` → Documents archivés
- `/abonnements` → Abonnements / MRR
- `/rendez-vous` → RDV (intégration Google Calendar + Calendly)
- `/tresorerie` → Cashflow prédictif
- `/parametres` → Paramètres workspace, SIRET/TVA, préférences

> ⚠️ Ces routes remplacent la liste précédente (`/`, `/devis`, `/factures`, `/pipeline`, `/temps`, `/tresorerie`) qui était obsolète. Il n'y a pas de route `/temps` (time-tracking) actuellement implémentée.

---

## 2. Stack technique

| Couche        | Technologie                                                               |
| ------------- | ------------------------------------------------------------------------- |
| Framework     | TanStack Start (React 19 + TanStack Router)                               |
| Styling       | TailwindCSS v4 (pas de config tailwind.config.js — utiliser les CSS vars) |
| Composants    | shadcn/ui (Radix UI sous le capot) — fichiers dans `src/components/ui/`   |
| Charts        | Recharts                                                                  |
| Forms         | React Hook Form + Zod                                                     |
| State serveur | TanStack Query                                                            |
| i18n          | Système maison dans `src/lib/i18n.tsx` (fr/en)                            |
| Build         | Vite 8 + Bun                                                              |
| Déploiement   | Lovable (branch `main` synced)                                            |

**Commandes importantes :**

```bash
bun run dev      # dev server
bun run build    # production build
bun run lint     # eslint
bun run format   # prettier
```

---

## 3. Conventions de code

### Structure des fichiers

- **Routes** → `src/routes/*.tsx` (TanStack Router file-based routing)
- **Composants partagés** → `src/components/`
- **Données de démo** → `src/lib/demo-data.ts` (types + données statiques)
- **Utils** → `src/lib/utils.ts`
- **i18n** → `src/lib/i18n.tsx` — toujours utiliser `useI18n()` pour les textes (hook : `t()`, `tv()`, `money()`, `lang`)

### Règles de style

- Utiliser les **CSS variables** (ex: `var(--color-border)`, `var(--color-card)`) — pas de couleurs hardcodées
- Classes utilitaires : `card-elevated` pour les cartes (défini dans `styles.css`)
- Icônes : **lucide-react** exclusivement
- Pas de `localStorage` (interdit dans les artifacts)
- `PageHeader` importé depuis `@/components/AppShell` pour les en-têtes de pages

### Typage

- Tout en TypeScript strict
- Types métier définis dans `src/lib/demo-data.ts` (ex: `Deal`, `InvoiceStatus`, `Bi`)
- `Bi` = bilingue `{ fr: string; en: string }` — tout texte visible doit utiliser ce pattern

---

## 4. Domaine métier — À connaître absolument

### Conformité légale France 2026

- **Factur-X** : Format obligatoire = PDF + XML embarqué (hybrid). À respecter dans tout export PDF
- **Numérotation** : Séquence stricte et inaltérable (DV-YYYY-NNN pour devis, FA-YYYY-NNNN pour factures)
- **Piste d'Audit Fiable (PAF)** : Chaque action doit être horodatée (IP + timestamp)
- **Loi anti-fraude TVA** : Documents validés = verrouillés. Les modifications passent par des avoirs, jamais par édition directe
- **PDP/PPF** : Portail Public de Facturation — connexion prévue en Phase 1

### Vocabulaire métier spécifique artisans/BTP

- **Devis** (DV) : Document commercial avant commande — peut être signé électroniquement
- **Facture** (FA) : Après livraison/réception travaux
- **Situation de travaux** : Facturation partielle par avancement (30% → 70% → solde)
- **Acompte** : Facture d'acompte avant démarrage (courant dans le BTP)
- **Avoir** : Annulation partielle ou totale d'une facture existante
- **MRR** : Monthly Recurring Revenue (pour abonnements/retainers)
- **SEPA** : Prélèvement automatique européen — mode de paiement privilégié B2B
- **URSSAF / SIRET / TVA intracommunautaire** : Champs obligatoires sur les documents
- **Délai de paiement légal** : 30 jours nets ou 45 jours fin de mois (loi LME)
- **Pénalités de retard** : Légalement obligatoires sur factures B2B (taux BCE + 10%)

### Statuts de documents

**Devis :** brouillon → envoyé → vu → signé → refusé → expiré
**Facture :** brouillon → envoyée → en attente → payée → en retard → avoir émis

### TVA (taux France)

- 20% : taux normal (services, matériaux standard)
- 10% : travaux de rénovation logement (BTP)
- 5,5% : travaux d'amélioration énergétique
- 0% : auto-liquidation intracommunautaire

---

## 5. Skills et capacités à mobiliser

### Pour les fonctionnalités existantes (développement)

- **`anthropic-skills:frontend-enhancer`** : Amélioration UI/UX, animations, design system
- **`anthropic-skills:ui-ux-pro-max`** : Composants complexes, palettes couleurs, typographies pro
- **`anthropic-skills:docx`** : Génération de documents Word (contrats, CGV, modèles)
- **`anthropic-skills:pdf`** : Génération/manipulation PDF (Factur-X, export factures)
- **`anthropic-skills:xlsx`** : Export comptable, import catalogue produits/prestations
- **`anthropic-skills:test-specialist`** : Tests unitaires TypeScript/React

### Pour le contenu et la doc

- **`anthropic-skills:codebase-documenter`** : Documentation technique, README
- **`anthropic-skills:business-document-generator`** : Modèles de devis/factures PDF
- **`anthropic-skills:brand-analyzer`** : Cohérence visuelle et brand kit

### Pour les analyses

- **`anthropic-skills:data-analyst`** : Analyse des données de trésorerie, rentabilité
- **`anthropic-skills:finance-manager`** : Logique cashflow prédictif, KPIs financiers
- **`finance:financial-statements`** : Structure P&L, bilans, comptabilité
- **`finance:variance-analysis`** : Analyse des écarts budget/réel

### Pour la mise en prod

- **`anthropic-skills:cicd-pipeline-generator`** : GitHub Actions, déploiement Vercel/Lovable
- **`anthropic-skills:docker-containerization`** : Si déploiement infra custom

---

## 6. Roadmap et priorités

> Mise à jour le 2026-08-18 après audit du code réel (analyse de graphe de dépendances, commit `5c5bf2f1`). L'ancienne roadmap sous-estimait fortement l'avancement : la quasi-totalité de la Phase 1 est déjà implémentée.

### Phase 1 — MVP

- [x] Dashboard KPIs (`tableau-de-bord.tsx`)
- [x] Routes devis, factures, pipeline, catalogue, clients, dépenses, paiements, archives, abonnements, rendez-vous, trésorerie, paramètres
- [x] Formulaire création de devis avec catalogue de prestations (`devis.tsx`, `catalogue.tsx`, `QuoteEditorDialog.tsx`)
- [x] Génération PDF Factur-X (`facturx-embed.ts`, `facturx-xml.ts`, `pdf-export.ts`, `document-pdf.ts`)
- [x] Authentification (Supabase Auth + OAuth Google — `connexion.tsx`, `inscription.tsx`, `api/auth/google/*`)
- [x] Base de données (Supabase PostgreSQL — `supabase.ts`, `supabase-context.tsx`, `database.types.ts`)
- [x] Espace client (portail magique — `portail.$id.tsx`)
- [x] Validation SIRET/TVA (`siret.ts`, `api/vies/check.ts`)
- [ ] Time-tracking par client/projet (`/temps`) — **non implémenté**, à confirmer si toujours dans le scope

### Phase 2 — Growth

- [x] Relances (manuelles) — `ReminderModal.tsx`, `email-templates.ts`, `paiements.tsx`
- [x] Intégration calendrier (Google Calendar + Calendly) — **non prévue dans la roadmap d'origine, déjà livrée**
- [ ] Web-quotes interactifs (options à cocher, curseurs quantité) — à vérifier précisément dans `portail.$id.tsx`
- [ ] Signature eIDAS — pas trouvé dans le code
- [ ] Paiement Stripe intégré — pas trouvé dans le code
- [ ] Relances automatisées (déclenchement planifié, pas seulement manuel) — à confirmer

### Phase 3 — Scale

- [ ] Open Banking (rapprochement bancaire)
- [ ] OCR factures fournisseurs (Mindee / AWS Textract)
- [ ] Relances SMS (Twilio)

### Phase 4 — Enterprise

- [ ] API publique + webhooks
- [ ] Multi-sociétés / marque blanche
- [ ] Intégrations Pennylane, Xero, Zapier

### Dette technique identifiée (rapport Graphify du 2026-08-18)

- `devis.tsx` (81 Ko) et `portail.$id.tsx` (30 Ko) ont une cohésion très faible (0.12 et 0.06) → candidats à un découpage en modules plus petits
- 397 nœuds faiblement connectés dans le graphe de dépendances → possibles zones mortes ou peu documentées à vérifier
- Un dossier `_to_delete/` existe à la racine avec d'anciens fichiers (dont `routes/situations.tsx`, une ancienne feature "situations de travaux" remplacée) et d'anciennes pages HTML de démo (`public-demo-pages/`). Ces fichiers ne sont plus référencés par le code actif — à supprimer définitivement quand tu confirmes

---

## 7. Supabase (backend — déjà branché)

Le projet utilise Supabase comme backend (BaaS) — ce n'est plus une cible, c'est en place (`src/lib/supabase.ts`, `src/lib/supabase-context.tsx`, types générés dans `src/lib/database.types.ts`).

**Tables** : se référer directement à `database.types.ts` (source de vérité, généré depuis le schéma réel) plutôt qu'à la liste ci-dessous, qui reste la liste cible d'origine et peut ne plus correspondre exactement :

```
workspaces, users, clients, contacts
quotes (devis), quote_items, quote_signatures
invoices (factures), invoice_items, invoice_payments
products (catalogue prestations)
projects, time_entries
expenses (dépenses fournisseurs)
cashflow_forecasts
audit_logs (PAF — piste d'audit fiable)
```

**Sécurité :**

- Row Level Security (RLS) sur toutes les tables
- Multi-tenant : chaque workspace est isolé
- Logs d'audit horodatés pour conformité anti-fraude

> À vérifier lors d'une prochaine session avec les outils Supabase MCP (`list_tables`, `get_advisors`) pour confirmer que RLS est bien actif partout et lister les vraies tables en base plutôt que de se fier à cette liste indicative.

---

## 8. Règles de travail

1. **Jamais modifier** un document validé (devis signé, facture envoyée) — passer par un avoir ou un duplicata
2. **Toujours bilingue** : tout texte UI doit avoir une clé dans `i18n.tsx` avec version `fr` et `en`
3. **CSS variables** pour les couleurs — jamais de couleurs hardcodées en Tailwind
4. **Lovable sync** : ne pas rebaser ou amender des commits déjà pushés sur `main`
5. **Types d'abord** : définir les types TypeScript avant d'implémenter la logique
6. **Conformité** : tout document financier doit inclure SIRET, TVA, mentions légales obligatoires

---

## 9. Intégrations API tierces

| Service               | Usage                                      | Statut                                            |
| ---------------------- | ------------------------------------------- | -------------------------------------------------- |
| **VIES (EU)**          | Validation numéro TVA intracommunautaire    | ✅ Fait (`api/vies/check.ts`)                      |
| **Google OAuth**        | Authentification / Google Calendar          | ✅ Fait (`api/auth/google/*`, `api/calendar/*`)    |
| **Calendly**            | Prise de RDV                                | ✅ Fait (`api/auth/calendly/*`, `api/calendly/*`) — non prévu à l'origine |
| **SIRENE / Pappers**    | Auto-complétion SIRET → données entreprise  | ⏳ À vérifier (siret.ts existe, source à confirmer) |
| **Stripe**              | Paiement carte + virement                   | ❌ Pas trouvé dans le code                          |
| **GoCardless**          | Prélèvement SEPA                            | ❌ Pas trouvé dans le code                          |
| **Twilio**              | SMS de relance                              | ❌ Pas trouvé dans le code                          |
| **Mindee**              | OCR factures fournisseurs                   | ❌ Pas trouvé dans le code                          |
| **OpenAI GPT-4o**       | IA rédaction devis, traduction, analyse     | ⏳ À vérifier (widget "AIQuoteWidget" présent — source du modèle à confirmer) |
| **eIDAS**               | Signature électronique certifiée            | ❌ Pas trouvé dans le code                          |

---

## 10. Fichiers clés

```
src/
  lib/
    demo-data.ts        ← Types + données de démo (Deal, InvoiceStatus, Bi, etc.)
    showcase-data.ts     ← Données de démonstration (mode showcase)
    i18n.tsx             ← Système de traduction + hook useI18n()
    utils.ts             ← cn() et helpers
    supabase.ts           ← Client Supabase
    supabase-context.tsx  ← Contexte data Supabase (remplace/complète data-context.tsx)
    data-context.tsx      ← Contexte data legacy/local
    database.types.ts     ← Types générés depuis le schéma Supabase
    facturx-embed.ts       ← Embed XML dans le PDF (Factur-X)
    facturx-xml.ts          ← Génération du XML Factur-X
    pdf-export.ts            ← Export PDF devis/factures
    document-pdf.ts          ← Génération PDF documents
    document-workflow.ts      ← Workflow devis → facture → avoir
    invoice-from-quote.ts      ← Conversion devis → facture
    quote-editor.ts             ← Logique éditeur de devis
    catalogue-io.ts               ← Import/export catalogue (Excel)
    email-templates.ts             ← Templates d'emails (relances, envoi devis/facture)
    siret.ts                        ← Validation SIRET/TVA (France)
    export-compta.ts                 ← Export comptable
  components/
    AppShell.tsx        ← Layout global + PageHeader
    QuoteEditorDialog.tsx ← Édition d'un devis
    DocumentTemplate.tsx  ← Template de rendu devis/facture
    ReminderModal.tsx      ← Relance de paiement
    ui/                     ← Composants shadcn/Radix
  routes/
    index.tsx           ← Landing page marketing
    tableau-de-bord.tsx  ← Dashboard (app)
    devis.tsx             ← Devis
    factures.tsx           ← Factures
    pipeline.tsx             ← CRM Kanban
    catalogue.tsx              ← Catalogue de prestations
    clients.tsx                 ← Clients
    depenses.tsx                  ← Dépenses
    paiements.tsx                   ← Paiements / relances
    archives.tsx                     ← Documents archivés
    abonnements.tsx                    ← Abonnements / MRR
    rendez-vous.tsx                      ← RDV (Google Calendar / Calendly)
    tresorerie.tsx                         ← Cashflow
    parametres.tsx                          ← Paramètres workspace
    portail.$id.tsx                           ← Portail client
    api/                                       ← Endpoints serveur (auth Google/Calendly, calendar, VIES)
```

> ⚠️ Il n'existe pas de route `/temps` (time-tracking) ni de fichier associé — l'ancienne référence a été retirée.
