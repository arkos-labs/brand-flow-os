# Cohérence complète du SaaS sans backend — Plan d’implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendre le SaaS local cohérent, typé et testable sur tout le parcours devis → facture → paiement, sans remplacer `localStorage` par une base de données.

**Architecture:** Les règles métier sont extraites dans des fonctions pures sous `src/lib`, puis utilisées par le contexte et les routes. Les pages ne décident plus seules des transitions de statut ni des calculs. Les intégrations réseau absentes restent explicitement en mode local et ne prétendent plus avoir envoyé un email ou exécuté une IA distante.

**Tech Stack:** React 19, TanStack Start/Router, TypeScript strict, Tailwind CSS v4, assertions Node pour les tests métier, Vite.

## Global Constraints

- Préserver toutes les modifications existantes du worktree.
- Ne pas ajouter de base de données ni de fournisseur d’authentification.
- Ne pas annoncer un email, une signature légale ou une IA distante comme réellement exécutés en mode local.
- Garder les documents triés par dernière activité utile.
- Faire passer `tsc --noEmit`, les tests métier, le build et ESLint hors bruit Prettier.

---

### Task 1: Moteur de cycle documentaire

**Files:**
- Create: `src/lib/document-workflow.ts`
- Create: `src/lib/document-workflow.test.ts`
- Modify: `src/lib/data-context.tsx`
- Modify: `src/lib/invoice-from-quote.ts`

**Interfaces:**
- Produces: `getQuoteStage`, `canManuallyMoveQuote`, `markInvoicePaid`, `getDocumentActivityDate`, `calculateBusinessMetrics`.

- [ ] Écrire des assertions qui échouent pour les transitions interdites, les factures brouillon non échues et la synchronisation paiement/devis.
- [ ] Exécuter les tests et confirmer l’échec attendu.
- [ ] Implémenter les fonctions pures minimales.
- [ ] Réexécuter les tests jusqu’au vert.

### Task 2: Pipeline et conversion devis → facture

**Files:**
- Modify: `src/routes/pipeline.tsx`
- Modify: `src/routes/devis.tsx`
- Modify: `src/routes/factures.tsx`

**Interfaces:**
- Consumes: règles de `document-workflow.ts` et sélection de lignes de `invoice-from-quote.ts`.
- Produces: transitions automatiques cohérentes, édition autorisée seulement pour brouillon/refusé, facture partielle par lignes, création brouillon ou création+envoi.

- [ ] Verrouiller le glisser-déposer aux seules transitions manuelles autorisées.
- [ ] Empêcher l’édition d’un devis signé/facturé/payé.
- [ ] Repasser un devis refusé modifié en brouillon.
- [ ] Synchroniser devis, facture et paiement depuis une seule action.
- [ ] Vérifier les cartes et boutons de chaque colonne.

### Task 3: Paiements, trésorerie, dashboard et export

**Files:**
- Modify: `src/routes/paiements.tsx`
- Modify: `src/routes/tresorerie.tsx`
- Modify: `src/routes/tableau-de-bord.tsx`
- Modify: `src/lib/export-compta.ts`
- Modify: `src/lib/data-context.tsx`

**Interfaces:**
- Produces: `paidAt`, mode de règlement, échéance correcte, chiffres sans double comptage, trésorerie nette, TVA basée sur les lignes.

- [ ] Tester qu’un brouillon n’est jamais en retard.
- [ ] Enregistrer la date et le mode de règlement.
- [ ] Trier et filtrer selon création, envoi, échéance ou règlement.
- [ ] Corriger les KPI et la trésorerie en intégrant les dépenses.
- [ ] Corriger l’export comptable avec les montants HT/TVA calculés.

### Task 4: Mode local honnête et cohérence globale

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/ReminderModal.tsx`
- Modify: `src/components/AIQuoteWidget.tsx`
- Modify: `src/routes/portail.$id.tsx`
- Modify: `src/routes/depenses.tsx`
- Modify: `src/lib/data-context.tsx`

**Interfaces:**
- Produces: hooks React valides, notifications réelles du domaine, libellés mode local, signature locale persistée, données facultatives sûres.

- [ ] Supprimer les hooks conditionnels et les notifications vers des pages inexistantes.
- [ ] Persister les informations de signature locale sans revendiquer une valeur légale.
- [ ] Remplacer les faux succès email/IA par un état explicite de prévisualisation locale.
- [ ] Corriger les types optionnels et les imports.

### Task 5: Qualité, responsive et vérification

**Files:**
- Modify: fichiers signalés par TypeScript/ESLint.
- Modify: `package.json`

**Interfaces:**
- Produces: commandes `test:domain`, `typecheck`, `check`.

- [ ] Corriger chaque erreur TypeScript sans masquer les erreurs par `any` global.
- [ ] Corriger les violations React Hooks et erreurs ESLint.
- [ ] Vérifier les tailles tactiles et les débordements principaux sur mobile.
- [ ] Exécuter `npm run test:domain`.
- [ ] Exécuter `npm run typecheck`.
- [ ] Exécuter `npm run build`.
- [ ] Exécuter ESLint hors règle Prettier afin d’isoler la qualité logique.

