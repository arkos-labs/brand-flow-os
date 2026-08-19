import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo, type ReactNode } from "react";
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  ReceiptEuro,
  Pencil,
  Trash2,
  ChevronRight,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, Client, ClientType } from "@/lib/data-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Quote } from "@/lib/data-context";
import { Download, CheckCircle2, Send, Eye, Link, LoaderCircle } from "lucide-react";
import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { searchCompanyBySiret } from "@/lib/siret";
import { ReminderModal } from "@/components/ReminderModal";
import { QuoteEditorDialog } from "@/components/QuoteEditorDialog";
import { UpgradeModal } from "@/components/UpgradeModal";
import { exportQuotePdf } from "@/lib/pdf-export";
import { getClientQuoteActions } from "@/lib/quote-actions";

export const Route = createFileRoute("/clients")({
  head: () => ({
    meta: [
      { title: "Clients — ClearQuote" },
      {
        name: "description",
        content: "Carnet d'adresses clients avec historique des devis et factures.",
      },
    ],
  }),
  component: () => (
    <ErrorBoundary>
      <ClientsPage />
    </ErrorBoundary>
  ),
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-blue-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-blue-700",
    "bg-teal-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length] ?? colors[0]!;
}

const EMPTY_CLIENT: Omit<Client, "id" | "createdAt"> = {
  type: "pro",
  name: "",
  firstName: "",
  lastName: "",
  companyName: "",
  siret: "",
  vatNumber: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  postalCode: "",
  city: "",
  country: "France",
  notes: "",
};

type Tab = "info" | "quotes" | "invoices";

// ── Main component ────────────────────────────────────────────────────────────

function ClientsPage() {
  const { t, tv, money, date, lang } = useI18n();
  const { clients, addClient, updateClient, deleteClient, quotes, invoices, products, company, updateQuote, updateInvoice, profile } = useData();

  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [externalClientName, setExternalClientName] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("info");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null);
  const [form, setForm] = useState<Omit<Client, "id" | "createdAt">>(EMPTY_CLIENT);
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [emailQuote, setEmailQuote] = useState<Quote | null>(null);
  const [exportingQuote, setExportingQuote] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState("");
  const [reminderInvoice, setReminderInvoice] = useState<import("@/lib/data-context").Invoice | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);

  const handleSiretLookup = async (siret: string) => {
    const clean = siret.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setIsFetchingSiret(true);
    try {
      const data = await searchCompanyBySiret(clean);
      if (data) {
        setForm((prev) => ({
          ...prev,
          companyName: data.name || prev.companyName || "",
          address: data.address || prev.address || "",
          postalCode: data.postalCode || prev.postalCode || "",
          city: data.city || prev.city || "",
          vatNumber: data.vatNumber || prev.vatNumber || "",
        }));
      }
    } finally {
      setIsFetchingSiret(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.siret?.includes(q),
    );
  }, [clients, search]);

  useEffect(() => {
    const focusName = window.localStorage.getItem("invoicepro_client_focus");
    if (!focusName) return;
    const registeredClient = clients.find((client) => client.name.toLowerCase() === focusName.toLowerCase());
    setSelectedId(registeredClient?.id ?? null);
    setExternalClientName(registeredClient ? null : focusName);
    setTab("info");
    window.localStorage.removeItem("invoicepro_client_focus");
  }, [clients]);

  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedId)
      ?? (externalClientName
        ? {
            id: `document-history-${externalClientName}`,
            type: "particulier" as const,
            name: externalClientName,
            email: "",
            country: "France",
            createdAt: "2026-01-01",
          }
        : null),
    [clients, externalClientName, selectedId],
  );
  const isExternalClient = selectedClient !== null && selectedId === null;

  // Historique: match par nom client (string)
  const clientQuotes = useMemo(
    () =>
      selectedClient
        ? quotes.filter(
            (quote) => quote.clientId === selectedClient.id
              || (!quote.clientId && quote.client.toLowerCase() === selectedClient.name.toLowerCase()),
          )
        : [],
    [quotes, selectedClient],
  );
  const clientInvoices = useMemo(
    () =>
      selectedClient
        ? invoices.filter(
            (invoice) => invoice.clientId === selectedClient.id
              || (!invoice.clientId && invoice.client.toLowerCase() === selectedClient.name.toLowerCase()),
          )
        : [],
    [invoices, selectedClient],
  );

  const handleSendReminder = (invoiceNumber: string, type: "J+7" | "J+15" | "J+30") => {
    const invoice = invoices.find((item) => item.number === invoiceNumber);
    if (!invoice) return;
    updateInvoice(invoiceNumber, {
      ...invoice,
      reminders: [...(invoice.reminders ?? []), { date: new Date().toISOString(), type }],
    });
  };

  const openNew = () => {
    const plan = profile?.plan_tier || "solo";
    if (plan === "solo" && clients.length >= 1) {
      setIsUpgradeModalOpen(true);
      return;
    }
    setEditingClient(null);
    setForm(EMPTY_CLIENT);
    setIsFormOpen(true);
  };

  const openEdit = (c: Client) => {
    setEditingClient(c);
    setForm({
      type: c.type,
      name: c.name,
      firstName: c.firstName ?? "",
      lastName: c.lastName ?? "",
      companyName: c.companyName ?? "",
      siret: c.siret ?? "",
      vatNumber: c.vatNumber ?? "",
      email: c.email,
      phone: c.phone ?? "",
      website: c.website ?? "",
      address: c.address ?? "",
      postalCode: c.postalCode ?? "",
      city: c.city ?? "",
      country: c.country ?? "France",
      notes: c.notes ?? "",
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Calcul du nom d'affichage
    const displayName =
      form.type === "pro"
        ? form.companyName || form.name
        : `${form.firstName} ${form.lastName}`.trim();

    const clientData: Client = {
      ...form,
      id: editingClient?.id ?? crypto.randomUUID(),
      name: displayName || form.name,
      createdAt: editingClient?.createdAt ?? new Date().toISOString().split("T")[0] ?? "",
    };

    if (editingClient) {
      updateClient(editingClient.id, clientData);
      if (selectedId === editingClient.id) setSelectedId(clientData.id);
    } else {
      addClient(clientData);
      setSelectedId(clientData.id);
    }

    setIsFormOpen(false);
    setTab("info");
  };

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClient(deleteTarget.id);
    if (selectedId === deleteTarget.id) setSelectedId(null);
    setDeleteTarget(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title={t("cli.title")}
        subtitle={t("cli.subtitle")}
        action={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("cli.new")}
          </Button>
        }
      />

      <div className="flex gap-5 lg:gap-6" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* ── Liste ────────────────────────────────────────── */}
        <div className={cn("flex flex-col gap-3", selectedClient ? "hidden lg:flex lg:w-80 shrink-0" : "w-full")}>
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("cli.search")}
              className="pl-9"
            />
          </div>

          {/* Stats */}
          {clients.length > 0 && (
            <p className="text-xs text-muted-foreground px-1">
              {filtered.length} / {clients.length} {lang === "fr" ? "client(s)" : "client(s)"}
            </p>
          )}

          {/* Empty state */}
          {clients.length === 0 && (
            <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Users className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">{t("cli.empty")}</p>
              <p className="max-w-xs text-xs text-muted-foreground">{t("cli.empty.desc")}</p>
              <Button variant="outline" size="sm" onClick={openNew} className="mt-2 gap-2">
                <Plus className="h-4 w-4" />
                {t("cli.new")}
              </Button>
            </div>
          )}

          {/* Client cards */}
          <div className="flex flex-col gap-2">
            {filtered.map((c) => {
              const qCount = quotes.filter((q) => q.client.toLowerCase() === c.name.toLowerCase()).length;
              const invCount = invoices.filter((inv) => inv.client.toLowerCase() === c.name.toLowerCase()).length;
              const isSelected = selectedId === c.id;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => { setSelectedId(c.id); setExternalClientName(null); setTab("info"); }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  {/* Avatar */}
                  <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white", avatarColor(c.name))}>
                    {initials(c.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <span className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                        c.type === "pro" ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground",
                      )}>
                        {c.type === "pro" ? t("cli.type.pro") : t("cli.type.particulier")}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{c.email || c.city || "—"}</p>
                    <div className="mt-1 flex gap-2 text-[10px] text-muted-foreground">
                      {qCount > 0 && <span>{qCount} {t("cli.total.quotes")}</span>}
                      {invCount > 0 && <span>{invCount} {t("cli.total.invoices")}</span>}
                    </div>
                  </div>

                  <ChevronRight className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isSelected && "rotate-90 lg:rotate-0")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Détail client ─────────────────────────────────── */}
        {selectedClient && (
          <div className="flex-1 min-w-0">
            {/* Header fiche */}
            <div className="card-elevated mb-4 p-5">
              <div className="flex items-start gap-4">
                {/* Bouton retour mobile */}
                <button
                  type="button"
                  className="lg:hidden text-muted-foreground hover:text-foreground"
                  onClick={() => { setSelectedId(null); setExternalClientName(null); }}
                >
                  ←
                </button>

                <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-xl font-bold text-white", avatarColor(selectedClient.name))}>
                  {initials(selectedClient.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold">{selectedClient.name}</h2>
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      selectedClient.type === "pro" ? "bg-blue-100 text-blue-700" : "bg-secondary text-muted-foreground",
                    )}>
                      {selectedClient.type === "pro" ? t("cli.type.pro") : t("cli.type.particulier")}
                    </span>
                  </div>
                  {selectedClient.siret && (
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">SIRET {selectedClient.siret}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {selectedClient.email && (
                      <a href={`mailto:${selectedClient.email}`} className="flex items-center gap-1 hover:text-foreground">
                        <Mail className="h-3.5 w-3.5" />{selectedClient.email}
                      </a>
                    )}
                    {selectedClient.phone && (
                      <a href={`tel:${selectedClient.phone}`} className="flex items-center gap-1 hover:text-foreground">
                        <Phone className="h-3.5 w-3.5" />{selectedClient.phone}
                      </a>
                    )}
                    {selectedClient.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />{selectedClient.postalCode} {selectedClient.city}
                      </span>
                    )}
                    {selectedClient.website && (
                      <a href={selectedClient.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-foreground">
                        <Globe className="h-3.5 w-3.5" />{selectedClient.website.replace(/^https?:\/\//, "")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t("cli.since")} {date(selectedClient.createdAt)}
                  </p>
                </div>

                {!isExternalClient && <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(selectedClient)} className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    {t("cli.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteTarget(selectedClient)}
                    className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive hover:text-white"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>}
              </div>

              {/* KPI rapides */}
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4">
                <div className="text-center">
                  <p className="text-xl font-bold">{clientQuotes.length}</p>
                  <p className="text-xs text-muted-foreground">{t("cli.total.quotes")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold">{clientInvoices.length}</p>
                  <p className="text-xs text-muted-foreground">{t("cli.total.invoices")}</p>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-primary">
                    {money(clientInvoices.reduce((s, inv) => s + inv.amount, 0))}
                  </p>
                  <p className="text-xs text-muted-foreground">{lang === "fr" ? "CA total" : "Total revenue"}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-4 flex gap-1 rounded-lg border border-border bg-muted/30 p-1">
              {(["info", "quotes", "invoices"] as Tab[]).map((t_) => (
                <button
                  key={t_}
                  type="button"
                  onClick={() => setTab(t_)}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    tab === t_
                      ? "bg-white shadow-sm text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t_ === "info" && <User className="h-3.5 w-3.5" />}
                  {t_ === "quotes" && <FileText className="h-3.5 w-3.5" />}
                  {t_ === "invoices" && <ReceiptEuro className="h-3.5 w-3.5" />}
                  {t_ === "info" && t("cli.tab.info")}
                  {t_ === "quotes" && `${t("cli.tab.quotes")} (${clientQuotes.length})`}
                  {t_ === "invoices" && `${t("cli.tab.invoices")} (${clientInvoices.length})`}
                </button>
              ))}
            </div>

            {/* Tab: Informations */}
            {tab === "info" && (
              <div className="grid grid-cols-2 gap-4">
                {/* Identité */}
                <div className="card-elevated p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    {t("cli.section.identity")}
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {selectedClient.companyName && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{t("cli.companyName")}</dt>
                        <dd className="font-medium text-right">{selectedClient.companyName}</dd>
                      </div>
                    )}
                    {(selectedClient.firstName || selectedClient.lastName) && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{lang === "fr" ? "Contact" : "Contact"}</dt>
                        <dd className="font-medium text-right">{selectedClient.firstName} {selectedClient.lastName}</dd>
                      </div>
                    )}
                    {selectedClient.siret && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">SIRET</dt>
                        <dd className="font-mono text-right">{selectedClient.siret}</dd>
                      </div>
                    )}
                    {selectedClient.vatNumber && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">N° TVA</dt>
                        <dd className="font-mono text-right">{selectedClient.vatNumber}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Contact + Adresse */}
                <div className="card-elevated p-5">
                  <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {t("cli.section.address")}
                  </h3>
                  <dl className="space-y-2 text-sm">
                    {selectedClient.address && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{t("cli.address")}</dt>
                        <dd className="text-right">{selectedClient.address}</dd>
                      </div>
                    )}
                    {selectedClient.city && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{t("cli.city")}</dt>
                        <dd>{selectedClient.postalCode} {selectedClient.city}</dd>
                      </div>
                    )}
                    {selectedClient.country && selectedClient.country !== "France" && (
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">{t("cli.country")}</dt>
                        <dd>{selectedClient.country}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                {/* Notes */}
                {selectedClient.notes && (
                  <div className="card-elevated p-5 col-span-2">
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("cli.notes")}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedClient.notes}</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Devis */}
            {tab === "quotes" && (
              <div className="card-elevated p-5">
                {clientQuotes.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                    <FileText className="h-8 w-8" />
                    <p className="text-sm">{t("cli.history.empty")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {clientQuotes.map((q) => (
                      <li key={q.number} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div>
                          <p className="font-medium font-mono">{q.number}</p>
                          <p className="text-xs text-muted-foreground">Créé le {date(q.date)}{q.sentAt && ` · Envoyé le ${date(q.sentAt)}`}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            q.status.fr === "Signé"   && "bg-emerald-100 text-emerald-700",
                            q.status.fr === "Facturé" && "bg-primary/15 text-primary",
                            q.status.fr === "Payé"    && "bg-success/20 text-success",
                            q.status.fr === "Envoyé"  && "bg-blue-100 text-blue-700",
                            !["Signé","Facturé","Payé","Envoyé"].includes(q.status.fr) && "bg-secondary text-muted-foreground",
                          )}>
                            {tv(q.status)}
                          </span>
                          <span className="font-semibold">{money(q.amount)}</span>
                          <div className="ml-2 flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                            {getClientQuoteActions(q.status.fr).includes("edit") && (
                              <ActionIcon title="Modifier le devis" onClick={() => setEditingQuote(q)}>
                                <Pencil className="h-4 w-4" />
                              </ActionIcon>
                            )}
                            <ActionIcon title="Voir le devis" onClick={() => setPreviewQuote(q)}>
                              <Eye className="h-4 w-4" />
                            </ActionIcon>
                            <ActionIcon
                              title="Télécharger le PDF"
                              disabled={exportingQuote === q.number}
                              onClick={async () => {
                                setExportingQuote(q.number);
                                try {
                                  await exportQuotePdf(q, company, profile?.plan_tier);
                                  setActionNotice(`PDF ${q.number} téléchargé.`);
                                } catch {
                                  setActionNotice("Impossible de générer le PDF pour le moment.");
                                } finally {
                                  setExportingQuote(null);
                                }
                              }}
                            >
                              {exportingQuote === q.number
                                ? <LoaderCircle className="h-4 w-4 animate-spin" />
                                : <Download className="h-4 w-4" />}
                            </ActionIcon>
                            <ActionIcon
                              title="Copier le lien client"
                              onClick={async () => {
                                const url = `${window.location.origin}/portail/${q.publicToken || q.number}`;
                                try {
                                  await navigator.clipboard.writeText(url);
                                  setActionNotice(`Lien client de ${q.number} copié.`);
                                } catch {
                                  setActionNotice("Impossible de copier le lien automatiquement.");
                                }
                              }}
                            >
                              <Link className="h-4 w-4" />
                            </ActionIcon>
                            {getClientQuoteActions(q.status.fr).includes("send") && (
                              <ActionIcon title="Envoyer le devis" onClick={() => setEmailQuote(q)}>
                                <Send className="h-4 w-4" />
                              </ActionIcon>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Tab: Factures */}
            {tab === "invoices" && (
              <div className="card-elevated p-5">
                {clientInvoices.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                    <ReceiptEuro className="h-8 w-8" />
                    <p className="text-sm">{t("cli.history.empty")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {clientInvoices.map((inv) => (
                      <li key={inv.number} className="flex items-center justify-between gap-4 py-3 text-sm">
                        <div>
                          <p className="font-medium font-mono">{inv.number}</p>
                          <p className="text-xs text-muted-foreground">
                            {lang === "fr" ? "Émise le" : "Issued"} {date(inv.date)}
                            {inv.sentAt && ` · ${lang === "fr" ? "Envoyée le" : "Sent on"} ${date(inv.sentAt)}`}
                            {inv.due && ` · ${lang === "fr" ? "Échéance" : "Due"} ${date(inv.due)}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            inv.status === "paid"  && "bg-success/20 text-success",
                            inv.status === "sent"  && "bg-blue-100 text-blue-700",
                            inv.status === "late"  && "bg-destructive/10 text-destructive",
                            inv.status === "draft" && "bg-secondary text-muted-foreground",
                          )}>
                            {inv.status === "paid"  && (lang === "fr" ? "Payée" : "Paid")}
                            {inv.status === "sent"  && (lang === "fr" ? "Envoyée" : "Sent")}
                            {inv.status === "late"  && (lang === "fr" ? "En retard" : "Late")}
                            {inv.status === "draft" && (lang === "fr" ? "Brouillon" : "Draft")}
                          </span>
                          <span className="font-semibold">{money(inv.amount)}</span>
                          {inv.status === "late" && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => { setReminderInvoice(inv); setIsReminderOpen(true); }}
                              className="h-8 gap-1.5 border-destructive/30 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Send className="h-3.5 w-3.5" /> Relancer
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "late") && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => updateInvoice(inv.number, { ...inv, status: "paid" })}
                              className="h-8 gap-1.5 bg-success px-3 text-xs text-white hover:bg-success/90"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {lang === "fr" ? "Paiement reçu" : "Payment received"}
                            </Button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Limite de clients atteinte"
        description="Le forfait Solo est limité à 1 client actif. Passez au forfait Pro pour débloquer l'ajout de clients en illimité."
        requiredPlan="pro"
      />

      {/* ── Sheet Formulaire ──────────────────────────────────────────────────── */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-xl w-[90vw] p-0 flex flex-col">
          <SheetHeader className="p-6 pb-3 border-b">
            <SheetTitle>
              {editingClient
                ? (lang === "fr" ? "Modifier le client" : "Edit client")
                : t("cli.new")}
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <form id="client-form" onSubmit={handleSave} className="space-y-7 p-6">
              {/* Type */}
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  {lang === "fr" ? "Type de client" : "Client type"}
                </Label>
                <RadioGroup
                  value={form.type}
                  onValueChange={(v) => set("type", v as ClientType)}
                  className="flex gap-4"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="pro" id="type-pro" />
                    <Label htmlFor="type-pro" className="cursor-pointer font-normal">
                      <Building2 className="mr-1.5 inline h-3.5 w-3.5" />
                      {t("cli.type.pro")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="particulier" id="type-part" />
                    <Label htmlFor="type-part" className="cursor-pointer font-normal">
                      <User className="mr-1.5 inline h-3.5 w-3.5" />
                      {t("cli.type.particulier")}
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* ── Section Identité ── */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cli.section.identity")}
                </h3>

                {form.type === "pro" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 col-span-2">
                      <Label>{t("cli.companyName")} *</Label>
                      <Input
                        required
                        value={form.companyName}
                        onChange={(e) => set("companyName", e.target.value)}
                        placeholder="ACME SARL"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("cli.siret")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={form.siret}
                          onChange={(e) => set("siret", e.target.value.replace(/\D/g, "").slice(0, 14))}
                          placeholder="12345678901234"
                          className={cn("font-mono flex-1", form.siret && form.siret.length !== 14 && "border-warning")}
                          maxLength={14}
                        />
                        <button
                          type="button"
                          disabled={!form.siret || form.siret.length !== 14 || isFetchingSiret}
                          onClick={() => handleSiretLookup(form.siret || "")}
                          className="flex h-9 items-center justify-center rounded-[var(--shape-control)] border-2 border-navy bg-primary px-3 text-sm font-bold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
                          title={lang === "fr" ? "Rechercher via API" : "Search via API"}
                        >
                          {isFetchingSiret ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </button>
                      </div>
                      {form.siret && form.siret.length > 0 && form.siret.length !== 14 && (
                        <p className="text-[10px] text-warning-foreground">14 chiffres requis</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label>{t("cli.vatNumber")}</Label>
                      <Input
                        value={form.vatNumber}
                        onChange={(e) => set("vatNumber", e.target.value.toUpperCase())}
                        placeholder="FR12345678901"
                        className="font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>{t("cli.firstName")} {form.type === "particulier" ? "*" : ""}</Label>
                    <Input
                      required={form.type === "particulier"}
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Jean"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.lastName")} {form.type === "particulier" ? "*" : ""}</Label>
                    <Input
                      required={form.type === "particulier"}
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Dupont"
                    />
                  </div>
                </div>
              </section>

              {/* ── Section Contact ── */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cli.section.contact")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label>{t("cli.email")} *</Label>
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="contact@acme.fr"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.phone")}</Label>
                    <Input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                      placeholder="06 12 34 56 78"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.website")}</Label>
                    <Input
                      type="url"
                      value={form.website}
                      onChange={(e) => set("website", e.target.value)}
                      placeholder="https://acme.fr"
                    />
                  </div>
                </div>
              </section>

              {/* ── Section Adresse ── */}
              <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("cli.section.address")}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5 col-span-2">
                    <Label>{t("cli.address")}</Label>
                    <Input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="12 rue de la Paix"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.postalCode")}</Label>
                    <Input
                      value={form.postalCode}
                      onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                      placeholder="75001"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.city")}</Label>
                    <Input
                      value={form.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Paris"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>{t("cli.country")}</Label>
                    <Input
                      value={form.country}
                      onChange={(e) => set("country", e.target.value)}
                      placeholder="France"
                    />
                  </div>
                </div>
              </section>

              {/* ── Notes ── */}
              <section className="space-y-2">
                <Label>{t("cli.notes")}</Label>
                <Textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder={lang === "fr" ? "Commentaires internes, conditions particulières…" : "Internal notes, special conditions…"}
                  className="resize-none"
                />
              </section>
            </form>
          </ScrollArea>

          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button type="submit" form="client-form">
              {t("cli.save")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Dialog Suppression ───────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {t("cli.delete.confirm")}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{t("cli.delete.confirm.desc")}</p>
          {deleteTarget && (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="font-medium">{deleteTarget.name}</p>
              <p className="text-xs text-muted-foreground">{deleteTarget.email}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("cli.delete")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ReminderModal
        invoice={reminderInvoice}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onSend={handleSendReminder}
      />
      <QuoteEditorDialog
        quote={editingQuote}
        clients={clients}
        products={products}
        onOpenChange={(open) => !open && setEditingQuote(null)}
        onSave={(updated) => {
          updateQuote(updated.number, updated);
          setEditingQuote(null);
          setActionNotice(`Le devis ${updated.number} a été mis à jour.`);
        }}
      />

      <Dialog open={!!emailQuote} onOpenChange={(open) => !open && setEmailQuote(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Envoyer le devis
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4 text-sm">
              <p><span className="text-muted-foreground">Destinataire :</span> {selectedClient?.email || "Adresse e-mail à renseigner"}</p>
              <p className="mt-2"><span className="text-muted-foreground">Objet :</span> Votre devis {emailQuote?.number}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              En mode démonstration, cette action enregistre l’envoi et sa date. L’envoi réel sera activé avec la connexion Gmail.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setEmailQuote(null)}>Annuler</Button>
            <Button onClick={() => {
              if (!emailQuote) return;
              updateQuote(emailQuote.number, {
                ...emailQuote,
                status: { fr: "Envoyé", en: "Sent" },
                sentAt: new Date().toISOString(),
              });
              setActionNotice(`Le devis ${emailQuote.number} est marqué comme envoyé.`);
              setEmailQuote(null);
            }}>
              <Send className="mr-2 h-4 w-4" />
              Envoyer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {actionNotice && (
        <div className="fixed bottom-5 right-5 z-[70] max-w-sm rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 shadow-lg">
          {actionNotice}
          <button className="ml-3 text-emerald-900/60 hover:text-emerald-900" onClick={() => setActionNotice("")}>×</button>
        </div>
      )}
      {/* Preview Modal for Quotes */}
      <Dialog open={!!previewQuote} onOpenChange={(open) => !open && setPreviewQuote(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>Aperçu du Devis {previewQuote?.number}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 bg-muted/20 p-4 sm:p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
            <div className="bg-white mx-auto max-w-[21cm] min-h-[29.7cm] p-[2cm] shadow-sm ring-1 ring-border rounded-sm print:shadow-none print:ring-0 print:p-0 print:m-0 text-black">
              <div className="flex justify-between items-start mb-16">
                <div>
                  <h1 className="text-4xl font-light tracking-wide text-primary uppercase">Devis</h1>
                  <p className="text-muted-foreground mt-2 font-mono text-sm">{previewQuote?.number}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-lg">{previewQuote?.client}</p>
                  {previewQuote?.details?.address && <p className="text-muted-foreground text-sm mt-1">{previewQuote.details.address}</p>}
                  <p className="text-muted-foreground text-sm mt-4">Date : {date(previewQuote?.date || "")}</p>
                </div>
              </div>
              
              <table className="w-full mb-8 text-sm">
                <thead>
                  <tr className="border-b-2 border-primary/20 text-muted-foreground text-left">
                    <th className="py-3 font-medium">Description</th>
                    <th className="py-3 text-right font-medium">Qté</th>
                    <th className="py-3 text-right font-medium">Prix unitaire HT</th>
                    <th className="py-3 text-right font-medium">Total HT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {previewQuote?.details?.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 font-medium">{item.label}</td>
                      <td className="py-4 text-right text-muted-foreground">{item.qty}</td>
                      <td className="py-4 text-right text-muted-foreground">{money(Number(item.priceHT || 0))}</td>
                      <td className="py-4 text-right font-medium">{money(Number(item.priceHT || 0) * Number(item.qty || 0))}</td>
                    </tr>
                  ))}
                  {previewQuote?.details?.upsells && previewQuote?.details?.upsells?.length > 0 && (
                    <tr>
                      <td colSpan={4} className="py-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 mt-2">Options supplémentaires</p>
                      </td>
                    </tr>
                  )}
                  {previewQuote?.details?.upsells?.map((item) => (
                    <tr key={item.id} className="bg-muted/5">
                      <td className="py-3 pl-4 text-sm">{item.label}</td>
                      <td className="py-3 text-right text-muted-foreground text-sm">{item.qty}</td>
                      <td className="py-3 text-right text-muted-foreground text-sm">{money(Number(item.priceHT || 0))}</td>
                      <td className="py-3 text-right font-medium text-sm">{money(Number(item.priceHT || 0) * Number(item.qty || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end mt-12">
                <div className="w-72 space-y-3 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Total HT</span>
                    <span className="font-medium text-foreground">{money(previewQuote?.details?.totalHT || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>TVA ({previewQuote?.details?.vatRate || 20}%)</span>
                    <span className="font-medium text-foreground">{money((previewQuote?.details?.totalTTC || 0) - (previewQuote?.details?.totalHT || 0))}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold mt-4 pt-4 border-t-2 border-primary">
                    <span className="text-primary">Total TTC</span>
                    <span className="text-primary">{money(previewQuote?.details?.totalTTC || previewQuote?.amount || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-4">
                    <span className="text-muted-foreground">Acompte à la signature (30%)</span>
                    <span className="font-medium text-foreground">{money((previewQuote?.details?.totalTTC || previewQuote?.amount || 0) * 0.3)}</span>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="flex justify-end gap-3 p-4 border-t shrink-0 print:hidden">
            <Button variant="outline" onClick={() => setPreviewQuote(null)}>
              Fermer
            </Button>
            <Button
              disabled={!previewQuote || exportingQuote === previewQuote.number}
              onClick={async () => {
                if (!previewQuote) return;
                setExportingQuote(previewQuote.number);
                try {
                  await exportQuotePdf(previewQuote, company, profile?.plan_tier);
                } finally {
                  setExportingQuote(null);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ActionIcon({ title, onClick, disabled = false, children }: {
  title: string;
  onClick: () => void | Promise<void>;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:cursor-wait disabled:opacity-50"
    >
      {children}
    </button>
  );
}
