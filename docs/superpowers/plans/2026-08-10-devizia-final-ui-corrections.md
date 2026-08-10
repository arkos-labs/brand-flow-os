# Devizia Final UI Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finaliser les boutons Pipeline, « Générer maintenant », « Valider » et la cohérence des cartes sans modifier les zones déjà approuvées.

**Architecture:** Le contrat visuel existant est étendu aux trois zones ciblées. Les boutons gardent leurs gestionnaires actuels et reçoivent uniquement les variantes géométriques communes ; les cartes s’appuient sur les utilitaires globaux existants.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Vite, Playwright.

## Global Constraints

- Ne modifier ni Catalogue, ni les modales, ni l’animation de lecture/analyse.
- Ne modifier aucune logique métier ou transition de statut.
- Préserver le vert pour les paiements et le rouge pour les actions destructives.
- Ne pas réécrire l’historique Git connecté à Lovable.

---

### Task 1: Verrouiller les dernières signatures

**Files:**
- Modify: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: sources `pipeline.tsx`, `devis.tsx`, `factures.tsx`.
- Produces: assertions statiques sur les classes Devizia attendues.

- [ ] **Step 1: Ajouter les assertions en échec**

Vérifier que les boutons du Pipeline utilisent `rounded-[var(--shape-control)]` et une bordure de 2 px, que « Générer maintenant » contient `shadow-offset`, et que « Valider » conserve `bg-success` avec `border-2`.

- [ ] **Step 2: Exécuter le test**

Run: `node src/lib/design-contract.test.ts`

Expected: échec sur les trois zones actuelles.

- [ ] **Step 3: Commit du test après passage au vert avec la tâche 2**

### Task 2: Corriger les boutons et cartes ciblés

**Files:**
- Modify: `src/routes/pipeline.tsx`
- Modify: `src/routes/devis.tsx`
- Modify: `src/routes/factures.tsx`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: gestionnaires existants des boutons.
- Produces: mêmes comportements, classes visuelles uniformisées.

- [ ] **Step 1: Uniformiser les boutons Pipeline**

Appliquer hauteur, rayon, bordure, graisse, ombre et transitions communes à Modifier, Envoyer, Créer la facture, Envoyer la facture, Paiement reçu et Clôturer. Garder les couleurs sémantiques.

- [ ] **Step 2: Corriger « Générer maintenant »**

Conserver le contraste blanc sur la carte marine, ajouter bordure blanche nette, rayon court, ombre décalée et translation au survol.

- [ ] **Step 3: Corriger « Valider »**

Conserver `bg-success`, ajouter bordure marine de 2 px, rayon court, ombre courte et interaction commune.

- [ ] **Step 4: Harmoniser les cartes**

Étendre l’utilitaire global `card-elevated` et les cartes Pipeline avec bordure de 2 px, rayon court et ombre cohérente. Ne pas changer la structure ou les couleurs de statut.

- [ ] **Step 5: Vérifier le contrat et les types**

Run: `node src/lib/design-contract.test.ts && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add src/lib/design-contract.test.ts src/routes/pipeline.tsx src/routes/devis.tsx src/routes/factures.tsx src/styles.css
git commit -m "style: finaliser boutons et cartes Devizia"
```

### Task 3: Validation finale

**Files:**
- Modify: uniquement un fichier responsable d’un défaut constaté.

**Interfaces:**
- Consumes: serveur local `http://127.0.0.1:4174`.
- Produces: validation desktop/mobile sans erreur ou débordement.

- [ ] **Step 1: Tester les interactions**

Vérifier que « Générer maintenant » ouvre l’assistant, que « Valider » ouvre le dialogue de paiement et que les actions Pipeline restent cliquables.

- [ ] **Step 2: Contrôler les rendus**

Capturer Pipeline, Devis et Factures à 1365 × 900 et 390 × 844. Vérifier les cartes, couleurs, alignements et débordements.

- [ ] **Step 3: Lancer la suite complète**

Run: `npm run check && git diff --check`

- [ ] **Step 4: Commit des corrections éventuelles**

```bash
git add src
git commit -m "fix: terminer corrections interface Devizia"
```
