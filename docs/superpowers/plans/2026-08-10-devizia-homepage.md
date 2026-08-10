# Devizia Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a polished, responsive Devizia homepage that converts artisans, independents, and small businesses through time savings, growth, and compliance messaging.
**Architecture:** Replace the current TanStack Router homepage composition with focused local React sections driven by typed content arrays. Add a small route-specific stylesheet for the editorial visual language and motion, while preserving existing global tokens and routes.
**Tech Stack:** React 19, TypeScript, TanStack Router, Tailwind CSS 4, Lucide React, Vite

## Global Constraints

- Keep `/` as the public homepage and preserve `/inscription`, `/connexion`, and `/tarifs` navigation.
- Display the Devizia brand; do not show InvoicePro on the homepage.
- Add no runtime dependency and no network request.
- Do not invent customer counts, ratings, certifications, hosting claims, or quantified savings.
- Support keyboard navigation, visible focus, mobile layouts, and `prefers-reduced-motion`.
- Preserve the user's existing modification to `src/routeTree.gen.ts`.

---

## File Map

- `src/routes/index.tsx`: homepage metadata, content models, navigation, and all landing-page sections.
- `src/routes/homepage.css`: scoped visual treatment, atmospheric backgrounds, product mockup details, reveal motion, and responsive refinements.
- `docs/superpowers/specs/2026-08-10-devizia-homepage-design.md`: approved product and marketing design reference; no implementation edits expected.

### Task 1: Establish the Devizia marketing shell and hero

**Files:**
- Modify: `src/routes/index.tsx`
- Create: `src/routes/homepage.css`

**Interfaces:**
- Consumes: TanStack Router `Link`, Lucide icon components, and existing routes.
- Produces: `LandingPage`, `PublicHeader`, `Hero`, and `ProductPreview` React components.

- [ ] **Step 1: Capture the current validation baseline**

Run: `npm run typecheck`

Expected: the existing project typechecks, or any unrelated pre-existing failure is recorded before editing.

- [ ] **Step 2: Replace homepage metadata and brand shell**

Set the title and description to Devizia and the three target groups. Build a skip link, accessible sticky navigation, correct mobile `aria-expanded` state, Devizia logo, login link, and registration CTA.

- [ ] **Step 3: Implement the conversion-focused hero**

Add one `h1` using the approved promise, supporting copy, primary and secondary CTAs, factual micro-reassurance, target-audience labels, and a realistic HTML/CSS product preview.

- [ ] **Step 4: Add the editorial visual foundation**

Create `homepage.css` with scoped CSS variables, subtle paper texture, document-inspired shapes, refined typography fallbacks, focus states, hero composition, product preview styling, and reduced-motion handling.

- [ ] **Step 5: Verify the shell**

Run: `npm run typecheck`

Expected: zero TypeScript errors caused by the homepage.

### Task 2: Build the complete marketing narrative

**Files:**
- Modify: `src/routes/index.tsx`
- Modify: `src/routes/homepage.css`

**Interfaces:**
- Consumes: typed local content arrays for problems, workflow steps, capabilities, pillars, profiles, and FAQ items.
- Produces: semantic sections with IDs `benefices`, `fonctionnement`, `fonctionnalites`, `profils`, and `faq`.

- [ ] **Step 1: Add the trust and problem-to-benefit sections**

Identify artisans, independents, and small businesses, then map late-night quotes, forgotten follow-ups, and unclear cash positions to concrete Devizia outcomes without fabricated statistics.

- [ ] **Step 2: Add the three-step workflow**

Show create, send, and collect as a connected narrative. Use concise copy and visual status details that reflect current product capabilities.

- [ ] **Step 3: Add product capability demonstrations**

Present AI-assisted quotes, Factur-X invoices, CRM/pipeline, cash visibility, and expense management using semantic HTML/CSS mini-interfaces and Lucide icons.

- [ ] **Step 4: Add the three marketing pillars and audience profiles**

Give time and serenity the strongest visual weight, then support it with growth and compliance. Add distinct but cohesive examples for artisans, independents, and small teams.

- [ ] **Step 5: Add pricing bridge, FAQ, final CTA, and footer**

Link to the canonical pricing route instead of duplicating plans. Use native `details` elements for five common objections. Finish with the registration CTA and only real navigation links.

- [ ] **Step 6: Verify semantic content**

Run: `rg -n "InvoicePro|href=\"#\"|2 400|4\.9|847" src/routes/index.tsx`

Expected: no visible stale brand, placeholder link, or invented proof.

### Task 3: Validate responsive behavior and production readiness

**Files:**
- Modify if required: `src/routes/index.tsx`
- Modify if required: `src/routes/homepage.css`

**Interfaces:**
- Consumes: completed homepage.
- Produces: buildable, responsive, accessible public route.

- [ ] **Step 1: Run automated domain and type checks**

Run: `npm run test:domain && npm run typecheck`

Expected: all domain tests pass and TypeScript reports no errors.

- [ ] **Step 2: Build the production bundle**

Run: `npm run build`

Expected: Vite/TanStack build completes successfully.

- [ ] **Step 3: Inspect the page at mobile and desktop widths**

Start the existing development server and inspect `/` at approximately 390px and 1440px. Confirm no horizontal overflow, readable text, working menu, valid anchors, and visible CTA hierarchy.

- [ ] **Step 4: Check keyboard and motion behavior**

Tab through the skip link, navigation, CTAs, FAQ, and footer. Confirm visible focus and test reduced-motion emulation to ensure content remains available without animation.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the planned homepage files plus the user's pre-existing `src/routeTree.gen.ts` change appear.

- [ ] **Step 6: Commit the implementation**

Stage only `src/routes/index.tsx`, `src/routes/homepage.css`, and this plan, then commit with `feat: refondre accueil marketing Devizia`.
