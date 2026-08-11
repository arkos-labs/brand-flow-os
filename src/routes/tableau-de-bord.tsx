import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText,
  Receipt,
  CheckCircle2,
  Clock,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tableau-de-bord")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — ClearQuote" },
      { name: "description", content: "Dashboard ClearQuote — suivez votre activité, vos devis, factures et trésorerie." },
      { property: "og:title", content: "Tableau de bord — ClearQuote" },
      { property: "og:description", content: "Dashboard ClearQuote — suivez votre activité, vos devis, factures et trésorerie." },
    ],
  }),
  component: Dashboard,
});

// ── Constantes couleurs Recharts ──────────────────────────────────────────────
// CSS custom properties (oklch) ne fonctionnant pas dans SVG fill, on utilise
// des valeurs hex cohérentes avec le design system.
const COLOR_SENT = "#1769e0"; // ClearQuote blue
const COLOR_SIGNED = "#10b981"; // success (emerald)
const COLOR_REFUSED = "#f43f5e"; // destructive (rose)
const COLOR_PROGRESS = "#f59e0b"; // warning (amber)
const COLOR_DRAFT = "#94a3b8"; // muted (slate)

// ── Status helpers ────────────────────────────────────────────────────────────
const SIGNED_STATUSES = ["Signé", "Facturé", "Payé"];
const REFUSED_STATUSES = ["Refusé", "Expiré"];
const PROGRESS_STATUSES = ["Envoyé", "Vu"];
const DRAFT_STATUSES = ["Brouillon"];

// ── Tooltip personnalisé ──────────────────────────────────────────────────────
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
    <div className="rounded-lg border border-border bg-background px-3 py-2.5 shadow-lg text-xs">
      <p className="mb-1.5 font-semibold text-foreground">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}</span>
          <span className="ml-auto font-medium text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({
  color,
  label,
  count,
  amount,
  moneyFn,
}: {
  color: string;
  label: string;
  count: number;
  amount?: number;
  moneyFn: (n: number) => string;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums">{count}</span>
      {amount !== undefined && amount > 0 && (
        <span className="text-xs text-muted-foreground">{moneyFn(amount)}</span>
      )}
    </div>
  );
}

// ── Donut label central ───────────────────────────────────────────────────────
function DonutCenter({ rate, lang }: { rate: number | null; lang: string }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan
        x="50%"
        dy="-4"
        fontSize="22"
        fontWeight="700"
        fill="currentColor"
        style={{ fill: "var(--color-foreground)" }}
      >
        {rate === null ? "—" : `${rate}%`}
      </tspan>
      <tspan x="50%" dy="18" fontSize="10" style={{ fill: "var(--color-muted-foreground)" }}>
        {lang === "fr" ? "conversion" : "conversion"}
      </tspan>
    </text>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard() {
  const { t, lang, money, date } = useI18n();
  const { quotes, invoices, expenses } = useData();

  // ── KPI base ──────────────────────────────────────────────────────────────
  const acceptedQuotes = quotes.filter((q) => SIGNED_STATUSES.includes(q.status.fr));
  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  const pendingInvoices = invoices.filter((inv) => inv.status === "sent" || inv.status === "late");
  const pendingQuotes = quotes.filter((q) => PROGRESS_STATUSES.includes(q.status.fr));

  const totalRevenue = paidInvoices.reduce((a, i) => a + i.amount, 0);
  const pendingRevenue = pendingInvoices.reduce((a, i) => a + i.amount, 0);
  const pendingQuotesTotal = pendingQuotes.reduce((a, q) => a + q.amount, 0);
  
  const totalExpenses = expenses.reduce((a, e) => a + e.amountHT, 0);
  const netProfit = totalRevenue - totalExpenses;

  // ── Funnel stats ─────────────────────────────────────────────────────────
  const signedQuotes = quotes.filter((q) => SIGNED_STATUSES.includes(q.status.fr));
  const refusedQuotes = quotes.filter((q) => REFUSED_STATUSES.includes(q.status.fr));
  const draftQuotes = quotes.filter((q) => DRAFT_STATUSES.includes(q.status.fr));
  const inProgressQuotes = quotes.filter((q) => PROGRESS_STATUSES.includes(q.status.fr));
  const sentQuotes = quotes.filter((q) => !DRAFT_STATUSES.includes(q.status.fr));

  // Taux de transformation = signés / (signés + refusés) sur les devis clôturés
  const closedQuotes = signedQuotes.length + refusedQuotes.length;
  const conversionRate: number | null =
    closedQuotes > 0 ? Math.round((signedQuotes.length / closedQuotes) * 100) : null;

  // Trend : comparer mois courant vs mois précédent
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

  const thisMonthClosed = quotes.filter((q) => {
    const d = new Date(q.date);
    return (
      d.getFullYear() === thisYear &&
      d.getMonth() === thisMonth &&
      (SIGNED_STATUSES.includes(q.status.fr) || REFUSED_STATUSES.includes(q.status.fr))
    );
  });
  const lastMonthClosed = quotes.filter((q) => {
    const d = new Date(q.date);
    return (
      d.getFullYear() === lastYear &&
      d.getMonth() === lastMonth &&
      (SIGNED_STATUSES.includes(q.status.fr) || REFUSED_STATUSES.includes(q.status.fr))
    );
  });

  const thisMonthRate =
    thisMonthClosed.length > 0
      ? Math.round(
          (thisMonthClosed.filter((q) => SIGNED_STATUSES.includes(q.status.fr)).length /
            thisMonthClosed.length) *
            100,
        )
      : null;
  const lastMonthRate =
    lastMonthClosed.length > 0
      ? Math.round(
          (lastMonthClosed.filter((q) => SIGNED_STATUSES.includes(q.status.fr)).length /
            lastMonthClosed.length) *
            100,
        )
      : null;

  const trendDelta =
    thisMonthRate !== null && lastMonthRate !== null ? thisMonthRate - lastMonthRate : null;

  // ── Données mensuelles pour le graphique barres ──────────────────────────
  const months6 = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(thisYear, thisMonth - 5 + i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", { month: "short" }),
    };
  });

  const monthlyData = months6.map((m) => {
    const mq = quotes.filter((q) => {
      const d = new Date(q.date);
      return d.getFullYear() === m.year && d.getMonth() === m.month;
    });
    const signed = mq.filter((q) => SIGNED_STATUSES.includes(q.status.fr)).length;
    const refused = mq.filter((q) => REFUSED_STATUSES.includes(q.status.fr)).length;
    const sent = mq.filter((q) => !DRAFT_STATUSES.includes(q.status.fr)).length;
    return {
      name: m.label,
      sent,
      signed,
      refused,
    };
  });

  const hasMonthlyData = monthlyData.some(
    (m) => m.sent > 0 || m.signed > 0,
  );

  // ── Données donut ────────────────────────────────────────────────────────
  const donutData = [
    { name: t("dash.funnel.signed"), value: signedQuotes.length, color: COLOR_SIGNED },
    { name: t("dash.funnel.refused"), value: refusedQuotes.length, color: COLOR_REFUSED },
    { name: t("dash.funnel.in_progress"), value: inProgressQuotes.length, color: COLOR_PROGRESS },
    { name: t("dash.funnel.draft"), value: draftQuotes.length, color: COLOR_DRAFT },
  ].filter((d) => d.value > 0);

  const hasDonutData = donutData.length > 0;

  // ── Activité récente ──────────────────────────────────────────────────────
  const recentActivity = [
    ...acceptedQuotes.map((q) => ({
      type: "quote",
      date: q.signedAt ?? q.sentAt ?? q.date,
      label: lang === "fr" ? "Devis accepté" : "Accepted quote",
      client: q.client,
      amount: q.amount,
      icon: CheckCircle2,
      color: "text-success bg-success/10",
    })),
    ...paidInvoices.map((inv) => ({
      type: "invoice",
      date: inv.paidAt ?? inv.sentAt ?? inv.date,
      label: lang === "fr" ? "Facture payée" : "Paid invoice",
      client: inv.client,
      amount: inv.amount,
      icon: Receipt,
      color: "text-primary bg-primary/10",
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
        <div>
          <h1 className="text-xl font-semibold text-foreground lg:text-3xl">{t("dash.title")}</h1>
          <p className="mt-1 text-xs text-muted-foreground lg:mt-1.5 lg:text-sm">{t("dash.welcome")}</p>
        </div>
        <div className="flex justify-center gap-2 lg:justify-start">
          <Button asChild variant="outline" size="sm">
            <Link to="/factures">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("dash.new_invoice")}
            </Link>
          </Button>
          <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/devis">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              {t("dash.new_quote")}
            </Link>
          </Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        {/* CA */}
        <div className="card-revenue card-hover relative overflow-hidden rounded-xl p-3 lg:p-6">
          <div className="pointer-events-none absolute -right-4 -top-4 opacity-[0.08]">
            <Receipt className="h-20 w-20 lg:h-32 lg:w-32" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
          <p className="text-[9px] font-semibold uppercase tracking-widest text-white/55 lg:text-[11px]">
            {t("dash.kpi.ca")}
          </p>
          <p className="mt-1 font-display text-sm font-bold text-white lg:mt-2.5 lg:text-3xl">
            {money(totalRevenue)}
          </p>
          <div className="mt-2 border-t border-white/10 pt-2 lg:mt-6 lg:pt-4">
            <p className="text-[9px] text-white/50 lg:text-[10px]">{lang === "fr" ? "Net" : "Profit"}</p>
            <p className="text-xs font-bold text-emerald-400 lg:text-xl">{money(netProfit)}</p>
          </div>
        </div>

        {/* Devis en attente */}
        <div className="card-elevated card-hover card-warning-accent p-3 lg:p-6">
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground lg:text-[11px]">
              {t("dash.kpi.pending_quotes")}
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-warning/15 lg:h-10 lg:w-10 lg:rounded-xl">
              <FileText className="h-3 w-3 text-warning-foreground lg:h-5 lg:w-5" />
            </div>
          </div>
          <p className="mt-1.5 font-display text-2xl font-bold text-foreground lg:mt-2.5 lg:text-3xl">
            {pendingQuotes.length}
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground lg:text-xs">
            <span className="font-bold text-foreground">{money(pendingQuotesTotal)}</span>
          </p>
        </div>

        {/* En attente d'encaissement */}
        <div className="card-elevated card-hover card-destructive-accent p-3 lg:p-6">
          <div className="flex items-start justify-between">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground lg:text-[11px]">
              {t("dash.kpi.pending_invoices")}
            </p>
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-destructive/10 lg:h-10 lg:w-10 lg:rounded-xl">
              <Clock className="h-3 w-3 text-destructive lg:h-5 lg:w-5" />
            </div>
          </div>
          <p className="mt-1.5 font-display text-base font-bold text-foreground lg:mt-2.5 lg:text-3xl">
            {money(pendingRevenue)}
          </p>
          <p className="mt-1 text-[9px] text-muted-foreground lg:text-xs">
            {pendingInvoices.length} {lang === "fr" ? "fact." : "inv."}
          </p>
        </div>
      </div>

      {/* ── Section pipeline devis + conversion ── */}
      <div className="card-elevated overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-gradient-subtle px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground">{t("dash.funnel.title")}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{t("dash.funnel.subtitle")}</p>
            </div>
            <Link
              to="/devis"
              className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {t("dash.list.see_all")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
          {/* ── Panneau gauche : taux + stats ── */}
          <div className="border-b border-border p-6 lg:border-b-0 lg:border-r">
            {/* Taux + donut */}
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("dash.conversion.title")}
            </p>
            <p className="text-[11px] text-muted-foreground">{t("dash.conversion.hint")}</p>

            {/* Donut chart */}
            <div className="relative mx-auto mt-4 h-40 w-40">
              {hasDonutData ? (
                <PieChart width={160} height={160}>
                  <Pie
                    data={donutData}
                    cx={75}
                    cy={75}
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={donutData.length > 1 ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <DonutCenter rate={conversionRate} lang={lang} />
                </PieChart>
              ) : (
                <div className="flex h-40 w-40 flex-col items-center justify-center rounded-full border-4 border-dashed border-border">
                  <span className="text-xl font-bold text-muted-foreground">—</span>
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {lang === "fr" ? "conversion" : "conversion"}
                  </span>
                </div>
              )}
            </div>

            {/* Trend badge */}
            {trendDelta !== null && (
              <div
                className={cn(
                  "mx-auto mt-2 flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                  trendDelta > 0
                    ? "bg-success/10 text-success"
                    : trendDelta < 0
                      ? "bg-destructive/10 text-destructive"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {trendDelta > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trendDelta < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <Minus className="h-3 w-3" />
                )}
                {trendDelta > 0 ? "+" : ""}
                {trendDelta}% {lang === "fr" ? "vs mois préc." : "vs prev. month"}
              </div>
            )}

            {/* Stat pills */}
            <div className="mt-5 flex flex-col gap-2">
              <StatPill
                color={COLOR_SENT}
                label={lang === "fr" ? "Envoyés (total)" : "Sent (total)"}
                count={sentQuotes.length}
                amount={sentQuotes.reduce((a, q) => a + q.amount, 0)}
                moneyFn={money}
              />
              <StatPill
                color={COLOR_SIGNED}
                label={t("dash.funnel.signed")}
                count={signedQuotes.length}
                amount={signedQuotes.reduce((a, q) => a + q.amount, 0)}
                moneyFn={money}
              />
              <StatPill
                color={COLOR_REFUSED}
                label={t("dash.funnel.refused")}
                count={refusedQuotes.length}
                moneyFn={money}
              />
              <StatPill
                color={COLOR_PROGRESS}
                label={t("dash.funnel.in_progress")}
                count={inProgressQuotes.length}
                amount={inProgressQuotes.reduce((a, q) => a + q.amount, 0)}
                moneyFn={money}
              />
            </div>
          </div>

          {/* ── Panneau droit : graphique barres mensuel ── */}
          <div className="p-6">
            <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {lang === "fr" ? "Évolution mensuelle" : "Monthly trend"}
            </p>
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={monthlyData}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                  barGap={3}
                  barSize={12}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-border)"
                    vertical={false}
                  />
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
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "var(--color-muted)", opacity: 0.3 }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Bar
                    dataKey="sent"
                    name={t("dash.funnel.sent")}
                    fill={COLOR_SENT}
                    radius={[3, 3, 0, 0]}
                    opacity={0.7}
                  />
                  <Bar
                    dataKey="signed"
                    name={t("dash.funnel.signed")}
                    fill={COLOR_SIGNED}
                    radius={[3, 3, 0, 0]}
                  />
                  <Bar
                    dataKey="refused"
                    name={t("dash.funnel.refused")}
                    fill={COLOR_REFUSED}
                    radius={[3, 3, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-52 flex-col items-center justify-center gap-2 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                  <TrendingUp className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">{t("dash.funnel.empty")}</p>
                <p className="text-xs text-muted-foreground">{t("dash.funnel.empty.desc")}</p>
                <Link
                  to="/devis"
                  className="mt-2 flex h-9 items-center gap-1.5 rounded-[var(--shape-control)] border-2 border-navy bg-primary px-4 text-xs font-bold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {t("dash.new_quote")}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Listes ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Devis à relancer */}
        <div className="card-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-gradient-subtle px-6 py-4">
            <h2 className="text-sm font-bold text-foreground">{t("dash.list.pending")}</h2>
            <Link
              to="/devis"
              className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {t("dash.list.see_all")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex-1 divide-y divide-border">
            {pendingQuotes.length > 0 ? (
              pendingQuotes.slice(0, 5).map((q) => (
                <li
                  key={q.number}
                  className="table-row-hover flex items-center justify-between px-6 py-3.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                      {q.client.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{q.client}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {q.number} · {date(q.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{money(q.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{lang === "fr" ? q.status.fr : q.status.en}</p>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <FileText className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("dash.list.pending.empty")}
                </p>
              </li>
            )}
          </ul>
        </div>

        {/* Derniers encaissements */}
        <div className="card-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border bg-gradient-subtle px-6 py-4">
            <h2 className="text-sm font-bold text-foreground">{t("dash.list.payments")}</h2>
            <Link
              to="/paiements"
              className="flex items-center gap-1.5 rounded-lg bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              {t("dash.list.history")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="flex-1 divide-y divide-border">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, i) => (
                <li key={i} className="table-row-hover flex items-center gap-3 px-6 py-3.5">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      act.color,
                    )}
                  >
                    <act.icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{act.client}</p>
                      <p className="text-[11px] text-muted-foreground">{act.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">+{money(act.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">{date(act.date)}</p>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Receipt className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  {t("dash.list.payments.empty")}
                </p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
