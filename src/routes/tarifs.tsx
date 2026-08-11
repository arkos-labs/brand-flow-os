import { createFileRoute, Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";
import {
  CheckCircle2,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — ClearQuote" },
      {
        name: "description",
        content:
          "Formules Starter, Pro et Enterprise pour ClearQuote. Toutes incluent la conformité Factur-X 2026.",
      },
      { property: "og:title", content: "Tarifs — ClearQuote" },
      {
        property: "og:description",
        content:
          "Formules Starter, Pro et Enterprise pour ClearQuote. Toutes incluent la conformité Factur-X 2026.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PricingPage,
});

function PublicHeader() {
  const { t, lang } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { to: "/", label: "nav.product" },
    { to: "/connexion", label: "nav.login" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 lg:px-6">
        <Link to="/" className="flex items-center">
          <BrandLogo className="h-9 w-auto" priority />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {t(link.label as never)}
            </Link>
          ))}
          <Link
            to="/inscription"
            className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("auth.signup")}
          </Link>
        </nav>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground md:hidden"
          aria-label={lang === "fr" ? "Menu" : "Menu"}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary"
              >
                {t(link.label as never)}
              </Link>
            ))}
            <Link
              to="/inscription"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              {t("auth.signup")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

const plans = [
  {
    key: "starter",
    popular: false,
    features: [
      "quotes",
      "invoices",
      "clients",
      "crm",
      "facturx",
    ],
    cta: "pricing.cta",
    trial: 30,
  },
  {
    key: "pro",
    popular: true,
    features: [
      "quotes",
      "invoices",
      "clients",
      "crm",
      "cashflow",
      "time",
      "expenses",
      "ai",
      "facturx",
      "signature",
      "support",
    ],
    cta: "pricing.cta.pro",
    trial: 14,
  },
  {
    key: "enterprise",
    popular: false,
    features: [
      "quotes",
      "invoices",
      "clients",
      "crm",
      "cashflow",
      "time",
      "expenses",
      "ai",
      "facturx",
      "signature",
      "api",
      "branding",
      "support",
    ],
    cta: "pricing.cta.enterprise",
    trial: 0,
  },
] as const;

const planUsers = {
  starter: "1",
  pro: "5",
  enterprise: "illimité",
};

function PricingCards() {
  const { t } = useI18n();
  return (
    <div className="mx-auto grid max-w-6xl gap-5 px-4 lg:grid-cols-3 lg:px-6">
      {plans.map((plan) => (
        <div
          key={plan.key}
          className={cn(
            "relative flex flex-col rounded-2xl border bg-card p-6 shadow-sm",
            plan.popular && "border-primary/30 shadow-lg shadow-primary/10"
          )}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
              {t("pricing.popular")}
            </div>
          )}

          <div className="text-center">
            <h3 className="font-display text-lg font-semibold text-foreground">
              {t(`pricing.${plan.key}.name` as never)}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t(`pricing.${plan.key}.desc` as never)}
            </p>
            <div className="mt-4 flex items-baseline justify-center gap-1">
              <span className="font-display text-4xl font-bold text-foreground">
                {t(`pricing.${plan.key}.price` as never)}
              </span>
              {plan.key !== "enterprise" && (
                <span className="text-sm text-muted-foreground">/ {t("pricing.month")}</span>
              )}
            </div>
            {plan.trial > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                {plan.trial} jours d'essai gratuit
              </p>
            )}
          </div>

          <div className="mt-6 flex-1 space-y-3">
            {plan.features.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm text-foreground">
                  {t(`pricing.feature.${feature}` as never)}
                </span>
              </div>
            ))}
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-sm text-foreground">
                {t("pricing.feature.users") as string}: {planUsers[plan.key]}
              </span>
            </div>
          </div>

          <Link
            to={plan.key === "enterprise" ? "/" : "/inscription"}
            className={cn(
              "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
              plan.popular
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "border border-border bg-background text-foreground hover:bg-secondary"
            )}
          >
            {t(plan.cta as never)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ))}
    </div>
  );
}

function Faq() {
  const { t } = useI18n();
  const items = [
    { q: "pricing.faq.free_trial", a: "pricing.faq.free_trial.answer" },
    { q: "pricing.faq.cancel", a: "pricing.faq.cancel.answer" },
    { q: "pricing.faq.facturx", a: "pricing.faq.facturx.answer" },
  ];
  return (
    <div className="mx-auto max-w-3xl px-4 lg:px-6">
      <h2 className="text-center font-display text-xl font-bold text-foreground lg:text-2xl">
        {t("pricing.faq.title")}
      </h2>
      <div className="mt-8 space-y-4">
        {items.map((item) => (
          <div key={item.q} className="card-elevated p-5">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t(item.q as never)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {t(item.a as never)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 lg:flex-row lg:px-6">
        <BrandLogo className="h-9 w-auto" />
        <p className="text-xs text-muted-foreground">
          © 2026 ClearQuote. Factur-X · PAF · RGPD.
        </p>
      </div>
    </footer>
  );
}

function PricingPage() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main>
        <section className="bg-surface py-16 lg:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {t("landing.trust")}
            </div>
            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
              {t("pricing.title")}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("pricing.subtitle")}
            </p>
          </div>
        </section>

        <section className="py-12 lg:py-16">
          <PricingCards />
        </section>

        <section className="bg-surface py-16 lg:py-20">
          <Faq />
        </section>

        <section className="bg-navy py-16">
          <div className="mx-auto max-w-4xl px-4 text-center lg:px-6">
            <h2 className="font-display text-2xl font-bold text-navy-foreground">
              {t("landing.cta.title")}
            </h2>
            <Link
              to="/inscription"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-foreground px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
            >
              {t("landing.cta.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
