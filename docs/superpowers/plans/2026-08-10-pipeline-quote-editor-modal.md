# Pipeline Quote Editor Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Ouvrir et enregistrer l’éditeur complet d’un devis dans une modale depuis la page Pipeline, sans navigation.

**Architecture:** Une fonction métier pure prépare et valide la mise à jour tout en conservant les métadonnées du devis. Un composant `QuoteEditorDialog` gère le formulaire et les calculs, tandis que `pipeline.tsx` conserve seulement le devis sélectionné et appelle `updateQuote`.

**Tech Stack:** React 19, TypeScript, TanStack Start, shadcn/Radix Dialog, Tailwind CSS v4, tests Node `assert`.

## Global Constraints

- Ne pas ajouter de dépendance.
- Ne pas modifier le statut ni les dates métier lors d’une simple édition.
- Autoriser l’ouverture uniquement pour les statuts acceptés par `canEditQuote`.
- Garder une modale utilisable sur téléphone et sur ordinateur.

---

### Task 1: Logique métier de modification

**Files:**
- Create: `src/lib/quote-editor.ts`
- Create: `src/lib/quote-editor.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `buildEditedQuote(original: Quote, form: QuoteEditorForm): Quote`
- Produces: `quoteToEditorForm(quote: Quote, client?: Client): QuoteEditorForm`

- [ ] **Step 1: Write the failing test**

Vérifier le préremplissage depuis `quote.details`, le recalcul HT/TTC et la conservation de `number`, `status`, `sentAt`, `refusedAt`, `closedAt`, `signedAt` et `invoicedLineIds`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node src/lib/quote-editor.test.ts`

- [ ] **Step 3: Write minimal implementation**

Créer les types du formulaire, les valeurs de repli pour les anciens devis sans `details`, et la construction immuable du devis édité.

- [ ] **Step 4: Run test to verify it passes**

Run: `node src/lib/quote-editor.test.ts`

- [ ] **Step 5: Add the test to the domain suite**

Ajouter `node src/lib/quote-editor.test.ts` à `test:domain`.

### Task 2: Modale d’édition complète

**Files:**
- Create: `src/components/QuoteEditorDialog.tsx`

**Interfaces:**
- Consumes: `quote: Quote | null`, `clients: Client[]`, `products: Product[]`, `onSave(updated: Quote): void`, `onOpenChange(open: boolean): void`
- Uses: `quoteToEditorForm` and `buildEditedQuote`

- [ ] **Step 1: Build controlled open/close state from the selected quote**
- [ ] **Step 2: Prefill client and chantier fields when the quote changes**
- [ ] **Step 3: Render editable prestations and options with add/remove actions**
- [ ] **Step 4: Add catalog suggestions and editable quantity/price inputs**
- [ ] **Step 5: Calculate and display HT, TVA and TTC live**
- [ ] **Step 6: Validate required client and line fields before saving**
- [ ] **Step 7: Make the dialog responsive with a scrollable body and fixed action footer**

### Task 3: Branchement dans le pipeline

**Files:**
- Modify: `src/routes/pipeline.tsx`

**Interfaces:**
- Consumes: `QuoteEditorDialog`
- Produces: selection through `editingQuote: Quote | null`

- [ ] **Step 1: Read `clients` and `products` from `useData()`**
- [ ] **Step 2: Replace both `/devis?modifier=...` redirects with `setEditingQuote(quote)`**
- [ ] **Step 3: Mount one dialog outside the Kanban loop**
- [ ] **Step 4: Save through `updateQuote`, close the dialog and show a success toast**
- [ ] **Step 5: Verify Brouillon and Refusé open the modal while other statuses expose no edit action**

### Task 4: Vérification finale

**Files:**
- Verify: `src/lib/quote-editor.test.ts`
- Verify: `src/components/QuoteEditorDialog.tsx`
- Verify: `src/routes/pipeline.tsx`

- [ ] **Step 1: Run all domain tests**

Run: `npm run test:domain`

- [ ] **Step 2: Run TypeScript verification**

Run: `npm run typecheck`

- [ ] **Step 3: Build production assets**

Run: `npm run build`

- [ ] **Step 4: Check the diff for whitespace and unintended files**

Run: `git diff --check`
