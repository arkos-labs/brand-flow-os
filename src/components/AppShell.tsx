import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  ReceiptEuro,
  TrendingUp,
  Timer,
  ShieldCheck,
  Package,
  CheckSquare,
  Settings,
  Users,
  Bell,
  AlertTriangle,
  Clock,
  X,
  Layers,
  Sun,
  Moon,
  Monitor,
  CreditCard,
  Repeat,
} from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { useTheme, type Theme } from "@/lib/theme";
import { projects } from "@/lib/demo-data";
import { cn } from "@/lib/utils";
import { GlobalSearch } from "./GlobalSearch";
import { Search as SearchIcon } from "lucide-react";

const groups: {
  section: Key;
  items: { to: string; label: Key; icon: typeof LayoutDashboard }[];
}[] = [
  {
    section: "nav.section.sales",
    items: [
      { to: "/", label: "nav.dashboard", icon: LayoutDashboard },
      { to: "/pipeline", label: "nav.pipeline", icon: KanbanSquare },
      { to: "/clients", label: "nav.clients", icon: Users },
      { to: "/devis", label: "nav.quotes", icon: FileText },
      { to: "/catalogue", label: "nav.catalogue", icon: Package },
    ],
  },
  {
    section: "nav.section.finance",
    items: [
      { to: "/factures", label: "nav.invoices", icon: ReceiptEuro },
      { to: "/abonnements", label: "nav.subscriptions" as Key, icon: Repeat },
      { to: "/situations", label: "nav.situations", icon: Layers },
      { to: "/paiements", label: "nav.payments", icon: CheckSquare },
      { to: "/depenses", label: "nav.expenses" as Key, icon: CreditCard },
      { to: "/tresorerie", label: "nav.cashflow", icon: TrendingUp },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUOTE_VALIDITY_DAYS = 30;

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function isQuoteExpired(q: { status: { fr: string }; date: string }): boolean {
  const finalStatuses = ["Signé", "Facturé", "Payé", "Refusé", "Expiré"];
  if (finalStatuses.includes(q.status.fr)) return q.status.fr === "Expiré";
  return daysSince(q.date) > QUOTE_VALIDITY_DAYS;
}

// ── NotificationBadge ─────────────────────────────────────────────────────────

function NotifBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white leading-none">
      {count > 9 ? "9+" : count}
    </span>
  );
}

// ── NotificationPanel ─────────────────────────────────────────────────────────

type NotifItem = {
  id: string;
  count: number;
  title: Key;
  desc: Key;
  link: string;
  linkLabel: Key;
  icon: typeof AlertTriangle;
  color: string;
  bg: string;
};

function NotificationPanel({ items, onClose }: { items: NotifItem[]; onClose: () => void }) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-border bg-background shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold">{t("notif.title")}</span>
        <button
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-2">
        {items.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-foreground">{t("notif.empty")}</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("notif.empty.desc")}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <Link
                key={item.id}
                to={item.link}
                onClick={onClose}
                className="group flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                    item.bg,
                  )}
                >
                  <item.icon className={cn("h-4 w-4", item.color)} />
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={cn("text-xs font-semibold", item.color)}>
                      {item.count}{" "}
                      {lang === "fr"
                        ? t(item.title).replace("(s)", item.count > 1 ? "s" : "")
                        : t(item.title).replace("(s)", item.count > 1 ? "s" : "")}
                    </p>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                    {t(item.desc)}
                  </p>
                  <span
                    className={cn(
                      "mt-1 inline-block text-[11px] font-medium underline-offset-2 group-hover:underline",
                      item.color,
                    )}
                  >
                    {t(item.linkLabel)} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── ThemeToggle ───────────────────────────────────────────────────────────────

const THEME_CYCLE: Theme[] = ["light", "dark", "system"];

const THEME_META: Record<Theme, { icon: typeof Sun; labelFr: string; labelEn: string }> = {
  light: { icon: Sun, labelFr: "Thème clair", labelEn: "Light theme" },
  dark: { icon: Moon, labelFr: "Thème sombre", labelEn: "Dark theme" },
  system: { icon: Monitor, labelFr: "Thème système", labelEn: "System theme" },
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { lang } = useI18n();

  const cycleNext = () => {
    const idx = THEME_CYCLE.indexOf(theme);
    setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length]);
  };

  const meta = THEME_META[theme];
  const Icon = meta.icon;
  const label = lang === "fr" ? meta.labelFr : meta.labelEn;

  return (
    <button
      onClick={cycleNext}
      title={label}
      aria-label={label}
      className="flex h-full w-full items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { invoices, quotes } = useData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();

  // If this is a public portal route, don't show the admin shell
  if (location.pathname.startsWith("/portail")) {
    return <main className="min-h-screen bg-muted/20">{children}</main>;
  }

  const { company } = useData();
  const filteredGroups = groups.map(g => ({
    ...g,
    items: g.items.filter(item => {
      if (item.to === "/situations" && !company.enableSituations) return false;
      return true;
    })
  }));

  // ── Compute notification counts ──────────────────────────────────────────
  const lateInvoiceCount = invoices.filter((i) => i.status === "late").length;
  const expiredQuoteCount = quotes.filter(isQuoteExpired).length;
  const unbilledHoursCount = projects.reduce(
    (s: number, p: { unbilled: number }) => s + p.unbilled,
    0,
  );

  // Badge per route
  const badges: Record<string, number> = {
    "/factures": lateInvoiceCount,
    "/devis": expiredQuoteCount,
    "/temps": unbilledHoursCount,
  };

  const totalNotifs = lateInvoiceCount + expiredQuoteCount + (unbilledHoursCount > 0 ? 1 : 0);

  // Notification items for panel
  const notifItems: NotifItem[] = [
    lateInvoiceCount > 0 && {
      id: "late-invoices",
      count: lateInvoiceCount,
      title: "notif.late_invoices" as Key,
      desc: "notif.late_invoices.desc" as Key,
      link: "/factures",
      linkLabel: "notif.view_invoices" as Key,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    expiredQuoteCount > 0 && {
      id: "expired-quotes",
      count: expiredQuoteCount,
      title: "notif.expired_quotes" as Key,
      desc: "notif.expired_quotes.desc" as Key,
      link: "/devis",
      linkLabel: "notif.view_quotes" as Key,
      icon: Clock,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    unbilledHoursCount > 0 && {
      id: "unbilled-hours",
      count: unbilledHoursCount,
      title: "notif.unbilled_hours" as Key,
      desc: "notif.unbilled_hours.desc" as Key,
      link: "/temps",
      linkLabel: "notif.view_time" as Key,
      icon: Timer,
      color: "text-primary",
      bg: "bg-primary/10",
    },
  ].filter(Boolean) as NotifItem[];

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col surface-navy px-3 py-3 lg:flex">
        {/* ── Brand ── */}
        <div className="flex items-center gap-3 px-2 pb-5 border-b border-sidebar-border/30">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/40 text-sm font-bold text-primary-foreground">
            IP
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5 rounded-full bg-success ring-2 ring-sidebar" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-sm font-bold tracking-tight">{t("app.name")}</p>
            <p className="text-[10px] text-sidebar-foreground/50 font-medium">{t("app.tagline")}</p>
          </div>
        </div>

        <nav className="mt-3 flex flex-1 flex-col gap-3 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div key={group.section}>
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/35">
                {t(group.section)}
              </p>
              <div className="flex flex-col gap-px">
                {group.items.map((item) => {
                  const badgeCount = badges[item.to] ?? 0;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      activeOptions={{ exact: item.to === "/" }}
                      className="group flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-sidebar-foreground/65 transition-all duration-150 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                      activeProps={{
                        className:
                          "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-l-[3px] border-primary pl-[9px]",
                      }}
                    >
                      <span className="relative">
                        <item.icon className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
                        <NotifBadge count={badgeCount} />
                      </span>
                      <span className="flex-1 truncate">{t(item.label)}</span>
                      {badgeCount > 0 && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[9px] font-bold text-white">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ── Compliance badge ── */}
        <div className="mt-4 rounded-xl border border-sidebar-border/40 bg-sidebar-accent/30 p-3 backdrop-blur">
          <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/70">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            <span className="font-medium">Factur-X · PAF · RGPD</span>
          </div>
          <p className="mt-0.5 pl-6 text-[10px] text-sidebar-foreground/40">Conforme 2026</p>
        </div>

        {/* ── Settings Link ── */}
        <div className="mt-2 px-1">
          <Link
            to="/parametres"
            className="group flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-sidebar-foreground/65 transition-all duration-150 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm border-l-[3px] border-primary pl-[5px]",
            }}
          >
            <Settings className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
            <span className="flex-1 truncate">{t("nav.settings")}</span>
          </Link>
        </div>

        {/* ── User area ── */}
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-sidebar-border/30 bg-sidebar-accent/20 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-foreground">
            CM
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-sidebar-foreground/90">
              Nicolas Cherki
            </p>
            <p className="text-[10px] text-sidebar-foreground/45">Administrateur</p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/90 px-5 backdrop-blur-md">
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto lg:hidden">
            {filteredGroups
              .flatMap((g) => g.items)
              .map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.to === "/" }}
                  className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground transition-colors"
                  activeProps={{ className: "bg-secondary text-foreground font-semibold" }}
                >
                  {t(item.label)}
                </Link>
              ))}
          </nav>

          {/* Desktop left: empty space for flex alignment */}
          <div className="hidden items-center gap-2 lg:flex">
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden lg:flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-4 py-2 text-sm text-muted-foreground transition-all duration-150 hover:bg-muted hover:border-border hover:shadow-sm"
            >
              <SearchIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="w-36 text-left">Rechercher...</span>
              <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground/70">
                ⌘K
              </kbd>
            </button>
            <button
              onClick={() => setSearchOpen(true)}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors"
            >
              <SearchIcon className="h-4 w-4" />
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-xl border transition-all duration-150",
                  notifOpen
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                aria-label={t("notif.title")}
              >
                <Bell className="h-4 w-4" />
                {totalNotifs > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
                  </span>
                )}
              </button>
              {notifOpen && (
                <NotificationPanel items={notifItems} onClose={() => setNotifOpen(false)} />
              )}
            </div>

            {/* Theme toggle */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors">
              <ThemeToggle />
            </div>

            {/* Lang switcher */}
            <div className="flex rounded-xl border border-border bg-secondary/40 p-0.5">
              {(["fr", "en"] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={cn(
                    "rounded-lg px-2.5 py-1 text-xs font-semibold uppercase transition-all duration-150",
                    lang === code
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            {/* User avatar */}
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-navy text-xs font-bold text-navy-foreground ring-2 ring-navy/20">
              CM
            </div>
          </div>
        </header>
        <main className="px-5 py-7 lg:px-9">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold text-foreground lg:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
