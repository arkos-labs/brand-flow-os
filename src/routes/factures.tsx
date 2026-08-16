import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Download,
  Bell,
  Copy,
  ReceiptEuro,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MoreHorizontal,
  Ban,
  Plus,
  Trash2,
  FileText,
  ChevronRight,
  Eye,
  Search,
  Send,
  CalendarDays,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData, Invoice, type Client, type Quote } from "@/lib/data-context";
import {
  calculateInvoiceTotals,
  isQuoteReadyToInvoice,
  selectInvoiceLines,
  invoiceLinesFromQuote,
  type InvoiceLine,
} from "@/lib/invoice-from-quote";
import { recordInvoicePayment, type PaymentMethod } from "@/lib/document-workflow";
import { type InvoiceStatus } from "@/lib/demo-data";
import { searchCompanyBySiret } from "@/lib/siret";
import { exportInvoicePdf } from "@/lib/pdf-export";
import { generateAccountingExportCSV, downloadCSV } from "@/lib/export-compta";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ReminderModal } from "@/components/ReminderModal";

export const Route = createFileRoute("/factures")({
  head: () => ({
    meta: [
      { title: "Factures Factur-X — ClearQuote" },
      {
        name: "description",
        content:
          "Suivi des factures : numérotation verrouillée, échéances, statuts de paiement et format Factur-X.",
      },
      { property: "og:title", content: "Factures Factur-X — ClearQuote" },
      {
        property: "og:description",
        content: "Suivi des factures, échéances et statuts de paiement.",
      },
    ],
  }),
  component: Invoices,
});

const statusStyles: Record<InvoiceStatus, string> = {
  paid: "bg-success/12 text-success",
  sent: "bg-primary/10 text-primary",
  late: "bg-destructive/10 text-destructive",
  draft: "bg-secondary text-muted-foreground",
};

const statusKey: Record<InvoiceStatus, Key> = {
  paid: "inv.status.paid",
  sent: "inv.status.sent",
  late: "inv.status.late",
  draft: "inv.status.draft",
};

const statusIcon: Record<InvoiceStatus, typeof CheckCircle2> = {
  paid: CheckCircle2,
  sent: Clock,
  late: AlertTriangle,
  draft: MoreHorizontal,
};

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// invoiceLinesFromQuote est importée depuis @/lib/invoice-from-quote (version canonique partagée)

function Invoices() {
  const { t, money, date, lang } = useI18n();
  const navigate = useNavigate();
  const { invoices, addInvoice, updateInvoice, company, updateCompany, clients, addClient, quotes, updateQuote } = useData();
  const [filter, setFilter] = useState<InvoiceStatus | "all">("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState<string | null>(null);
  
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newClientType, setNewClientType] = useState<"pro" | "particulier">("pro");
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newSiret, setNewSiret] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);

  // Lignes de prestation pour la création manuelle de facture
  type NewLine = { id: string; label: string; qty: string; priceHT: string; vatRate: string };
  const emptyLine = (): NewLine => ({ id: crypto.randomUUID(), label: "", qty: "1", priceHT: "", vatRate: "20" });
  const [newLines, setNewLines] = useState<NewLine[]>([emptyLine()]);

  const addNewLine = () => setNewLines((prev) => [...prev, emptyLine()]);
  const removeNewLine = (id: string) => setNewLines((prev) => prev.length > 1 ? prev.filter((l) => l.id !== id) : prev);
  const updateNewLine = (id: string, field: keyof NewLine, value: string) =>
    setNewLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  const newLinesTotals = newLines.reduce(
    (acc, l) => {
      const ht = (parseFloat(l.priceHT) || 0) * (parseFloat(l.qty) || 0);
      const tva = ht * ((parseFloat(l.vatRate) || 20) / 100);
      return { totalHT: acc.totalHT + ht, totalTVA: acc.totalTVA + tva };
    },
    { totalHT: 0, totalTVA: 0 },
  );
  const newLinesTotalTTC = newLinesTotals.totalHT + newLinesTotals.totalTVA;
  const [quoteToInvoice, setQuoteToInvoice] = useState<Quote | null>(null);
  const [selectedQuoteLineIds, setSelectedQuoteLineIds] = useState<Set<string>>(new Set());

  // Address book search
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);

  const filteredClients = (clients || []).filter((c) => {
    const search = clientSearch.toLowerCase();
    return (
      (c.companyName?.toLowerCase() || "").includes(search) ||
      (c.firstName?.toLowerCase() || "").includes(search) ||
      (c.lastName?.toLowerCase() || "").includes(search) ||
      c.name.toLowerCase().includes(search)
    );
  });

  const handleSelectExistingClient = (c: Client) => {
    setNewClientType(c.type || "pro");
    setNewCompanyName(c.companyName || c.name || "");
    setNewFirstName(c.firstName || "");
    setNewLastName(c.lastName || "");
    setNewSiret(c.siret || "");
    setClientSearch("");
    setShowClientList(false);
  };

  const handleSiretLookup = async (s: string) => {
    const clean = s.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setIsFetchingSiret(true);
    try {
      const data = await searchCompanyBySiret(clean);
      if (data && data.name) {
        setNewCompanyName(data.name);
      }
    } finally {
      setIsFetchingSiret(false);
    }
  };

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportMonth, setExportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const handleExportCSV = () => {
    const [year = "0", month = "0"] = exportMonth.split("-");
    const filteredInvoices = invoices.filter(inv => {
      if (!inv.date) return false;
      const d = new Date(inv.date);
      return d.getFullYear() === parseInt(year) && (d.getMonth() + 1) === parseInt(month);
    });
    
    if (filteredInvoices.length === 0) {
      alert(lang === "fr" ? "Aucune facture sur ce mois." : "No invoices for this month.");
      return;
    }
    
    const csv = generateAccountingExportCSV(filteredInvoices);
    downloadCSV(csv, `export_compta_${exportMonth}.csv`);
    setIsExportModalOpen(false);
  };

  const quoteInvoiceLines = quoteToInvoice ? invoiceLinesFromQuote(quoteToInvoice) : [];
  const invoicedQuoteLineIds = new Set(quoteToInvoice?.invoicedLineIds ?? []);
  const selectedQuoteLines = selectInvoiceLines(quoteInvoiceLines, selectedQuoteLineIds);
  const selectedQuoteTotals = calculateInvoiceTotals(selectedQuoteLines);

  const openQuoteInvoice = (quote: Quote) => {
    const lines = invoiceLinesFromQuote(quote);
    const alreadyInvoiced = new Set(quote.invoicedLineIds ?? []);
    setQuoteToInvoice(quote);
    setSelectedQuoteLineIds(new Set(lines.filter((line) => !alreadyInvoiced.has(line.id)).map((line) => line.id)));
  };

  useEffect(() => {
    const quoteNumber = new URLSearchParams(window.location.search).get("devis");
    if (!quoteNumber) return;
    const quote = quotes.find((item) => item.number === quoteNumber);
    if (!quote) return;
    openQuoteInvoice(quote);
    window.history.replaceState({}, "", "/factures#factures-a-creer");
  }, [quotes]);

  const toggleQuoteLine = (lineId: string) => {
    if (invoicedQuoteLineIds.has(lineId)) return;
    setSelectedQuoteLineIds((previous) => {
      const next = new Set(previous);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const handleCreateInvoiceFromQuote = (status: InvoiceStatus = "draft") => {
    if (!quoteToInvoice || selectedQuoteLines.length === 0) return;
    const today = new Date();
    const due = new Date(today);
    due.setDate(today.getDate() + (company.paymentTermsDays || 30));

    const num = company.nextInvoiceNumber || 1;
    const pad = String(num).padStart(4, "0");
    const year = today.getFullYear();
    const invoiceNumber = `${company.invoicePrefix || "FA"}-${year}-${pad}`;

    const newInvoice: Invoice = {
      number: invoiceNumber,
      client: quoteToInvoice.client,
      ...(quoteToInvoice.clientId ? { clientId: quoteToInvoice.clientId } : {}),
      date: today.toISOString().split("T")[0] ?? "",
      due: due.toISOString().split("T")[0] ?? "",
      amount: selectedQuoteTotals.totalTTC,
      totalHT: selectedQuoteTotals.totalHT,
      totalVAT: selectedQuoteTotals.totalTVA,
      status,
      ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}),
      sourceQuoteNumber: quoteToInvoice.number,
      items: selectedQuoteLines,
    };
    
    addInvoice(newInvoice);
    updateCompany({ nextInvoiceNumber: num + 1 });
    const nextInvoicedLineIds = Array.from(
      new Set([...(quoteToInvoice.invoicedLineIds ?? []), ...selectedQuoteLines.map((line) => line.id)]),
    );
    updateQuote(quoteToInvoice.number, {
      ...quoteToInvoice,
      invoicedLineIds: nextInvoicedLineIds,
      status: { fr: "Facturé", en: "Invoiced" },
    });
    setQuoteToInvoice(null);
    setSelectedQuoteLineIds(new Set());
  };

  // isQuoteReadyToInvoice couvre : Signé, Facturé, Payé
  const pendingQuotes = (quotes || []).filter((q) => {
    if (!isQuoteReadyToInvoice(q.status.fr)) return false;
    const billed = new Set(q.invoicedLineIds ?? []);
    return invoiceLinesFromQuote(q).some((line) => !billed.has(line.id));
  });

  // Reminder modal
  const [reminderInvoice, setReminderInvoice] = useState<Invoice | null>(null);
  const [isReminderOpen, setIsReminderOpen] = useState(false);

  // Confirm paid modal
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("virement");
  const [paymentAmount, setPaymentAmount] = useState("");

  const rows = invoices.filter((invoice) => {
    const matchesStatus = filter === "all" || invoice.status === filter;
    return matchesStatus && (!dateFrom || invoice.date >= dateFrom) && (!dateTo || invoice.date <= dateTo);
  });

  const openClientHistory = (clientName: string) => {
    window.localStorage.setItem("invoicepro_client_focus", clientName);
    navigate({ to: "/clients" });
  };

  // KPIs — Bug 6 corrigé : on somme les TTC puis on recalcule HT
  // Sans taux TVA stocké par facture, on affiche le CA TTC total (plus fiable)
  const totalTTC = invoices.reduce((s, i) => s + i.amount, 0);
  const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.amount, 0);
  const overdue = invoices.filter((i) => i.status === "late").reduce((s, i) => s + i.amount, 0);
  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  const kpis = [
    {
      label: t("inv.kpi.count"),
      value: invoices.length.toString(),
      icon: ReceiptEuro,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("inv.kpi.total") + " (TTC)",
      value: money(totalTTC),
      icon: ReceiptEuro,
      tone: "text-foreground",
      bg: "bg-muted",
    },
    {
      label: t("inv.kpi.pending"),
      value: money(pending),
      icon: Clock,
      tone: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: t("inv.kpi.overdue"),
      value: money(overdue),
      icon: AlertTriangle,
      tone: "text-destructive",
      bg: "bg-destructive/10",
    },
  ];

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClientType === "pro" && !newCompanyName) return;
    if (newClientType === "particulier" && (!newFirstName || !newLastName)) return;
    const validLines = newLines.filter((l) => l.label && parseFloat(l.priceHT) > 0);
    if (validLines.length === 0) return;

    const displayName = newClientType === "pro" ? newCompanyName : `${newFirstName} ${newLastName}`.trim();

    // Auto-save client if not exists
    const existing = clients?.find((c) => c.name.toLowerCase() === displayName.toLowerCase());
    const clientId = existing?.id ?? crypto.randomUUID();
    if (!existing && addClient) {
      addClient({
        id: clientId,
        type: newClientType,
        name: displayName,
        companyName: newClientType === "pro" ? newCompanyName : "",
        firstName: newClientType === "particulier" ? newFirstName : "",
        lastName: newClientType === "particulier" ? newLastName : "",
        siret: newClientType === "pro" ? newSiret : "",
        email: "",
        createdAt: new Date().toISOString().split("T")[0] ?? "",
      });
    }

    const today = new Date();
    const due = new Date(today);
    due.setDate(today.getDate() + (company.paymentTermsDays || 30));

    const num = company.nextInvoiceNumber || 1;
    const year = today.getFullYear();
    const pad = String(num).padStart(4, "0");

    const invoiceLines: InvoiceLine[] = validLines.map((l) => ({
      id: l.id,
      label: l.label,
      qty: parseFloat(l.qty) || 1,
      priceHT: parseFloat(l.priceHT) || 0,
      vatRate: parseFloat(l.vatRate) || 20,
    }));

    const totalHT = invoiceLines.reduce((s, l) => s + l.qty * l.priceHT, 0);
    const totalVAT = invoiceLines.reduce((s, l) => s + l.qty * l.priceHT * (l.vatRate / 100), 0);
    const totalTTC = totalHT + totalVAT;

    const newInvoice: Invoice = {
      number: `${company.invoicePrefix || "FA"}-${year}-${pad}`,
      client: displayName,
      clientId,
      date: today.toISOString().split("T")[0] ?? "",
      due: due.toISOString().split("T")[0] ?? "",
      amount: Math.round(totalTTC * 100) / 100,
      totalHT: Math.round(totalHT * 100) / 100,
      totalVAT: Math.round(totalVAT * 100) / 100,
      status: "draft",
      items: invoiceLines,
    };

    addInvoice(newInvoice);
    updateCompany({ nextInvoiceNumber: num + 1 });
    setIsNewOpen(false);
    setNewCompanyName("");
    setNewFirstName("");
    setNewLastName("");
    setNewSiret("");
    setNewAmount("");
    setNewLines([emptyLine()]);
    setClientSearch("");
    setShowClientList(false);
  };

  // Dupliquer une facture
  const handleDuplicate = (inv: Invoice) => {
    const today = new Date();
    const due = new Date(today);
    due.setDate(today.getDate() + (company.paymentTermsDays || 30));

    const num = company.nextInvoiceNumber || 1;
    const year = today.getFullYear();
    const pad = String(num).padStart(4, "0");
    const invoiceNumber = `${company.invoicePrefix || "FA"}-${year}-${pad}`;

    addInvoice({
      number: invoiceNumber,
      client: inv.client,
      ...(inv.clientId ? { clientId: inv.clientId } : {}),
      date: today.toISOString().split("T")[0] ?? "",
      due: due.toISOString().split("T")[0] ?? "",
      amount: inv.amount,
      ...(inv.totalHT !== undefined ? { totalHT: inv.totalHT } : {}),
      ...(inv.totalVAT !== undefined ? { totalVAT: inv.totalVAT } : {}),
      ...(inv.items ? { items: inv.items } : {}),
      status: "draft",
    });
    updateCompany({ nextInvoiceNumber: num + 1 });
  };

  // Marquer comme payé
  const handleMarkPaid = (inv: Invoice) => {
    const remaining = Math.max(0, inv.amount - (inv.paidAmount ?? 0));
    const amount = Math.min(remaining, Math.max(0, Number(paymentAmount.replace(",", ".")) || remaining));
    const updatedInvoice = recordInvoicePayment(inv, amount, new Date().toISOString(), paymentMethod);
    updateInvoice(inv.number, updatedInvoice);
    if (updatedInvoice.status === "paid" && inv.sourceQuoteNumber) {
      const sourceQuote = quotes.find((quote) => quote.number === inv.sourceQuoteNumber);
      if (sourceQuote) updateQuote(sourceQuote.number, { ...sourceQuote, status: { fr: "Payé", en: "Paid" } });
    }
    setPayingInvoice(null);
    setPaymentMethod("virement");
    setPaymentAmount("");
  };

  const openPaymentDialog = (invoice: Invoice) => {
    setPayingInvoice(invoice);
    setPaymentAmount(String(Math.max(0, invoice.amount - (invoice.paidAmount ?? 0))));
  };

  // Relance
  const handleSendReminder = (invoiceNumber: string, type: "J+7" | "J+15" | "J+30") => {
    const inv = invoices.find((i) => i.number === invoiceNumber);
    if (inv) {
      const updatedReminders = [...(inv.reminders || []), { date: new Date().toISOString(), type }];
      updateInvoice(invoiceNumber, { ...inv, reminders: updatedReminders });
    }
  };

  return (
    <>
      <PageHeader
        title={t("inv.title")}
        subtitle={t("inv.subtitle")}
        action={
          <div className="flex items-center gap-2">
            <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex">
                  <Download className="mr-2 h-4 w-4" />
                  {lang === "fr" ? "Export Comptable" : "Accounting Export"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{lang === "fr" ? "Export Comptable (CSV)" : "Accounting Export (CSV)"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>{lang === "fr" ? "Mois à exporter" : "Month to export"}</Label>
                    <Input
                      type="month"
                      value={exportMonth}
                      onChange={(e) => setExportMonth(e.target.value)}
                    />
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleExportCSV} className="w-full">
                      {lang === "fr" ? "Télécharger le fichier CSV" : "Download CSV file"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  {lang === "fr" ? "Nouvelle Facture" : "New Invoice"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer une facture</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4 mt-4">
                
                {/* Sélecteur depuis le carnet d'adresses */}
                {(clients || []).length > 0 && (
                  <div className="relative">
                    <Label className="text-xs text-muted-foreground">
                      Chercher dans le carnet d'adresses
                    </Label>
                    <Input
                      placeholder="Rechercher un client existant..."
                      value={clientSearch}
                      onChange={(e) => {
                        setClientSearch(e.target.value);
                        setShowClientList(true);
                      }}
                      onFocus={() => setShowClientList(true)}
                      className="mt-1"
                    />
                    {showClientList && clientSearch && filteredClients.length > 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
                        {filteredClients.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex flex-col gap-0.5"
                            onClick={() => handleSelectExistingClient(c)}
                          >
                            <span className="font-medium">
                              {c.companyName || c.name || `${c.firstName} ${c.lastName}`}
                            </span>
                            {c.city && (
                              <span className="text-xs text-muted-foreground">{c.city}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                    {showClientList && clientSearch && filteredClients.length === 0 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg p-3 text-sm text-muted-foreground">
                        Aucun client trouvé — remplissez le formulaire ci-dessous.
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-3 pt-2 border-t border-border">
                  <Label>Type de client</Label>
                  <RadioGroup
                    value={newClientType}
                    onValueChange={(val) => setNewClientType(val as "pro" | "particulier")}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pro" id="fact-pro" />
                      <Label htmlFor="fact-pro">Professionnel</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="particulier" id="fact-part" />
                      <Label htmlFor="fact-part">Particulier</Label>
                    </div>
                  </RadioGroup>
                </div>

                {newClientType === "pro" ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nom de la Société *</Label>
                      <Input
                        required
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        placeholder="Ex: Studio Acme"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Numéro SIRET</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={newSiret}
                          onChange={(e) => setNewSiret(e.target.value.replace(/\D/g, "").slice(0, 14))}
                          maxLength={14}
                          className="font-mono flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={!newSiret || newSiret.length !== 14 || isFetchingSiret}
                          onClick={() => handleSiretLookup(newSiret)}
                        >
                          {isFetchingSiret ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Prénom *</Label>
                      <Input
                        required
                        value={newFirstName}
                        onChange={(e) => setNewFirstName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nom *</Label>
                      <Input
                        required
                        value={newLastName}
                        onChange={(e) => setNewLastName(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Lignes de prestation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Prestations *</Label>
                    <button type="button" onClick={addNewLine} className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Plus className="h-3 w-3" /> Ajouter une ligne
                    </button>
                  </div>
                  <div className="space-y-2">
                    {/* En-têtes */}
                    <div className="grid grid-cols-[1fr_56px_96px_72px_28px] gap-1.5 text-xs text-muted-foreground px-1">
                      <span>Description</span><span className="text-center">Qté</span><span className="text-right">Prix HT</span><span className="text-right">TVA %</span><span/>
                    </div>
                    {newLines.map((line) => (
                      <div key={line.id} className="grid grid-cols-[1fr_56px_96px_72px_28px] gap-1.5 items-center">
                        <Input
                          required
                          placeholder="Description de la prestation"
                          value={line.label}
                          onChange={(e) => updateNewLine(line.id, "label", e.target.value)}
                          className="text-sm h-8"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="1"
                          value={line.qty}
                          onChange={(e) => updateNewLine(line.id, "qty", e.target.value)}
                          className="text-sm h-8 text-center"
                        />
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          placeholder="0.00"
                          value={line.priceHT}
                          onChange={(e) => updateNewLine(line.id, "priceHT", e.target.value)}
                          className="text-sm h-8 text-right"
                        />
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="20"
                          value={line.vatRate}
                          onChange={(e) => updateNewLine(line.id, "vatRate", e.target.value)}
                          className="text-sm h-8 text-right"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewLine(line.id)}
                          className="flex items-center justify-center text-muted-foreground hover:text-destructive"
                          disabled={newLines.length === 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {/* Récap totaux */}
                  {newLinesTotalTTC > 0 && (
                    <div className="rounded-lg bg-muted/30 px-3 py-2 mt-1 text-xs space-y-0.5 text-right">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total HT</span><span className="font-medium text-foreground">{newLinesTotals.totalHT.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>TVA</span><span className="font-medium text-foreground">{newLinesTotals.totalTVA.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                      </div>
                      <div className="flex justify-between font-semibold text-sm border-t border-border pt-1 mt-1">
                        <span>Total TTC</span><span className="text-primary">{newLinesTotalTTC.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Numéro attribué automatiquement :{" "}
                  <span className="font-mono font-semibold text-foreground">
                    {company.invoicePrefix || "FA"}-{new Date().getFullYear()}-
                    {String(company.nextInvoiceNumber || 1).padStart(4, "0")}
                  </span>
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={newLines.every((l) => !l.label || !parseFloat(l.priceHT))}>
                    Enregistrer (Brouillon)
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          </div>
        }
      />

      <Dialog open={quoteToInvoice !== null} onOpenChange={(open) => !open && setQuoteToInvoice(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une facture à partir du devis</DialogTitle>
          </DialogHeader>
          {quoteToInvoice && (
            <div className="mt-2 space-y-4">
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs font-semibold text-primary">{quoteToInvoice.number}</p>
                <p className="mt-0.5 font-semibold text-foreground">{quoteToInvoice.client}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Retirez les options ou prestations non réalisées. Le devis signé reste inchangé.
                </p>
              </div>

              <ScrollArea className="max-h-[45vh] rounded-lg border border-border">
                <div className="divide-y divide-border">
                  {quoteInvoiceLines.map((line) => {
                    const isInvoiced = invoicedQuoteLineIds.has(line.id);
                    const isSelected = selectedQuoteLineIds.has(line.id);
                    return (
                      <div
                        key={line.id}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors",
                          isInvoiced ? "bg-emerald-50/70" : !isSelected ? "bg-muted/30" : "hover:bg-muted/50",
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className={cn("block truncate text-sm font-medium", !isSelected && !isInvoiced && "text-muted-foreground line-through")}>{line.label}</span>
                            {line.kind === "option" && (
                              <span className="shrink-0 rounded-full bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning-foreground">OPTION</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {line.qty} × {money(line.priceHT)} HT · TVA {line.vatRate}%
                          </span>
                        </span>
                        <span className="text-sm font-semibold tabular-nums text-foreground">
                          {money(line.qty * line.priceHT)}
                        </span>
                        {isInvoiced ? (
                          <span className="min-w-20 rounded-md bg-emerald-100 px-2.5 py-1.5 text-center text-xs font-bold text-emerald-700">
                            Facturé
                          </span>
                        ) : (
                          <Button
                            type="button"
                            variant={isSelected ? "outline" : "secondary"}
                            size="sm"
                            onClick={() => toggleQuoteLine(line.id)}
                            className={cn("min-w-20", isSelected && "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive")}
                          >
                            {isSelected ? "Retirer" : "Ajouter"}
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="flex items-center justify-between rounded-lg bg-muted/60 px-4 py-3">
                <div className="text-xs text-muted-foreground">
                  {selectedQuoteLines.length} ligne{selectedQuoteLines.length > 1 ? "s" : ""} à facturer
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total TTC</p>
                  <p className="text-lg font-bold tabular-nums text-foreground">{money(selectedQuoteTotals.totalTTC)}</p>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" disabled={selectedQuoteLines.length === 0} onClick={() => handleCreateInvoiceFromQuote("draft")}>
                  <FileText className="mr-2 h-4 w-4" />
                  Enregistrer brouillon
                </Button>
                <Button disabled={selectedQuoteLines.length === 0} onClick={() => handleCreateInvoiceFromQuote("sent")}>
                  <Send className="mr-2 h-4 w-4" />
                  Créer et envoyer ({money(selectedQuoteTotals.totalTTC)} TTC)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Devis à facturer (Affiché uniquement s'il y a des devis "Signés") */}
      {pendingQuotes.length > 0 && (
        <div id="factures-a-creer" className="mb-6 scroll-mt-24 rounded-xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
                <FileText className="h-4 w-4 text-primary" />
                Factures à créer
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {pendingQuotes.length} devis avec des prestations ou options restant à facturer.
              </p>
            </div>
            <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
              Action requise
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            {pendingQuotes.map((q) => (
              <div key={q.number} className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/50">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-medium text-muted-foreground">{q.number}</span>
                    <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">Facture non créée</span>
                  </div>
                  <h3 className="font-semibold text-card-foreground line-clamp-1">{q.client}</h3>
                  <div className="text-sm font-medium mt-1">
                    {money(q.details?.totalTTC || q.amount || 0)}
                  </div>
                </div>
                <Button 
                  size="sm" 
                  className="w-full mt-auto" 
                  onClick={() => openQuoteInvoice(q)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Créer en 1 clic
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-6">
        {/* CA total — hero */}
        <div className="card-revenue card-hover relative overflow-hidden rounded-xl p-5 col-span-2 xl:col-span-1">
          <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.07]">
            <ReceiptEuro className="h-24 w-24" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
            {t("inv.kpi.total")} TTC
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{money(totalTTC)}</p>
        </div>
        <div className="card-elevated card-hover card-primary-accent p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("inv.kpi.count")}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ReceiptEuro className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{invoices.length}</p>
        </div>
        <div className="card-elevated card-hover card-warning-accent p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("inv.kpi.pending")}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/12">
              <Clock className="h-4 w-4 text-warning-foreground" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold">{money(pending)}</p>
        </div>
        <div className="card-elevated card-hover card-destructive-accent p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              {t("inv.kpi.overdue")}
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">{money(overdue)}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "paid", "sent", "late", "draft"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === key
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
            )}
          >
            {key === "all" ? t("inv.filter.all") : t(statusKey[key])}
            {key !== "all" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  filter === key ? "bg-white/20" : "bg-muted",
                )}
              >
                {invoices.filter((i) => i.status === key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-2 rounded-xl border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <CalendarDays className="h-4 w-4 text-primary" />
          Période d'émission
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-8 w-auto text-xs" aria-label="Date de début" />
          <span className="text-xs text-muted-foreground">au</span>
          <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-8 w-auto text-xs" aria-label="Date de fin" />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>
              Effacer
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated overflow-hidden">
        <div className="border-b border-border bg-gradient-subtle px-5 py-3">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {rows.length}{" "}
            {lang === "fr"
              ? `facture${rows.length > 1 ? "s" : ""}`
              : `invoice${rows.length > 1 ? "s" : ""}`}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-left text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                <th className="px-5 py-3">{t("inv.col.number")}</th>
                <th className="px-5 py-3">{t("inv.col.client")}</th>
                <th className="px-5 py-3">{t("inv.col.date")}</th>
                <th className="px-5 py-3">{t("inv.col.due")}</th>
                <th className="px-5 py-3 text-right">{t("inv.col.amount")}</th>
                <th className="px-5 py-3">{t("inv.col.status")}</th>
                <th className="px-5 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((inv) => {
                const late = inv.status === "late" ? daysSince(inv.due) : 0;
                return (
                  <tr key={inv.number} className="table-row-hover group">
                    <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                      {inv.number}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-bold text-primary">
                          {inv.client.substring(0, 2).toUpperCase()}
                        </div>
                        <button type="button" onClick={() => openClientHistory(inv.client)} className="text-left font-semibold hover:text-primary hover:underline underline-offset-4">
                          {inv.client}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">
                      <p>{date(inv.date)}</p>
                      {inv.sentAt && <p className="mt-0.5 text-[11px] font-medium text-primary">Envoyée le {date(inv.sentAt)}</p>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          inv.status === "late"
                            ? "font-semibold text-destructive"
                            : "text-muted-foreground"
                        }
                      >
                        {date(inv.due)}
                        {late > 0 && (
                          <span className="ml-1.5 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                            +{late}j
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-display font-bold">
                      {money(inv.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={cn(
                          "badge-status",
                          inv.status === "paid" &&
                            "bg-success/10 text-success ring-1 ring-success/25",
                          inv.status === "sent" &&
                            "bg-primary/8 text-primary ring-1 ring-primary/20",
                          inv.status === "late" &&
                            "bg-destructive/8 text-destructive ring-1 ring-destructive/20",
                          inv.status === "draft" &&
                            "bg-secondary text-muted-foreground ring-1 ring-border",
                        )}
                      >
                        <span
                          className={cn(
                            "h-1.5 w-1.5 rounded-full shrink-0",
                            inv.status === "paid" && "bg-success",
                            inv.status === "sent" && "bg-primary",
                            inv.status === "late" && "bg-destructive",
                            inv.status === "draft" && "bg-muted-foreground/40",
                          )}
                        />
                        {t(statusKey[inv.status])}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="Télécharger PDF + XML Factur-X"
                          disabled={exporting === inv.number}
                          onClick={async () => {
                            setExporting(inv.number);
                            await exportInvoicePdf(inv, company);
                            setExporting(null);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                        >
                          <Download
                            className={cn(
                              "h-3.5 w-3.5",
                              exporting === inv.number && "animate-pulse",
                            )}
                          />
                        </button>
                        {(inv.status === "late" || inv.status === "sent") && (
                          <button
                            title={t("inv.action.remind")}
                            onClick={() => {
                              setReminderInvoice(inv);
                              setIsReminderOpen(true);
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Bell className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {inv.status === "draft" && (
                          <button
                            title="Envoyer la facture"
                            onClick={() => updateInvoice(inv.number, { ...inv, status: "sent", sentAt: new Date().toISOString() })}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-[var(--shape-control)] border-2 border-navy bg-primary px-2.5 text-xs font-bold text-white shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-primary/90 hover:shadow-none"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Envoyer
                          </button>
                        )}
                        {(inv.status === "sent" || inv.status === "late") && (
                          <button
                            title="Valider le paiement"
                            onClick={() => openPaymentDialog(inv)}
                            className="flex h-8 items-center justify-center gap-1.5 rounded-[var(--shape-control)] border-2 border-navy bg-success px-2.5 text-xs font-bold text-white shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-success/90 hover:shadow-none"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Valider
                          </button>
                        )}
                        <button
                          title={t("inv.action.duplicate")}
                          onClick={() => handleDuplicate(inv)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-muted/30">
                <td
                  colSpan={4}
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Total filtré
                </td>
                <td className="px-5 py-3 text-right font-display font-bold">
                  {money(rows.reduce((s, i) => s + i.amount, 0))}
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal confirmation paiement */}
      <Dialog open={!!payingInvoice} onOpenChange={(open) => !open && setPayingInvoice(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Confirmer le paiement
            </DialogTitle>
          </DialogHeader>
          {payingInvoice && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg bg-muted/40 p-4 text-sm">
                <p className="font-semibold">{payingInvoice.client}</p>
                <p className="text-muted-foreground mt-0.5">{payingInvoice.number}</p>
                <p className="text-lg font-bold text-success mt-2">{money(payingInvoice.amount)}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Marquer cette facture comme payée ? Cette action met à jour le statut et l'inclut
                dans les encaissements.
              </p>
              <label className="block text-sm font-medium">
                Montant reçu
                <Input
                  type="number"
                  min="0.01"
                  max={Math.max(0, payingInvoice.amount - (payingInvoice.paidAmount ?? 0))}
                  step="0.01"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  className="mt-1.5"
                />
                {(payingInvoice.paidAmount ?? 0) > 0 && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Déjà encaissé : {money(payingInvoice.paidAmount ?? 0)}
                  </span>
                )}
              </label>
              <label className="block text-sm font-medium">
                Mode de règlement
                <select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option value="virement">Virement bancaire</option>
                  <option value="carte">Carte bancaire</option>
                  <option value="cheque">Chèque</option>
                  <option value="especes">Espèces</option>
                  <option value="prelevement">Prélèvement</option>
                  <option value="autre">Autre</option>
                </select>
              </label>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setPayingInvoice(null)}>
                  Annuler
                </Button>
                <Button
                  className="bg-success hover:bg-success/90 text-white gap-2"
                  onClick={() => handleMarkPaid(payingInvoice)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmer payé
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ReminderModal (Bug 3 corrigé) */}
      <ReminderModal
        invoice={reminderInvoice}
        isOpen={isReminderOpen}
        onClose={() => setIsReminderOpen(false)}
        onSend={handleSendReminder}
      />
    </>
  );
}
