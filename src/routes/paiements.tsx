import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, type Invoice } from "@/lib/data-context";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  ReceiptEuro,
  Search,
  Send,
  CalendarDays,
} from "lucide-react";
import { ReminderModal } from "@/components/ReminderModal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getInvoicePaymentState, markInvoiceAsPaid } from "@/lib/document-workflow";

export const Route = createFileRoute("/paiements")({
  component: PaymentsPage,
});

type PaymentFilter = "all" | "late" | "pending" | "paid" | "completed";
type PaymentRow = {
  id: string;
  document: string;
  client: string;
  source?: string;
  date: string;
  sentAt?: string;
  paidAt?: string;
  due?: string;
  amount: number;
  type: "invoice" | "quote";
  status: "late" | "pending" | "paid" | "completed" | "draft";
  invoice?: Invoice;
  daysLate?: number;
};

function PaymentsPage() {
  const { money, date } = useI18n();
  const navigate = useNavigate();
  const { invoices, quotes, updateInvoice, updateQuote } = useData();
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateField, setDateField] = useState<"activity" | "created" | "sent" | "due" | "paid">("activity");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rows = useMemo<PaymentRow[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const invoiceRows = invoices.map((invoice) => {
      const dueDate = new Date(invoice.due);
      dueDate.setHours(0, 0, 0, 0);
      const paymentState = getInvoicePaymentState(invoice, today);
      const isLate = paymentState === "late";
      const daysLate = isLate ? Math.floor((today.getTime() - dueDate.getTime()) / 86_400_000) : 0;
      const status: PaymentRow["status"] = paymentState;

      return {
        id: invoice.number,
        document: invoice.number,
        client: invoice.client,
        ...(invoice.sourceQuoteNumber ? { source: invoice.sourceQuoteNumber } : {}),
        date: invoice.date,
        ...(invoice.sentAt ? { sentAt: invoice.sentAt } : {}),
        ...(invoice.paidAt ? { paidAt: invoice.paidAt } : {}),
        due: invoice.due,
        amount: invoice.amount,
        type: "invoice" as const,
        status,
        invoice,
        daysLate,
      };
    });

    const quoteRows = quotes
      .filter((quote) => quote.status.fr === "Signé" && !invoices.some((invoice) => invoice.sourceQuoteNumber === quote.number))
      .map((quote) => ({
        id: quote.number,
        document: quote.number,
        client: quote.client,
        date: quote.date,
        amount: quote.amount,
        type: "quote" as const,
        status: "completed" as const,
      }));

    const order: Record<PaymentRow["status"], number> = { late: 0, pending: 1, draft: 2, completed: 3, paid: 4 };
    return [...invoiceRows, ...quoteRows].sort((a, b) => order[a.status] - order[b.status] || b.date.localeCompare(a.date));
  }, [invoices, quotes]);

  const counts = useMemo(() => ({
    late: rows.filter((row) => row.status === "late").length,
    pending: rows.filter((row) => row.status === "pending").length,
    paid: rows.filter((row) => row.status === "paid").length,
    completed: rows.filter((row) => row.status === "completed").length,
  }), [rows]);

  const visibleRows = rows.filter((row) => {
    const matchesFilter = filter === "all"
      || (filter === "late" && row.status === "late")
      || (filter === "pending" && (row.status === "pending" || row.status === "draft"))
      || (filter === "paid" && row.status === "paid")
      || (filter === "completed" && row.status === "completed");
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [row.document, row.client, row.source].filter(Boolean).some((value) => value!.toLowerCase().includes(term));
    const rowFilterDate = dateField === "created"
      ? row.date
      : dateField === "sent"
        ? row.sentAt
        : dateField === "due"
          ? row.due
          : dateField === "paid"
            ? row.paidAt
            : row.paidAt ?? row.sentAt ?? row.date;
    const normalizedFilterDate = rowFilterDate?.slice(0, 10);
    const matchesFrom = !dateFrom || (!!normalizedFilterDate && normalizedFilterDate >= dateFrom);
    const matchesTo = !dateTo || (!!normalizedFilterDate && normalizedFilterDate <= dateTo);
    return matchesFilter && matchesSearch && matchesFrom && matchesTo;
  });

  const openClientHistory = (clientName: string) => {
    window.localStorage.setItem("invoicepro_client_focus", clientName);
    navigate({ to: "/clients" });
  };

  const confirmPayment = (invoice: Invoice) => {
    updateInvoice(invoice.number, markInvoiceAsPaid(invoice));
    if (!invoice.sourceQuoteNumber) return;
    const quote = quotes.find((item) => item.number === invoice.sourceQuoteNumber);
    if (quote) updateQuote(quote.number, { ...quote, status: { fr: "Payé", en: "Paid" } });
  };

  const handleSendReminder = (invoiceNumber: string, type: "J+7" | "J+15" | "J+30") => {
    const invoice = invoices.find((item) => item.number === invoiceNumber);
    if (!invoice) return;
    updateInvoice(invoiceNumber, {
      ...invoice,
      reminders: [...(invoice.reminders || []), { date: new Date().toISOString(), type }],
    });
  };

  const filters: { id: PaymentFilter; label: string; count?: number; className: string }[] = [
    { id: "all", label: "Tous les mouvements", className: "bg-foreground text-background" },
    { id: "late", label: "Factures en retard", count: counts.late, className: "bg-destructive/10 text-destructive" },
    { id: "pending", label: "À encaisser", count: counts.pending, className: "bg-orange-100 text-orange-700" },
    { id: "paid", label: "Factures réglées", count: counts.paid, className: "bg-emerald-100 text-emerald-700" },
    { id: "completed", label: "Prestations terminées", count: counts.completed, className: "bg-primary/10 text-primary" },
  ];

  return (
    <>
      <PageHeader
        title="Paiements & suivi"
        subtitle="Suivez chaque encaissement et les prestations prêtes à facturer, sans perdre le fil."
      />

      <div className="space-y-5 p-4 lg:p-6">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <SummaryCard label="À encaisser" value={money(rows.filter((row) => row.status === "pending" || row.status === "late").reduce((sum, row) => sum + row.amount, 0))} icon={Clock3} tone="orange" />
          <SummaryCard label="En retard" value={money(rows.filter((row) => row.status === "late").reduce((sum, row) => sum + row.amount, 0))} icon={AlertTriangle} tone="red" />
          <SummaryCard label="Encaissé" value={money(rows.filter((row) => row.status === "paid").reduce((sum, row) => sum + row.amount, 0))} icon={CheckCircle2} tone="green" />
          <SummaryCard label="Devis à facturer" value={String(counts.completed)} icon={FileText} tone="blue" />
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border p-4 lg:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold">Registre des paiements</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">{visibleRows.length} ligne{visibleRows.length > 1 ? "s" : ""} affichée{visibleRows.length > 1 ? "s" : ""}</p>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Client, facture ou devis…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    filter === item.id ? item.className : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {item.label}{item.count !== undefined ? ` · ${item.count}` : ""}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><CalendarDays className="h-3.5 w-3.5 text-primary" /> Période</span>
              <select value={dateField} onChange={(event) => setDateField(event.target.value as typeof dateField)} className="h-8 rounded-lg border border-border bg-background px-2 text-xs" aria-label="Type de date">
                <option value="activity">Dernière activité</option>
                <option value="created">Création</option>
                <option value="sent">Envoi</option>
                <option value="due">Échéance</option>
                <option value="paid">Règlement</option>
              </select>
              <input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-xs" aria-label="Date de début" />
              <span className="text-xs text-muted-foreground">au</span>
              <input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-8 rounded-lg border border-border bg-background px-2 text-xs" aria-label="Date de fin" />
              {(dateFrom || dateTo) && <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }} className="text-xs font-semibold text-primary hover:underline">Effacer</button>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-border bg-muted/35 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Document</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Date / échéance</th>
                  <th className="px-5 py-3 text-right">Montant TTC</th>
                  <th className="px-5 py-3">État</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleRows.map((row) => (
                  <tr key={row.id} className="transition-colors hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", row.type === "invoice" ? "bg-violet-100 text-violet-700" : "bg-primary/10 text-primary")}>
                          {row.type === "invoice" ? <ReceiptEuro className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </span>
                        <div>
                          <p className="font-mono text-xs font-semibold">{row.document}</p>
                          <p className="text-[11px] text-muted-foreground">{row.type === "invoice" ? "Facture" : "Devis signé"}{row.source ? ` · ${row.source}` : ""}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><button type="button" onClick={() => openClientHistory(row.client)} className="font-medium hover:text-primary hover:underline underline-offset-4">{row.client}</button></td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground">
                      <p>{date(row.date)}</p>
                      {row.due && <p className={cn("mt-0.5", row.status === "late" && "font-semibold text-destructive")}>Échéance : {date(row.due)}{row.daysLate ? ` · +${row.daysLate} j` : ""}</p>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-display font-bold tabular-nums">{money(row.amount)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={row.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      {row.status === "late" && row.invoice && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedInvoice(row.invoice!); setIsModalOpen(true); }} className="gap-1.5">
                          <Send className="h-3.5 w-3.5" /> Relancer
                        </Button>
                      )}
                      {(row.status === "pending") && row.invoice && (
                        <Button size="sm" onClick={() => confirmPayment(row.invoice!)} className="gap-1.5 bg-success text-white hover:bg-success/90">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Paiement reçu
                        </Button>
                      )}
                      {row.status === "draft" && <span className="text-xs text-muted-foreground">À envoyer depuis Factures</span>}
                      {row.status === "paid" && <span className="text-xs font-semibold text-success">Encaissement validé</span>}
                      {row.status === "completed" && <span className="text-xs text-primary">À facturer</span>}
                    </td>
                  </tr>
                ))}
                {visibleRows.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">Aucun document ne correspond à ce filtre.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ReminderModal invoice={selectedInvoice} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSend={handleSendReminder} />
    </>
  );
}

function StatusBadge({ status }: { status: PaymentRow["status"] }) {
  const config = {
    late: { label: "En retard", className: "bg-destructive/10 text-destructive" },
    pending: { label: "À encaisser", className: "bg-orange-100 text-orange-700" },
    draft: { label: "Brouillon", className: "bg-secondary text-muted-foreground" },
    paid: { label: "Réglée", className: "bg-emerald-100 text-emerald-700" },
    completed: { label: "Prestation terminée", className: "bg-primary/10 text-primary" },
  }[status];
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", config.className)}>{config.label}</span>;
}

function SummaryCard({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Clock3; tone: "orange" | "red" | "green" | "blue" }) {
  const styles = {
    orange: "border-orange-200 bg-orange-50/50 text-orange-700",
    red: "border-destructive/20 bg-destructive/5 text-destructive",
    green: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
    blue: "border-primary/20 bg-primary/5 text-primary",
  }[tone];
  return <div className={cn("rounded-xl border p-4", styles)}><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p><Icon className="h-4 w-4" /></div><p className="mt-2 font-display text-xl font-bold tabular-nums">{value}</p></div>;
}
