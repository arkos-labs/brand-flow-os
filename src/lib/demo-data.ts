export type Bi = { fr: string; en: string };

export const kpis = {
  revenue: 48250,
  pending: 21400,
  overdue: 6300,
  mrr: 4180,
};

export const revenueSeries = [
  { month: { fr: "Mars", en: "Mar" }, invoiced: 32000, collected: 28500 },
  { month: { fr: "Avril", en: "Apr" }, invoiced: 41000, collected: 35200 },
  { month: { fr: "Mai", en: "May" }, invoiced: 37500, collected: 39100 },
  { month: { fr: "Juin", en: "Jun" }, invoiced: 52000, collected: 44300 },
  { month: { fr: "Juillet", en: "Jul" }, invoiced: 46800, collected: 48250 },
  { month: { fr: "Août", en: "Aug" }, invoiced: 51200, collected: 42900 },
];

export const activity: { at: Bi; label: Bi }[] = [
  {
    at: { fr: "il y a 12 min", en: "12 min ago" },
    label: {
      fr: "Devis DV-2026-084 signé par Atelier Nord",
      en: "Quote DV-2026-084 signed by Atelier Nord",
    },
  },
  {
    at: { fr: "il y a 1 h", en: "1 h ago" },
    label: {
      fr: "Paiement SEPA reçu — 4 800 € (Kaptix SAS)",
      en: "SEPA payment received — €4,800 (Kaptix SAS)",
    },
  },
  {
    at: { fr: "il y a 3 h", en: "3 h ago" },
    label: { fr: "Relance n°2 envoyée à Groupe Vela", en: "Second reminder sent to Groupe Vela" },
  },
  {
    at: { fr: "hier", en: "yesterday" },
    label: {
      fr: "Facture fournisseur lue par OCR — 312 €",
      en: "Supplier invoice read by OCR — €312",
    },
  },
];

export const tasks: { label: Bi; tone: "warn" | "info" }[] = [
  {
    label: { fr: "3 factures en retard de plus de 30 jours", en: "3 invoices over 30 days late" },
    tone: "warn",
  },
  {
    label: {
      fr: "18 h non facturées sur Refonte Kaptix",
      en: "18 unbilled hours on Kaptix redesign",
    },
    tone: "info",
  },
  {
    label: { fr: "2 dépenses à valider (> 500 €)", en: "2 expenses awaiting approval (> €500)" },
    tone: "info",
  },
];

export type Deal = {
  id: string;
  client: string;
  title: Bi;
  amount: number;
  probability: number;
  stage: "lead" | "qualified" | "quote" | "won";
};

export const deals: Deal[] = [
  {
    id: "d1",
    client: "Atelier Nord",
    title: { fr: "Identité de marque", en: "Brand identity" },
    amount: 8400,
    probability: 20,
    stage: "lead",
  },
  {
    id: "d2",
    client: "Loop Studio",
    title: { fr: "Audit SEO annuel", en: "Annual SEO audit" },
    amount: 3200,
    probability: 25,
    stage: "lead",
  },
  {
    id: "d3",
    client: "Kaptix SAS",
    title: { fr: "Refonte plateforme", en: "Platform redesign" },
    amount: 26500,
    probability: 55,
    stage: "qualified",
  },
  {
    id: "d4",
    client: "Groupe Vela",
    title: { fr: "Campagne lancement", en: "Launch campaign" },
    amount: 14900,
    probability: 45,
    stage: "qualified",
  },
  {
    id: "d5",
    client: "Norvik Retail",
    title: { fr: "App mobile V2", en: "Mobile app V2" },
    amount: 42000,
    probability: 70,
    stage: "quote",
  },
  {
    id: "d6",
    client: "Cabinet Serres",
    title: { fr: "Site vitrine", en: "Marketing site" },
    amount: 9600,
    probability: 65,
    stage: "quote",
  },
  {
    id: "d7",
    client: "Maison Ober",
    title: { fr: "Retainer design", en: "Design retainer" },
    amount: 18000,
    probability: 100,
    stage: "won",
  },
];

export const quotes: {
  number: string;
  client: string;
  amount: number;
  status: Bi;
  date: string;
}[] = [];

export type InvoiceStatus = "paid" | "sent" | "late" | "draft";

export const initialInvoices: Array<{
  number: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
  reminders?: { date: string; type: "J+7" | "J+15" | "J+30" }[];
}> = [
  {
    number: "FA-2026-008",
    client: "Groupe Vela",
    date: "2026-06-15",
    due: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? "", // 10 days late
    amount: 6300,
    status: "late",
    reminders: [],
  },
  {
    number: "FA-2026-005",
    client: "Loop Studio",
    date: "2026-05-10",
    due: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? "", // 20 days late
    amount: 3840,
    status: "late",
    reminders: [{ date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), type: "J+7" }],
  },
  {
    number: "FA-2026-002",
    client: "Maison Ober",
    date: "2026-03-20",
    due: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] ?? "", // 40 days late
    amount: 5400,
    status: "late",
    reminders: [
      { date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(), type: "J+7" },
      { date: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000).toISOString(), type: "J+15" }
    ],
  }
];

export const invoices: {
  number: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
  reminders?: { date: string; type: "J+7" | "J+15" | "J+30" }[];
}[] = [];

export const cashflow = [
  {
    month: { fr: "Août", en: "Aug" },
    actual: 38200,
    forecast: 38200,
    inflow: 21400,
    outflow: 12800,
  },
  {
    month: { fr: "Sept.", en: "Sep" },
    actual: null,
    forecast: 46800,
    inflow: 24300,
    outflow: 13100,
  },
  {
    month: { fr: "Oct.", en: "Oct" },
    actual: null,
    forecast: 51200,
    inflow: 19800,
    outflow: 13100,
  },
  {
    month: { fr: "Nov.", en: "Nov" },
    actual: null,
    forecast: 47600,
    inflow: 16400,
    outflow: 14900,
  },
  {
    month: { fr: "Déc.", en: "Dec" },
    actual: null,
    forecast: 58900,
    inflow: 28700,
    outflow: 14200,
  },
  {
    month: { fr: "Janv.", en: "Jan" },
    actual: null,
    forecast: 63400,
    inflow: 22100,
    outflow: 14200,
  },
];

export const riskyReceivables = [
  { client: "Groupe Vela", amount: 6300, days: 47, probability: 55 },
  { client: "Loop Studio", amount: 3840, days: 12, probability: 82 },
  { client: "Maison Ober", amount: 5400, days: 4, probability: 94 },
];

export const projects: never[] = [];

// ─── Catalogue de prestations ───────────────────────────────────────────────

export type ProductUnit = "h" | "j" | "forfait" | "m2" | "ml" | "unite" | "km";
export type ProductCategory =
  "main-oeuvre" | "materiaux" | "deplacement" | "sous-traitance" | "equipement" | "autre";
export type VatRate = 0 | 5.5 | 10 | 20;
export type Upsell = {
  id: string;
  label: string;
  priceHT: number | string;
};

export type Product = {
  id: string;
  ref: string;
  label: { fr: string; en: string };
  description: { fr: string; en: string };
  category: ProductCategory;
  unit: ProductUnit;
  priceHT: number | string;
  vatRate: VatRate;
  active: boolean;
  upsells?: Upsell[];
};

export const UNIT_LABELS: Record<ProductUnit, { fr: string; en: string }> = {
  h: { fr: "Heure", en: "Hour" },
  j: { fr: "Jour", en: "Day" },
  forfait: { fr: "Forfait", en: "Fixed fee" },
  m2: { fr: "m²", en: "m²" },
  ml: { fr: "ml", en: "ml" },
  unite: { fr: "Unité", en: "Unit" },
  km: { fr: "km", en: "km" },
};

export const CATEGORY_LABELS: Record<ProductCategory, Bi> = {
  "main-oeuvre": { fr: "Main d'œuvre", en: "Labour" },
  materiaux: { fr: "Matériaux", en: "Materials" },
  deplacement: { fr: "Déplacement", en: "Travel" },
  "sous-traitance": { fr: "Sous-traitance", en: "Subcontracting" },
  equipement: { fr: "Équipement", en: "Equipment" },
  autre: { fr: "Autre", en: "Other" },
};

export const products: Product[] = [
  {
    id: "p-net-int",
    ref: "NET-INT",
    label: { fr: "Nettoyage Intérieur Complet", en: "Full Interior Cleaning" },
    description: {
      fr: "Aspiration complète, nettoyage plastiques, vitres intérieures, coffre",
      en: "Full vacuum, plastics cleaning, interior windows, trunk",
    },
    category: "main-oeuvre",
    unit: "forfait",
    priceHT: 50,
    vatRate: 20,
    active: true,
    upsells: [
      { id: "up-int-1", label: "Shampoing des sièges (tissus)", priceHT: 40 },
      { id: "up-int-2", label: "Nettoyage et soin cuir", priceHT: 55 },
      { id: "up-int-3", label: "Traitement anti-odeur / purificateur habitacle", priceHT: 25 },
      { id: "up-int-4", label: "Nettoyage des moquettes en profondeur", priceHT: 35 },
    ],
  },
  {
    id: "p-net-ext",
    ref: "NET-EXT",
    label: { fr: "Nettoyage Extérieur Premium", en: "Premium Exterior Cleaning" },
    description: {
      fr: "Lavage carrosserie à la main, nettoyage jantes, vitres, brillant pneu",
      en: "Hand car wash, rim cleaning, windows, tire shine",
    },
    category: "main-oeuvre",
    unit: "forfait",
    priceHT: 45,
    vatRate: 20,
    active: true,
    upsells: [
      { id: "up-ext-1", label: "Application cire de brillance longue durée", priceHT: 20 },
      { id: "up-ext-2", label: "Dégoudronnage complet carrosserie", priceHT: 30 },
      { id: "up-ext-3", label: "Lustrage machine (1 passe de correction)", priceHT: 80 },
    ],
  },
  {
    id: "p-net-comp",
    ref: "NET-COMP",
    label: { fr: "Nettoyage Intégral VIP", en: "VIP Full Detail" },
    description: {
      fr: "Formule complète Intérieur + Extérieur avec finitions au détail",
      en: "Complete package Interior + Exterior with meticulous detailing",
    },
    category: "main-oeuvre",
    unit: "forfait",
    priceHT: 90,
    vatRate: 20,
    active: true,
    upsells: [
      { id: "up-comp-1", label: "Traitement céramique (protection 12 mois)", priceHT: 150 },
      { id: "up-comp-2", label: "Rénovation optiques de phare (la paire)", priceHT: 60 },
      { id: "up-comp-3", label: "Nettoyage compartiment moteur", priceHT: 45 },
    ],
  },
];
