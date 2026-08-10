# Devizia Connexion Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Aligner uniquement la page `/connexion` sur le thème bleu de l’accueil Devizia sans changer son comportement.

**Architecture:** La page conserve son composant React et ses gestionnaires existants. La refonte remplace la composition visuelle actuelle par une présentation Devizia autonome, bâtie avec les tokens globaux et quelques classes locales dédiées dans `styles.css`. Un contrat statique protège la marque, les signatures visuelles et l’absence de modification de l’accueil.

**Tech Stack:** React, TanStack Router, TypeScript, Tailwind CSS, CSS global, Lucide React, tests Node `assert`, Playwright pour la validation visuelle.

## Global Constraints

- Ne modifier ni `src/routes/index.tsx` ni `src/routes/homepage.css`.
- Ne changer aucune logique de soumission, navigation, chargement ou affichage du mot de passe.
- Ne pas ajouter de dépendance.
- Réutiliser `--shape-control`, `--shadow-offset`, les couleurs `primary`, `navy`, `card` et le quadrillage déjà présents.
- Préserver l’accès de démonstration et tous les liens existants.

---

### Task 1: Contrat visuel de la connexion

**Files:**
- Modify: `src/lib/design-contract.test.ts`
- Test: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: contenu source de `src/routes/connexion.tsx` et `src/styles.css`.
- Produces: assertions statiques protégeant la marque et les signatures du thème.

- [ ] **Step 1: Écrire les assertions en échec**

Ajouter la lecture de `src/routes/connexion.tsx`, puis vérifier : présence de `Devizia`, absence de la marque visible `InvoicePro`, présence des classes `devizia-auth-grid`, `border-2`, `rounded-[var(--shape-control)]` et `shadow-offset`; vérifier également que les gestionnaires `handleSubmit`, `handleDevAccess` et `setShowPassword` sont toujours présents.

- [ ] **Step 2: Exécuter le test pour confirmer l’échec**

Run: `node src/lib/design-contract.test.ts`

Expected: échec sur les nouvelles signatures de la page de connexion.

- [ ] **Step 3: Conserver le test en échec pour guider Task 2**

- [ ] **Step 4: Vérifier que seuls le test et la future page de connexion sont concernés**

Run: `git status --short`

- [ ] **Step 5: Ne pas committer avant l’implémentation minimale de Task 2**

---

### Task 2: Recomposer la page de connexion Devizia

**Files:**
- Modify: `src/routes/connexion.tsx`
- Modify: `src/styles.css`
- Test: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: fonctions `handleSubmit`, `handleDevAccess`, états `email`, `password`, `showPassword`, `loading`, `devLoading`.
- Produces: même formulaire et mêmes actions dans une composition visuelle Devizia responsive.

- [ ] **Step 1: Remplacer uniquement la structure visuelle JSX**

Conserver les états et gestionnaires. Construire une page quadrillée avec une zone de présentation et une carte formulaire. Remplacer la marque visible par « Devizia ». Garder les champs, le bouton d’affichage du mot de passe, le lien d’oubli, le bouton principal, l’accès démonstration et le lien d’inscription.

- [ ] **Step 2: Ajouter les styles locaux nécessaires**

Dans `src/styles.css`, définir `.devizia-auth-grid` avec le quadrillage bleu clair, puis limiter les styles complémentaires au périmètre `.devizia-auth`. Utiliser une bordure de 2 px, `var(--shape-control)` et l’ombre décalée pour la carte et les contrôles principaux.

- [ ] **Step 3: Exécuter le contrat visuel**

Run: `node src/lib/design-contract.test.ts`

Expected: `design-contract.test.ts: OK`.

- [ ] **Step 4: Vérifier TypeScript et le diff**

Run: `npm run typecheck`

Run: `git diff --check`

- [ ] **Step 5: Committer la refonte isolée**

```powershell
git add -- src/routes/connexion.tsx src/styles.css src/lib/design-contract.test.ts
git commit -m "style: aligner la connexion sur Devizia"
```

---

### Task 3: Validation visuelle et non-régression

**Files:**
- Verify: `src/routes/connexion.tsx`
- Verify unchanged: `src/routes/index.tsx`
- Verify unchanged: `src/routes/homepage.css`

**Interfaces:**
- Consumes: serveur local `http://127.0.0.1:4174/connexion`.
- Produces: validation desktop/mobile et preuve d’isolation du changement.

- [ ] **Step 1: Capturer `/connexion` en desktop**

Viewport: `1365 × 900`. Vérifier la carte, la marque Devizia, la lisibilité et l’absence d’erreur console.

- [ ] **Step 2: Capturer `/connexion` en mobile**

Viewport: `390 × 844`. Vérifier l’ordre du contenu, la taille tactile des contrôles et l’absence de débordement horizontal.

- [ ] **Step 3: Tester les interactions sans terminer la navigation**

Saisir un e-mail et un mot de passe, basculer l’affichage du mot de passe, puis vérifier que les boutons principal et démonstration restent activables.

- [ ] **Step 4: Prouver que l’accueil n’a pas changé**

Run: `git diff --name-only HEAD~1..HEAD`

Expected: aucun `src/routes/index.tsx` ni `src/routes/homepage.css`.

- [ ] **Step 5: Lancer les contrôles finaux**

Run: `node src/lib/design-contract.test.ts`

Run: `npm run typecheck`

Run: `git diff --check`
