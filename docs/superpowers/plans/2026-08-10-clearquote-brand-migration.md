# ClearQuote Brand Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remplacer la marque produit Devizia/InvoicePro par ClearQuote et installer le logo fourni dans tous les emplacements utiles de l’application.

**Architecture:** Une ressource de logo optimisée et un composant `BrandLogo` partagé centralisent l’affichage de la marque. Les pages publiques et l’AppShell consomment ce composant, tandis qu’un passage ciblé met à jour les métadonnées et les mentions techniques de la plateforme sans toucher aux logos des entreprises clientes.

**Tech Stack:** React, TypeScript, TanStack Router, Tailwind CSS, assets PNG/SVG, Node `assert`, Vite, Playwright.

## Global Constraints

- Préserver les pixels, couleurs et proportions du logo fourni.
- Ne jamais remplacer `company.logoBase64` ni les logos chargés dans Paramètres.
- Ne pas renommer les routes, le package, le dépôt ou les clés de stockage.
- Ne pas modifier la logique métier.
- Ne pas toucher aux HTML de comparaison non utilisés en production.
- Conserver le thème bleu et le responsive existants.

---

### Task 1: Préparer les ressources et le composant de marque

**Files:**
- Create: `public/brand/clearquote-logo.png`
- Create: `public/brand/clearquote-mark.png`
- Create: `src/components/BrandLogo.tsx`
- Modify: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: `C:/Users/CHERK/Downloads/ClearQuote_logo_design_2K_202608102217-removebg-preview.png`.
- Produces: `BrandLogo({ compact?: boolean, className?: string, priority?: boolean })`.

- [ ] **Step 1: Ajouter un contrat statique en échec**

Vérifier l’existence des deux ressources, du composant partagé, des textes alternatifs ClearQuote et des variantes horizontal/compact.

- [ ] **Step 2: Confirmer l’échec initial**

Run: `node src/lib/design-contract.test.ts`

- [ ] **Step 3: Préparer les images sans les redessiner**

Retirer uniquement les marges transparentes du logo horizontal. Extraire le symbole de gauche en conservant exactement ses pixels pour la variante compacte. Enregistrer les fichiers dans `public/brand/`.

- [ ] **Step 4: Créer `BrandLogo`**

Le composant choisit `/brand/clearquote-logo.png` ou `/brand/clearquote-mark.png`, applique `object-contain`, renseigne le texte alternatif et accepte les classes de dimensionnement du contexte appelant.

- [ ] **Step 5: Valider et committer**

Run: `node src/lib/design-contract.test.ts`

```powershell
git add -- public/brand/clearquote-logo.png public/brand/clearquote-mark.png src/components/BrandLogo.tsx src/lib/design-contract.test.ts
git commit -m "feat: ajouter les ressources de marque ClearQuote"
```

---

### Task 2: Installer le logo dans les interfaces principales

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/connexion.tsx`
- Modify: `src/routes/inscription.tsx`
- Modify: `src/routes/mot-de-passe-oublie.tsx`
- Modify: `src/routes/tarifs.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/routes/homepage.css`
- Modify: `src/styles.css`
- Test: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: `BrandLogo` de Task 1.
- Produces: logo ClearQuote cohérent sur pages publiques, authentification et application.

- [ ] **Step 1: Étendre le contrat en échec**

Vérifier que l’accueil, la connexion, l’inscription et l’AppShell importent `BrandLogo`, et que les anciens blocs de marque textuels n’y subsistent pas.

- [ ] **Step 2: Remplacer les marques visuelles**

Utiliser le logo horizontal dans les zones larges et le symbole compact uniquement dans les emplacements réellement étroits. Ajouter un fond clair local sur la barre latérale si nécessaire pour garantir le contraste du mot-symbole marine.

- [ ] **Step 3: Ajuster le responsive sans refonte**

Limiter les styles aux dimensions, au contraste et à l’alignement du logo. Ne changer aucune autre composition de page.

- [ ] **Step 4: Exécuter les tests**

Run: `node src/lib/design-contract.test.ts`

Run: `npm run typecheck`

- [ ] **Step 5: Committer**

```powershell
git add -- src/routes/index.tsx src/routes/connexion.tsx src/routes/inscription.tsx src/routes/mot-de-passe-oublie.tsx src/routes/tarifs.tsx src/components/AppShell.tsx src/routes/homepage.css src/styles.css src/lib/design-contract.test.ts
git commit -m "style: installer le logo ClearQuote dans l interface"
```

---

### Task 3: Migrer les mentions produit et les métadonnées

**Files:**
- Modify: `src/routes/__root.tsx`
- Modify: `src/routes/abonnements.tsx`
- Modify: `src/routes/catalogue.tsx`
- Modify: `src/routes/clients.tsx`
- Modify: `src/routes/connexion.tsx`
- Modify: `src/routes/depenses.tsx`
- Modify: `src/routes/devis.tsx`
- Modify: `src/routes/factures.tsx`
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/inscription.tsx`
- Modify: `src/routes/mot-de-passe-oublie.tsx`
- Modify: `src/routes/parametres.tsx`
- Modify: `src/routes/pipeline.tsx`
- Modify: `src/routes/situations.tsx`
- Modify: `src/routes/tableau-de-bord.tsx`
- Modify: `src/routes/tarifs.tsx`
- Modify: `src/routes/tresorerie.tsx`
- Modify: `src/lib/catalogue-io.ts`
- Modify: `src/lib/facturx-embed.ts`
- Modify: `src/lib/facturx-xml.ts`
- Modify: `public/favicon.ico`
- Test: `src/lib/design-contract.test.ts`

**Interfaces:**
- Consumes: nom officiel `ClearQuote` et marque compacte de Task 1.
- Produces: titres, descriptions, générateur Factur-X et favicon cohérents.

- [ ] **Step 1: Ajouter le test d’inventaire des anciennes marques**

Scanner uniquement les sources de production `src/` et autoriser les occurrences historiques strictement nécessaires dans le test lui-même. Le test doit échouer tant que `Devizia` ou `InvoicePro` identifie encore le SaaS.

- [ ] **Step 2: Remplacer les mentions produit ciblées**

Mettre à jour les titres de route, descriptions, libellés d’export et métadonnées générateur. Ne pas modifier les contenus d’entreprise cliente.

- [ ] **Step 3: Installer le favicon ClearQuote**

Brancher la marque compacte dans la configuration de tête existante sans ajouter de dépendance.

- [ ] **Step 4: Valider**

Run: `node src/lib/design-contract.test.ts`

Run: `npm run typecheck`

Run: `git diff --check`

- [ ] **Step 5: Committer**

```powershell
git add -- src public
git commit -m "refactor: renommer la plateforme ClearQuote"
```

---

### Task 4: Validation visuelle et production

**Files:**
- Verify: `src/routes/index.tsx`
- Verify: `src/routes/connexion.tsx`
- Verify: `src/components/AppShell.tsx`
- Verify: `src/routes/parametres.tsx`

**Interfaces:**
- Consumes: serveur local `http://127.0.0.1:4174`.
- Produces: preuve de cohérence desktop/mobile et absence de régression.

- [ ] **Step 1: Vérifier l’accueil et la connexion en desktop/mobile**

Contrôler le ratio, la netteté, le contraste, la taille et l’absence de débordement du logo.

- [ ] **Step 2: Vérifier l’AppShell en desktop/mobile**

Contrôler la barre latérale et le mode compact, sans masquer les liens de navigation.

- [ ] **Step 3: Protéger le logo client**

Vérifier dans Paramètres, les modèles d’e-mails et le portail client que `company.logoBase64` reste prioritaire et inchangé.

- [ ] **Step 4: Lancer les contrôles finaux**

Run: `node src/lib/design-contract.test.ts`

Run: `npm run typecheck`

Run: `npm run build`

Run: `git diff --check`

- [ ] **Step 5: Vérifier l’état Git**

Run: `git status --short`

Expected: worktree propre hors fichiers générés automatiquement restaurés avant livraison.
