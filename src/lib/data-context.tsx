import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { toast } from "sonner";
import {
  quotes as initialQuotes,
  invoices as initialInvoices,
  products as initialProducts,
  Bi,
  InvoiceStatus,
  type Product as DemoProduct,
} from "./demo-data";
import { getDocumentActivityDate, type PaymentMethod } from "./document-workflow";
import { createShowcaseData, SHOWCASE_DATA_VERSION } from "./showcase-data";
import { supabase, getMyOrgId } from "./supabase";

// ─── Helpers Supabase sync ────────────────────────────────────────────────────

function quoteStatusToDb(fr: string): string {
  const map: Record<string, string> = {
    "Brouillon": "draft",
    "Envoyé": "sent",
    "Signé": "accepted",
    "Refusé": "rejected",
    // "Facturé" et "Payé" : le devis est accepté et a progressé → on les distingue
    // via le champ payload (objet Quote complet) ; la colonne status reste "accepted"
    // pour la conformité schema Supabase, mais le statut précis est dans payload.status.fr
    "Facturé": "accepted",
    "Clôturé": "expired",
    "Payé": "accepted",
  };
  return map[fr] ?? "draft";
}

function invoiceStatusToDb(s: string): string {
  const map: Record<string, string> = { draft: "draft", sent: "sent", paid: "paid", late: "overdue" };
  return map[s] ?? "draft";
}

async function upsertQuote(quote: Quote, orgId: string) {
  await supabase.from("quotes").upsert({
    organization_id: orgId,
    number: quote.number,
    client_name: quote.client,
    status: quoteStatusToDb(quote.status.fr) as "draft" | "sent" | "accepted" | "rejected" | "expired",
    issue_date: quote.date,
    validity_date: (quote as Quote & { validityDate?: string }).validityDate ?? null,
    total_ht: quote.details?.totalHT ?? (quote.amount / 1.2),
    total_vat: quote.details ? (quote.details.totalTTC - quote.details.totalHT) : (quote.amount - quote.amount / 1.2),
    total_ttc: quote.details?.totalTTC ?? quote.amount,
    payload: quote,
  }, { onConflict: "organization_id,number" });
}

async function upsertInvoice(invoice: Invoice, orgId: string) {
  await supabase.from("invoices").upsert({
    organization_id: orgId,
    number: invoice.number,
    client_name: invoice.client,
    status: invoiceStatusToDb(invoice.status) as "draft" | "sent" | "paid" | "partially_paid" | "overdue" | "canceled",
    issue_date: invoice.date,
    due_date: invoice.due ?? null,
    total_ht: invoice.totalHT ?? (invoice.amount / 1.2),
    total_vat: invoice.totalVAT ?? (invoice.amount - invoice.amount / 1.2),
    total_ttc: invoice.amount,
    amount_paid: invoice.paidAmount ?? 0,
    payload: invoice,
  }, { onConflict: "organization_id,number" });
}

async function upsertClient(client: Client, orgId: string) {
  await supabase.from("clients").upsert({
    id: client.id,
    organization_id: orgId,
    is_company: client.type === "pro",
    company_name: client.companyName ?? client.name,
    first_name: client.firstName ?? null,
    last_name: client.lastName ?? null,
    siret: client.siret ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    payload: client,
  }, { onConflict: "id" });
}

async function deleteQuoteFromDb(number: string, orgId: string) {
  await supabase.from("quotes").delete().eq("organization_id", orgId).eq("number", number);
}

async function loadOrgData(orgId: string): Promise<{ quotes: Quote[]; invoices: Invoice[]; clients: Client[] } | null> {
  const [qRes, iRes, cRes] = await Promise.all([
    supabase.from("quotes").select("payload").eq("organization_id", orgId).order("created_at", { ascending: false }),
    supabase.from("invoices").select("payload").eq("organization_id", orgId).order("created_at", { ascending: false }),
    supabase.from("clients").select("payload").eq("organization_id", orgId).order("created_at", { ascending: false }),
  ]);
  if (qRes.error || iRes.error || cRes.error) return null;
  const quotes = (qRes.data ?? []).map((r) => r.payload as Quote).filter(Boolean);
  const invoices = (iRes.data ?? []).map((r) => r.payload as Invoice).filter(Boolean);
  const clients = (cRes.data ?? []).map((r) => r.payload as Client).filter(Boolean);
  return { quotes, invoices, clients };
}

export type Product = DemoProduct;

export type CompanySettings = {
  // Identité
  name: string;
  legalForm: string; // SAS, SARL, EI, Auto-entrepreneur…
  siret: string;
  vatNumber: string; // numéro TVA intracommunautaire
  capital?: string;
  rcs?: string;
  // Coordonnées
  address: string;
  postalCode: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  // Logo (base64 data URL)
  logoBase64?: string;
  // Documents
  quotePrefix: string; // ex: DV
  invoicePrefix: string; // ex: FA
  nextQuoteNumber: number;
  nextInvoiceNumber: number;
  paymentTermsDays: number; // 30 ou 45
  lateInterestRate: string; // ex: "10.5"
  recoveryFee: string; // indemnité forfaitaire de recouvrement (40€ légal)
  footerNote: string; // mentions légales pied de page
  bankName?: string;
  iban?: string;
  bic?: string;
  defaultQuoteTemplate?: "classic" | "modern" | "minimal" | "elegant" | "bold";
  defaultInvoiceTemplate?: "classic" | "modern" | "minimal" | "elegant" | "bold";
  defaultEmailTemplate?: "modele-1" | "modele-2" | "modele-3" | "modele-4" | "modele-5";
  enableSituations?: boolean;
  primaryColor?: string;
};

const defaultCompanySettings: CompanySettings = {
  name: "",
  legalForm: "EI",
  siret: "",
  vatNumber: "",
  capital: "",
  rcs: "",
  address: "",
  postalCode: "",
  city: "",
  country: "France",
  phone: "",
  email: "",
  website: "",
  quotePrefix: "DV",
  invoicePrefix: "FA",
  nextQuoteNumber: 1,
  nextInvoiceNumber: 1,
  paymentTermsDays: 30,
  lateInterestRate: "10.5",
  recoveryFee: "40",
  footerNote: "",
  bankName: "",
  iban: "",
  bic: "",
  defaultQuoteTemplate: "classic",
  defaultInvoiceTemplate: "classic",
  defaultEmailTemplate: "modele-1",
  primaryColor: "#0f172a",
};

export type ClientType = "pro" | "particulier";

export type Client = {
  id: string;
  type: ClientType;
  // Identité
  name: string; // Raison sociale ou "Prénom Nom"
  firstName?: string;
  lastName?: string;
  companyName?: string;
  siret?: string;
  vatNumber?: string;
  // Contact
  email: string;
  phone?: string;
  website?: string;
  // Adresse
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  // Notes
  notes?: string;
  // Meta
  createdAt: string;
};

export type QuoteItem = {
  id: string;
  productId?: string;
  label: string;
  priceHT: number | string;
  qty: number | string;
};

export type QuoteDetails = {
  clientType: ClientType;
  lastName: string;
  firstName: string;
  companyName?: string;
  siret?: string;
  address: string;
  phone: string;
  serviceAddress: string;
  items: QuoteItem[];
  upsells: QuoteItem[];
  vatRate: number;
  totalHT: number;
  totalTTC: number;
};

/** Trace d'un email envoyé (devis, facture, relance…) */
export type EmailSend = {
  date: string;        // ISO
  to: string;          // destinataire
  label: string;       // "Envoi initial", "Relance J+7", "Renvoi", etc.
};

export type Quote = {
  number: string;
  client: string;
  clientId?: string;
  clientEmail?: string;
  amount: number;
  status: Bi;
  date: string;
  /** Date/heure à laquelle le devis a été transmis au client. */
  sentAt?: string;
  signedAt?: string;
  refusedAt?: string;
  closedAt?: string;
  signatureData?: {
    signerName: string;
    signedAt: string;
    consent: boolean;
    image?: string;
  };
  details?: QuoteDetails;
  invoicedLineIds?: string[];
  /** Historique complet de tous les emails envoyés */
  emailsSent?: EmailSend[];
};

export type Invoice = {
  number: string;
  client: string;
  clientId?: string;
  date: string;
  /** Date/heure à laquelle la facture a été envoyée au client. */
  sentAt?: string;
  paidAt?: string;
  lastPaymentAt?: string;
  paidAmount?: number;
  paymentMethod?: PaymentMethod;
  due: string;
  amount: number;
  totalHT?: number;
  totalVAT?: number;
  status: InvoiceStatus;
  sourceQuoteNumber?: string;
  sourceSubscriptionId?: string;
  items?: import("./invoice-from-quote").InvoiceLine[];
  reminders?: { date: string; type: "J+7" | "J+15" | "J+30" }[];
  /** Historique complet de tous les emails envoyés */
  emailsSent?: EmailSend[];
  clientEmail?: string;
};

/** Les listes de documents sont toujours rangées par dernière activité :
 * création tant qu'il n'est pas envoyé, puis date d'envoi. */
function sortDocumentsByActivity<T extends { date: string; sentAt?: string; paidAt?: string }>(documents: T[]): T[] {
  return [...documents].sort((a, b) => {
    const aActivity = new Date(getDocumentActivityDate(a)).getTime();
    const bActivity = new Date(getDocumentActivityDate(b)).getTime();
    if (bActivity !== aActivity) return bActivity - aActivity;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export type Upsell = {
  id: string;
  fr: string;
  en: string;
  price: number;
};

const initialUpsells: Upsell[] = [];

// ── Dépenses (Achats) ──────────────────────────────────────────────────────────

export type ExpenseCategory = "software" | "hardware" | "travel" | "subcontractor" | "office" | "other";

export type Expense = {
  id: string;
  date: string;       // YYYY-MM-DD
  description: string;
  vendor: string;
  quantity: number;
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  category: ExpenseCategory;
  receiptName?: string;
  receiptData?: string;
  createdAt: string;
};

// ── Abonnements (Factures Récurrentes) ────────────────────────────────────────

export type SubscriptionInterval = "monthly" | "quarterly" | "yearly";

export type Subscription = {
  id: string;
  client: string;
  title: string;
  amountHT: number;
  vatRate: number;
  interval: SubscriptionInterval;
  nextBillingDate: string; // YYYY-MM-DD
  status: "active" | "paused";
  createdAt: string;
};

// ── Situations de travaux (BTP) ───────────────────────────────────────────────

export type MarcheStatus = "actif" | "solde" | "arrete";

export type Marche = {
  id: string;
  number: string;            // MC-YYYY-NNN
  client: string;
  title: string;             // Intitulé du marché
  totalHT: number;           // Montant global HT du marché
  vatRate: number;           // TVA applicable : 20, 10, 5.5, 0
  retenuGarantie: number;    // % retenue de garantie (typiquement 5)
  startDate: string;         // YYYY-MM-DD
  endDate?: string;
  status: MarcheStatus;
  notes?: string;
  createdAt: string;
};

export type SituationStatus = "brouillon" | "envoyee" | "payee";

export type Situation = {
  id: string;
  marcheId: string;
  number: number;              // Numéro séquentiel (1, 2, 3…)
  label: string;               // "Situation 1", "Solde", etc.
  date: string;                // YYYY-MM-DD
  avancementCumule: number;    // % cumulé à l'issue de cette situation
  avancementSituation: number; // Delta % (cette situation uniquement)
  montantHT: number;           // Montant HT de la situation (delta)
  retenueGarantie: number;     // € retenus (RG)
  vatAmount: number;           // TVA
  montantTTC: number;          // TTC avant RG
  netAPayer: number;           // TTC - RG
  status: SituationStatus;
  invoiceNumber?: string;      // N° facture liée (une fois générée)
};

// ── Données de démo ───────────────────────────────────────────────────────────

const initialMarches: Marche[] = [
  {
    id: "mc-001",
    number: "MC-2026-001",
    client: "Maison Dupont",
    title: "Rénovation complète salle de bain + WC",
    totalHT: 42000,
    vatRate: 10,
    retenuGarantie: 5,
    startDate: "2026-03-01",
    status: "actif",
    createdAt: "2026-03-01",
  },
  {
    id: "mc-002",
    number: "MC-2026-002",
    client: "Résidence Les Pins",
    title: "Électricité générale — mise aux normes C15-100",
    totalHT: 28500,
    vatRate: 20,
    retenuGarantie: 5,
    startDate: "2026-04-15",
    status: "actif",
    createdAt: "2026-04-15",
  },
  {
    id: "mc-003",
    number: "MC-2026-003",
    client: "Appartement Lehmann",
    title: "Isolation thermique par l'extérieur (ITE)",
    totalHT: 15200,
    vatRate: 5.5,
    retenuGarantie: 5,
    startDate: "2026-01-10",
    endDate: "2026-05-30",
    status: "solde",
    createdAt: "2026-01-10",
  },
];

// Helpers de calcul
function calcSituation(
  marche: Marche,
  avancementCumule: number,
  prevCumule: number,
): Pick<Situation, "avancementSituation" | "montantHT" | "retenueGarantie" | "vatAmount" | "montantTTC" | "netAPayer"> {
  const avancementSituation = avancementCumule - prevCumule;
  const montantHT = (avancementSituation / 100) * marche.totalHT;
  const retenueGarantie = montantHT * (marche.retenuGarantie / 100);
  const vatAmount = montantHT * (marche.vatRate / 100);
  const montantTTC = montantHT + vatAmount;
  const netAPayer = montantTTC - retenueGarantie;
  return { avancementSituation, montantHT, retenueGarantie, vatAmount, montantTTC, netAPayer };
}

const sit1mc1 = calcSituation(initialMarches[0]!, 30, 0);
const sit2mc1 = calcSituation(initialMarches[0]!, 70, 30);
const sit1mc2 = calcSituation(initialMarches[1]!, 30, 0);
const sit1mc3 = calcSituation(initialMarches[2]!, 40, 0);
const sit2mc3 = calcSituation(initialMarches[2]!, 75, 40);
const sit3mc3 = calcSituation(initialMarches[2]!, 100, 75);

const initialSituations: Situation[] = [
  // MC-2026-001 — Maison Dupont
  {
    id: "sit-001", marcheId: "mc-001", number: 1, label: "Situation n°1",
    date: "2026-04-01", avancementCumule: 30, ...sit1mc1,
    status: "payee", invoiceNumber: "FA-2026-0012",
  },
  {
    id: "sit-002", marcheId: "mc-001", number: 2, label: "Situation n°2",
    date: "2026-06-15", avancementCumule: 70, ...sit2mc1,
    status: "envoyee",
  },
  // MC-2026-002 — Résidence Les Pins
  {
    id: "sit-003", marcheId: "mc-002", number: 1, label: "Situation n°1",
    date: "2026-05-20", avancementCumule: 30, ...sit1mc2,
    status: "payee", invoiceNumber: "FA-2026-0014",
  },
  // MC-2026-003 — Appartement Lehmann (soldé)
  {
    id: "sit-004", marcheId: "mc-003", number: 1, label: "Situation n°1",
    date: "2026-02-10", avancementCumule: 40, ...sit1mc3,
    status: "payee", invoiceNumber: "FA-2026-0007",
  },
  {
    id: "sit-005", marcheId: "mc-003", number: 2, label: "Situation n°2",
    date: "2026-04-05", avancementCumule: 75, ...sit2mc3,
    status: "payee", invoiceNumber: "FA-2026-0009",
  },
  {
    id: "sit-006", marcheId: "mc-003", number: 3, label: "Situation de solde",
    date: "2026-05-28", avancementCumule: 100, ...sit3mc3,
    status: "payee", invoiceNumber: "FA-2026-0011",
  },
];

export type DataContextType = {
  quotes: Quote[];
  addQuote: (quote: Quote) => void;
  updateQuote: (number: string, updated: Quote) => void;
  deleteQuote: (number: string) => void;
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (number: string, invoice: Invoice) => void;
  upsells: Upsell[];
  addUpsell: (u: Upsell) => void;
  products: Product[];
  addProduct: (p: Product) => void;
  updateProduct: (id: string, p: Product) => void;
  deleteProduct: (id: string) => void;
  company: CompanySettings;
  updateCompany: (settings: Partial<CompanySettings>) => void;
  clients: Client[];
  addClient: (c: Client) => void;
  updateClient: (id: string, c: Client) => void;
  deleteClient: (id: string) => void;
  // Situations de travaux BTP
  marches: Marche[];
  addMarche: (m: Omit<Marche, "id" | "createdAt">) => void;
  updateMarche: (id: string, partial: Partial<Marche>) => void;
  deleteMarche: (id: string) => void;

  situations: Situation[];
  addSituation: (s: Omit<Situation, "id">) => void;
  updateSituation: (id: string, partial: Partial<Situation>) => void;
  deleteSituation: (id: string) => void;
  
  expenses: Expense[];
  addExpense: (e: Omit<Expense, "id" | "createdAt">) => void;
  updateExpense: (id: string, partial: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  subscriptions: Subscription[];
  addSubscription: (s: Omit<Subscription, "id" | "createdAt">) => void;
  updateSubscription: (id: string, partial: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

const repairServiceProduct: Product = {
  id: "p-depannage-reparation",
  ref: "REP-001",
  label: { fr: "Dépannage & réparation — intervention standard", en: "Repair service — standard callout" },
  description: {
    fr: "Diagnostic sur place, recherche de panne et première heure de main-d'œuvre incluse.",
    en: "On-site diagnosis, fault finding and first labour hour included.",
  },
  category: "main-oeuvre",
  unit: "forfait",
  priceHT: 89,
  vatRate: 20,
  active: true,
  upsells: [
    { id: "rep-up-urgence", label: "Intervention urgente sous 2 heures", priceHT: 75 },
    { id: "rep-up-deplacement", label: "Déplacement hors zone (jusqu'à 30 km)", priceHT: 35 },
    { id: "rep-up-diagnostic", label: "Diagnostic approfondi avec compte rendu", priceHT: 45 },
    { id: "rep-up-heure", label: "Heure de main-d'œuvre supplémentaire", priceHT: 55 },
    { id: "rep-up-petites-pieces", label: "Forfait petites fournitures et consommables", priceHT: 29 },
    { id: "rep-up-pieces", label: "Fourniture de pièces de remplacement", priceHT: 90 },
    { id: "rep-up-soir", label: "Majoration intervention soir ou nuit", priceHT: 85 },
    { id: "rep-up-weekend", label: "Majoration week-end ou jour férié", priceHT: 110 },
    { id: "rep-up-remise-etat", label: "Remise en état et finitions après réparation", priceHT: 65 },
    { id: "rep-up-nettoyage", label: "Nettoyage complet de la zone d'intervention", priceHT: 25 },
    { id: "rep-up-photos", label: "Rapport photo avant / après", priceHT: 20 },
    { id: "rep-up-garantie", label: "Extension de garantie intervention 12 mois", priceHT: 49 },
    { id: "rep-up-entretien", label: "Visite préventive et contrôle général", priceHT: 79 },
    { id: "rep-up-enlevement", label: "Enlèvement et évacuation du matériel défectueux", priceHT: 40 },
  ],
};

// Jeu de démonstration réaliste : il montre le parcours complet sur plusieurs mois.
// Les données restent modifiables depuis l'application comme de vraies données.
const functionalDemoClients: Client[] = [
  { id: "cli-martin", type: "particulier", name: "Sophie Martin", firstName: "Sophie", lastName: "Martin", email: "sophie.martin@email.fr", phone: "06 12 45 78 90", address: "18 rue des Tilleuls", postalCode: "69003", city: "Lyon", country: "France", createdAt: "2026-03-04" },
  { id: "cli-durand", type: "particulier", name: "Julien Durand", firstName: "Julien", lastName: "Durand", email: "julien.durand@email.fr", phone: "06 28 31 42 58", address: "6 avenue du Parc", postalCode: "69007", city: "Lyon", country: "France", createdAt: "2026-04-08" },
  { id: "cli-cafe", type: "pro", name: "Café des Canuts", companyName: "Café des Canuts", siret: "90123456700018", email: "contact@cafedescanuts.fr", phone: "04 72 10 22 30", address: "3 place des Terreaux", postalCode: "69001", city: "Lyon", country: "France", createdAt: "2026-05-13" },
  { id: "cli-bertrand", type: "particulier", name: "Claire Bertrand", firstName: "Claire", lastName: "Bertrand", email: "claire.bertrand@email.fr", phone: "06 42 18 76 35", address: "40 rue de la République", postalCode: "69100", city: "Villeurbanne", country: "France", createdAt: "2026-06-02" },
  { id: "cli-leroy", type: "particulier", name: "Marc Leroy", firstName: "Marc", lastName: "Leroy", email: "marc.leroy@email.fr", phone: "06 71 08 33 44", address: "12 chemin des Vignes", postalCode: "69300", city: "Caluire-et-Cuire", country: "France", createdAt: "2026-07-16" },
];

const functionalDemoQuotes: Quote[] = [
  { number: "DV-2026-001", client: "Sophie Martin", amount: 2860, date: "2026-03-05", sentAt: "2026-03-07", status: { fr: "Payé", en: "Paid" } },
  { number: "DV-2026-002", client: "Julien Durand", amount: 5180, date: "2026-04-10", sentAt: "2026-04-12", status: { fr: "Facturé", en: "Invoiced" } },
  { number: "DV-2026-003", client: "Café des Canuts", amount: 3940, date: "2026-05-16", sentAt: "2026-05-18", status: { fr: "Facturé", en: "Invoiced" } },
  { number: "DV-2026-004", client: "Claire Bertrand", amount: 1760, date: "2026-06-05", status: { fr: "Facturé", en: "Invoiced" } },
  { number: "DV-2026-005", client: "Marc Leroy", amount: 2490, date: "2026-07-21", status: { fr: "Signé", en: "Signed" } },
  { number: "DV-2026-006", client: "Sophie Martin", amount: 1320, date: "2026-08-02", sentAt: "2026-08-03", status: { fr: "Envoyé", en: "Sent" } },
  { number: "DV-2026-007", client: "Café des Canuts", amount: 840, date: "2026-08-08", status: { fr: "Brouillon", en: "Draft" } },
  { number: "DV-2026-008", client: "Julien Durand", amount: 615, date: "2026-06-18", status: { fr: "Refusé", en: "Refused" } },
];

const functionalDemoInvoices: Invoice[] = [
  { number: "FA-2026-001", client: "Sophie Martin", date: "2026-03-21", sentAt: "2026-03-21", paidAt: "2026-04-14", paymentMethod: "virement", due: "2026-04-20", amount: 2860, status: "paid", sourceQuoteNumber: "DV-2026-001" },
  { number: "FA-2026-002", client: "Julien Durand", date: "2026-04-25", sentAt: "2026-04-26", due: "2026-05-25", amount: 5180, status: "late", sourceQuoteNumber: "DV-2026-002", reminders: [{ date: "2026-06-01T09:00:00.000Z", type: "J+7" }, { date: "2026-06-10T09:00:00.000Z", type: "J+15" }] },
  { number: "FA-2026-003", client: "Café des Canuts", date: "2026-05-30", sentAt: "2026-05-31", due: "2026-08-30", amount: 3940, status: "sent", sourceQuoteNumber: "DV-2026-003" },
  { number: "FA-2026-004", client: "Claire Bertrand", date: "2026-07-14", due: "2026-08-13", amount: 1760, status: "draft", sourceQuoteNumber: "DV-2026-004" },
];

const functionalDemoExpenses: Expense[] = [
  { id: "exp-001", date: "2026-03-12", vendor: "Point.P", description: "Carrelage et colle — chantier Martin", quantity: 1, amountHT: 640, vatAmount: 128, amountTTC: 768, category: "hardware", receiptName: "facture-pointp-mars.pdf", createdAt: "2026-03-12T10:30:00.000Z" },
  { id: "exp-002", date: "2026-04-18", vendor: "CEDEO", description: "Robinetterie thermostatique", quantity: 2, amountHT: 460, vatAmount: 92, amountTTC: 552, category: "hardware", receiptName: "facture-cedeo-avril.pdf", createdAt: "2026-04-18T14:00:00.000Z" },
  { id: "exp-003", date: "2026-05-28", vendor: "Kiloutou", description: "Location perforateur et aspirateur", quantity: 3, amountHT: 156, vatAmount: 31.2, amountTTC: 187.2, category: "hardware", receiptName: "location-kiloutou-mai.pdf", createdAt: "2026-05-28T16:20:00.000Z" },
  { id: "exp-004", date: "2026-06-22", vendor: "TotalEnergies", description: "Déplacements chantiers Lyon", quantity: 1, amountHT: 118, vatAmount: 23.6, amountTTC: 141.6, category: "travel", createdAt: "2026-06-22T18:10:00.000Z" },
  { id: "exp-005", date: "2026-07-09", vendor: "ManoMano Pro", description: "Outillage électroportatif", quantity: 1, amountHT: 329, vatAmount: 65.8, amountTTC: 394.8, category: "hardware", receiptName: "outillage-juillet.pdf", createdAt: "2026-07-09T11:15:00.000Z" },
  { id: "exp-006", date: "2026-08-04", vendor: "Sonepar", description: "Câbles et consommables électriques", quantity: 1, amountHT: 212, vatAmount: 42.4, amountTTC: 254.4, category: "hardware", receiptName: "sonepar-aout.pdf", createdAt: "2026-08-04T09:40:00.000Z" },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [company, setCompany] = useState<CompanySettings>(defaultCompanySettings);
  const [loaded, setLoaded] = useState(false);

  const [clients, setClients] = useState<Client[]>([]);
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [marches, setMarches] = useState<Marche[]>(initialMarches);
  const [situations, setSituations] = useState<Situation[]>(initialSituations);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  // Organisation Supabase de l'utilisateur connecté
  const orgIdRef = useRef<string | null>(null);

  // Charger depuis le localStorage au montage (puis enrichir depuis Supabase)
  useEffect(() => {
    // Nettoyer toutes les anciennes clés de données de démo
    const demoKeys = [
      "invoicepro_showcase_reset_v1",
      "invoicepro_showcase_reset_v2",
      "invoicepro_showcase_reset_v3",
      `invoicepro_showcase_reset_${SHOWCASE_DATA_VERSION}`,
    ];
    // Si Supabase est connecté, on ne charge JAMAIS de données locales non-vérifiées
    // → on démarre avec des tableaux vides et Supabase les remplacera
    // Si non connecté, on charge localStorage (vraies données utilisateur, pas démo)

    const storedQuotes = localStorage.getItem("invoicepro_quotes_v4");
    const storedInvoices = localStorage.getItem("invoicepro_invoices_v4");
    const storedProducts = localStorage.getItem("invoicepro_products") ?? localStorage.getItem("demo-products-v2");
    const storedSettings = localStorage.getItem("invoicepro_company_v1");
    const storedClients = localStorage.getItem("invoicepro_clients");
    const storedUpsells = localStorage.getItem("invoicepro_upsells");
    const storedMarches = localStorage.getItem("invoicepro_marches");
    const storedSituations = localStorage.getItem("invoicepro_situations");
    const storedExpenses = localStorage.getItem("invoicepro_expenses");
    const storedSubscriptions = localStorage.getItem("invoicepro_subscriptions");

    // Démarrage avec données vides — Supabase les remplacera dès que connecté
    // On ne charge localStorage que si ce sont de vraies données (pas de démo injectée)
    {
      const parsedQuotes = storedQuotes ? JSON.parse(storedQuotes) as Quote[] : [];
      setQuotes(sortDocumentsByActivity(parsedQuotes));
    }
    {
      const parsedInvoices = storedInvoices ? JSON.parse(storedInvoices) as Invoice[] : [];
      setInvoices(sortDocumentsByActivity(parsedInvoices));
    }
    const existingProducts: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
    const productsWithRepair = existingProducts.some((product) => product.id === repairServiceProduct.id)
      ? existingProducts
      : [...existingProducts, repairServiceProduct];
    setProducts(productsWithRepair);
    localStorage.setItem("invoicepro_products", JSON.stringify(productsWithRepair));
    if (storedSettings) setCompany(JSON.parse(storedSettings));
    setClients(storedClients ? JSON.parse(storedClients) : []);
    if (storedUpsells) setUpsells(JSON.parse(storedUpsells));
    if (storedMarches) setMarches(JSON.parse(storedMarches));
    if (storedSituations) setSituations(JSON.parse(storedSituations));
    setExpenses(storedExpenses ? JSON.parse(storedExpenses) : []);
    if (storedSubscriptions) setSubscriptions(JSON.parse(storedSubscriptions));
    setLoaded(true);

    // Tentative de chargement depuis Supabase (si connecté)
    getMyOrgId().then(async (orgId) => {
      if (!orgId) return;
      orgIdRef.current = orgId;
      // Utilisateur connecté → vider immédiatement les données locales (démo ou cache)
      // pour éviter l'affichage de fausses données pendant le chargement Supabase
      setQuotes([]);
      setInvoices([]);
      setClients([]);
      const remote = await loadOrgData(orgId);
      if (!remote) return;
      // Si Supabase a des données → elles ont la priorité (données réelles vs demo)
      // Si 0 données → nouvel utilisateur authentifié → on efface la démo locale
      // Utilisateur connecté → toujours utiliser Supabase comme source de vérité
      // On écrase systématiquement le localStorage (y compris l'éventuelle démo)
      const realQuotes = remote.quotes;
      setQuotes(sortDocumentsByActivity(realQuotes));
      localStorage.setItem("invoicepro_quotes_v4", JSON.stringify(realQuotes));

      const realInvoices = remote.invoices;
      setInvoices(sortDocumentsByActivity(realInvoices));
      localStorage.setItem("invoicepro_invoices_v4", JSON.stringify(realInvoices));

      const realClients = remote.clients;
      setClients(realClients);
      localStorage.setItem("invoicepro_clients", JSON.stringify(realClients));

      // Realtime subscription for instant signature updates
      supabase
        .channel("public:data")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "quotes",
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            supabase.from("quotes").select("payload").eq("organization_id", orgId).order("created_at", { ascending: false })
              .then(({ data }) => {
                if (data) {
                  const realQuotes = data.map((r) => r.payload as Quote).filter(Boolean);
                  setQuotes(sortDocumentsByActivity(realQuotes));
                }
              });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "invoices",
            filter: `organization_id=eq.${orgId}`,
          },
          () => {
            supabase.from("invoices").select("payload").eq("organization_id", orgId).order("created_at", { ascending: false })
              .then(({ data }) => {
                if (data) {
                  const realInvoices = data.map((r) => r.payload as Invoice).filter(Boolean);
                  setInvoices(sortDocumentsByActivity(realInvoices));
                }
              });
          }
        )
        .subscribe();

    }).catch(() => { /* silencieux si pas de connexion */ });
  }, []);

  // Check for status changes to trigger notifications
  const prevQuotesRef = useRef<Quote[]>([]);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // If not initialized, don't trigger notifications on initial load
    if (!isInitializedRef.current) {
      if (quotes.length > 0 || loaded) {
        isInitializedRef.current = true;
        prevQuotesRef.current = quotes;
      }
      return;
    }

    // After initialization, check if any quote changed to "Signé"
    quotes.forEach((q) => {
      const prev = prevQuotesRef.current.find((p) => p.number === q.number);
      if (prev && prev.status.fr !== "Signé" && q.status.fr === "Signé") {
        toast.success(`Le devis ${q.number} a été signé par ${q.client} ! 🎉`, {
          duration: 10000,
        });
        
        // System notification fallback if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Devis signé ! 🎉", {
            body: `Le client ${q.client} vient de signer le devis ${q.number}.`
          });
        }
      }
    });

    prevQuotesRef.current = quotes;
  }, [quotes, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_quotes_v4", JSON.stringify(quotes));
  }, [quotes, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_invoices_v4", JSON.stringify(invoices));
  }, [invoices, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_upsells", JSON.stringify(upsells));
  }, [upsells, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_products", JSON.stringify(products));
  }, [products, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_company_v1", JSON.stringify(company));
  }, [company, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_clients", JSON.stringify(clients));
  }, [clients, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_marches", JSON.stringify(marches));
  }, [marches, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_situations", JSON.stringify(situations));
  }, [situations, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_expenses", JSON.stringify(expenses));
  }, [expenses, loaded]);

  useEffect(() => {
    if (loaded) localStorage.setItem("invoicepro_subscriptions", JSON.stringify(subscriptions));
  }, [subscriptions, loaded]);

  // Generateur de factures pour les abonnements
  useEffect(() => {
    if (!loaded) return;
    let hasChanges = false;
    const today = new Date().toISOString().split("T")[0] ?? "";
    
    setSubscriptions(prev => {
      let updatedSubs = [...prev];
      const newInvoices = [...invoices];
      const num = company.nextInvoiceNumber || 1;
      let nextNumber = num;
      
      updatedSubs = updatedSubs.map(sub => {
        if (sub.status !== "active" || sub.nextBillingDate > today) return sub;

        let billingDate = sub.nextBillingDate;
        let generated = 0;
        while (billingDate <= today && generated < 60) {
          const alreadyGenerated = newInvoices.some(
            (invoice) => invoice.sourceSubscriptionId === sub.id && invoice.date === billingDate,
          );
          if (!alreadyGenerated) {
            const totalVAT = sub.amountHT * (sub.vatRate / 100);
            const due = new Date(`${billingDate}T12:00:00`);
            due.setDate(due.getDate() + (company.paymentTermsDays || 30));
            const billingYear = new Date(`${billingDate}T12:00:00`).getFullYear();
            newInvoices.unshift({
              number: `${company.invoicePrefix || "FA"}-${billingYear}-${String(nextNumber).padStart(4, "0")}`,
              client: sub.client,
              date: billingDate,
              due: due.toISOString().split("T")[0] ?? billingDate,
              amount: sub.amountHT + totalVAT,
              totalHT: sub.amountHT,
              totalVAT,
              status: "draft",
              sourceSubscriptionId: sub.id,
            });
            nextNumber++;
          }

          const nextDate = new Date(`${billingDate}T12:00:00`);
          if (sub.interval === "monthly") nextDate.setMonth(nextDate.getMonth() + 1);
          else if (sub.interval === "quarterly") nextDate.setMonth(nextDate.getMonth() + 3);
          else nextDate.setFullYear(nextDate.getFullYear() + 1);
          billingDate = nextDate.toISOString().split("T")[0] ?? today;
          generated++;
        }

        hasChanges = true;
        return { ...sub, nextBillingDate: billingDate };
      });
      
      if (hasChanges) {
        setInvoices(newInvoices);
        setCompany(prev => ({ ...prev, nextInvoiceNumber: nextNumber }));
        return updatedSubs;
      }
      return prev;
    });
  }, [company.invoicePrefix, company.nextInvoiceNumber, company.paymentTermsDays, invoices, loaded]);

  const addQuote = (quote: Quote) => {
    setQuotes((prev) => {
      if (prev.some((q) => q.number === quote.number)) return prev;
      return sortDocumentsByActivity([...prev, quote]);
    });
    if (orgIdRef.current) upsertQuote(quote, orgIdRef.current).catch(console.warn);
  };
  const updateQuote = (number: string, updated: Quote) => {
    setQuotes((prev) => sortDocumentsByActivity(prev.map((q) => (q.number === number ? updated : q))));
    if (orgIdRef.current) upsertQuote(updated, orgIdRef.current).catch(console.warn);
  };
  const deleteQuote = (number: string) => {
    setQuotes((prev) => prev.filter((quote) => quote.number !== number));
    if (orgIdRef.current) deleteQuoteFromDb(number, orgIdRef.current).catch(console.warn);
  };
  const addInvoice = (invoice: Invoice) => {
    setInvoices((prev) => {
      if (prev.some((inv) => inv.number === invoice.number)) return prev;
      return sortDocumentsByActivity([...prev, invoice]);
    });
    if (orgIdRef.current) upsertInvoice(invoice, orgIdRef.current).catch(console.warn);
  };
  const updateInvoice = (number: string, updated: Invoice) => {
    setInvoices((prev) => sortDocumentsByActivity(prev.map((inv) => (inv.number === number ? updated : inv))));
    if (orgIdRef.current) upsertInvoice(updated, orgIdRef.current).catch(console.warn);
  };
  const addUpsell = (upsell: Upsell) => {
    setUpsells((prev) => [...prev, upsell]);
  };

  const addProduct = (p: Product) => {
    setProducts((prev) => [...prev, p]);
  };

  const updateProduct = (id: string, updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const updateCompany = (settings: Partial<CompanySettings>) => {
    setCompany((prev) => ({ ...prev, ...settings }));
  };

  const addClient = (c: Client) => {
    setClients((prev) => [c, ...prev]);
    if (orgIdRef.current) upsertClient(c, orgIdRef.current).catch(console.warn);
  };
  const updateClient = (id: string, updated: Client) => {
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    if (orgIdRef.current) upsertClient(updated, orgIdRef.current).catch(console.warn);
  };
  const deleteClient = (id: string) =>
    setClients((prev) => prev.filter((c) => c.id !== id));

  // ── Marchés ────────────────────────────────────────────────────────────────
  const addMarche = (m: Omit<Marche, "id" | "createdAt">) => {
    const newMarche: Marche = { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setMarches((prev) => [newMarche, ...prev]);
  };
  const updateMarche = (id: string, partial: Partial<Marche>) =>
    setMarches((prev) => prev.map((m) => (m.id === id ? { ...m, ...partial } : m)));
  const deleteMarche = (id: string) =>
    setMarches((prev) => prev.filter((m) => m.id !== id));

  const addSituation = (s: Omit<Situation, "id">) => {
    const newSit: Situation = { ...s, id: crypto.randomUUID() };
    setSituations((prev) => [...prev, newSit]);
  };
  const updateSituation = (id: string, partial: Partial<Situation>) => {
    setSituations((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };
  const deleteSituation = (id: string) => {
    setSituations((prev) => prev.filter((s) => s.id !== id));
  };

  // Expenses
  const addExpense = (e: Omit<Expense, "id" | "createdAt">) => {
    const newExpense: Expense = {
      ...e,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
  };

  const updateExpense = (id: string, partial: Partial<Expense>) => {
    setExpenses((prev) => prev.map((exp) => (exp.id === id ? { ...exp, ...partial } : exp)));
  };

  const deleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== id));
  };

  // Subscriptions
  const addSubscription = (s: Omit<Subscription, "id" | "createdAt">) => {
    const newSub: Subscription = {
      ...s,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSubscriptions((prev) => [newSub, ...prev]);
  };

  const updateSubscription = (id: string, partial: Partial<Subscription>) => {
    setSubscriptions((prev) => prev.map((sub) => (sub.id === id ? { ...sub, ...partial } : sub)));
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
  };

  // Ne jamais bloquer le rendu du Provider : si les données ne sont pas encore
  // chargées (SSR ou premier tick client), on rend quand même le contexte avec
  // les valeurs en cours (vides par défaut) pour éviter "useData must be used
  // within a DataProvider".
  return (
    <DataContext.Provider
      value={{
        quotes,
        addQuote,
        updateQuote,
        deleteQuote,
        invoices,
        addInvoice,
        updateInvoice,
        upsells,
        addUpsell,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        company,
        updateCompany,
        clients,
        addClient,
        updateClient,
        deleteClient,
        marches,
        addMarche,
        updateMarche,
        deleteMarche,
        situations,
        addSituation,
        updateSituation,
        deleteSituation,
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
