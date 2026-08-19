import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, type Quote, type Invoice } from "@/lib/data-context";
import { exportQuotePdf, exportInvoicePdf } from "@/lib/pdf-export";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  ReceiptEuro,
  Search,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/archives")({
  component: ArchivesPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type AffaireStatus = "paid" | "invoiced" | "refused" | "closed";

type Affaire = {
  id: string;
  client: string;
  quote?: Quote;
  invoices: Invoice[];
  date: string;        // date la plus récente pour le tri
  amount: number;      // montant de référence (facture si existe, sinon devis)
  status: AffaireStatus;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function affaireStatus(quote?: Quote, invoices?: Invoice[]): AffaireStatus {
  if (invoices && invoices.length > 0) {
    const allPaid = invoices.every((i) => i.status === "paid");
    if (allPaid) return "paid";
    return "invoiced";
  }
  if (quote?.status.fr === "Refusé") return "refused";
  return "closed";
}

function latestDate(...dates: (string | undefined)[]): string {
  return dates.filter(Boolean).sort().reverse()[0] ?? "";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ArchivesPage() {
  const { money, date } = useI18n();
  const navigate = useNavigate();
  const { invoices, quotes, company, profile } = useData();
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<AffaireStatus | "all">("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState<string | null>(null);

  // ── Construire les affaires ────────────────────────────────────────────────
  const affaires = useMemo<Affaire[]>(() => {
    const archivedQuoteStatuses = ["Refusé", "Payé", "Facturé", "Clôturé"];
    const linkedInvoiceNumbers = new Set<string>();

    // Affaires avec devis source
    const quoteAffaires: Affaire[] = quotes
      .filter((q) => archivedQuoteStatuses.includes(q.status.fr))
      .map((q) => {
        const linked = invoices.filter((i) => i.sourceQuoteNumber === q.number);
        linked.forEach((i) => linkedInvoiceNumbers.add(i.number));
        const status = affaireStatus(q, linked);
        const lastDate = latestDate(
          q.date,
          q.sentAt,
          q.signedAt,
          ...linked.map((i) => i.paidAt ?? i.sentAt ?? i.date),
        );
        const amount = linked.length > 0
          ? linked.reduce((s, i) => s + i.amount, 0)
          : q.amount;
        return { id: q.number, client: q.client, quote: q, invoices: linked, date: lastDate, amount, status };
      });

    // Factures sans devis source (créées manuellement)
    const standaloneInvoiceAffaires: Affaire[] = invoices
      .filter((i) => i.status === "paid" && !linkedInvoiceNumbers.has(i.number) && !i.sourceQuoteNumber)
      .map((i) => ({
        id: i.number,
        client: i.client,
        invoices: [i],
        date: i.paidAt ?? i.sentAt ?? i.date,
        amount: i.amount,
        status: "paid" as const,
      }));

    return [...quoteAffaires, ...standaloneInvoiceAffaires].sort((a, b) =>
      b.date.localeCompare(a.date),
    );
  }, [quotes, invoices]);

  // ── Filtres ───────────────────────────────────────────────────────────────
  const visible = affaires.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    const term = search.trim().toLowerCase();
    if (term) {
      const hay = [a.client, a.quote?.number, ...a.invoices.map((i) => i.number)]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(term)) return false;
    }
    if (dateFrom && a.date < dateFrom) return false;
    if (dateTo && a.date > dateTo) return false;
    return true;
  });

  // ── Compteurs ─────────────────────────────────────────────────────────────
  const counts = useMemo(() => ({
    paid: affaires.filter((a) => a.status === "paid").length,
    invoiced: affaires.filter((a) => a.status === "invoiced").length,
    refused: affaires.filter((a) => a.status === "refused").length,
  }), [affaires]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openClientHistory = (clientName: string) => {
    window.localStorage.setItem("invoicepro_client_focus", clientName);
    navigate({ to: "/clients" });
  };

  const handleDownloadQuote = async (q: Quote) => {
    setExporting(q.number);
    try {
      await exportQuotePdf(q, company, profile?.plan_tier);
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadInvoice = async (inv: Invoice) => {
    setExporting(inv.number);
    try {
      await exportInvoicePdf(inv, company, profile?.plan_tier);
    } finally {
      setExporting(null);
    }
  };

  const filterBtns: { id: AffaireStatus | "all"; label: string; count?: number }[] = [
    { id: "all", label: "Toutes les affaires" },
    { id: "paid", label: "Réglées", count: counts.paid },
    { id: "invoiced", label: "Facturées", count: counts.invoiced },
    { id: "refused", label: "Refusées", count: counts.refused },
  ];

  return (
    <>
      <PageHeader
        title="Archives"
        subtitle="Historique complet de vos affaires — devis et factures regroupés par dossier client."
      />

      <div className="space-y-5 p-4 lg:p-6">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

          {/* ── En-tête filtres ───────────────────────────────────────────── */}
          <div className="border-b border-border p-4 lg:p-5 space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-bold">Registre des affaires</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {visible.length} affaire{visible.length > 1 ? "s" : ""} — devis et factures liés sur la même ligne
                </p>
              </div>
              <div className="relative w-full lg:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Client, n° devis ou facture…"
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </div>

            {/* Filtres statut */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filterBtns.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setStatusFilter(f.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition",
                    statusFilter === f.id
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground hover:bg-muted/70",
                  )}
                >
                  {f.label}{f.count !== undefined ? ` · ${f.count}` : ""}
                </button>
              ))}
            </div>

            {/* Filtre date */}
            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Période
              </span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs" />
              <span className="text-xs text-muted-foreground">au</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="h-8 rounded-lg border border-border bg-background px-2 text-xs" />
              {(dateFrom || dateTo) && (
                <button type="button" onClick={() => { setDateFrom(""); setDateTo(""); }}
                  className="text-xs font-semibold text-primary hover:underline">Effacer</button>
              )}
            </div>
          </div>

          {/* ── Table ────────────────────────────────────────────────────────── */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-border bg-muted/35 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="w-8 px-3 py-3" />
                  <th className="px-4 py-3">Devis</th>
                  <th className="px-4 py-3">Facture(s)</th>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Montant TTC</th>
                  <th className="px-4 py-3">État</th>
                  <th className="px-4 py-3 text-right">Télécharger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((affaire) => {
                  const isExpanded = expandedIds.has(affaire.id);
                  const multipleInvoices = affaire.invoices.length > 1;

                  return (
                    <>
                      {/* ── Ligne principale ─────────────────────────────── */}
                      <tr
                        key={affaire.id}
                        className={cn(
                          "transition-colors hover:bg-muted/30",
                          isExpanded && "bg-muted/20",
                        )}
                      >
                        {/* Expand toggle (si plusieurs factures) */}
                        <td className="px-3 py-3.5">
                          {multipleInvoices ? (
                            <button
                              type="button"
                              onClick={() => toggleExpand(affaire.id)}
                              className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-muted"
                            >
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4" />
                                : <ChevronRight className="h-4 w-4" />}
                            </button>
                          ) : null}
                        </td>

                        {/* Devis */}
                        <td className="px-4 py-3.5">
                          {affaire.quote ? (
                            <div className="flex items-center gap-2">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <FileText className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p className="font-mono text-xs font-semibold">{affaire.quote.number}</p>
                                <p className="text-[10px] text-muted-foreground">{affaire.quote.status.fr}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Facture(s) */}
                        <td className="px-4 py-3.5">
                          {affaire.invoices.length === 0 ? (
                            <span className="text-xs text-muted-foreground">—</span>
                          ) : affaire.invoices.length === 1 ? (
                            <div className="flex items-center gap-2">
                              {affaire.quote && <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                                <ReceiptEuro className="h-3.5 w-3.5" />
                              </span>
                              <div>
                                <p className="font-mono text-xs font-semibold">{affaire.invoices[0]!.number}</p>
                                <p className="text-[10px] text-muted-foreground capitalize">
                                  {affaire.invoices[0]!.status === "paid" ? "Réglée" : "Envoyée"}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {affaire.quote && <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                                <ReceiptEuro className="h-3.5 w-3.5" />
                              </span>
                              <span className="text-xs font-semibold text-orange-700">
                                {affaire.invoices.length} factures
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Client */}
                        <td className="px-4 py-3.5">
                          <button
                            type="button"
                            onClick={() => openClientHistory(affaire.client)}
                            className="font-medium hover:text-primary hover:underline underline-offset-4"
                          >
                            {affaire.client}
                          </button>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {date(affaire.date.slice(0, 10))}
                        </td>

                        {/* Montant */}
                        <td className="px-4 py-3.5 text-right font-display font-bold tabular-nums">
                          {money(affaire.amount)}
                        </td>

                        {/* Statut */}
                        <td className="px-4 py-3.5">
                          <AffaireStatusBadge status={affaire.status} />
                        </td>

                        {/* Télécharger */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            {affaire.quote && (
                              <button
                                type="button"
                                title={`PDF ${affaire.quote.number}`}
                                onClick={() => handleDownloadQuote(affaire.quote!)}
                                disabled={exporting === affaire.quote.number}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
                              >
                                {exporting === affaire.quote.number
                                  ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  : <FileText className="h-3.5 w-3.5" />}
                              </button>
                            )}
                            {affaire.invoices.length === 1 && (
                              <button
                                type="button"
                                title={`PDF ${affaire.invoices[0]!.number}`}
                                onClick={() => handleDownloadInvoice(affaire.invoices[0]!)}
                                disabled={exporting === affaire.invoices[0]!.number}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-orange-500 hover:text-orange-600 disabled:opacity-40"
                              >
                                {exporting === affaire.invoices[0]!.number
                                  ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                  : <ReceiptEuro className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ── Sous-lignes (multi-factures) ─────────────────── */}
                      {multipleInvoices && isExpanded && affaire.invoices.map((inv) => (
                        <tr key={inv.number} className="bg-muted/10">
                          <td />
                          <td />
                          <td className="px-4 py-2.5" colSpan={1}>
                            <div className="flex items-center gap-2 pl-2">
                              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-orange-100 text-orange-700">
                                <ReceiptEuro className="h-3 w-3" />
                              </span>
                              <div>
                                <p className="font-mono text-xs font-semibold">{inv.number}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {inv.status === "paid" ? "Réglée" : "Envoyée"} · {date(inv.date)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td />
                          <td />
                          <td className="px-4 py-2.5 text-right font-display text-sm font-semibold tabular-nums text-muted-foreground">
                            {money(inv.amount)}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold",
                              inv.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700",
                            )}>
                              {inv.status === "paid" ? "Réglée" : "Envoyée"}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              type="button"
                              title={`PDF ${inv.number}`}
                              onClick={() => handleDownloadInvoice(inv)}
                              disabled={exporting === inv.number}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition hover:border-orange-500 hover:text-orange-600 disabled:opacity-40 ml-auto"
                            >
                              {exporting === inv.number
                                ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                : <ReceiptEuro className="h-3.5 w-3.5" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center text-sm text-muted-foreground">
                      Aucune affaire archivée ne correspond à ce filtre.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}

function AffaireStatusBadge({ status }: { status: AffaireStatus }) {
  const config: Record<AffaireStatus, { label: string; className: string }> = {
    paid:     { label: "Réglée ✓",       className: "bg-emerald-100 text-emerald-700" },
    invoiced: { label: "Facturée",        className: "bg-orange-100 text-orange-700" },
    refused:  { label: "Refusée",         className: "bg-muted text-muted-foreground" },
    closed:   { label: "Clôturée",        className: "bg-primary/10 text-primary" },
  };
  const c = config[status];
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold", c.className)}>
      {c.label}
    </span>
  );
}
