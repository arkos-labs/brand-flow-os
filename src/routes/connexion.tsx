import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — InvoicePro" },
      {
        name: "description",
        content: "Connectez-vous à votre espace InvoicePro.",
      },
      { property: "og:title", content: "Connexion — InvoicePro" },
      {
        property: "og:description",
        content: "Connectez-vous à votre espace InvoicePro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ConnexionPage,
});

function ConnexionPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="min-h-screen bg-background flex">
      {/* Branding panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-sm font-bold text-white shadow-lg backdrop-blur">
            IP
          </div>
          <div>
            <p className="font-bold text-white text-lg leading-tight">InvoicePro</p>
            <p className="text-orange-300 text-xs">Business OS</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          <h2 className="text-3xl font-bold text-white leading-snug mb-3">
            Vos devis & factures.<br />
            <span className="text-orange-300">Propulsés par l'IA.</span>
          </h2>
          <p className="text-orange-100 text-sm leading-relaxed max-w-sm mb-6">
            {t("landing.hero.subtitle")}
          </p>

          <div className="space-y-2.5 mb-8">
            {[
              t("landing.features.ai_quotes.title"),
              t("landing.features.facturx.title"),
              t("landing.features.signature.title"),
              t("landing.features.cashflow.title"),
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-400/30">
                  <span className="text-orange-300 text-xs">✓</span>
                </div>
                <p className="text-orange-100 text-sm">{f}</p>
              </div>
            ))}
          </div>

          {/* Mini dashboard preview */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/40">
            <div className="flex items-center gap-2 bg-black/40 px-3 py-2 backdrop-blur">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="flex-1 rounded bg-white/10 px-2 py-0.5 text-[10px] text-white/40 text-center">
                invoicepro.fr/app
              </div>
            </div>
            <div className="bg-[#0f1117] p-4">
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "CA ce mois", value: "18 400 €", color: "text-emerald-400" },
                  { label: "Devis en attente", value: "7", color: "text-amber-400" },
                  { label: "Factures dues", value: "3", color: "text-rose-400" },
                ].map((k) => (
                  <div key={k.label} className="rounded-lg bg-white/5 border border-white/8 p-2">
                    <p className="text-[9px] text-white/40 mb-0.5">{k.label}</p>
                    <p className={`text-sm font-bold ${k.color}`}>{k.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg bg-orange-600/20 border border-orange-500/30 p-3 mb-2">
                <p className="text-[9px] text-orange-300 font-semibold mb-1.5">✨ IA — Devis généré</p>
                <div className="space-y-1">
                  {[
                    { desc: "Pose carrelage sol", total: "900 €" },
                    { desc: "Faïence murale", total: "630 €" },
                    { desc: "WC suspendu + pose", total: "850 €" },
                  ].map((l) => (
                    <div key={l.desc} className="flex justify-between text-[9px]">
                      <span className="text-white/60">{l.desc}</span>
                      <span className="text-white font-semibold">{l.total}</span>
                    </div>
                  ))}
                  <div className="border-t border-white/10 pt-1 mt-1 flex justify-between text-[10px]">
                    <span className="text-orange-300 font-semibold">Total HT</span>
                    <span className="text-orange-300 font-bold">3 740 €</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg bg-orange-600 py-1.5 text-center text-[9px] font-bold text-white">
                  Envoyer
                </div>
                <div className="flex-1 rounded-lg bg-white/8 border border-white/10 py-1.5 text-center text-[9px] text-white/60">
                  PDF Factur-X
                </div>
              </div>
            </div>
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
              IP
            </div>
            <span className="font-bold text-lg text-foreground">InvoicePro</span>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">{t("auth.login.title")}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t("auth.login.subtitle")}</p>

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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-foreground">{t("auth.password")}</label>
                <Link to="/mot-de-passe-oublie" className="text-xs text-primary hover:underline">
                  {t("auth.forgot_password")}
                </Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  {t("auth.login")}…
                </>
              ) : (
                <>
                  {t("auth.login")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
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
            {t("auth.no_account")}{" "}
            <Link
              to="/inscription"
              className="font-semibold text-primary hover:underline"
            >
              {t("auth.signup")} →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
