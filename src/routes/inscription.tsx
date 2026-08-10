import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, Zap, User } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Inscription — InvoicePro" },
      {
        name: "description",
        content: "Créez votre compte InvoicePro et démarrez votre essai gratuit.",
      },
      { property: "og:title", content: "Inscription — InvoicePro" },
      {
        property: "og:description",
        content: "Créez votre compte InvoicePro et démarrez votre essai gratuit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InscriptionPage,
});

function InscriptionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate({ to: "/tableau-de-bord" });
    }, 800);
  }

  function handleDevAccess() {
    setDevLoading(true);
    setTimeout(() => {
      setDevLoading(false);
      navigate({ to: "/tableau-de-bord" });
    }, 400);
  }

  return (
    <div className="devizia-auth min-h-screen bg-background flex">
      {/* Branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="inline-flex w-fit rounded-xl bg-white px-3 py-2">
          <BrandLogo className="h-9 w-auto" priority />
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Lancez votre activité.<br />
            <span className="text-blue-300">Conformité dès le premier jour.</span>
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-sm mb-6">
            {t("landing.hero.subtitle")}
          </p>

          <div className="space-y-2.5 mb-8">
            {[
              t("landing.features.ai_quotes.title"),
              t("landing.features.facturx.title"),
              t("landing.features.crm.title"),
              t("landing.features.cashflow.title"),
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-400/30">
                  <span className="text-blue-300 text-xs">✓</span>
                </div>
                <p className="text-blue-100 text-sm">{f}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-white text-xs font-semibold">{t("landing.trust")}</p>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo className="h-9 w-auto" priority />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">{t("auth.signup.title")}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t("auth.signup.subtitle")}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t("auth.email")}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.fr"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t("auth.password")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                {t("auth.password.confirm")}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  {t("auth.signup")}…
                </>
              ) : (
                <>
                  {t("auth.signup.cta")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground font-medium">ou</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleDevAccess}
            disabled={devLoading}
            className="w-full flex items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-amber-400/60 bg-amber-50/60 dark:bg-amber-950/20 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-400 transition-all hover:bg-amber-100/80 dark:hover:bg-amber-950/40 hover:border-amber-500 disabled:opacity-60"
          >
            {devLoading ? (
              <span className="h-4 w-4 rounded-full border-2 border-amber-400/40 border-t-amber-500 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            {t("auth.dev_access")}
          </button>
          <p className="text-center text-[11px] text-muted-foreground/60 mt-2">
            {t("auth.dev_mode")}
          </p>

          <p className="text-center text-xs text-muted-foreground mt-8">
            {t("auth.signup.has_account")}{" "}
            <Link
              to="/connexion"
              className="font-semibold text-primary hover:underline"
            >
              {t("auth.login")} →
            </Link>
          </p>

          <p className="text-center text-[11px] text-muted-foreground/60 mt-6">
            {t("auth.terms")}
          </p>
        </div>
      </div>
    </div>
  );
}
