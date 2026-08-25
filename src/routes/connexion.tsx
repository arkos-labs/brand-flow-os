import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — ClearQuote" },
      { name: "description", content: "Connectez-vous à votre espace ClearQuote." },
      { property: "og:title", content: "Connexion — ClearQuote" },
      { property: "og:description", content: "Connectez-vous à votre espace ClearQuote." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/connexion" }],
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
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Veuillez renseigner votre e-mail et votre mot de passe.");
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        // Messages d'erreur en français
        if (authError.message.includes("Invalid login credentials")) {
          setError("E-mail ou mot de passe incorrect. Vérifiez vos identifiants.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Votre adresse e-mail n'a pas encore été confirmée. Vérifiez votre boîte mail.");
        } else if (authError.message.includes("Too many requests")) {
          setError("Trop de tentatives. Attendez quelques minutes avant de réessayer.");
        } else {
          setError(authError.message);
        }
        return;
      }

      // Succès — Supabase met à jour la session automatiquement
      navigate({ to: "/tableau-de-bord" });
    } catch (err) {
      setError("Une erreur inattendue s'est produite. Réessayez dans un instant.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-[var(--shape-control)] border-2 border-navy/20 bg-white py-3 pl-11 pr-4 text-sm text-navy outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

  return (
    <main className="devizia-auth devizia-auth-grid min-h-screen px-4 py-5 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-6xl flex-col">
        <Link to="/" className="inline-flex w-fit items-center" aria-label="Retour à l'accueil ClearQuote">
          <BrandLogo className="h-11 w-auto" priority />
        </Link>

        <div className="grid flex-1 items-center gap-10 py-8 lg:grid-cols-[1fr_460px] lg:gap-16">
          {/* Panneau gauche */}
          <section className="hidden lg:block">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border-2 border-navy/15 bg-white px-4 py-2 text-sm font-bold text-navy shadow-offset-sm">
              <Sparkles className="h-4 w-4 text-primary" /> Votre activité, enfin sous contrôle
            </span>
            <p className="max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-navy xl:text-6xl">
              Retrouvez votre entreprise là où vous l'avez laissée.
            </p>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Devis, factures, clients et paiements réunis dans un espace simple, conçu pour les artisans et les indépendants.
            </p>
            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
              {[
                "Vos documents centralisés",
                "Un suivi clair des paiements",
                "Des devis créés plus vite",
                "Vos données protégées",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 font-semibold text-navy">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white">
                    <Check className="h-4 w-4" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </section>

          {/* Formulaire */}
          <section
            className="rounded-[var(--shape-control)] border-2 border-navy bg-card p-6 shadow-offset sm:p-9"
            aria-labelledby="connexion-title"
          >
            <div className="mb-7">
              <span className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-primary">
                <ShieldCheck className="h-4 w-4" /> Espace sécurisé
              </span>
              <h1 id="connexion-title" className="text-3xl font-black tracking-tight text-navy">
                {t("auth.login.title")}
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("auth.login.subtitle")}</p>
            </div>

            {/* Bannière d'erreur */}
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-[var(--shape-control)] border-2 border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold text-navy">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.fr"
                    className={inputClass}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="text-sm font-bold text-navy">
                    {t("auth.password")}
                  </label>
                  <Link to="/mot-de-passe-oublie" className="text-xs font-bold text-primary hover:underline">
                    {t("auth.forgot_password")}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-[var(--shape-control)] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[var(--shape-control)] border-2 border-navy bg-primary px-5 py-3 text-sm font-extrabold text-white shadow-offset-sm transition hover:-translate-y-0.5 hover:shadow-offset disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Connexion en cours…
                  </>
                ) : (
                  <>
                    {t("auth.login")}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-muted-foreground">
              {t("auth.no_account")}{" "}
              <Link to="/inscription" className="font-bold text-primary hover:underline">
                {t("auth.signup")} →
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
