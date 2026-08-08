import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  quotes as initialQuotes,
  invoices as initialInvoices,
  products as initialProducts,
  Bi,
  InvoiceStatus,
  Product,
} from "./demo-data";

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
  logoBase64: undefined,
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
  defaultEmailTemplate: "template1",
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

export type Quote = {
  number: string;
  client: string;
  amount: number;
  status: Bi;
  date: string;
  details?: QuoteDetails;
};

export type Invoice = {
  number: string;
  client: string;
  date: string;
  due: string;
  amount: number;
  status: InvoiceStatus;
  reminders?: { date: string; type: "J+7" | "J+15" | "J+30" }[];
};

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
  amountHT: number;
  vatAmount: number;
  amountTTC: number;
  category: ExpenseCategory;
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

const sit1mc1 = calcSituation(initialMarches[0], 30, 0);
const sit2mc1 = calcSituation(initialMarches[0], 70, 30);
const sit1mc2 = calcSituation(initialMarches[1], 30, 0);
const sit1mc3 = calcSituation(initialMarches[2], 40, 0);
const sit2mc3 = calcSituation(initialMarches[2], 75, 40);
const sit3mc3 = calcSituation(initialMarches[2], 100, 75);

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

  // Charger depuis le localStorage au montage
  useEffect(() => {
    const storedQuotes = localStorage.getItem("invoicepro_quotes_v4");
    const storedInvoices = localStorage.getItem("invoicepro_invoices_v4");
    const storedProducts = localStorage.getItem("invoicepro_products");
    const storedSettings = localStorage.getItem("invoicepro_company_v1");
    const storedClients = localStorage.getItem("invoicepro_clients");
    const storedUpsells = localStorage.getItem("invoicepro_upsells");
    const storedMarches = localStorage.getItem("invoicepro_marches");
    const storedSituations = localStorage.getItem("invoicepro_situations");
    const storedExpenses = localStorage.getItem("invoicepro_expenses");
    const storedSubscriptions = localStorage.getItem("invoicepro_subscriptions");
    
    if (storedQuotes) setQuotes(JSON.parse(storedQuotes));
    if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
    if (storedProducts) setProducts(JSON.parse(storedProducts));
    if (storedSettings) setCompany(JSON.parse(storedSettings));
    if (storedClients) setClients(JSON.parse(storedClients));
    if (storedUpsells) setUpsells(JSON.parse(storedUpsells));
    if (storedMarches) setMarches(JSON.parse(storedMarches));
    if (storedSituations) setSituations(JSON.parse(storedSituations));
    if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
    if (storedSubscriptions) setSubscriptions(JSON.parse(storedSubscriptions));
    setLoaded(true);
  }, []);

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
    if (loaded) localStorage.setItem("demo-products-v2", JSON.stringify(products));
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
      let newInvoices = [...invoices];
      let num = company.nextInvoiceNumber || 1;
      let nextNumber = num;
      
      updatedSubs = updatedSubs.map(sub => {
        if (sub.status === "active" && sub.nextBillingDate <= today) {
          const tva = sub.amountHT * (sub.vatRate / 100);
          const amountTTC = sub.amountHT + tva;
          
          const newInv: Invoice = {
            number: `${company.invoicePrefix || "FA"}-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`,
            client: sub.client,
            date: today,
            due: today,
            amount: amountTTC,
            status: "draft",
          };
          newInvoices.unshift(newInv);
          nextNumber++;
          
          const d = new Date(sub.nextBillingDate);
          if (sub.interval === "monthly") d.setMonth(d.getMonth() + 1);
          else if (sub.interval === "quarterly") d.setMonth(d.getMonth() + 3);
          else if (sub.interval === "yearly") d.setFullYear(d.getFullYear() + 1);
          
          hasChanges = true;
          return { ...sub, nextBillingDate: d.toISOString().split("T")[0] ?? "" };
        }
        return sub;
      });
      
      if (hasChanges) {
        setInvoices(newInvoices);
        setCompany(prev => ({ ...prev, nextInvoiceNumber: nextNumber }));
        return updatedSubs;
      }
      return prev;
    });
  }, [loaded]); // Run once when loaded

  const addQuote = (quote: Quote) => setQuotes((prev) => [quote, ...prev]);
  const updateQuote = (number: string, updated: Quote) => {
    setQuotes((prev) => prev.map((q) => (q.number === number ? updated : q)));
  };
  const addInvoice = (invoice: Invoice) => setInvoices((prev) => [invoice, ...prev]);
  const updateInvoice = (number: string, updated: Invoice) => {
    setInvoices((prev) => prev.map((inv) => (inv.number === number ? updated : inv)));
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

  const addClient = (c: Client) => setClients((prev) => [c, ...prev]);
  const updateClient = (id: string, updated: Client) =>
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
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

  if (!loaded) {
    return null; // or a loader
  }

  return (
    <DataContext.Provider
      value={{
        quotes,
        addQuote,
        updateQuote,
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
