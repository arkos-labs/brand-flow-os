import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/inscription")({
  head: () => ({
    meta: [
      { title: "Inscription — ClearQuote" },
      {
        name: "description",
        content: "Créez votre compte ClearQuote et démarrez votre essai gratuit.",
      },
      { property: "og:title", content: "Inscription — ClearQuote" },
      {
        property: "og:description",
        content: "Créez votre compte ClearQuote et démarrez votre essai gratuit.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/inscription" }],
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
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email || !password || !confirmPassword) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/tableau-de-bord`,
        },
      });

      if (signUpError) {
        if (signUpError.message.includes("already registered") || signUpError.message.includes("User already registered")) {
          setError("Un compte existe déjà avec cet email. Connectez-vous ou utilisez un autre email.");
        } else if (signUpError.message.includes("invalid email")) {
          setError("Adresse email invalide.");
        } else if (signUpError.message.includes("Password should be")) {
          setError("Le mot de passe doit contenir au moins 6 caractères.");
        } else {
          setError(signUpError.message);
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Check if email confirmation is required
        if (data.session) {
          // User is immediately logged in (email confirmation disabled)
          // Create default organization
          try {
            await supabase.from("organizations").insert({
              name: "Mon entreprise",
              owner_id: data.user.id,
            });
          } catch {
            // Organization might already exist or table might not exist yet — not blocking
          }
          navigate({ to: "/tableau-de-bord" });
        } else {
          // Email confirmation required
          setEmailSent(true);
        }
      }
    } catch (err) {
      setError("Une erreur inattendue s'est produite. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // Email confirmation sent state
  if (emailSent) {
    return (
      <div className="devizia-auth min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Vérifiez vos emails</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Un lien de confirmation a été envoyé à <strong>{email}</strong>. Cliquez dessus pour activer votre compte.
          </p>
          <p className="text-xs text-muted-foreground">
            Pas reçu ?{" "}
            <button
              onClick={() => setEmailSent(false)}
              className="text-primary font-semibold hover:underline"
            >
              Réessayer
            </button>
          </p>
        </div>
      </div>
    );
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

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 dark:border-red-800/50 dark:bg-red-950/30 px-4 py-3 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

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
                  required
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
                  required
                  minLength={8}
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
              <p className="text-[11px] text-muted-foreground/60 mt-1">Minimum 8 caractères</p>
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
                  required
                  className={`w-full rounded-xl border bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all ${
                    confirmPassword && password !== confirmPassword
                      ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                      : "border-border focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-[11px] text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                  Création du compte…
                </>
              ) : (
                <>
                  {t("auth.signup.cta")}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

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
