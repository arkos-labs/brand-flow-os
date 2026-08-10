import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GripVertical,
  KanbanSquare,
  Send,
  ReceiptEuro,
  CheckCircle,
  Clock3,
  RefreshCw,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { QuoteEditorDialog } from "@/components/QuoteEditorDialog";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { type Quote } from "@/lib/data-context";
import {
  canMoveQuoteManually,
  getInvoicePaymentState,
  getQuotePipelineStage,
  markInvoiceAsPaid,
  type QuotePipelineStage,
} from "@/lib/document-workflow";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline des devis — InvoicePro" },
      {
        name: "description",
        content: "Pipeline Kanban : suivez l'avancement de vos devis.",
      },
    ],
  }),
  component: Pipeline,
});

type ColumnId = QuotePipelineStage;

const columns: {
  id: ColumnId;
  label: string;
  sublabel: string;
  dotColor: string;
  accentBg: string;
  accentText: string;
  headerBg: string;
}[] = [
  {
    id: "Brouillon",
    label: "En attente d’envoi",
    sublabel: "Devis à envoyer",
    dotColor: "bg-muted-foreground/50",
    accentBg: "bg-secondary",
    accentText: "text-muted-foreground",
    headerBg: "bg-muted/30",
  },
  {
    id: "Envoyé",
    label: "Envoyé",
    sublabel: "En attente client",
    dotColor: "bg-warning",
    accentBg: "bg-warning/15",
    accentText: "text-warning-foreground",
    headerBg: "bg-warning/5",
  },
  {
    id: "Signé",
    label: "Signé",
    sublabel: "À facturer",
    dotColor: "bg-primary",
    accentBg: "bg-primary/10",
    accentText: "text-primary",
    headerBg: "bg-primary/5",
  },
  {
    id: "Facturé",
    label: "Facturé",
    sublabel: "Facture brouillon",
    dotColor: "bg-violet-500",
    accentBg: "bg-violet-100",
    accentText: "text-violet-700",
    headerBg: "bg-violet-50",
  },
  {
    id: "APayer",
    label: "À payer",
    sublabel: "En attente client",
    dotColor: "bg-orange-500",
    accentBg: "bg-orange-100",
    accentText: "text-orange-700",
    headerBg: "bg-orange-50",
  },
  {
    id: "Refusé",
    label: "Refusé",
    sublabel: "/ Expiré",
    dotColor: "bg-destructive",
    accentBg: "bg-destructive/10",
    accentText: "text-destructive",
    headerBg: "bg-destructive/5",
  },
];

const statusMap: Partial<Record<ColumnId, { fr: string; en: string }>> = {
  Brouillon: { fr: "Brouillon", en: "Draft" },
  Envoyé: { fr: "Envoyé", en: "Sent" },
};

function Pipeline() {
  const { money, date } = useI18n();
  const { quotes, invoices, clients, products, updateQuote, updateInvoice } = useData();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnId | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [saveNotice, setSaveNotice] = useState("");

  const pipelineQuotes = quotes.filter((quote) => {
    const linkedInvoices = invoices.filter((invoice) => invoice.sourceQuoteNumber === quote.number);
    return !["Payé", "Expiré"].includes(quote.status.fr) &&
      !(linkedInvoices.length > 0 && linkedInvoices.every((invoice) => invoice.status === "paid"));
  });

  /* ── Actions ─────────────────────────────────────────────── */

  const moveQuote = (quote: Quote, target: ColumnId) => {
    const targetStatus = statusMap[target];
    if (!targetStatus) return;
    updateQuote(quote.number, {
      ...quote,
      status: targetStatus,
      ...(target === "Envoyé" ? { sentAt: new Date().toISOString() } : {}),
    });
  };

  /* ── Drag & drop ─────────────────────────────────────────── */

  const drop = (targetCol: ColumnId) => {
    if (dragId) {
      const quote = quotes.find((q) => q.number === dragId);
      if (quote) {
        const currentCol = getQuotePipelineStage(quote, invoices);
        if (currentCol !== targetCol && canMoveQuoteManually(currentCol, targetCol)) {
          moveQuote(quote, targetCol);
        }
      }
    }
    setDragId(null);
    setOverCol(null);
  };

  /* ── Métriques ───────────────────────────────────────────── */

  const totalPipeline = pipelineQuotes.reduce((sum, q) => sum + q.amount, 0);

  return (
    <>
      <PageHeader
        title="Pipeline des devis"
        subtitle="Suivez l'avancement de vos propositions commerciales par simple glisser-déposer."
      />

      {saveNotice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {saveNotice}
        </div>
      )}

      {/* Métriques */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="card-revenue card-hover relative overflow-hidden rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="pointer-events-none absolute -right-2 -top-2 opacity-[0.07]">
            <KanbanSquare className="h-20 w-20" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
            Valeur pipeline
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-white">
            {money(totalPipeline)}
          </p>
        </div>

        <div className="card-elevated card-hover card-primary-accent p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Devis actifs
          </p>
          <p className="mt-1.5 font-display text-xl font-bold">
            {
              pipelineQuotes.filter(
                (q) => !["Refusé", "Expiré"].includes(q.status.fr),
              ).length
            }
          </p>
        </div>

        <div className="card-elevated card-hover card-success-accent p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Signés
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-success">
            {
              pipelineQuotes.filter(
                (q) => q.status.fr === "Signé",
              ).length
            }
          </p>
        </div>

        <div className="card-elevated card-hover card-destructive-accent p-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            Perdus
          </p>
          <p className="mt-1.5 font-display text-xl font-bold text-destructive">
            {
              pipelineQuotes.filter(
                (q) => q.status.fr === "Refusé" || q.status.fr === "Expiré",
              ).length
            }
          </p>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid min-h-[60vh] grid-flow-col auto-cols-[minmax(160px,1fr)] gap-3 overflow-x-auto pb-2">
        {columns.map((col) => {
          const items = pipelineQuotes.filter(
            (q) => getQuotePipelineStage(q, invoices) === col.id,
          );
          const colTotal = items.reduce((s, d) => s + d.amount, 0);

          return (
            <section
              key={col.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(col.id);
              }}
              onDragLeave={() => setOverCol((c) => (c === col.id ? null : c))}
              onDrop={() => drop(col.id)}
              className={cn(
                "flex flex-col rounded-xl border border-border bg-muted/20 transition-all duration-150",
                overCol === col.id &&
                  "ring-2 ring-primary ring-offset-2 bg-primary/3 scale-[1.01]",
              )}
            >
              {/* En-tête colonne */}
              <header
                className={cn(
                  "flex items-center justify-between rounded-t-xl border-b border-border px-3.5 py-3",
                  col.headerBg,
                )}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      col.dotColor,
                    )}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {col.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {col.sublabel}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                    col.accentBg,
                    col.accentText,
                  )}
                >
                  {items.length}
                </span>
              </header>

              {/* Total colonne */}
              {colTotal > 0 && (
                <div className="border-b border-border px-3.5 py-2 text-xs">
                  <span className="text-muted-foreground">Total · </span>
                  <span
                    className={cn("font-display font-bold", col.accentText)}
                  >
                    {money(colTotal)}
                  </span>
                </div>
              )}

              {/* Cartes */}
              <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-2.5">
                {items.map((quote) => {
                  const linkedInvoices = invoices.filter((invoice) => invoice.sourceQuoteNumber === quote.number);
                  const paymentStates = linkedInvoices.map((invoice) => getInvoicePaymentState(invoice));
                  const paymentState = paymentStates.includes("late")
                    ? "late"
                    : paymentStates.includes("pending")
                      ? "waiting"
                      : paymentStates.includes("draft")
                        ? "draft"
                        : paymentStates.length > 0 && paymentStates.every((state) => state === "paid")
                          ? "paid"
                          : null;

                  return (
                    <article
                    key={quote.number}
                    draggable={col.id === "Brouillon" || col.id === "Refusé"}
                    onDragStart={() => setDragId(quote.number)}
                    onDragEnd={() => setDragId(null)}
                    className={cn(
                      "card-elevated rounded-lg bg-card p-3 transition-all duration-150",
                      dragId === quote.number
                        ? "opacity-40 scale-95 cursor-grabbing"
                        : "cursor-grab hover:shadow-md",
                    )}
                  >
                    {/* Infos devis */}
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/30" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {quote.client}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                          {quote.number}
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {date(quote.date)}
                        </p>
                      </div>
                    </div>

                    {/* Montant */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5 pl-6">
                      <span
                        className={cn(
                          "font-display text-sm font-bold",
                          col.accentText,
                        )}
                      >
                        {money(quote.amount)}
                      </span>
                      {col.id === "Facturé" && paymentState && (
                        <span
                          className={cn(
                            "rounded-full px-2 py-1 text-[10px] font-bold",
                            paymentState === "draft" && "bg-secondary text-muted-foreground",
                            paymentState === "waiting" && "bg-orange-100 text-orange-700",
                            paymentState === "late" && "bg-destructive/10 text-destructive",
                            paymentState === "paid" && "bg-success/15 text-success",
                          )}
                        >
                          {paymentState === "draft" && "Facture brouillon"}
                          {paymentState === "waiting" && "En attente de paiement"}
                          {paymentState === "late" && "Paiement en retard"}
                          {paymentState === "paid" && "Paiement reçu"}
                        </span>
                      )}
                    </div>

                    {/* ── Boutons d'action selon la colonne ── */}
                    <div className="mt-2 pl-6 flex flex-col gap-1.5">

                      {/* Ouvre le devis concerné avec les informations client déjà renseignées. */}
                      {col.id === "Brouillon" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingQuote(quote);
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Modifier le devis
                        </button>
                      )}

                      {/* BROUILLON → Envoyer */}
                      {col.id === "Brouillon" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuote(quote, "Envoyé");
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-md bg-warning/10 px-2.5 py-1.5 text-[11px] font-semibold text-warning-foreground hover:bg-warning/25 transition-colors w-full"
                        >
                          <Send className="h-3 w-3" />
                          Envoyer
                        </button>
                      )}

                      {/* ENVOYÉ : la signature ou le refus vient automatiquement du portail client. */}
                      {col.id === "Envoyé" && (
                        <p className="rounded-md bg-warning/10 px-2.5 py-2 text-center text-[10px] font-medium text-warning-foreground">
                          En attente de la réponse du client
                        </p>
                      )}

                      {/* SIGNÉ → Créer la facture */}
                      {col.id === "Signé" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `/factures?devis=${encodeURIComponent(quote.number)}#factures-a-creer`;
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2.5 py-2 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-primary/90"
                        >
                          <ReceiptEuro className="h-3.5 w-3.5" />
                          Créer la facture
                        </button>
                      )}

                      {/* FACTURÉ → Envoyer la facture brouillon */}
                      {col.id === "Facturé" && linkedInvoices.some((invoice) => invoice.status === "draft") && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            linkedInvoices
                              .filter((invoice) => invoice.status === "draft")
                              .forEach((invoice) => updateInvoice(invoice.number, { ...invoice, status: "sent", sentAt: new Date().toISOString() }));
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-violet-600 px-2.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-violet-700"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Envoyer la facture
                        </button>
                      )}

                      {/* À PAYER → Confirmer l'encaissement */}
                      {col.id === "APayer" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            linkedInvoices
                              .filter((invoice) => invoice.status === "sent" || invoice.status === "late")
                              .forEach((invoice) => updateInvoice(invoice.number, markInvoiceAsPaid(invoice)));
                            updateQuote(quote.number, { ...quote, status: { fr: "Payé", en: "Paid" } });
                          }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-emerald-600 px-2.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-emerald-700"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          Paiement reçu
                        </button>
                      )}

                      {col.id === "APayer" && paymentState === "late" && (
                        <span className="flex items-center justify-center gap-1 text-[10px] font-semibold text-destructive">
                          <Clock3 className="h-3 w-3" /> Paiement en retard
                        </span>
                      )}

                      {/* REFUSÉ → Corriger le devis avec les données existantes */}
                      {col.id === "Refusé" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingQuote(quote);
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors w-full"
                          >
                            <RefreshCw className="h-3 w-3" />
                            Modifier le devis
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuote(quote.number, {
                                ...quote,
                                status: { fr: "Expiré", en: "Expired" },
                                closedAt: new Date().toISOString(),
                              });
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive w-full"
                          >
                            <X className="h-3 w-3" />
                            Clôturer
                          </button>
                        </>
                      )}
                    </div>
                    </article>
                  );
                })}

                {items.length === 0 && (
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border/40 py-8 text-center">
                    <p className="text-[11px] text-muted-foreground/50">
                      Glisser un devis ici
                    </p>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <QuoteEditorDialog
        quote={editingQuote}
        clients={clients}
        products={products}
        onOpenChange={(open) => {
          if (!open) setEditingQuote(null);
        }}
        onSave={(updated) => {
          updateQuote(updated.number, updated);
          setEditingQuote(null);
          setSaveNotice(`Le devis ${updated.number} a été mis à jour.`);
          window.setTimeout(() => setSaveNotice(""), 3500);
        }}
      />
    </>
  );
}
