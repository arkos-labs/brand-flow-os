import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  GripVertical,
  KanbanSquare,
  Send,
  PenLine,
  Clock,
  CheckCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { type Quote } from "@/lib/data-context";
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

type ColumnId = "Brouillon" | "Envoyé" | "Signé" | "EnAttente" | "Refusé";

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
    label: "Brouillon",
    sublabel: "À envoyer",
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
    sublabel: "Validé",
    dotColor: "bg-primary",
    accentBg: "bg-primary/10",
    accentText: "text-primary",
    headerBg: "bg-primary/5",
  },
  {
    id: "EnAttente",
    label: "En attente",
    sublabel: "De paiement",
    dotColor: "bg-orange-400",
    accentBg: "bg-orange-100",
    accentText: "text-orange-600",
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

const statusMap: Record<ColumnId, { fr: string; en: string }> = {
  Brouillon: { fr: "Brouillon", en: "Draft" },
  Envoyé: { fr: "Envoyé", en: "Sent" },
  Signé: { fr: "Signé", en: "Signed" },
  EnAttente: { fr: "En attente", en: "Awaiting payment" },
  Refusé: { fr: "Refusé", en: "Refused" },
};

/** Détermine la colonne Kanban à partir du statut d'un devis */
function getColumnId(statusFr: string): ColumnId {
  if (statusFr === "Brouillon") return "Brouillon";
  if (statusFr === "Envoyé" || statusFr.includes("Vue")) return "Envoyé";
  if (statusFr === "Signé") return "Signé";
  if (statusFr === "En attente" || statusFr === "En attente de paiement") return "EnAttente";
  if (statusFr === "Refusé" || statusFr === "Expiré") return "Refusé";
  return "Brouillon";
}

function Pipeline() {
  const { money, date } = useI18n();
  const { quotes, updateQuote, addQuote, company, updateCompany } = useData();

  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ColumnId | null>(null);

  // Les devis "Payé" disparaissent du pipeline
  const pipelineQuotes = quotes.filter(
    (q) => q.status.fr !== "Payé" && q.status.en !== "Paid",
  );

  /* ── Actions ─────────────────────────────────────────────── */

  const moveQuote = (quote: Quote, target: ColumnId) => {
    updateQuote(quote.number, { ...quote, status: statusMap[target] });
  };

  const markPaid = (quote: Quote) => {
    // Passer en "Payé" → le devis disparaît du pipeline
    updateQuote(quote.number, {
      ...quote,
      status: { fr: "Payé", en: "Paid" },
    });
  };

  const duplicateAsDraft = (quote: Quote) => {
    const year = new Date().getFullYear();
    const prefix = company.quotePrefix || "DV";
    const nextNum = company.nextQuoteNumber ?? 1;
    const newNumber = `${prefix}-${year}-${String(nextNum).padStart(3, "0")}`;
    const newQuote: Quote = {
      ...quote,
      number: newNumber,
      date: new Date().toISOString().split("T")[0]!,
      status: { fr: "Brouillon", en: "Draft" },
    };
    addQuote(newQuote);
    updateCompany({ nextQuoteNumber: nextNum + 1 });
  };

  /* ── Drag & drop ─────────────────────────────────────────── */

  const drop = (targetCol: ColumnId) => {
    if (dragId) {
      const quote = quotes.find((q) => q.number === dragId);
      if (quote) {
        const currentCol = getColumnId(quote.status.fr);
        if (currentCol !== targetCol) {
          updateQuote(dragId, { ...quote, status: statusMap[targetCol] });
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
                (q) => q.status.fr === "Signé" || q.status.fr === "En attente",
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
      <div className="grid grid-cols-3 gap-3 xl:grid-cols-5 min-h-[60vh]">
        {columns.map((col) => {
          const items = pipelineQuotes.filter(
            (q) => getColumnId(q.status.fr) === col.id,
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
                {items.map((quote) => (
                  <article
                    key={quote.number}
                    draggable
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
                    <div className="mt-3 border-t border-border pt-2.5 pl-6">
                      <span
                        className={cn(
                          "font-display text-sm font-bold",
                          col.accentText,
                        )}
                      >
                        {money(quote.amount)}
                      </span>
                    </div>

                    {/* ── Boutons d'action selon la colonne ── */}
                    <div className="mt-2 pl-6 flex flex-col gap-1.5">

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

                      {/* ENVOYÉ → Signé / Refusé (client) */}
                      {col.id === "Envoyé" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuote(quote, "Signé");
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors w-full"
                          >
                            <PenLine className="h-3 w-3" />
                            Signé par le client
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveQuote(quote, "Refusé");
                            }}
                            className="flex items-center justify-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-[11px] font-semibold text-destructive hover:bg-destructive/20 transition-colors w-full"
                          >
                            <X className="h-3 w-3" />
                            Refusé par le client
                          </button>
                        </>
                      )}

                      {/* SIGNÉ → En attente de paiement */}
                      {col.id === "Signé" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            moveQuote(quote, "EnAttente");
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-md bg-orange-100 px-2.5 py-1.5 text-[11px] font-semibold text-orange-600 hover:bg-orange-200 transition-colors w-full"
                        >
                          <Clock className="h-3 w-3" />
                          En attente de paiement
                        </button>
                      )}

                      {/* EN ATTENTE → Marquer payé (disparaît) */}
                      {col.id === "EnAttente" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markPaid(quote);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-md bg-success/10 px-2.5 py-1.5 text-[11px] font-semibold text-success hover:bg-success/20 transition-colors w-full"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Payé ✓
                        </button>
                      )}

                      {/* REFUSÉ → Modifier le devis (nouveau brouillon) */}
                      {col.id === "Refusé" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateAsDraft(quote);
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary hover:bg-primary/20 transition-colors w-full"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Modifier le devis
                        </button>
                      )}
                    </div>
                  </article>
                ))}

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
    </>
  );
}
