/**
 * SupabaseDataProvider — remplace intégralement data-context.tsx (localStorage)
 *
 * API publique volontairement compatible avec useData() pour minimiser les
 * modifications dans les routes existantes.
 *
 * Toutes les entités sont chargées via Supabase avec realtime optionnel.
 * Les mutations sont atomiques : insert/update/delete + invalidation locale.
 */
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "./supabase";
import type {
  DbClient,
  DbQuote,
  DbQuoteItem,
  DbInvoice,
  DbInvoiceItem,
  DbPayment,
  DbReminder,
  DbReminderTemplate,
  DbCatalogItem,
  DbOrganization,
  DbProfile,
  QuoteStatus,
  InvoiceStatus,
  PaymentMethod,
  ReminderLevel,
  ReminderType,
} from "./database.types";
import type { Session, User } from "@supabase/supabase-js";

// ── Re-exports pour compatibilité avec les routes existantes ──────────────────
export type { DbClient as Client };
export type { DbCatalogItem as CatalogItem };
export type { DbOrganization as Organization };
export type { DbQuote as Quote };
export type { DbQuoteItem as QuoteItem };
export type { DbInvoice as Invoice };
export type { DbInvoiceItem as InvoiceItem };
export type { DbPayment as Payment };
export type { DbReminder as Reminder };
export type { DbReminderTemplate as ReminderTemplate };
export type { QuoteStatus, InvoiceStatus, PaymentMethod, ReminderLevel, ReminderType };

// ── Types de création ─────────────────────────────────────────────────────────

export type NewClient = Omit<DbClient, "id" | "created_at" | "updated_at">;
export type NewCatalogItem = Omit<DbCatalogItem, "id" | "created_at" | "updated_at">;
export type NewQuote = Omit<DbQuote, "id" | "created_at" | "updated_at" | "number" | "total_ht" | "total_vat" | "total_ttc">;
export type NewQuoteItem = Omit<DbQuoteItem, "id" | "created_at" | "updated_at" | "total_ht" | "total_vat" | "total_ttc">;
export type NewInvoice = Omit<DbInvoice, "id" | "created_at" | "updated_at" | "number" | "total_ht" | "total_vat" | "total_ttc" | "amount_paid" | "amount_due">;
export type NewInvoiceItem = Omit<DbInvoiceItem, "id" | "created_at" | "updated_at" | "total_ht" | "total_vat" | "total_ttc">;
export type NewPayment = Omit<DbPayment, "id" | "created_at" | "updated_at">;
export type NewReminder = Omit<DbReminder, "id" | "created_at" | "updated_at">;

// ── Context type ──────────────────────────────────────────────────────────────

export type SupabaseContextType = {
  // Auth
  session: Session | null;
  user: User | null;
  profile: DbProfile | null;
  organization: DbOrganization | null;
  currentUserRole: 'admin' | 'member';
  isLoading: boolean;

  // Clients
  clients: DbClient[];
  addClient: (c: NewClient) => Promise<DbClient>;
  updateClient: (id: string, c: Partial<DbClient>) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;

  // Catalogue
  catalogItems: DbCatalogItem[];
  addCatalogItem: (item: NewCatalogItem) => Promise<DbCatalogItem>;
  updateCatalogItem: (id: string, item: Partial<DbCatalogItem>) => Promise<void>;
  deleteCatalogItem: (id: string) => Promise<void>;

  // Devis
  quotes: DbQuote[];
  addQuote: (q: NewQuote, items: NewQuoteItem[]) => Promise<DbQuote>;
  updateQuote: (id: string, q: Partial<DbQuote>) => Promise<void>;
  deleteQuote: (id: string) => Promise<void>;
  getQuoteItems: (quoteId: string) => Promise<DbQuoteItem[]>;
  convertQuoteToInvoice: (quoteId: string) => Promise<string>;

  // Factures
  invoices: DbInvoice[];
  addInvoice: (inv: NewInvoice, items: NewInvoiceItem[]) => Promise<DbInvoice>;
  updateInvoice: (id: string, inv: Partial<DbInvoice>) => Promise<void>;
  getInvoiceItems: (invoiceId: string) => Promise<DbInvoiceItem[]>;

  // Paiements
  addPayment: (p: NewPayment) => Promise<DbPayment>;
  getPaymentsByInvoice: (invoiceId: string) => Promise<DbPayment[]>;
  deletePayment: (id: string) => Promise<void>;

  // Relances
  addReminder: (r: NewReminder) => Promise<DbReminder>;
  updateReminder: (id: string, r: Partial<DbReminder>) => Promise<void>;
  getRemindersByInvoice: (invoiceId: string) => Promise<DbReminder[]>;
  reminderTemplates: DbReminderTemplate[];

  // Organisation
  ownedOrganizations: DbOrganization[];
  updateOrganization: (partial: Partial<DbOrganization>) => Promise<void>;
  createOrganization: (name: string) => Promise<DbOrganization>;
  switchOrganization: (orgId: string) => Promise<void>;

  // Refresh manuel
  refresh: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export function SupabaseDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DbProfile | null>(null);
  const [organization, setOrganization] = useState<DbOrganization | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<'admin' | 'member'>('member');
  const [ownedOrganizations, setOwnedOrganizations] = useState<DbOrganization[]>([]);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const isLoading = isAuthLoading || isDataLoading;

  const [clients, setClients] = useState<DbClient[]>([]);
  const [catalogItems, setCatalogItems] = useState<DbCatalogItem[]>([]);
  const [quotes, setQuotes] = useState<DbQuote[]>([]);
  const [invoices, setInvoices] = useState<DbInvoice[]>([]);
  const [reminderTemplates, setReminderTemplates] = useState<DbReminderTemplate[]>([]);

  // ── Auth ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Chargement des données au login ──────────────────────────────────────

  const loadAll = useCallback(async () => {
    if (isAuthLoading) return;

    if (!user) {
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);

    try {
      // Profil + organisation
      const { data: prof } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(prof);

      if (prof?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", prof.organization_id)
          .single();
        setOrganization(org);

        // Données métier en parallèle
        const [
          { data: clientsData },
          { data: catalogData },
          { data: quotesData },
          { data: invoicesData },
          { data: templatesData },
        ] = await Promise.all([
          supabase.from("clients").select("*").eq("organization_id", prof.organization_id).order("created_at", { ascending: false }),
          supabase.from("items_catalog").select("*").eq("organization_id", prof.organization_id).eq("is_active", true).order("title"),
          supabase.from("quotes").select("*").eq("organization_id", prof.organization_id).order("created_at", { ascending: false }),
          supabase.from("invoices").select("*").eq("organization_id", prof.organization_id).order("created_at", { ascending: false }),
          supabase.from("reminder_templates").select("*").eq("organization_id", prof.organization_id).order("delay_days"),
        ]);

        setClients(clientsData ?? []);
        setCatalogItems(catalogData ?? []);
        setQuotes(quotesData ?? []);
        setInvoices(invoicesData ?? []);
        setReminderTemplates(templatesData ?? []);

        // Passage automatique en overdue retiré car la fonction n'existe plus
        // Charger toutes les orgs de l'utilisateur pour le switcher
        const { data: allOrgs } = await supabase
          .from("organizations")
          .select("*")
          .eq("owner_id", user.id);
        setOwnedOrganizations(allOrgs ?? []);

        // Déterminer le rôle
        let role: 'admin' | 'member' = 'member';
        if (org.owner_id === user.id) {
          role = 'admin';
        } else {
          const { data: memberData } = await supabase
            .from('team_members')
            .select('role')
            .eq('user_id', user.id)
            .single();
          if (memberData && memberData.role === 'admin') {
            role = 'admin';
          }
        }
        setCurrentUserRole(role);

      }
    } finally {
      setIsDataLoading(false);
    }
  }, [user, isAuthLoading]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Realtime : factures & devis (statuts) ─────────────────────────────────

  useEffect(() => {
    if (!organization) return;

    const channel = supabase
      .channel("org-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "invoices", filter: `organization_id=eq.${organization.id}` },
        () => {
          supabase.from("invoices").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false })
            .then(({ data }) => setInvoices(data ?? []));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "quotes", filter: `organization_id=eq.${organization.id}` },
        () => {
          supabase.from("quotes").select("*").eq("organization_id", organization.id).order("created_at", { ascending: false })
            .then(({ data }) => setQuotes(data ?? []));
        },
      )
      .on(
        // FIX BUG CRITIQUE (PRO-1/AGENCY-1) : écouter les changements de plan_tier sur l'organisation
        // pour que l'UI reflète immédiatement une montée de plan sans rechargement de page.
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "organizations", filter: `id=eq.${organization.id}` },
        (payload) => {
          setOrganization((prev) => prev ? { ...prev, ...(payload.new as Partial<DbOrganization>) } : prev);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organization]);

  // ── Realtime : profil utilisateur (plan_tier) ────────────────────────────
  // FIX BUG CRITIQUE (PRO-1/AGENCY-1) : si le plan_tier est modifié en DB
  // (ex: webhook Stripe), le frontend est notifié instantanément et met à jour
  // le cache local sans attendre un rechargement de page.

  useEffect(() => {
    if (!user) return;

    const profileChannel = supabase
      .channel("profile-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          setProfile((prev) => prev ? { ...prev, ...(payload.new as Partial<DbProfile>) } : prev);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(profileChannel); };
  }, [user]);

  // ── Clients ───────────────────────────────────────────────────────────────

  const addClient = useCallback(async (c: NewClient): Promise<DbClient> => {
    const { data, error } = await supabase.from("clients").insert(c).select().single();
    if (error) throw new Error(error.message);
    setClients((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateClient = useCallback(async (id: string, c: Partial<DbClient>) => {
    const { error } = await supabase.from("clients").update(c).eq("id", id);
    if (error) throw new Error(error.message);
    setClients((prev) => prev.map((cl) => (cl.id === id ? { ...cl, ...c } : cl)));
  }, []);

  const deleteClient = useCallback(async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setClients((prev) => prev.filter((cl) => cl.id !== id));
  }, []);

  // ── Catalogue ─────────────────────────────────────────────────────────────

  const addCatalogItem = useCallback(async (item: NewCatalogItem): Promise<DbCatalogItem> => {
    const { data, error } = await supabase.from("items_catalog").insert(item).select().single();
    if (error) throw new Error(error.message);
    setCatalogItems((prev) => [...prev, data].sort((a, b) => a.title.localeCompare(b.title)));
    return data;
  }, []);

  const updateCatalogItem = useCallback(async (id: string, item: Partial<DbCatalogItem>) => {
    const { error } = await supabase.from("items_catalog").update(item).eq("id", id);
    if (error) throw new Error(error.message);
    setCatalogItems((prev) => prev.map((ci) => (ci.id === id ? { ...ci, ...item } : ci)));
  }, []);

  const deleteCatalogItem = useCallback(async (id: string) => {
    // Soft-delete : on désactive l'article
    const { error } = await supabase.from("items_catalog").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);
    setCatalogItems((prev) => prev.filter((ci) => ci.id !== id));
  }, []);

  // ── Devis ─────────────────────────────────────────────────────────────────

  const addQuote = useCallback(async (q: NewQuote, items: NewQuoteItem[]): Promise<DbQuote> => {
    // Insérer le devis — le trigger SQL génère le numéro
    const { data: quote, error } = await supabase
      .from("quotes")
      .insert({ ...q, number: "" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("quote_items").insert(
        items.map((item, i) => ({ ...item, quote_id: quote.id, position: i })),
      );
      if (itemsError) throw new Error(itemsError.message);
    }

    // Recharger le devis avec les totaux recalculés par trigger
    const { data: fresh } = await supabase.from("quotes").select("*").eq("id", quote.id).single();
    const freshQuote = fresh ?? quote;
    setQuotes((prev) => [freshQuote, ...prev]);
    return freshQuote;
  }, []);

  const updateQuote = useCallback(async (id: string, q: Partial<DbQuote>) => {
    const { error } = await supabase.from("quotes").update(q).eq("id", id);
    if (error) throw new Error(error.message);
    setQuotes((prev) => prev.map((qu) => (qu.id === id ? { ...qu, ...q } : qu)));
  }, []);

  const deleteQuote = useCallback(async (id: string) => {
    const { error } = await supabase.from("quotes").delete().eq("id", id);
    if (error) throw new Error(error.message);
    setQuotes((prev) => prev.filter((qu) => qu.id !== id));
  }, []);

  const getQuoteItems = useCallback(async (quoteId: string): Promise<DbQuoteItem[]> => {
    const { data, error } = await supabase
      .from("quote_items")
      .select("*")
      .eq("quote_id", quoteId)
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  }, []);

  const convertQuoteToInvoice = useCallback(async (quoteId: string): Promise<string> => {
    const { data, error } = await supabase.rpc("convert_quote_to_invoice", { p_quote_id: quoteId });
    if (error) throw new Error(error.message);
    // Rafraîchir devis + factures
    await loadAll();
    return data as string;
  }, [loadAll]);

  // ── Factures ──────────────────────────────────────────────────────────────

  const addInvoice = useCallback(async (inv: NewInvoice, items: NewInvoiceItem[]): Promise<DbInvoice> => {
    const { data: invoice, error } = await supabase
      .from("invoices")
      .insert({ ...inv, number: "" })
      .select()
      .single();
    if (error) throw new Error(error.message);

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("invoice_items").insert(
        items.map((item, i) => ({ ...item, invoice_id: invoice.id, position: i })),
      );
      if (itemsError) throw new Error(itemsError.message);
    }

    const { data: fresh } = await supabase.from("invoices").select("*").eq("id", invoice.id).single();
    const freshInvoice = fresh ?? invoice;
    setInvoices((prev) => [freshInvoice, ...prev]);
    return freshInvoice;
  }, []);

  const updateInvoice = useCallback(async (id: string, inv: Partial<DbInvoice>) => {
    const { error } = await supabase.from("invoices").update(inv).eq("id", id);
    if (error) throw new Error(error.message);
    setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, ...inv } : i)));
  }, []);

  const getInvoiceItems = useCallback(async (invoiceId: string): Promise<DbInvoiceItem[]> => {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("position");
    if (error) throw new Error(error.message);
    return data ?? [];
  }, []);

  // ── Paiements ─────────────────────────────────────────────────────────────

  const addPayment = useCallback(async (p: NewPayment): Promise<DbPayment> => {
    const { data, error } = await supabase.from("payments").insert(p).select().single();
    if (error) throw new Error(error.message);
    // Le trigger SQL met à jour amount_paid + statut de la facture — on recharge
    const { data: updatedInvoice } = await supabase.from("invoices").select("*").eq("id", p.invoice_id).single();
    if (updatedInvoice) {
      setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
    }
    return data;
  }, []);

  const getPaymentsByInvoice = useCallback(async (invoiceId: string): Promise<DbPayment[]> => {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("payment_date", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  }, []);

  const deletePayment = useCallback(async (id: string) => {
    // On récupère la facture liée avant de supprimer pour pouvoir rafraîchir
    const { data: payment } = await supabase.from("payments").select("invoice_id").eq("id", id).single();
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) throw new Error(error.message);
    if (payment) {
      const { data: updatedInvoice } = await supabase.from("invoices").select("*").eq("id", payment.invoice_id).single();
      if (updatedInvoice) {
        setInvoices((prev) => prev.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)));
      }
    }
  }, []);

  // ── Relances ──────────────────────────────────────────────────────────────

  const addReminder = useCallback(async (r: NewReminder): Promise<DbReminder> => {
    const { data, error } = await supabase.from("reminders").insert(r).select().single();
    if (error) throw new Error(error.message);
    return data;
  }, []);

  const updateReminder = useCallback(async (id: string, r: Partial<DbReminder>) => {
    const { error } = await supabase.from("reminders").update(r).eq("id", id);
    if (error) throw new Error(error.message);
  }, []);

  const getRemindersByInvoice = useCallback(async (invoiceId: string): Promise<DbReminder[]> => {
    const { data, error } = await supabase
      .from("reminders")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("scheduled_at");
    if (error) throw new Error(error.message);
    return data ?? [];
  }, []);

  // ── Organisation ──────────────────────────────────────────────────────────

  const updateOrganization = useCallback(async (partial: Partial<DbOrganization>) => {
    if (!organization) return;
    const { error } = await supabase.from("organizations").update(partial).eq("id", organization.id);
    if (error) throw new Error(error.message);
    setOrganization((prev) => (prev ? { ...prev, ...partial } : prev));
  }, [organization]);

  const createOrganization = useCallback(async (name: string) => {
    if (!user) throw new Error("Non connecté");
    const { data: org, error } = await supabase.from("organizations").insert({
      name,
      owner_id: user.id,
    }).select().single();
    if (error) throw new Error(error.message);
    
    // Switch sur la nouvelle orga
    const { error: profError } = await supabase.from("profiles").update({
      organization_id: org.id
    }).eq("id", user.id);
    if (profError) throw new Error(profError.message);

    await loadAll();
    window.location.reload();
    return org;
  }, [user, loadAll]);

  const switchOrganization = useCallback(async (orgId: string) => {
    if (!user) throw new Error("Non connecté");
    const { error } = await supabase.from("profiles").update({
      organization_id: orgId
    }).eq("id", user.id);
    if (error) throw new Error(error.message);
    
    await loadAll();
    window.location.reload();
  }, [user, loadAll]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value: SupabaseContextType = {
    session,
    user,
    profile,
    organization,
    currentUserRole,
    isLoading,
    clients,
    addClient,
    updateClient,
    deleteClient,
    catalogItems,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    quotes,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuoteItems,
    convertQuoteToInvoice,
    invoices,
    addInvoice,
    updateInvoice,
    getInvoiceItems,
    addPayment,
    getPaymentsByInvoice,
    deletePayment,
    addReminder,
    updateReminder,
    getRemindersByInvoice,
    reminderTemplates,
    ownedOrganizations,
    updateOrganization,
    createOrganization,
    switchOrganization,
    refresh: loadAll,
  };

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useSupabaseData(): SupabaseContextType {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabaseData doit être utilisé dans <SupabaseDataProvider>");
  return ctx;
}

// Alias de compatibilité pour les routes existantes qui importent useData
export { useSupabaseData as useData };
