# CLAUDE.md — InvoicePro / Brand Flow OS

> Instructions personnelles pour Claude dans ce projet. À lire en priorité avant toute action.

---

## 1. Contexte produit

**Nom :** InvoicePro (nom de code Brand Flow OS)
**Type :** SaaS B2B de gestion commerciale et financière — "Business OS"
**Cibles :** Artisans (BTP, plomberie, électricité, menuiserie…), freelances (créatifs, tech, conseil), agences, TPE de services
**Vision :** Remplacer Word/Excel par un outil professionnel complet : devis web interactifs, facturation conforme Factur-X, CRM Kanban, suivi du temps, trésorerie prédictive

**Routes existantes :**

- `/` → Dashboard KPIs + graphe CA + conformité
- `/devis` → Gestion des devis (pipeline commercial)
- `/factures` → Factures clients
- `/pipeline` → CRM Kanban (lead → qualifié → devis → gagné)
- `/temps` → Time-tracking par client/projet
- `/tresorerie` → Cashflow prédictif

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

### Phase 1 — MVP (en cours)

- [x] Dashboard KPIs
- [x] Routes devis, factures, pipeline, temps, trésorerie (shell)
- [ ] Formulaire création de devis avec catalogue de prestations
- [ ] Génération PDF Factur-X
- [ ] Authentification (Supabase Auth)
- [ ] Base de données (Supabase PostgreSQL)
- [ ] Espace client (portail magique, accès PIN)

### Phase 2 — Growth

- [ ] Web-quotes interactifs (options à cocher, curseurs quantité)
- [ ] Signature eIDAS
- [ ] Paiement Stripe intégré
- [ ] Relances automatisées email

### Phase 3 — Scale

- [ ] Open Banking (rapprochement bancaire)
- [ ] OCR factures fournisseurs (Mindee / AWS Textract)
- [ ] Relances SMS (Twilio)

### Phase 4 — Enterprise

- [ ] API publique + webhooks
- [ ] Multi-sociétés / marque blanche
- [ ] Intégrations Pennylane, Xero, Zapier

---

## 7. Supabase (backend cible)

Le projet vise Supabase comme backend (BaaS).

**Tables principales à créer :**

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

---

## 8. Règles de travail

1. **Jamais modifier** un document validé (devis signé, facture envoyée) — passer par un avoir ou un duplicata
2. **Toujours bilingue** : tout texte UI doit avoir une clé dans `i18n.tsx` avec version `fr` et `en`
3. **CSS variables** pour les couleurs — jamais de couleurs hardcodées en Tailwind
4. **Lovable sync** : ne pas rebaser ou amender des commits déjà pushés sur `main`
5. **Types d'abord** : définir les types TypeScript avant d'implémenter la logique
6. **Conformité** : tout document financier doit inclure SIRET, TVA, mentions légales obligatoires

---

## 9. Intégrations API tierces prévues

| Service              | Usage                                      |
| -------------------- | ------------------------------------------ |
| **SIRENE / Pappers** | Auto-complétion SIRET → données entreprise |
| **VIES (EU)**        | Validation numéro TVA intracommunautaire   |
| **Stripe**           | Paiement carte + virement                  |
| **GoCardless**       | Prélèvement SEPA                           |
| **Twilio**           | SMS de relance                             |
| **Mindee**           | OCR factures fournisseurs                  |
| **OpenAI GPT-4o**    | IA rédaction devis, traduction, analyse    |
| **eIDAS**            | Signature électronique certifiée           |

---

## 10. Fichiers clés

```
src/
  lib/
    demo-data.ts     ← Types + données de démo (Deal, InvoiceStatus, Bi, etc.)
    i18n.tsx         ← Système de traduction + hook useI18n()
    utils.ts         ← cn() et helpers
  components/
    AppShell.tsx     ← Layout global + PageHeader
    ui/              ← Composants shadcn/Radix
  routes/
    index.tsx        ← Dashboard
    devis.tsx        ← Devis
    factures.tsx     ← Factures
    pipeline.tsx     ← CRM Kanban
    temps.tsx        ← Time-tracking
    tresorerie.tsx   ← Cashflow
```
