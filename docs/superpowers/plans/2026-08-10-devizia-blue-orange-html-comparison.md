# Devizia Blue Orange HTML Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create four static responsive HTML mockups that compare blue and orange Devizia palettes on identical homepage and dashboard layouts.
**Architecture:** Use one shared CSS file with semantic custom properties overridden by `theme-blue` and `theme-orange` body classes. Duplicate only the HTML documents required for direct standalone URLs, keeping paired structures identical.
**Tech Stack:** Semantic HTML5, CSS custom properties, inline SVG-free UI shapes

## Global Constraints

- Do not modify React routes or application behavior.
- Keep paired blue/orange markup structurally identical.
- Use fictional demonstration data and no form submission.
- Support desktop and mobile without horizontal overflow.

---

### Task 1: Shared comparison design system

**Files:**
- Create: `public/comparatif-couleurs.css`

- [ ] Define shared layout, typography, focus, navigation, homepage, dashboard, and responsive styles.
- [ ] Define isolated blue and orange semantic palette overrides.

### Task 2: Homepage variants

**Files:**
- Create: `public/accueil-bleu.html`
- Create: `public/accueil-orange.html`

- [ ] Build identical semantic homepage markup with comparison navigation.
- [ ] Apply only the body theme class and active comparison state differently.

### Task 3: Dashboard variants

**Files:**
- Create: `public/dashboard-bleu.html`
- Create: `public/dashboard-orange.html`

- [ ] Build identical semantic dashboard markup with sidebar, metrics, pipeline, and activity.
- [ ] Apply only the body theme class and active comparison state differently.

### Task 4: Verification

- [ ] Open all four pages and verify titles and comparison links.
- [ ] Test desktop and mobile overflow and console errors.
- [ ] Run `npm run build` and `git diff --check`.
- [ ] Commit with `feat: ajouter comparatif HTML bleu orange`.
