import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  ReceiptEuro,
  TrendingUp,
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
  Check,
  ChevronDown,
  Globe2,
  CreditCard,
  Repeat,
  Menu,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect, type ReactNode } from "react";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { formatNavigationBadge } from "@/lib/navigation-badge";
import { GlobalSearch } from "./GlobalSearch";
import { Search as SearchIcon } from "lucide-react";

const groups: {
  section: Key;
  items: { to: string; label: Key; icon: typeof LayoutDashboard }[];
}[] = [
  {
    section: "nav.section.sales",
    items: [
      { to: "/tableau-de-bord", label: "nav.dashboard", icon: LayoutDashboard },
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

const PUBLIC_PATHS = ["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/tarifs"];

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUOTE_VALIDITY_DAYS = 30;

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function isQuoteExpired(q: { status: { fr: string }; date: string; sentAt?: string }): boolean {
  const finalStatuses = ["Signé", "Facturé", "Payé", "Refusé", "Expiré"];
  if (finalStatuses.includes(q.status.fr)) return q.status.fr === "Expiré";
  if (!["Envoyé", "Vu"].includes(q.status.fr)) return false;
  return q.sentAt ? daysSince(q.sentAt) > QUOTE_VALIDITY_DAYS : false;
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
      className="fixed right-4 top-16 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-xl border border-border bg-background shadow-xl lg:absolute lg:right-0 lg:top-full lg:mt-2 lg:w-80"
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

const THEME_CYCLE: Theme[] = ["light", "dark"];

const THEME_META: Record<Theme, { icon: typeof Sun; labelFr: string; labelEn: string }> = {
  light: { icon: Sun, labelFr: "Thème clair", labelEn: "Light theme" },
  dark: { icon: Moon, labelFr: "Thème sombre", labelEn: "Dark theme" },
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const { lang } = useI18n();
  const [open, setOpen] = useState(false);
  const activeTheme = theme;
  const meta = THEME_META[activeTheme];
  const Icon = meta.icon;
  const label = lang === "fr" ? meta.labelFr : meta.labelEn;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        title={label}
        aria-label={label}
        aria-expanded={open}
        className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-muted/60 hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
        <span className="hidden text-xs font-medium xl:inline">{activeTheme === "light" ? "Clair" : "Sombre"}</span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 transition-transform xl:block", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
          <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Apparence</p>
          {THEME_CYCLE.map((value) => {
            const item = THEME_META[value];
            const ItemIcon = item.icon;
            const itemLabel = lang === "fr" ? item.labelFr : item.labelEn;
            return (
              <button
                key={value}
                onClick={() => { setTheme(value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
                  activeTheme === value && "bg-primary/10 text-primary",
                )}
              >
                <ItemIcon className="h-3.5 w-3.5" />
                <span className="flex-1">{itemLabel}</span>
                {activeTheme === value && <Check className="h-3.5 w-3.5" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── AppShell ──────────────────────────────────────────────────────────────────

export function AppShell({ children }: { children: ReactNode }) {
  const { t, lang, setLang } = useI18n();
  const { invoices, quotes, company } = useData();
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const locationPath = location.pathname;

  useEffect(() => { setMobileOpen(false); }, [locationPath]);

  // Public routes don't show the admin shell (login, landing, pricing, etc.)
  if (PUBLIC_PATHS.includes(location.pathname) || location.pathname.startsWith("/portail")) {
    return <>{children}</>;
  }

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

  // Badge per route
  const badges: Record<string, number> = {
    "/factures": lateInvoiceCount,
    "/devis": expiredQuoteCount,
  };

  const totalNotifs = lateInvoiceCount + expiredQuoteCount;

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
  ].filter(Boolean) as NotifItem[];

  // ── Sidebar content (partagé desktop + mobile drawer) ────────────────────
  const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {/* ── Brand ── */}
      <div className="flex items-center gap-3 px-2 pb-5 border-b border-sidebar-border/50">
        <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-primary-foreground">
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
                const badgeLabel = formatNavigationBadge(badgeCount);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    activeOptions={{ exact: item.to === "/tableau-de-bord" }}
                    className="group flex items-center gap-3 rounded-md px-3 py-2 text-[12px] text-sidebar-foreground/60 transition-all duration-150 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                    activeProps={{
                      className:
                        "bg-primary text-primary-foreground font-semibold shadow-sm",
                    }}
                  >
                    <item.icon className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" />
                    <span className="flex-1 truncate">{t(item.label)}</span>
                    {badgeLabel && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[9px] font-bold text-white">
                        {badgeLabel}
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
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-md px-3 py-2 text-[12px] text-sidebar-foreground/65 transition-all duration-150 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
          activeProps={{
            className:
              "bg-primary text-primary-foreground font-semibold shadow-sm",
          }}
        >
          <Settings className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
          <span className="flex-1 truncate">{t("nav.settings")}</span>
        </Link>
      </div>

      {/* ── User area + Logout ── */}
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
        <button
          onClick={() => { window.location.href = "/"; }}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sidebar desktop ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col surface-navy px-3 py-3 lg:flex">
        <SidebarContent />
      </aside>

      {/* ── Overlay mobile ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Drawer mobile (slide-in) ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col surface-navy px-3 py-3 transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors"
          aria-label="Fermer"
        >
          <X className="h-4 w-4" />
        </button>
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-3 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur-xl lg:px-7">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-secondary transition-colors lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          {/* Recherche + contexte */}
          <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
            <div className="flex h-8 items-center border-r border-border pr-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Espace de travail
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full max-w-xl items-center gap-2.5 rounded-xl border border-border bg-muted/25 px-3.5 py-2.5 text-xs text-muted-foreground transition-all duration-150 hover:border-primary/30 hover:bg-background hover:shadow-sm"
            >
              <SearchIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-left">Rechercher un client, un devis, une facture…</span>
              <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center rounded border border-border bg-background px-1.5 font-mono text-[10px] text-muted-foreground/70">
                ⌘K
              </kbd>
            </button>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Recherche mobile */}
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
            <ThemeToggle />

            {/* Lang switcher */}
            <div className="relative">
              <button
                onClick={() => setLanguageOpen((value) => !value)}
                aria-label="Changer la langue"
                aria-expanded={languageOpen}
                className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-2.5 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-muted/60 hover:text-foreground"
              >
                <Globe2 className="h-4 w-4" />
                <span className="hidden text-xs font-semibold sm:inline">{lang === "fr" ? "Français" : "English"}</span>
                <span className="text-xs font-bold sm:hidden">{lang.toUpperCase()}</span>
                <ChevronDown className={cn("hidden h-3.5 w-3.5 transition-transform sm:block", languageOpen && "rotate-180")} />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 rounded-xl border border-border bg-popover p-1.5 shadow-xl">
                  <p className="px-2.5 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Langue de l'application</p>
                  {(["fr", "en"] as const).map((code) => (
                    <button
                      key={code}
                      onClick={() => { setLang(code); setLanguageOpen(false); }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
                        lang === code && "bg-primary/10 text-primary",
                      )}
                    >
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-muted text-[10px] font-bold">{code.toUpperCase()}</span>
                      <span className="flex-1">{code === "fr" ? "Français" : "English"}</span>
                      {lang === code && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </header>
        <main className="px-4 py-5 lg:px-5 lg:py-6">{children}</main>
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
    <div className="mb-5 flex flex-col gap-2 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-[22px]">{title}</h1>
        <p className="mt-1 max-w-2xl text-xs text-muted-foreground lg:text-[11px]">{subtitle}</p>
      </div>
      {action && <div className="flex justify-center lg:justify-start">{action}</div>}
    </div>
  );
}

