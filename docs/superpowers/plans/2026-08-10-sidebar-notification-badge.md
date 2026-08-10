# Sidebar Notification Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Afficher un seul compteur de notification à droite de chaque menu de la barre latérale.

**Architecture:** Une petite fonction pure formate le compteur droit. Le composant de badge superposé à l’icône et son utilisation sont supprimés de `AppShell`.

**Tech Stack:** React 19, TypeScript, Node assert, Tailwind CSS v4.

## Global Constraints

- Ne pas modifier le calcul des factures en retard.
- Ne pas modifier la cloche ni son panneau.
- Ne conserver qu’un compteur à droite.

---

### Task 1: Formatage du compteur

**Files:**
- Create: `src/lib/navigation-badge.ts`
- Create: `src/lib/navigation-badge.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `formatNavigationBadge(count: number): string | null`

- [ ] Write a failing test for zero, one and values greater than 99.
- [ ] Run the focused test and confirm the missing module failure.
- [ ] Implement the formatter and add it to the domain test suite.

### Task 2: Rendu unique

**Files:**
- Modify: `src/components/AppShell.tsx`

- [ ] Remove the `NotifBadge` component.
- [ ] Remove the badge rendered inside the icon wrapper.
- [ ] Use `formatNavigationBadge` only for the right-side badge.
- [ ] Run tests, TypeScript and the production build.
