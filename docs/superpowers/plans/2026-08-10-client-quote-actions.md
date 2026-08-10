# Client Quote Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Afficher et exécuter toutes les actions d’un devis brouillon depuis l’onglet Devis de la fiche Client, sans navigation.

**Architecture:** Une fonction pure détermine les actions autorisées selon le statut. `clients.tsx` réutilise `QuoteEditorDialog`, l’export PDF existant et ses modales locales d’aperçu et d’envoi.

**Tech Stack:** React 19, TypeScript, TanStack Start, Radix Dialog, Tailwind CSS v4, Node assert.

## Global Constraints

- Aucune nouvelle dépendance.
- Aucune redirection vers `/devis`.
- Les devis brouillons exposent modifier, aperçu, PDF, lien et envoi.
- Une modification conserve les métadonnées ; seul l’envoi change le statut et `sentAt`.

---

### Task 1: Règles d’actions

**Files:**
- Create: `src/lib/quote-actions.ts`
- Create: `src/lib/quote-actions.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getClientQuoteActions(status: string): ClientQuoteAction[]`

- [ ] Write a failing test asserting that Brouillon returns `edit`, `preview`, `download`, `link`, `send`.
- [ ] Run `node src/lib/quote-actions.test.ts` and confirm the missing module failure.
- [ ] Implement the status rule and rerun the test.
- [ ] Add the test to `test:domain`.

### Task 2: Actions dans la fiche Client

**Files:**
- Modify: `src/routes/clients.tsx`

**Interfaces:**
- Consumes: `QuoteEditorDialog`, `getClientQuoteActions`, `exportQuotePdf`

- [ ] Add state for the edited quote, emailed quote, PDF generation and non-blocking notice.
- [ ] Render the five compact accessible icon buttons for each draft quote.
- [ ] Open `QuoteEditorDialog` with the selected client and catalog data.
- [ ] Generate the official PDF from the download action.
- [ ] Copy the portal URL and show a non-blocking confirmation.
- [ ] Open an email confirmation dialog and mark the quote sent only after confirmation.
- [ ] Remove the incorrect “Marquer comme payé” action from quote preview.

### Task 3: Verification

**Files:**
- Verify: `src/routes/clients.tsx`
- Verify: `src/lib/quote-actions.ts`

- [ ] Run `npm run test:domain`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` on the touched files.
