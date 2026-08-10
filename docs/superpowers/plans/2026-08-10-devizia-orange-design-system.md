# Devizia Orange Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the purple brand palette with a consistent orange-copper, navy, and ivory design system across every Devizia page.
**Architecture:** Update semantic tokens in the global stylesheet so shared Tailwind utilities and components inherit the new brand automatically. Align the homepage's local variables to the same palette, then remove only hardcoded purple brand values that bypass semantic tokens while preserving success, warning, and destructive status colors.
**Tech Stack:** CSS custom properties, Tailwind CSS 4, React 19, TanStack Router, Vite

## Global Constraints

- Preserve all page structures, routes, content, and business behavior.
- Orange is the brand/action color, not a replacement for green, amber, or red statuses.
- Use OKLCH values for global design-system tokens.
- Keep readable light and dark modes and visible keyboard focus.
- Do not add dependencies.

---

### Task 1: Replace global brand tokens

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: global semantic tokens consumed by Tailwind utilities and shared UI components.

- [ ] Run `npm run typecheck` to record the baseline.
- [ ] Update light-mode primary, secondary, accent, ring, chart, sidebar-primary, and brand gradients to orange-copper values.
- [ ] Update dark-mode primary, ring, chart, and sidebar-primary with accessible orange values.
- [ ] Preserve success, warning, destructive, and neutral semantics.
- [ ] Search the global stylesheet for obsolete purple brand values.

### Task 2: Align public homepage and hardcoded brand surfaces

**Files:**
- Modify: `src/routes/homepage.css`
- Modify only when a brand value bypasses tokens: `src/**/*.tsx`

**Interfaces:**
- Consumes: the palette defined in the approved design specification.
- Produces: consistent orange brand styling across public and authenticated pages.

- [ ] Map homepage action and emphasis variables to orange copper, navy, ivory, green, and amber.
- [ ] Keep text contrast correct on orange surfaces.
- [ ] Search `src` for hardcoded purple hex, RGB, HSL, and OKLCH brand values.
- [ ] Replace only brand-colored hardcodes; preserve semantic status colors and document/PDF rendering colors unless they represent the Devizia brand.

### Task 3: Verify the platform

**Files:**
- Modify if required: `src/styles.css`
- Modify if required: `src/routes/homepage.css`

**Interfaces:**
- Produces: verified production-ready design system.

- [ ] Run `npm run test:domain && npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Inspect `/`, `/connexion`, `/tableau-de-bord`, `/devis`, `/factures`, `/clients`, and `/tarifs` at desktop width.
- [ ] Inspect `/` and `/tableau-de-bord` at mobile width.
- [ ] Confirm no horizontal overflow or console errors.
- [ ] Run `git diff --check` and review the final diff.
- [ ] Commit the implementation with `style: appliquer identite orange Devizia`.
