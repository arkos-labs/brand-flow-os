import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";

export const Route = createFileRoute("/mot-de-passe-oublie")({
  head: () => ({
    meta: [
      { title: "Mot de passe oublié — ClearQuote" },
      {
        name: "description",
        content: "Réinitialisez votre mot de passe ClearQuote.",
      },
      { property: "og:title", content: "Mot de passe oublié — ClearQuote" },
      {
        property: "og:description",
        content: "Réinitialisez votre mot de passe ClearQuote.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 800);
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
            Récupérez l'accès.<br />
            <span className="text-blue-300">En toute sécurité.</span>
          </h2>
          <p className="text-blue-100 text-sm leading-relaxed max-w-sm">
            {t("auth.reset.subtitle")}
          </p>
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

          <h1 className="text-2xl font-bold text-foreground mb-1">{t("auth.reset.title")}</h1>
          <p className="text-sm text-muted-foreground mb-8">{t("auth.reset.subtitle")}</p>

          {sent ? (
            <div className="rounded-xl border border-success/20 bg-success/10 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-success" />
              <p className="mt-3 text-sm font-medium text-foreground">{t("auth.reset.success")}</p>
              <Link
                to="/connexion"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t("auth.reset.back_to_login")} →
              </Link>
            </div>
          ) : (
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

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {t("auth.reset.cta")}…
                  </>
                ) : (
                  <>
                    {t("auth.reset.cta")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {!sent && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              <Link
                to="/connexion"
                className="font-semibold text-primary hover:underline"
              >
                {t("auth.reset.back_to_login")} →
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
