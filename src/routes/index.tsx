import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import {
  Sparkles,
  FileText,
  KanbanSquare,
  TrendingUp,
  PenTool,
  ScanLine,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "InvoicePro — Business OS devis & facturation" },
      {
        name: "description",
        content:
          "Devis interactifs, facturation Factur-X, CRM Kanban et trésorerie prédictive pour freelances, agences et TPE.",
      },
      { property: "og:title", content: "InvoicePro — Business OS devis & facturation" },
      {
        property: "og:description",
        content:
          "Devis interactifs, facturation Factur-X, CRM Kanban et trésorerie prédictive pour freelances, agences et TPE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const features = [
  {
    key: "ai_quotes",
    icon: Sparkles,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "facturx",
    icon: FileText,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "crm",
    icon: KanbanSquare,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "cashflow",
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "signature",
    icon: PenTool,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "expenses",
    icon: ScanLine,
    color: "text-warning",
    bg: "bg-warning/10",
  },
];

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-[#092b34] text-sm font-extrabold text-white shadow-lg shadow-[#092b34]/20">
        IP
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-bold tracking-tight text-[#092b34]">InvoicePro</p>
        <p className="text-[9px] font-bold uppercase tracking-[.14em] text-[#ce7131]">Pour artisans</p>
      </div>
    </div>
  );
}

function PublicHeader() {
  const { t, lang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#dce6e5] bg-[#fffdf8]/95 backdrop-blur-md">
      <div className="mx-auto grid h-[72px] max-w-6xl grid-cols-[1fr_auto] items-center px-4 lg:grid-cols-[1fr_auto_1fr] lg:px-6">
        <Link to="/">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center justify-center gap-1 rounded-full border border-[#dce6e5] bg-white p-1 lg:flex">
          <a
            href="#fonctionnalites"
            className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-[#edf3f2] hover:text-[#092b34]"
          >
            Fonctionnalités
          </a>
          <Link
            to="/tarifs"
            className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-[#edf3f2] hover:text-[#092b34]"
          >
            {t("nav.pricing" as never)}
          </Link>
          <a
            href="#demo"
            className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition-colors hover:bg-[#edf3f2] hover:text-[#092b34]"
          >
            Voir la démo
          </a>
        </nav>

        <div className="hidden items-center justify-end gap-3 lg:flex">
          <Link
            to="/connexion"
            className="px-2 py-2 text-xs font-bold text-slate-600 transition-colors hover:text-[#ce7131]"
          >
            {t("nav.login" as never)}
          </Link>
          <Link
            to="/inscription"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ce7131] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#ce7131]/20 transition-all hover:-translate-y-0.5 hover:bg-[#b85220]"
          >
            Tester gratuitement <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Mobile menu */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#dce6e5] text-[#092b34] md:hidden"
          aria-label={lang === "fr" ? "Menu" : "Menu"}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[#dce6e5] bg-[#fffdf8] px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            <a href="#fonctionnalites" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[#edf3f2]">Fonctionnalités</a>
            <Link to="/tarifs" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[#edf3f2]">{t("nav.pricing" as never)}</Link>
            <Link to="/connexion" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-[#edf3f2]">{t("nav.login" as never)}</Link>
            <Link
              to="/inscription"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#ce7131] px-4 py-3 text-sm font-bold text-white"
            >
              {t("auth.signup")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-[#092b34]">
      {/* Gradient background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[.12] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute -top-24 -right-24 h-[32rem] w-[32rem] rounded-full bg-orange-400/20 blur-3xl" />
        <div className="absolute bottom-0 -left-24 h-72 w-72 rounded-full bg-teal-300/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-20 lg:px-6 lg:py-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[.14em] text-slate-200">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-300" />
            {t("landing.trust")}
          </div>

          <h1 className="mx-auto mt-7 max-w-4xl font-display text-5xl font-bold tracking-[-.045em] text-white sm:text-6xl lg:text-7xl">
            {t("landing.hero.title")}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 lg:text-lg">
            {t("landing.hero.subtitle")}
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/inscription"
              className="inline-flex items-center gap-2 rounded-xl bg-[#ce7131] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-[#b85220]"
            >
              {t("landing.hero.cta_primary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/tarifs"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
            >
              {t("landing.hero.cta_secondary")}
            </Link>
          </div>
        </div>

        {/* Dashboard preview */}
        <div className="mt-12 lg:mt-16">
          <div className="mx-auto max-w-4xl rounded-[22px] border border-white/15 bg-[#fffdf8] p-2 shadow-2xl shadow-black/30">
            <div className="rounded-2xl border border-[#dce6e5] bg-[#edf3f2] px-3 py-2">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
                <div className="flex-1 rounded bg-white px-2 py-0.5 text-[10px] text-center text-slate-400">
                  app.invoicepro.fr/tableau-de-bord
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 p-4">
              {[
                { label: "CA ce mois", value: "18 400 €", color: "text-emerald-500" },
                { label: "Devis en attente", value: "7", color: "text-amber-500" },
                { label: "Factures dues", value: "3", color: "text-rose-500" },
              ].map((k) => (
                <div key={k.label} className="rounded-xl border border-[#dce6e5] bg-white p-3">
                  <p className="text-[10px] font-semibold text-slate-400">{k.label}</p>
                  <p className={cn("text-sm font-bold lg:text-lg", k.color)}>{k.value}</p>
                </div>
              ))}
            </div>
            <div className="mx-4 mb-4 rounded-xl border border-[#ce7131]/25 bg-orange-50 p-4">
              <p className="text-xs font-bold text-[#a94f1d]">✦ {t("landing.features.ai_quotes.title")}</p>
              <div className="mt-2 space-y-1">
                {[
                  { desc: "Pose carrelage sol", total: "900 €" },
                  { desc: "Faïence murale", total: "630 €" },
                  { desc: "WC suspendu + pose", total: "850 €" },
                ].map((l) => (
                  <div key={l.desc} className="flex justify-between text-xs text-muted-foreground">
                    <span>{l.desc}</span>
                    <span className="font-medium text-foreground">{l.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  return (
    <section id="fonctionnalites" className="border-t border-border bg-surface py-16 lg:py-24">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            {t("landing.features.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground">
            {t("landing.features.subtitle")}
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.key}
                className="group card-elevated card-hover p-5"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", f.bg)}>
                  <Icon className={cn("h-5 w-5", f.color)} />
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-foreground">
                  {t(`landing.features.${f.key}.title` as never)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.features.${f.key}.desc` as never)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-navy py-16 lg:py-24">
      <div className="relative mx-auto max-w-4xl px-4 text-center lg:px-6">
        <h2 className="font-display text-2xl font-bold tracking-tight text-navy-foreground lg:text-3xl">
          {t("landing.cta.title")}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-navy-foreground/70">
          {t("landing.cta.subtitle")}
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/inscription"
            className="inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
          >
            {t("landing.cta.button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/tarifs"
            className="inline-flex items-center gap-2 rounded-xl border border-navy-foreground/20 px-6 py-3 text-sm font-semibold text-navy-foreground transition-colors hover:bg-navy-foreground/10"
          >
            {t("landing.hero.cta_secondary")}
          </Link>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-navy-foreground/60">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("pricing.feature.facturx")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("pricing.feature.clients")}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("pricing.feature.invoices")}
          </span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 lg:flex-row lg:px-6">
        <Logo />
        <p className="text-xs text-muted-foreground">
          © 2026 InvoicePro. Factur-X · PAF · RGPD.
        </p>
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <Hero />
        <Features />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
