# Devizia Platform Homepage Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Appliquer aux pages internes le langage visuel bleu, robuste et éditorial de l’accueil sans modifier les fonctionnalités métier.

**Architecture:** Les jetons et utilitaires globaux définissent la direction visuelle, puis les composants UI partagés propagent les formes, bordures, ombres et interactions. `AppShell` porte la navigation et l’atmosphère générale ; seules les contradictions restantes sont corrigées localement dans les routes.

**Tech Stack:** React 19, TanStack Router, TypeScript, Tailwind CSS 4, Radix UI, CSS custom properties, Vite.

## Global Constraints

- Ne modifier aucune logique métier, route, donnée ou libellé fonctionnel.
- Conserver vert, ambre et rouge pour les états sémantiques.
- Utiliser les jetons existants plutôt que multiplier les couleurs codées en dur.
- Maintenir les thèmes clair et sombre.
- Conserver des zones tactiles utilisables et un focus clavier visible.
- Ne pas réécrire l’historique Git connecté à Lovable.

---

## File Map

- `src/styles.css`: polices internes, jetons de forme, ombres, grille de fond et utilitaires Devizia.
- `src/lib/design-contract.test.ts`: contrat statique des signatures visuelles partagées.
- `package.json`: inclut le contrat visuel dans `test:domain`.
- `src/components/ui/button.tsx`: boutons principal, secondaire, destructif, fantôme et icône.
- `src/components/ui/card.tsx`: cartes et titres de cartes.
- `src/components/ui/input.tsx`, `textarea.tsx`, `select.tsx`: contrôles de formulaire.
- `src/components/ui/table.tsx`, `tabs.tsx`, `badge.tsx`: affichage de données et navigation locale.
- `src/components/ui/dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `command.tsx`: surfaces superposées.
- `src/components/AppShell.tsx`: sidebar, header, fond applicatif, navigation et `PageHeader`.
- `src/components/GlobalSearch.tsx`, `QuoteEditorDialog.tsx`, `ReminderModal.tsx`: intégrations complexes à vérifier.
- `src/routes/*.tsx`: uniquement les classes locales qui contredisent encore le système partagé.

### Task 1: Verrouiller le contrat visuel global

**Files:**
- Create: `src/lib/design-contract.test.ts`
- Modify: `package.json`
- Modify: `src/styles.css`

**Interfaces:**
- Consumes: fichiers source CSS et TSX lus avec `node:fs`.
- Produces: un test exécutable par Node qui échoue si les signatures essentielles disparaissent.

- [ ] **Step 1: Écrire le test de contrat en échec**

Créer un test qui vérifie dans `src/styles.css` la présence de `--shadow-offset`, `--shape-control`, `.app-workspace` et `prefers-reduced-motion`, puis vérifie que `button.tsx` utilise `shadow-offset` et une bordure de 2 px.

- [ ] **Step 2: Lancer le test et constater l’échec**

Run: `node src/lib/design-contract.test.ts`

Expected: échec sur les nouveaux jetons absents.

- [ ] **Step 3: Ajouter le test à la commande existante**

Ajouter `node src/lib/design-contract.test.ts` à la fin de `test:domain` dans `package.json`.

- [ ] **Step 4: Implémenter les fondations CSS minimales**

Ajouter les polices Barlow, Barlow Condensed et IBM Plex Mono, les jetons de forme et d’ombre, l’utilitaire `.app-workspace` avec grille bleue légère, les utilitaires d’ombre décalée et la réduction de mouvement.

- [ ] **Step 5: Relancer le test**

Run: `node src/lib/design-contract.test.ts`

Expected: passage du volet CSS ; le test du bouton peut rester rouge jusqu’à la tâche 2 si séparé explicitement.

- [ ] **Step 6: Commit**

```bash
git add package.json src/styles.css src/lib/design-contract.test.ts
git commit -m "test: verrouiller contrat visuel Devizia"
```

### Task 2: Transformer les composants de base

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/card.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/textarea.tsx`
- Modify: `src/components/ui/select.tsx`
- Modify: `src/components/ui/checkbox.tsx`
- Modify: `src/components/ui/radio-group.tsx`
- Modify: `src/components/ui/switch.tsx`

**Interfaces:**
- Consumes: jetons CSS de la tâche 1 et API de variantes existante.
- Produces: mêmes exports React et mêmes props, avec apparence Devizia.

- [ ] **Step 1: Mettre le bouton principal au contrat**

Remplacer les coins arrondis génériques par `rounded-sm`, appliquer `border-2 border-navy`, `shadow-offset`, typographie plus ferme et translation de 2 px au survol/à l’activation. Adapter chaque variante sans changer son nom.

- [ ] **Step 2: Uniformiser les tailles et le focus**

Conserver les dimensions publiques `default`, `sm`, `lg`, `icon`, avec focus bleu de 3 px et état désactivé stable.

- [ ] **Step 3: Transformer les cartes**

Appliquer bordure visible, rayon réduit, ombre courte et titre condensé. Garder les espacements actuels pour éviter les régressions de densité.

- [ ] **Step 4: Transformer les contrôles de formulaire**

Appliquer fond blanc/carte, bordure plus nette, rayon réduit, focus bleu et placeholders lisibles aux inputs, textarea et select. Adapter checkbox, radio et switch à la même géométrie.

- [ ] **Step 5: Vérifier le contrat et les types**

Run: `node src/lib/design-contract.test.ts && npm run typecheck`

Expected: succès.

- [ ] **Step 6: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/textarea.tsx src/components/ui/select.tsx src/components/ui/checkbox.tsx src/components/ui/radio-group.tsx src/components/ui/switch.tsx
git commit -m "style: appliquer composants fondamentaux Devizia"
```

### Task 3: Harmoniser les composants de données et de navigation locale

**Files:**
- Modify: `src/components/ui/table.tsx`
- Modify: `src/components/ui/tabs.tsx`
- Modify: `src/components/ui/badge.tsx`
- Modify: `src/components/ui/pagination.tsx`
- Modify: `src/components/ui/progress.tsx`
- Modify: `src/components/ui/skeleton.tsx`

**Interfaces:**
- Consumes: composants Radix et jetons globaux.
- Produces: mêmes exports et variantes existantes.

- [ ] **Step 1: Styliser les tableaux**

Donner aux en-têtes un fond bleu pâle, une typographie mono compacte, des séparateurs nets et aux lignes un survol bleu très léger.

- [ ] **Step 2: Styliser onglets et pagination**

Créer une sélection bleue franche, des contours cohérents et des états clavier visibles sans changer les API.

- [ ] **Step 3: Ajuster badges, progression et chargement**

Réduire les rayons, renforcer la lisibilité et préserver strictement les variantes sémantiques.

- [ ] **Step 4: Vérifier les types**

Run: `npm run typecheck`

Expected: succès.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/table.tsx src/components/ui/tabs.tsx src/components/ui/badge.tsx src/components/ui/pagination.tsx src/components/ui/progress.tsx src/components/ui/skeleton.tsx
git commit -m "style: harmoniser affichage des donnees Devizia"
```

### Task 4: Harmoniser les surfaces superposées

**Files:**
- Modify: `src/components/ui/dialog.tsx`
- Modify: `src/components/ui/alert-dialog.tsx`
- Modify: `src/components/ui/sheet.tsx`
- Modify: `src/components/ui/drawer.tsx`
- Modify: `src/components/ui/dropdown-menu.tsx`
- Modify: `src/components/ui/popover.tsx`
- Modify: `src/components/ui/command.tsx`
- Modify: `src/components/ui/tooltip.tsx`

**Interfaces:**
- Consumes: primitives Radix existantes.
- Produces: overlays, panneaux et menus conservant leurs props et comportements.

- [ ] **Step 1: Mettre dialogues et tiroirs au style éditorial**

Appliquer bordure marine, rayon réduit, ombre forte et titres condensés. Garder overlay, fermeture et animations existants.

- [ ] **Step 2: Mettre menus et popovers au même système**

Utiliser surface carte, bordure nette, sélection bleue et séparateurs cohérents.

- [ ] **Step 3: Harmoniser la recherche commande et les tooltips**

Préserver la densité et la navigation clavier ; appliquer les mêmes couleurs et géométries.

- [ ] **Step 4: Vérifier les types**

Run: `npm run typecheck`

Expected: succès.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/dialog.tsx src/components/ui/alert-dialog.tsx src/components/ui/sheet.tsx src/components/ui/drawer.tsx src/components/ui/dropdown-menu.tsx src/components/ui/popover.tsx src/components/ui/command.tsx src/components/ui/tooltip.tsx
git commit -m "style: harmoniser surfaces superposees Devizia"
```

### Task 5: Recomposer l’enveloppe applicative

**Files:**
- Modify: `src/components/AppShell.tsx`
- Modify: `src/components/GlobalSearch.tsx`

**Interfaces:**
- Consumes: composants partagés transformés et routes existantes.
- Produces: même `AppShell({ children })` et même `PageHeader({ title, subtitle, action })`.

- [ ] **Step 1: Appliquer le fond de travail**

Ajouter `.app-workspace` au conteneur principal et rendre le header plus franc avec bordure marine et surface opaque.

- [ ] **Step 2: Renforcer la sidebar**

Passer logo, liens actifs, groupes, encart conformité et zone utilisateur à la géométrie rectangulaire de l’accueil. Préserver badges et navigation mobile.

- [ ] **Step 3: Harmoniser les actions du header**

Mettre recherche, langue, thème et notifications au style des boutons externes, avec traitement compact.

- [ ] **Step 4: Transformer `PageHeader`**

Utiliser un titre condensé plus fort, un micro-kicker bleu et une composition responsive alignée sur l’accueil.

- [ ] **Step 5: Adapter la recherche globale**

Vérifier que la boîte de commande adopte automatiquement les nouveaux composants et corriger uniquement les classes contradictoires.

- [ ] **Step 6: Vérifier les types**

Run: `npm run typecheck`

Expected: succès.

- [ ] **Step 7: Commit**

```bash
git add src/components/AppShell.tsx src/components/GlobalSearch.tsx
git commit -m "style: aligner navigation sur accueil Devizia"
```

### Task 6: Corriger les intégrations et contradictions locales

**Files:**
- Modify: `src/components/QuoteEditorDialog.tsx`
- Modify: `src/components/ReminderModal.tsx`
- Modify: `src/routes/tableau-de-bord.tsx`
- Modify: `src/routes/clients.tsx`
- Modify: `src/routes/pipeline.tsx`
- Modify: `src/routes/devis.tsx`
- Modify: les autres `src/routes/*.tsx` seulement si une classe locale empêche les composants partagés de s’appliquer.

**Interfaces:**
- Consumes: design system partagé terminé.
- Produces: pages fonctionnellement identiques, visuellement cohérentes.

- [ ] **Step 1: Rechercher les contradictions**

Run: `rg -n "rounded-(xl|2xl|3xl)|shadow-xl|bg-orange|text-orange|border-orange" src/components src/routes`

Classer chaque résultat : marque à convertir, statut sémantique à conserver ou exception justifiée.

- [ ] **Step 2: Corriger les intégrations complexes**

Adapter l’éditeur de devis et la modale de relance sans toucher à leurs événements, validations ou données.

- [ ] **Step 3: Corriger les pages de référence**

Supprimer les rayons et ombres locaux qui contredisent le système sur tableau de bord, clients, pipeline et devis. Conserver les couleurs de statut.

- [ ] **Step 4: Corriger les autres routes uniquement si nécessaire**

Limiter les modifications aux classes visuelles incompatibles identifiées par la recherche.

- [ ] **Step 5: Lancer la vérification complète**

Run: `npm run check`

Expected: tests métier, contrat visuel, TypeScript et build réussis.

- [ ] **Step 6: Commit**

```bash
git add src/components/QuoteEditorDialog.tsx src/components/ReminderModal.tsx src/routes
git commit -m "style: finaliser coherence visuelle des pages"
```

### Task 7: Validation visuelle ordinateur et mobile

**Files:**
- Modify: uniquement les fichiers responsables d’un défaut constaté.

**Interfaces:**
- Consumes: serveur local `http://127.0.0.1:4174`.
- Produces: validation sans débordement, erreur console ou régression visuelle majeure.

- [ ] **Step 1: Vérifier les pages ordinateur**

Contrôler `/`, `/tableau-de-bord`, `/clients`, `/pipeline`, `/devis` et `/connexion` à 1365 × 900.

- [ ] **Step 2: Vérifier les interactions**

Ouvrir recherche globale, menu langue, notifications, une modale et le menu mobile. Vérifier focus, survol, fermeture et lisibilité.

- [ ] **Step 3: Vérifier les pages mobile**

Contrôler les mêmes pages à 390 × 844, avec `document.documentElement.scrollWidth <= window.innerWidth`.

- [ ] **Step 4: Corriger les défauts observés**

Appliquer uniquement les corrections nécessaires, puis répéter les vues concernées.

- [ ] **Step 5: Relancer la vérification finale**

Run: `npm run check && git diff --check`

Expected: succès, aucune erreur console bloquante, aucun débordement horizontal.

- [ ] **Step 6: Commit final si corrections**

```bash
git add src
git commit -m "fix: finaliser responsive design Devizia"
```
