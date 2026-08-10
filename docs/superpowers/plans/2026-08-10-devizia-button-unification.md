# Devizia Button Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Uniformiser les actions interactives de Devizia et placer « Nouvelle prestation » complètement à droite dans Catalogue.

**Architecture:** Le composant partagé `Button` reste la source de vérité. Un contrat statique détecte les anciennes signatures visuelles ; les actions principales et secondaires sont migrées par groupes de pages, tandis que les boutons texte et les contrôles spécialisés conservent leur sémantique.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, class-variance-authority, Vite, Playwright.

## Global Constraints

- Ne changer aucun gestionnaire d’événement ni aucune logique métier.
- Conserver les couleurs vert, ambre et rouge pour les actions sémantiques.
- Conserver l’API publique de `Button`.
- Chaque bouton d’icône doit garder un `title` ou `aria-label`.
- Ne pas réécrire l’historique Git connecté à Lovable.

---

### Task 1: Étendre le contrat des boutons

**Files:**
- Modify: `src/lib/design-contract.test.ts`
- Modify: `src/components/ui/button.tsx`

**Interfaces:**
- Consumes: `buttonVariants`, fichiers TSX des routes.
- Produces: mêmes exports `Button`, `ButtonProps`, `buttonVariants` et un contrôle anti-régression.

- [ ] **Step 1: Écrire le test en échec**

Ajouter des assertions exigeant que le Catalogue importe `Button`, que « Nouvelle prestation » utilise `ml-auto`, et que les signatures `rounded-lg bg-primary` ou `rounded-xl bg-primary` n’apparaissent plus sur les principales pages internes.

- [ ] **Step 2: Vérifier l’échec**

Run: `node src/lib/design-contract.test.ts`

Expected: échec sur Catalogue et les anciennes signatures.

- [ ] **Step 3: Stabiliser les variantes partagées**

Vérifier que `default`, `outline`, `secondary`, `ghost` et `destructive` partagent hauteur, rayon, focus et états désactivés. Ne modifier que les classes nécessaires au contrat.

- [ ] **Step 4: Vérifier les types**

Run: `npm run typecheck`

- [ ] **Step 5: Commit**

```bash
git add src/lib/design-contract.test.ts src/components/ui/button.tsx
git commit -m "test: renforcer contrat des boutons Devizia"
```

### Task 2: Recomposer la barre d’actions Catalogue

**Files:**
- Modify: `src/routes/catalogue.tsx`

**Interfaces:**
- Consumes: `Button` et les gestionnaires existants `downloadCsvTemplate`, `handleExportExcel`, `openNew`.
- Produces: mêmes actions, avec groupes gauche/droite responsives.

- [ ] **Step 1: Importer `Button`**

Ajouter l’import depuis `@/components/ui/button`.

- [ ] **Step 2: Recomposer la première rangée**

Rendre la rangée pleine largeur. Garder recherche, modèle, import et export dans le groupe gauche. Placer le bouton `openNew` après ce groupe avec `ml-auto`.

- [ ] **Step 3: Migrer les quatre actions**

Utiliser `outline` et `size="sm"` pour modèle/import/export, puis `default` et `size="sm"` pour « Nouvelle prestation ». Conserver les titres et états désactivés.

- [ ] **Step 4: Migrer les actions principales des dialogues Catalogue**

Remplacer les boutons locaux de validation par `Button`, sans toucher aux filtres en pilules ni aux zones de dépôt.

- [ ] **Step 5: Vérifier le contrat et les types**

Run: `node src/lib/design-contract.test.ts && npm run typecheck`

- [ ] **Step 6: Commit**

```bash
git add src/routes/catalogue.tsx
git commit -m "style: aligner actions du catalogue"
```

### Task 3: Migrer les actions principales des pages internes et publiques

**Files:**
- Modify: `src/routes/clients.tsx`
- Modify: `src/routes/devis.tsx`
- Modify: `src/routes/factures.tsx`
- Modify: `src/routes/pipeline.tsx`
- Modify: `src/routes/tableau-de-bord.tsx`
- Modify: `src/routes/parametres.tsx`
- Modify: `src/routes/connexion.tsx`
- Modify: `src/routes/inscription.tsx`
- Modify: `src/routes/mot-de-passe-oublie.tsx`

**Interfaces:**
- Consumes: gestionnaires et états existants.
- Produces: actions fonctionnellement identiques avec variantes partagées.

- [ ] **Step 1: Migrer Clients, Devis et Factures**

Remplacer uniquement les actions principales bleues et actions secondaires bordées. Conserver les boutons texte de noms clients et les actions de statut.

- [ ] **Step 2: Migrer Pipeline, Tableau de bord et Paramètres**

Utiliser `default`, `outline`, `secondary` ou `ghost` selon la hiérarchie définie. Préserver les boutons verts de paiement et rouges destructifs, en leur donnant la géométrie commune si nécessaire.

- [ ] **Step 3: Migrer les écrans d’authentification**

Utiliser `Button` pour les soumissions principales et conserver la largeur complète. Ne pas modifier les flux de connexion ou de développement.

- [ ] **Step 4: Rechercher les anciennes signatures**

Run: `rg -n "rounded-(lg|xl).*bg-primary|bg-primary.*rounded-(lg|xl)" src/routes src/components`

Classer les résultats restants : bouton à migrer ou élément non interactif à conserver.

- [ ] **Step 5: Vérification complète**

Run: `npm run check`

- [ ] **Step 6: Commit**

```bash
git add src/routes
git commit -m "style: uniformiser boutons des pages Devizia"
```

### Task 4: Validation visuelle et fonctionnelle

**Files:**
- Modify: uniquement les fichiers responsables d’un défaut constaté.

**Interfaces:**
- Consumes: serveur local `http://127.0.0.1:4174`.
- Produces: pages sans débordement, erreur console ou action inaccessible.

- [ ] **Step 1: Contrôler Catalogue sur ordinateur**

Vérifier que « Nouvelle prestation » est au bord droit, que les trois actions secondaires sont regroupées et que l’ouverture du formulaire fonctionne.

- [ ] **Step 2: Contrôler Catalogue sur mobile**

Vérifier le placement à droite, l’absence de débordement et les libellés accessibles.

- [ ] **Step 3: Contrôler les pages de référence**

Vérifier Clients, Devis, Factures, Pipeline et Connexion à 1365 × 900 et 390 × 844.

- [ ] **Step 4: Vérifier la suite finale**

Run: `npm run check && git diff --check`

- [ ] **Step 5: Commit des corrections éventuelles**

```bash
git add src
git commit -m "fix: finaliser uniformite des boutons"
```
