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
  Calendar,
  Archive,
  Plus,
  Building2,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/supabase-context";
import { useTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { formatNavigationBadge } from "@/lib/navigation-badge";
import { GlobalSearch } from "./GlobalSearch";
import { BrandLogo } from "@/components/BrandLogo";
import { Search as SearchIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      { to: "/paiements", label: "nav.payments", icon: CheckSquare },
      { to: "/depenses", label: "nav.expenses" as Key, icon: CreditCard },
      { to: "/tresorerie", label: "nav.cashflow", icon: TrendingUp },
      { to: "/archives", label: "nav.archives" as Key, icon: Archive },
    ],
  },
  {
    section: "nav.section.tools" as Key,
    items: [
      { to: "/rendez-vous", label: "nav.appointments" as Key, icon: Calendar },
    ],
  },
];

const PUBLIC_PATHS = [
  "/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/tarifs", "/fonctionnalites", "/fonctionnement", "/benefices",
  "/centre-aide", "/contactez-nous", "/nouveautes", "/mises-a-jour", "/confidentialite", "/conditions-utilisation", "/legal", "/plan-site"
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const QUOTE_VALIDITY_DAYS = 30;

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function isQuoteExpired(q: {
  status: string | { fr: string };
  date?: string;
  sentAt?: string;
  issue_date?: string;
  payload?: { status?: { fr?: string }; sentAt?: string } | null;
}): boolean {
  const payloadStatus = typeof q.payload?.status === "string" ? q.payload.status : q.payload?.status?.fr ?? "";
  const status = typeof q.status === "string"
    ? q.status
    : q.status?.fr ?? payloadStatus ?? "";
  const finalStatuses = ["accepted", "invoiced", "paid", "rejected", "expired", "Signé", "Facturé", "Payé", "Refusé", "Expiré"];
  if (finalStatuses.includes(status)) return status === "expired" || status === "Expiré";
  if (!["sent", "viewed", "Envoyé", "Vu"].includes(status)) return false;
  const sentAt = q.sentAt ?? q.payload?.sentAt;
  return sentAt ? daysSince(sentAt) > QUOTE_VALIDITY_DAYS : false;
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
      className="fixed right-4 top-16 z-50 w-[calc(100vw-2rem)] max-w-80 rounded-[var(--shape-control)] border-2 border-navy bg-background shadow-offset lg:absolute lg:right-0 lg:top-full lg:mt-2 lg:w-80"
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
        className="flex h-9 items-center gap-2 rounded-[var(--shape-control)] border-2 border-navy/25 bg-background px-2.5 text-muted-foreground shadow-offset-sm transition-all hover:border-primary hover:bg-muted/60 hover:text-foreground"
      >
        <Icon className="h-4 w-4" />
        <span className="hidden text-xs font-medium xl:inline">{activeTheme === "light" ? "Clair" : "Sombre"}</span>
        <ChevronDown className={cn("hidden h-3.5 w-3.5 transition-transform xl:block", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 rounded-[var(--shape-control)] border-2 border-navy bg-popover p-1.5 shadow-offset">
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
  const { lang, t, setLang } = useI18n();
  const { invoices, quotes, organization, ownedOrganizations, switchOrganization, createOrganization, user, currentUserRole } = useData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [upgradeOrgOpen, setUpgradeOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const location = useLocation();
  const locationPath = location.pathname;

  useEffect(() => { setMobileOpen(false); }, [locationPath]);

  // Request Notification permission for push notifications
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      const timer = setTimeout(() => {
        Notification.requestPermission().catch(() => {});
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  // Public routes don't show the admin shell (login, landing, pricing, etc.)
  if (PUBLIC_PATHS.includes(location.pathname) || location.pathname.startsWith("/portail")) {
    return <>{children}</>;
  }

  const filteredGroups = groups;

  // ── Compute notification counts ──────────────────────────────────────────
  const lateInvoiceCount = invoices.filter((i) => i.status === "overdue").length;
  const expiredQuoteCount = quotes.filter((q) => isQuoteExpired(q as unknown as Parameters<typeof isQuoteExpired>[0])).length;

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
  const SidebarContent = ({
    onNavigate,
    onCloseDrawer,
  }: {
    onNavigate?: () => void;
    onCloseDrawer?: () => void;
  }) => {

    return (
      <>
        {/* ── Brand ── */}
      <div className="flex items-center gap-2 border-b border-sidebar-border/50 px-2 pb-5">
        <div className="relative flex min-w-0 flex-1 items-center rounded-[var(--shape-control)] bg-white px-3 py-2">
          <BrandLogo compact={Boolean(onCloseDrawer)} className={onCloseDrawer ? "h-7 w-7" : "h-7 w-auto"} priority />
          {!onCloseDrawer && (
            <span className="absolute right-2 top-2 flex h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
          )}
        </div>
        {onCloseDrawer && (
          <button
            onClick={onCloseDrawer}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--shape-control)] border-2 border-white bg-white text-navy transition-colors hover:bg-primary/10"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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
                    className="group flex items-center gap-3 rounded-[2px] border border-transparent px-3 py-2 text-[12px] text-sidebar-foreground/60 transition-all duration-150 hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                    activeProps={{
                      className:
                        "border-primary bg-primary text-primary-foreground font-semibold shadow-[3px_3px_0_rgba(255,255,255,0.22)]",
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
      <div className="mt-4 rounded-[var(--shape-control)] border-2 border-sidebar-border/50 bg-sidebar-accent/30 p-3 backdrop-blur">
        <div className="flex items-center gap-2 text-[11px] text-sidebar-foreground/70">
          <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
          <span className="font-medium">Factur-X · PAF · RGPD</span>
        </div>
        <p className="mt-0.5 pl-6 text-[10px] text-sidebar-foreground/40">Conforme 2026</p>
      </div>

      {/* ── Settings Link ── */}
      {currentUserRole === 'admin' && (
        <div className="mt-2 px-1">
          <Link
            to="/parametres"
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-[2px] border border-transparent px-3 py-2 text-[12px] text-sidebar-foreground/65 transition-all duration-150 hover:border-sidebar-border hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            activeProps={{
              className:
                "border-primary bg-primary text-primary-foreground font-semibold shadow-[3px_3px_0_rgba(255,255,255,0.22)]",
            }}
          >
            <Settings className="h-4 w-4 transition-transform duration-150 group-hover:rotate-90" />
            <span className="flex-1 truncate">{t("nav.settings")}</span>
          </Link>
        </div>
      )}

      {/* ── User area + Logout ── */}
      <div className="mt-3 flex items-center gap-3 rounded-[var(--shape-control)] border-2 border-sidebar-border/40 bg-sidebar-accent/20 px-3 py-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary-foreground">
          {user?.email ? user.email.substring(0, 2).toUpperCase() : "CM"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-sidebar-foreground/90">
            {user?.email || "Utilisateur"}
          </p>
          <p className="text-[10px] text-sidebar-foreground/45">Administrateur</p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            // Vider TOUT le cache local (données réelles + démo + showcase)
            const keysToRemove = [
              "invoicepro_quotes_v4",
              "invoicepro_invoices_v4",
              "invoicepro_clients",
              "invoicepro_products",
              "invoicepro_company_v1",
              "invoicepro_upsells",
              "invoicepro_expenses",
              "invoicepro_subscriptions",
              "clearquote_onboarding_done",
              "demo-products-v2",
            ];
            // Supprimer aussi toutes les clés showcase (quel que soit la version)
            Object.keys(localStorage)
              .filter((k) => k.startsWith("invoicepro_showcase_reset"))
              .forEach((k) => localStorage.removeItem(k));
            keysToRemove.forEach((k) => localStorage.removeItem(k));
            window.location.href = "/connexion";
          }}
          title="Se déconnecter"
          aria-label="Se déconnecter"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/40 transition-colors hover:bg-destructive/15 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
    );
  };

  return (
    <div className="app-workspace min-h-screen overflow-x-hidden bg-background">
      {/* ── Sidebar desktop ── */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r-2 border-primary/60 surface-navy px-3 py-3 lg:flex">
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
        <SidebarContent onNavigate={() => setMobileOpen(false)} onCloseDrawer={() => setMobileOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b-2 border-navy/20 bg-background/95 px-3 shadow-sm backdrop-blur-xl lg:px-7">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--shape-control)] border-2 border-navy/25 text-muted-foreground hover:bg-secondary transition-colors lg:hidden"
            aria-label="Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div className="flex min-w-0 flex-1 items-center lg:hidden">
            <BrandLogo compact className="h-8 w-8" priority />
          </div>
          {/* Recherche + contexte */}
          <div className="hidden min-w-0 flex-1 items-center gap-4 lg:flex">
            <div className="relative">
              <button
                onClick={() => setOrgDropdownOpen((v) => !v)}
                className="flex h-8 items-center gap-2 border-r border-border pr-4 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[12px] font-bold text-foreground">
                    {organization?.name || "Mon Entreprise"}
                  </span>
                </div>
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", orgDropdownOpen && "rotate-180")} />
              </button>

              {orgDropdownOpen && (
                <div className="absolute left-0 top-[calc(100%+0.5rem)] z-50 w-56 rounded-[var(--shape-control)] border-2 border-navy bg-popover p-1.5 shadow-offset">
                  <p className="px-2.5 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mes entreprises</p>
                  
                  {ownedOrganizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={async () => {
                        setOrgDropdownOpen(false);
                        if (org.id !== organization?.id) {
                          await switchOrganization(org.id);
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-muted",
                        org.id === organization?.id && "bg-primary/10 text-primary font-bold",
                      )}
                    >
                      <span className="flex-1 truncate">{org.name}</span>
                      {org.id === organization?.id && <Check className="h-3.5 w-3.5" />}
                    </button>
                  ))}

                  <div className="my-1 border-t border-border" />
                  
                  <button
                    onClick={() => {
                      setOrgDropdownOpen(false);
                      if (organization?.plan_tier !== "agency") {
                        setUpgradeOrgOpen(true);
                        return;
                      }
                      setNewOrgName("");
                      setCreateOrgOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
                  >
                    <Plus className="h-4 w-4" />
                    Créer une entreprise
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex w-full max-w-xl items-center gap-2.5 rounded-[var(--shape-control)] border-2 border-navy/20 bg-card px-3.5 py-2.5 text-xs text-muted-foreground shadow-offset-sm transition-all duration-150 hover:border-primary hover:text-foreground"
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
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-[var(--shape-control)] border-2 border-navy/25 text-muted-foreground hover:bg-secondary transition-colors"
            >
              <SearchIcon className="h-4 w-4" />
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-[var(--shape-control)] border-2 transition-all duration-150",
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
                className="flex h-9 items-center gap-2 rounded-[var(--shape-control)] border-2 border-navy/25 bg-background px-2.5 text-muted-foreground shadow-offset-sm transition-all hover:border-primary hover:bg-muted/60 hover:text-foreground"
              >
                <Globe2 className="h-4 w-4" />
                <span className="hidden text-xs font-semibold sm:inline">{lang === "fr" ? "Français" : "English"}</span>
                <span className="text-xs font-bold sm:hidden">{lang.toUpperCase()}</span>
                <ChevronDown className={cn("hidden h-3.5 w-3.5 transition-transform sm:block", languageOpen && "rotate-180")} />
              </button>

              {languageOpen && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-48 rounded-[var(--shape-control)] border-2 border-navy bg-popover p-1.5 shadow-offset">
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
        <main className="px-4 py-5 lg:px-6 lg:py-7">{children}</main>
      </div>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Modal - Upgrade Required */}
      <Dialog open={upgradeOrgOpen} onOpenChange={setUpgradeOrgOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Mise à niveau requise
            </DialogTitle>
            <DialogDescription className="pt-3">
              La gestion multi-sociétés est une fonctionnalité exclusive du forfait <strong>Agency</strong>. 
              Veuillez mettre à niveau votre abonnement pour pouvoir créer et gérer plusieurs entreprises avec le même compte.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setUpgradeOrgOpen(false)}>Annuler</Button>
            <Button asChild>
              <Link to="/parametres" onClick={() => setUpgradeOrgOpen(false)}>Voir mon abonnement</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal - Create Organization */}
      <Dialog open={createOrgOpen} onOpenChange={setCreateOrgOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Créer une entreprise</DialogTitle>
            <DialogDescription>
              Entrez le nom de la nouvelle entreprise que vous souhaitez gérer.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="org-name">Nom de l'entreprise</Label>
              <Input
                id="org-name"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="Ex: Ma Deuxième SARL"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOrgOpen(false)} disabled={isCreatingOrg}>
              Annuler
            </Button>
            <Button 
              disabled={isCreatingOrg || !newOrgName.trim()} 
              onClick={async () => {
                if (!newOrgName.trim()) return;
                setIsCreatingOrg(true);
                try {
                  await createOrganization(newOrgName.trim());
                  setCreateOrgOpen(false);
                } catch (err: any) {
                  // Optionnel : afficher l'erreur proprement si besoin
                  console.error(err);
                } finally {
                  setIsCreatingOrg(false);
                }
              }}
            >
              {isCreatingOrg ? "Création..." : "Créer l'entreprise"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    <div className="mb-6 flex flex-col gap-3 border-b-2 border-navy/15 pb-4 text-center lg:flex-row lg:items-start lg:justify-between lg:text-left">
      <div>
        <span className="mb-1.5 inline-flex bg-navy px-2 py-1 font-mono text-[8px] font-semibold uppercase tracking-[0.14em] text-white">Espace de travail</span>
        <h1 className="font-display text-3xl font-black uppercase leading-none tracking-tight text-foreground lg:text-[36px]">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground lg:text-xs">{subtitle}</p>
      </div>
      {action && <div className="flex justify-center lg:justify-start">{action}</div>}
    </div>
  );
}

