import { createFileRoute } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { cn } from "@/lib/utils";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export const Route = createFileRoute("/tresorerie")({
  head: () => ({
    meta: [
      { title: "Trésorerie — InvoicePro" },
      { name: "description", content: "Suivi de votre trésorerie et cashflow prédictif." },
    ],
  }),
  component: Cashflow,
});

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-background px-3 py-2.5 shadow-lg text-xs">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-bold text-foreground">
            {new Intl.NumberFormat("fr-FR", {
              style: "currency",
              currency: "EUR",
              maximumFractionDigits: 0,
            }).format(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function Cashflow() {
  const { money, date } = useI18n();
  const { invoices } = useData();

  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const pendingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "late");
  const lateInvoices = invoices.filter((i) => i.status === "late");

  const totalInflows = paidInvoices.reduce((s, i) => s + i.amount, 0);
  const pendingInflows = pendingInvoices.reduce((s, i) => s + i.amount, 0);
  const lateAmount = lateInvoices.reduce((s, i) => s + i.amount, 0);
  const projected = totalInflows + pendingInflows;

  // Build 6-month chart data
  const now = new Date();
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString("fr-FR", { month: "short" }),
    };
  });

  const chartData = months6.map((m) => {
    const paid = paidInvoices
      .filter((i) => {
        const d = new Date(i.date);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      })
      .reduce((s, i) => s + i.amount, 0);
    const pending = pendingInvoices
      .filter((i) => {
        const d = new Date(i.due);
        return d.getFullYear() === m.year && d.getMonth() === m.month;
      })
      .reduce((s, i) => s + i.amount, 0);
    return { name: m.label, Encaissé: paid, "À venir": pending };
  });

  return (
    <>
      <PageHeader
        title="Trésorerie"
        subtitle="Vue synthétique de vos encaissements et créances en attente."
      />

      {/* ── KPIs ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
        {/* Solde réel — hero */}
        <div className="card-revenue card-hover relative overflow-hidden rounded-xl p-5">
          <div className="pointer-events-none absolute -right-3 -top-3 opacity-[0.07]">
            <Wallet className="h-28 w-28" />
          </div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/55">
            Encaissé (réel)
          </p>
          <p className="mt-2 font-display text-2xl font-bold text-white">{money(totalInflows)}</p>
          <p className="mt-1 text-[11px] text-white/40">
            {paidInvoices.length} facture{paidInvoices.length > 1 ? "s" : ""} payée
            {paidInvoices.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="card-elevated card-hover card-success-accent p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              À venir
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-success">
            {money(pendingInflows)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {pendingInvoices.length} créance{pendingInvoices.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="card-elevated card-hover card-destructive-accent p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              En retard
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-destructive">
            {money(lateAmount)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {lateInvoices.length} facture{lateInvoices.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="card-elevated card-hover card-primary-accent p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Solde projeté
            </p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-primary">{money(projected)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">Réel + à venir</p>
        </div>
      </div>

      {/* ── Area chart ── */}
      <div className="card-elevated mb-6 overflow-hidden">
        <div className="border-b border-border bg-gradient-subtle px-6 py-4">
          <h2 className="text-sm font-bold">Évolution des encaissements</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">6 derniers mois</p>
        </div>
        <div className="p-6">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Encaissé"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#gradPaid)"
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="À venir"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradPending)"
                dot={false}
                strokeDasharray="4 3"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Créances en attente ── */}
      <div className="card-elevated overflow-hidden">
        <div className="border-b border-border bg-gradient-subtle px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Créances en attente</h2>
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
              {pendingInvoices.length}
            </span>
          </div>
        </div>
        <ul className="divide-y divide-border">
          {pendingInvoices.length > 0 ? (
            pendingInvoices.map((inv) => (
              <li
                key={inv.number}
                className="table-row-hover flex items-center justify-between px-6 py-3.5"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-bold",
                      inv.status === "late"
                        ? "bg-destructive/10 text-destructive"
                        : "bg-warning/10 text-warning-foreground",
                    )}
                  >
                    {inv.client.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{inv.client}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">
                      {inv.number} · Éch. {date(inv.due)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-right">
                  <span className="font-display font-bold">{money(inv.amount)}</span>
                  {inv.status === "late" ? (
                    <span className="badge-status bg-destructive/8 text-destructive ring-1 ring-destructive/20">
                      <AlertTriangle className="h-3 w-3" />
                      En retard
                    </span>
                  ) : (
                    <span className="badge-status bg-warning/10 text-warning-foreground ring-1 ring-warning/25">
                      <Receipt className="h-3 w-3" />
                      En attente
                    </span>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li className="flex flex-col items-center justify-center py-14 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10">
                <CheckCircle2 className="h-7 w-7 text-success" />
              </div>
              <p className="text-sm font-semibold text-foreground">Aucune créance en attente</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Toutes vos factures sont réglées ✓
              </p>
            </li>
          )}
        </ul>
      </div>
    </>
  );
}
