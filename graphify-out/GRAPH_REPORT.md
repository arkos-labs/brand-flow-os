# Graph Report - devizia-homepage  (2026-08-18)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 1199 nodes · 2418 edges · 140 communities (68 shown, 72 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 43 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `5c5bf2f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devis.tsx
- portail.$id.tsx
- cn
- routeTree.gen.ts
- depenses.tsx
- BrandLogo.tsx
- sidebar.tsx
- data-context.tsx
- compilerOptions
- design-contract.test.ts
- paiements.tsx
- toggle-group.tsx
- pagination.tsx
- QuoteEditorDialog.tsx
- server.ts
- Catalogue
- database.types.ts
- theme.tsx
- FileRoutesByPath
- components.json
- supabase-context.tsx
- __root.tsx
- menubar.tsx
- situations.tsx
- showcase-data.ts
- demo-data.ts
- dependencies
- AppShell.tsx
- index.tsx
- carousel.tsx
- supabase.ts
- form.tsx
- catalogue-io.ts
- i18n.tsx
- devDependencies
- useI18n
- chart.tsx
- scripts
- catalogue.tsx
- tableau-de-bord.tsx
- benefices.tsx
- navigation-menu.tsx
- fonctionnalites.tsx
- fonctionnement.tsx
- Situations
- tarifs.tsx
- api/auth/google/callback.ts
- package.json
- routes/api/auth/google/callback.ts
- routes/api/auth/google/login.ts
- api/auth/google/login.ts
- api/auth/google/consume-token.ts
- api/calendar/events.ts
- api/calendar/list.ts
- send.ts
- sign.ts
- calendly/events.ts
- class-variance-authority
- utils.ts
- date-fns
- embla-carousel-react
- eslint-config-prettier
- cmdk
- eslint-plugin-react-hooks
- eslint-plugin-react-refresh
- clients.tsx
- html-to-image
- input-otp
- jspdf
- jspdf-autotable
- @lovable.dev/vite-tanstack-config
- lucide-react
- nitro
- pdf-lib
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-context-menu
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-navigation-menu
- @radix-ui/react-popover
- @radix-ui/react-progress
- @radix-ui/react-radio-group
- @radix-ui/react-scroll-area
- @radix-ui/react-select
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toggle
- @radix-ui/react-toggle-group
- @radix-ui/react-tooltip
- react
- react-dom
- react-hook-form
- react-resizable-panels
- recharts
- sonner
- @supabase/supabase-js
- tailwind-merge
- tailwindcss
- @tailwindcss/vite
- @tanstack/react-query
- @tanstack/react-router
- @tanstack/react-start
- @tanstack/router-plugin
- tw-animate-css
- vite-tsconfig-paths
- xlsx
- zod
- prettier
- typescript
- typescript-eslint
- vite
- @vitejs/plugin-react
- calendly/callback.ts
- calendly/login.ts
- vercel.json
- parametres.tsx
- command.tsx
- ReminderModal.tsx
- drawer.tsx
- dropdown-menu.tsx
- alert.tsx
- accordion.tsx
- avatar.tsx
- globals
- eslint

## God Nodes (most connected - your core abstractions)
1. `cn()` - 258 edges
2. `useI18n()` - 47 edges
3. `FileRoutesByPath` - 38 edges
4. `useData()` - 33 edges
5. `Catalogue()` - 23 edges
6. `Button` - 22 edges
7. `compilerOptions` - 22 edges
8. `BrandLogo()` - 19 edges
9. `exportQuotePdf()` - 17 edges
10. `Invoices()` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Situations()` --calls--> `cn()`  [EXTRACTED]
  _to_delete/routes/situations.tsx → src/lib/utils.ts
- `Situations()` --calls--> `useData()`  [EXTRACTED]
  _to_delete/routes/situations.tsx → src/lib/data-context.tsx
- `Situations()` --calls--> `useI18n()`  [EXTRACTED]
  _to_delete/routes/situations.tsx → src/lib/i18n.tsx
- `buildDocumentHtml()` --indirect_call--> `DocumentTemplate()`  [INFERRED]
  src/lib/pdf-export.ts → src/components/DocumentTemplate.tsx
- `AffaireStatusBadge()` --calls--> `cn()`  [EXTRACTED]
  src/routes/archives.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (140 total, 72 thin omitted)

### Community 0 - "devis.tsx"
Cohesion: 0.12
Nodes (26): PopoverContent, RadioGroup, RadioGroupItem, Quote, InvoiceStatus, canEditQuote(), recordInvoicePayment(), generateInvoiceEmailHtml() (+18 more)

### Community 1 - "portail.$id.tsx"
Cohesion: 0.06
Nodes (53): DocumentPreviewModal(), handlePrint(), Props, computeTotals(), DocumentClient, DocumentCompany, DocumentData, DocumentLineItem (+45 more)

### Community 2 - "cn"
Cohesion: 0.07
Nodes (39): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), Card (+31 more)

### Community 3 - "routeTree.gen.ts"
Cohesion: 0.04
Nodes (49): getRouter(), Route, Route, AbonnementsRoute, ApiAuthGoogleCallbackRoute, ApiAuthGoogleConsumeTokenRoute, ApiAuthGoogleLoginRoute, ApiCalendarEventsRoute (+41 more)

### Community 4 - "depenses.tsx"
Cohesion: 0.14
Nodes (23): PageHeader(), Badge(), BadgeProps, badgeVariants, DropdownMenuContent, DropdownMenuItem, ScrollArea, SheetContent (+15 more)

### Community 5 - "BrandLogo.tsx"
Cohesion: 0.09
Nodes (10): BrandLogo(), BrandLogoProps, Footer(), Route, Route, Route, Route, Route (+2 more)

### Community 6 - "sidebar.tsx"
Cohesion: 0.07
Nodes (32): Separator, SheetDescription, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup (+24 more)

### Community 7 - "data-context.tsx"
Cohesion: 0.09
Nodes (32): CompanySettings, DataContext, DataContextType, DataProvider(), defaultCompanySettings, deleteExpenseFromDb(), deleteProductFromDb(), deleteQuoteFromDb() (+24 more)

### Community 8 - "compilerOptions"
Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+23 more)

### Community 9 - "design-contract.test.ts"
Cohesion: 0.07
Nodes (27): accueil, appShell, button, catalogue, connexion, devis, drawerEnd, drawerStart (+19 more)

### Community 10 - "paiements.tsx"
Cohesion: 0.11
Nodes (25): ReminderModal(), canMoveQuoteManually(), getInvoicePaymentState(), getQuotePipelineStage(), InvoiceLike, InvoicePaymentState, markInvoiceAsPaid(), PaymentMethod (+17 more)

### Community 11 - "toggle-group.tsx"
Cohesion: 0.43
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 12 - "pagination.tsx"
Cohesion: 0.10
Nodes (20): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+12 more)

### Community 13 - "QuoteEditorDialog.tsx"
Cohesion: 0.14
Nodes (18): AIQuoteWidgetProps, emptyLine(), Props, QuoteEditorDialog(), Client, ClientType, Product, QuoteItem (+10 more)

### Community 14 - "server.ts"
Cohesion: 0.16
Nodes (13): consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch(), getServerEntry() (+5 more)

### Community 15 - "Catalogue"
Cohesion: 0.12
Nodes (10): exportCatalogueToExcel(), importRowsToProducts(), parseCatalogueCSV(), Catalogue(), closeModal(), handleConfirmImport(), handleExportExcel(), openNew() (+2 more)

### Community 16 - "database.types.ts"
Cohesion: 0.10
Nodes (19): Database, DatabaseWithoutInternals, DbCatalogItem, DbClient, DbInvoiceItem, DbQuote, DbQuoteItem, DbReminderTemplate (+11 more)

### Community 17 - "theme.tsx"
Cohesion: 0.24
Nodes (10): applyThemeClass(), DEFAULT_PREFS, loadPrefs(), PrefsContext, PrefsCtx, savePrefs(), Theme, ThemeProvider() (+2 more)

### Community 18 - "FileRoutesByPath"
Cohesion: 0.12
Nodes (17): Route, parseCookie(), Route, refreshGoogleToken(), Route, refreshGoogleToken(), Route, Route (+9 more)

### Community 19 - "components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 20 - "supabase-context.tsx"
Cohesion: 0.11
Nodes (18): DbInvoice, DbOrganization, DbPayment, DbProfile, DbReminder, InvoiceStatus, PaymentMethod, ReminderType (+10 more)

### Community 21 - "__root.tsx"
Cohesion: 0.14
Nodes (12): Toaster(), ToasterProps, LanguageProvider(), LovableErrorOptions, LovableEvents, reportLovableError(), Window, SupabaseDataProvider() (+4 more)

### Community 22 - "menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 23 - "situations.tsx"
Cohesion: 0.13
Nodes (17): Label, labelVariants, SelectContent, SelectItem, SelectLabel, SelectScrollDownButton, SelectScrollUpButton, SelectSeparator (+9 more)

### Community 24 - "showcase-data.ts"
Cohesion: 0.16
Nodes (14): Expense, QuoteDetails, Subscription, client(), createShowcaseData(), details(), invoiceItems(), SHOWCASE_DATA_VERSION (+6 more)

### Community 25 - "demo-data.ts"
Cohesion: 0.12
Nodes (15): activity, Bi, cashflow, Deal, deals, initialInvoices, invoices, kpis (+7 more)

### Community 26 - "dependencies"
Cohesion: 0.13
Nodes (15): clsx, @hookform/resolvers, dependencies, clsx, @hookform/resolvers, @radix-ui/react-hover-card, @radix-ui/react-menubar, @radix-ui/react-separator (+7 more)

### Community 27 - "AppShell.tsx"
Cohesion: 0.17
Nodes (11): daysSince(), groups, isQuoteExpired(), NotificationPanel(), NotifItem, PUBLIC_PATHS, THEME_CYCLE, THEME_META (+3 more)

### Community 28 - "index.tsx"
Cohesion: 0.13
Nodes (6): capabilities, faqs, problems, profiles, Route, workflow

### Community 29 - "carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 30 - "supabase.ts"
Cohesion: 0.20
Nodes (7): supabase, SUPABASE_ANON_KEY, SUPABASE_URL, ConnexionPage(), Route, InscriptionPage(), Route

### Community 31 - "form.tsx"
Cohesion: 0.23
Nodes (10): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+2 more)

### Community 32 - "catalogue-io.ts"
Cohesion: 0.17
Nodes (11): CSV_HEADERS, downloadCsvTemplate(), ExportRow, ImportRow, ParseResult, VALID_CATEGORIES, VALID_UNITS, VALID_VAT (+3 more)

### Community 33 - "i18n.tsx"
Cohesion: 0.21
Nodes (10): Dict, Key, Lang, LangContext, CalendarEvent, cleanDescription(), EventCell(), formatDuration() (+2 more)

### Community 34 - "devDependencies"
Cohesion: 0.18
Nodes (11): @eslint/js, eslint-plugin-prettier, devDependencies, @eslint/js, eslint-plugin-prettier, @types/node, @types/react, @types/react-dom (+3 more)

### Community 35 - "useI18n"
Cohesion: 0.30
Nodes (10): AppShell(), GlobalSearch(), useData(), useI18n(), SubscriptionsPage(), ExpensesPage(), SettingsPage(), RendezVousPage() (+2 more)

### Community 36 - "chart.tsx"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 37 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, build:dev, check, dev, format, lint, preview (+2 more)

### Community 38 - "catalogue.tsx"
Cohesion: 0.20
Nodes (9): CATEGORY_LABELS, ProductUnit, UNIT_LABELS, ALL_CATEGORIES, ALL_UNITS, ALL_VAT, CATEGORY_COLORS, Route (+1 more)

### Community 39 - "tableau-de-bord.tsx"
Cohesion: 0.20
Nodes (5): DRAFT_STATUSES, PROGRESS_STATUSES, REFUSED_STATUSES, Route, SIGNED_STATUSES

### Community 40 - "benefices.tsx"
Cohesion: 0.22
Nodes (6): BENEFITS, FAQ, navLinkStyle, navTitleStyle, Route, TESTIMONIALS

### Community 41 - "navigation-menu.tsx"
Cohesion: 0.29
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 42 - "fonctionnalites.tsx"
Cohesion: 0.25
Nodes (5): FAQ, FEATURES, navLinkStyle, navTitleStyle, Route

### Community 43 - "fonctionnement.tsx"
Cohesion: 0.25
Nodes (5): FAQ, navLinkStyle, navTitleStyle, Route, STEPS

### Community 44 - "Situations"
Cohesion: 0.36
Nodes (7): calcSitAmounts(), fmtDate(), Situations(), handleCreateMarche(), handleCreateSituation(), handleGenerateInvoice(), today()

### Community 45 - "tarifs.tsx"
Cohesion: 0.33
Nodes (3): FAQ, PLANS, Route

### Community 46 - "api/auth/google/callback.ts"
Cohesion: 0.60
Nodes (4): ALLOWED_RETURN_PATHS, handler(), parseCookie(), safeReturnTo()

### Community 47 - "package.json"
Cohesion: 0.40
Nodes (4): name, private, sideEffects, type

### Community 48 - "routes/api/auth/google/callback.ts"
Cohesion: 0.60
Nodes (4): ALLOWED_RETURN_PATHS, parseCookie(), Route, safeReturnTo()

### Community 49 - "routes/api/auth/google/login.ts"
Cohesion: 0.60
Nodes (4): ALLOWED_RETURN_PATHS, randomNonce(), Route, safeReturnTo()

### Community 50 - "api/auth/google/login.ts"
Cohesion: 0.67
Nodes (3): ALLOWED_RETURN_PATHS, handler(), safeReturnTo()

### Community 60 - "utils.ts"
Cohesion: 0.18
Nodes (12): AIQuoteResultItem, AIQuoteWidget(), extractQuantity(), LOADING_STEPS, QUICK_PROMPTS, runSmartAnalysis(), SERVICE_TEMPLATES, ServiceTemplate (+4 more)

### Community 67 - "clients.tsx"
Cohesion: 0.17
Nodes (8): ErrorBoundary, ClientQuoteAction, getClientQuoteActions(), avatarColor(), ClientsPage(), EMPTY_CLIENT, initials(), Tab

### Community 130 - "parametres.tsx"
Cohesion: 0.18
Nodes (10): Checkbox, calculateFrenchVatNumber(), checkVatNumber(), SiretData, VatCheckResult, LEGAL_FORMS, PrefToggleRow(), Route (+2 more)

### Community 131 - "command.tsx"
Cohesion: 0.26
Nodes (10): GlobalSearchProps, Command, CommandDialog(), CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList (+2 more)

### Community 132 - "ReminderModal.tsx"
Cohesion: 0.33
Nodes (8): ReminderModalProps, DialogContent, DialogDescription, DialogFooter(), DialogHeader(), DialogOverlay, DialogTitle, Invoice

### Community 133 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 134 - "dropdown-menu.tsx"
Cohesion: 0.25
Nodes (7): DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent, DropdownMenuSubTrigger

### Community 135 - "alert.tsx"
Cohesion: 0.50
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 136 - "accordion.tsx"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 137 - "avatar.tsx"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

## Knowledge Gaps
- **397 isolated node(s):** `QuoteForLines`, `Props`, `DocumentClient`, `DocumentLineItem`, `DocumentType` (+392 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **72 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `cn` to `devis.tsx`, `portail.$id.tsx`, `parametres.tsx`, `command.tsx`, `depenses.tsx`, `ReminderModal.tsx`, `drawer.tsx`, `alert.tsx`, `accordion.tsx`, `avatar.tsx`, `dropdown-menu.tsx`, `sidebar.tsx`, `pagination.tsx`, `toggle-group.tsx`, `paiements.tsx`, `Catalogue`, `menubar.tsx`, `situations.tsx`, `AppShell.tsx`, `carousel.tsx`, `form.tsx`, `i18n.tsx`, `useI18n`, `chart.tsx`, `catalogue.tsx`, `tableau-de-bord.tsx`, `navigation-menu.tsx`, `Situations`, `utils.ts`, `clients.tsx`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `useI18n()` connect `useI18n` to `devis.tsx`, `i18n.tsx`, `portail.$id.tsx`, `command.tsx`, `ReminderModal.tsx`, `depenses.tsx`, `catalogue.tsx`, `clients.tsx`, `BrandLogo.tsx`, `parametres.tsx`, `paiements.tsx`, `tableau-de-bord.tsx`, `Situations`, `Catalogue`, `situations.tsx`, `AppShell.tsx`, `utils.ts`, `supabase.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`, `class-variance-authority`, `date-fns`, `embla-carousel-react`, `cmdk`, `html-to-image`, `input-otp`, `jspdf`, `jspdf-autotable`, `lucide-react`, `pdf-lib`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-context-menu`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-label`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-popover`, `@radix-ui/react-progress`, `@radix-ui/react-radio-group`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toggle`, `@radix-ui/react-toggle-group`, `@radix-ui/react-tooltip`, `react`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `recharts`, `sonner`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss`, `@tailwindcss/vite`, `@tanstack/react-query`, `@tanstack/react-router`, `@tanstack/react-start`, `@tanstack/router-plugin`, `tw-animate-css`, `vite-tsconfig-paths`, `xlsx`, `zod`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **What connects `QuoteForLines`, `Props`, `DocumentClient` to the rest of the system?**
  _397 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devis.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12380952380952381 - nodes in this community are weakly interconnected._
- **Should `portail.$id.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06433566433566433 - nodes in this community are weakly interconnected._
- **Should `cn` be split into smaller, more focused modules?**
  _Cohesion score 0.0700354609929078 - nodes in this community are weakly interconnected._