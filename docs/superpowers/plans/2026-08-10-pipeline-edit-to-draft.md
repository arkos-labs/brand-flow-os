# Pipeline Edit To Draft Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replacer automatiquement un devis refusé dans Brouillon lorsque ses corrections sont enregistrées depuis la modale du pipeline.

**Architecture:** La transformation reste dans la fonction métier pure `buildEditedQuote`. Elle conserve le cycle d’un brouillon mais nettoie les métadonnées de l’ancien cycle lorsqu’un devis refusé est sauvegardé.

**Tech Stack:** TypeScript, React 19, Node assert, TanStack Start.

## Global Constraints

- Annuler la modale ne produit aucune écriture.
- Un brouillon modifié reste brouillon.
- Un devis refusé sauvegardé devient brouillon et perd les dates de refus, clôture, envoi et signature.

---

### Task 1: Transformation métier

**Files:**
- Modify: `src/lib/quote-editor.test.ts`
- Modify: `src/lib/quote-editor.ts`

**Interfaces:**
- Consumes: `buildEditedQuote(original, form)`
- Produces: un `Quote` corrigé prêt pour un nouveau cycle d’envoi

- [ ] Add a failing assertion that a refused quote becomes Draft after saving.
- [ ] Add failing assertions that obsolete refusal and signature metadata are absent.
- [ ] Run `node src/lib/quote-editor.test.ts` and confirm the status assertion fails.
- [ ] Implement the conditional reset in `buildEditedQuote`.
- [ ] Rerun the focused test and all domain tests.

### Task 2: Verification

**Files:**
- Verify: `src/lib/quote-editor.ts`
- Verify: `src/components/QuoteEditorDialog.tsx`
- Verify: `src/routes/pipeline.tsx`

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` on touched files.
