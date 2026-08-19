import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, ArrowRight, Zap, ShieldCheck, Menu, X } from "lucide-react";
import React, { useState } from "react";
import { useSupabaseData } from "@/lib/supabase-context";
import { toast } from "sonner";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs — ClearQuote | Formules Solo, Pro et Agency" },
      {
        name: "description",
        content:
          "Formules ClearQuote à partir de 0 €/mois. Solo gratuit jusqu'à 3 documents, Pro à 29 €/mois illimité, Agency à 79 €/mois multi-utilisateurs. Conformité Factur-X 2026 incluse dans toutes les formules.",
      },
      { property: "og:title", content: "Tarifs ClearQuote — À partir de 0 €/mois" },
      { property: "og:description", content: "Formules sans engagement. Conformité Factur-X 2026 incluse. Essai gratuit 14 jours." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://clearquote.fr/tarifs" },
      { property: "og:image", content: "https://clearquote.fr/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/tarifs" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ClearQuote",
          "applicationCategory": "BusinessApplication",
          "offers": [
            { "@type": "Offer", "name": "Solo", "price": "0", "priceCurrency": "EUR", "description": "Gratuit jusqu'à 3 documents par mois" },
            { "@type": "Offer", "name": "Pro", "price": "29", "priceCurrency": "EUR", "description": "Documents illimités, 1 utilisateur" },
            { "@type": "Offer", "name": "Agency", "price": "79", "priceCurrency": "EUR", "description": "Jusqu'à 5 utilisateurs, marque blanche" },
          ],
        }),
      },
    ],
  }),
  component: TarifsPage,
});

const PLANS = [
  {
    name: "Solo",
    price: "0 €",
    period: "/ mois",
    desc: "Pour démarrer et tester sans risque",
    highlight: false,
    badge: null,
    cta: "Commencer gratuitement",
    ctaTo: "/inscription",
    color: "var(--ink)",
    features: [
      "3 devis et 3 factures par mois",
      "1 client actif",
      "PDF standard ClearQuote",
      "Factur-X inclus",
      "Conformité 2026",
      "Support par email",
    ],
    disabled: ["Catalogue illimité", "Relances automatiques", "Signature électronique", "Trésorerie prédictive"],
    stripePriceId: null,
  },
  {
    name: "Pro",
    price: "19,99 €",
    period: "/ mois",
    desc: "Pour les freelances et artisans actifs",
    highlight: true,
    badge: "Le plus populaire",
    cta: "Essayer 14 jours gratuit",
    ctaTo: "/inscription",
    color: "var(--signal)",
    features: [
      "Devis et factures illimités",
      "Clients illimités",
      "Catalogue de prestations",
      "PDF à vos couleurs (logo, marque)",
      "Factur-X + Piste d'Audit Fiable",
      "Signature électronique client",
      "Relances automatiques",
      "Trésorerie prédictive",
      "Export comptable (FEC, CSV)",
      "Portail client avec accès PIN",
      "Support prioritaire",
    ],
    disabled: [],
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_PRO || "price_REPLACE_WITH_PRO_PRICE_ID",
  },
  {
    name: "Agency",
    price: "49,99 €",
    period: "/ mois",
    desc: "Pour les équipes et agences",
    highlight: false,
    badge: null,
    cta: "Contacter l'équipe",
    ctaTo: "/inscription",
    color: "var(--green)",
    features: [
      "Tout ce qui est dans Pro",
      "Jusqu'à 5 utilisateurs",
      "Marque blanche (domaine custom)",
      "Emails envoyés depuis votre domaine",
      "Rôles et permissions avancés",
      "Multi-sociétés",
      "Suivi du temps par projet",
      "Analyse de rentabilité équipe",
      "API & webhooks",
      "Intégrations Pennylane, Xero",
      "Account manager dédié",
    ],
    disabled: [],
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_AGENCY || "price_REPLACE_WITH_AGENCY_PRICE_ID",
  },
];

const FAQ = [
  {
    q: "Puis-je changer de formule à tout moment ?",
    a: "Oui. Vous pouvez upgrader ou downgrader votre formule à tout moment depuis vos paramètres. La facturation est au prorata du mois en cours.",
  },
  {
    q: "Y a-t-il un engagement de durée ?",
    a: "Non. Toutes les formules sont sans engagement. Vous pouvez annuler à tout moment. Vos documents restent accessibles et exportables pendant 10 ans.",
  },
  {
    q: "La conformité Factur-X est-elle vraiment incluse dans toutes les formules ?",
    a: "Oui, y compris dans la formule Solo gratuite. La conformité Factur-X 2026 est un prérequis légal, pas une option payante chez ClearQuote.",
  },
  {
    q: "Que se passe-t-il après les 14 jours d'essai Pro ?",
    a: "Vous basculez automatiquement sur la formule Solo (gratuite) si vous ne renseignez pas de carte bancaire. Aucun débit sans votre confirmation.",
  },
];

function PublicNav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="devizia-header">
      <div className="devizia-container devizia-header__inner">
        <Link to="/" aria-label="ClearQuote, accueil">
          <BrandLogo className="h-10 w-auto" priority />
        </Link>
        <nav className="devizia-nav" aria-label="Navigation principale">
          <Link to="/fonctionnalites">Fonctionnalités</Link>
          <Link to="/fonctionnement">Comment ça marche</Link>
          <Link to="/benefices">Bénéfices</Link>
          <Link to="/tarifs">Tarifs</Link>
        </nav>
        <div className="devizia-header__actions">
          <Link to="/connexion" className="devizia-login">Se connecter</Link>
          <Link to="/inscription" className="devizia-button devizia-button--small">Essayer gratuitement <ArrowRight aria-hidden="true" /></Link>
        </div>
        <button className="devizia-menu-button" type="button" aria-label={open ? "Fermer" : "Menu"} onClick={() => setOpen(v => !v)}>
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="devizia-mobile-nav" aria-label="Navigation mobile">
          <Link to="/fonctionnalites" onClick={close}>Fonctionnalités</Link>
          <Link to="/fonctionnement" onClick={close}>Comment ça marche</Link>
          <Link to="/benefices" onClick={close}>Bénéfices</Link>
          <Link to="/tarifs" onClick={close}>Tarifs</Link>
          <Link to="/connexion" onClick={close}>Se connecter</Link>
          <Link to="/inscription" onClick={close} className="devizia-button">Essayer gratuitement</Link>
        </nav>
      )}
    </header>
  );
}


function TarifsPage() {
  const { session, profile } = useSupabaseData();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (plan: typeof PLANS[0], e: React.MouseEvent) => {
    // Si l'utilisateur n'est pas connecté, on laisse le Link faire son travail vers /inscription
    if (!session) return;
    
    // S'il est connecté et clique sur Solo, il est déjà en Solo (ou on redirige vers le dashboard)
    if (!plan.stripePriceId) {
      e.preventDefault();
      window.location.href = "/tableau-de-bord";
      return;
    }

    e.preventDefault();
    setLoadingPlan(plan.name);
    
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planName: plan.name.toLowerCase(), // On envoie le nom du plan (pro ou agency)
          email: session.user?.email,
          userId: session.user?.id,
          successUrl: window.location.origin + "/tableau-de-bord?payment=success",
          cancelUrl: window.location.origin + "/tarifs?payment=cancelled",
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de paiement");
      
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Impossible de contacter Stripe");
      setLoadingPlan(null);
    }
  };

  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        {/* Hero */}
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Tarifs transparents</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Simple, honnête.<br /><em style={{ color: "oklch(0.85 0.12 255)", fontStyle: "normal" }}>Sans surprise.</em>
            </h1>
            <p style={{ maxWidth: 540, margin: "0 auto 12px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Commencez gratuitement. Passez au Pro quand vous en avez besoin. La conformité Factur-X est incluse dans toutes les formules.
            </p>
            <p style={{ fontSize: 12, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "oklch(0.78 0.08 255)", marginTop: 8 }}>
              Sans engagement · Sans carte bancaire pour démarrer
            </p>
          </div>
        </section>

        {/* Plans */}
        <section style={{ padding: "72px 0", background: "var(--cream)" }}>
          <div className="devizia-container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 28, alignItems: "start" }}>
              {PLANS.map((plan) => (
                <article
                  key={plan.name}
                  style={{
                    background: plan.highlight ? "var(--ink)" : "var(--paper)",
                    border: `2px solid var(--ink)`,
                    boxShadow: plan.highlight ? "6px 6px 0 var(--signal)" : "4px 4px 0 var(--ink)",
                    padding: "32px 28px",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    transform: plan.highlight ? "translateY(-8px)" : undefined,
                  }}
                >
                  {plan.badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "var(--signal)", color: "#fff", padding: "4px 14px", fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap", border: "2px solid var(--ink)" }}>
                      {plan.badge}
                    </div>
                  )}

                  {/* En-tête plan */}
                  <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${plan.highlight ? "oklch(0.35 0.045 270)" : "var(--ink)"}`, opacity: 0.9 }}>
                    <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: plan.highlight ? "oklch(0.75 0.1 255)" : "var(--muted)", marginBottom: 6 }}>Formule</p>
                    <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 36, textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 4px", color: plan.highlight ? "#fff" : "var(--ink)" }}>{plan.name}</h2>
                    <p style={{ fontSize: 12.5, fontWeight: 500, color: plan.highlight ? "oklch(0.72 0.06 255)" : "var(--muted)", marginBottom: 16 }}>{plan.desc}</p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 56, lineHeight: 1, color: plan.highlight ? "var(--signal)" : plan.color }}>{plan.price}</span>
                      <span style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600, color: plan.highlight ? "oklch(0.6 0.06 255)" : "var(--muted)", textTransform: "uppercase" }}>{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul style={{ listStyle: "none", margin: "0 0 24px", padding: 0, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {plan.features.map((f) => (
                      <li key={f} style={{ display: "flex", gap: 10, fontSize: 13.5, fontWeight: 500, color: plan.highlight ? "oklch(0.9 0.02 255)" : "var(--ink)" }}>
                        <Check size={14} style={{ color: plan.color, flexShrink: 0, marginTop: 2 }} /> {f}
                      </li>
                    ))}
                    {plan.disabled.map((f) => (
                      <li key={f} style={{ display: "flex", gap: 10, fontSize: 13.5, fontWeight: 500, color: "oklch(0.72 0.02 255)", textDecoration: "line-through" }}>
                        <span style={{ width: 14, height: 14, flexShrink: 0, marginTop: 2, display: "inline-block", border: "1.5px solid oklch(0.8 0.02 255)", borderRadius: "50%" }} /> {f}
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    to={plan.ctaTo}
                    onClick={(e) => handleSubscribe(plan, e)}
                    className="devizia-button"
                    style={{
                      background: plan.highlight ? "var(--signal)" : "transparent",
                      color: plan.highlight ? "#fff" : "var(--ink)",
                      border: `2px solid ${plan.highlight ? "var(--signal)" : "var(--ink)"}`,
                      boxShadow: plan.highlight ? "4px 4px 0 #fff" : "3px 3px 0 var(--ink)",
                      justifyContent: "center",
                      width: "100%",
                      opacity: loadingPlan === plan.name ? 0.6 : 1,
                      pointerEvents: loadingPlan === plan.name ? "none" : "auto",
                    }}
                  >
                    {loadingPlan === plan.name ? "Redirection..." : (session ? (plan.stripePriceId ? "Souscrire" : "Plan actuel") : plan.cta)}{" "}
                    {loadingPlan !== plan.name && <ArrowRight size={14} />}
                  </Link>
                </article>
              ))}
            </div>

            {/* Note conformité */}
            <div style={{ marginTop: 40, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <ShieldCheck size={16} style={{ color: "var(--green)" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--muted)" }}>
                Factur-X · Piste d'Audit Fiable · RGPD — inclus dans toutes les formules
              </p>
            </div>
          </div>
        </section>

        {/* Comparatif rapide */}
        <section style={{ padding: "64px 0", background: "var(--ink)", color: "#fff" }}>
          <div className="devizia-container" style={{ maxWidth: 860 }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <span className="section-kicker" style={{ background: "var(--signal)" }}>Comparatif</span>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 44px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 0", color: "#fff" }}>Ce qui change selon la formule</h2>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 16px", fontFamily: "IBM Plex Mono, monospace", fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "oklch(0.6 0.04 255)", fontWeight: 600, borderBottom: "1px solid oklch(0.35 0.045 270)" }}>Fonctionnalité</th>
                    {["Solo", "Pro", "Agency"].map(n => (
                      <th key={n} style={{ textAlign: "center", padding: "10px 16px", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 18, textTransform: "uppercase", color: "#fff", borderBottom: "1px solid oklch(0.35 0.045 270)" }}>{n}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Documents / mois", "3", "Illimités", "Illimités"],
                    ["Factur-X conforme 2026", "✓", "✓", "✓"],
                    ["Signature électronique", "—", "✓", "✓"],
                    ["Relances automatiques", "—", "✓", "✓"],
                    ["Trésorerie prédictive", "—", "✓", "✓"],
                    ["Utilisateurs", "1", "1", "5"],
                    ["Marque blanche", "—", "—", "✓"],
                    ["API & webhooks", "—", "—", "✓"],
                  ].map(([feat, solo, pro, agency]) => (
                    <tr key={feat} style={{ borderBottom: "1px solid oklch(0.3 0.04 265)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 500, color: "oklch(0.82 0.02 260)" }}>{feat}</td>
                      {[solo, pro, agency].map((val, i) => (
                        <td key={i} style={{ textAlign: "center", padding: "12px 16px", fontWeight: 700, color: val === "✓" ? "var(--green)" : val === "—" ? "oklch(0.45 0.03 265)" : "#fff" }}>{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 740 }}>
            <span className="section-kicker">Questions fréquentes</span>
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 50px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 40px" }}>
              Tout savoir sur les tarifs
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {FAQ.map((item) => (
                <details key={item.q} style={{ border: "2px solid var(--ink)", padding: "18px 20px", background: "var(--paper)" }}>
                  <summary style={{ fontWeight: 700, fontSize: 15, cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {item.q}
                    <span style={{ marginLeft: 12, flexShrink: 0, color: "var(--signal)" }}>+</span>
                  </summary>
                  <p style={{ margin: "14px 0 0", fontSize: 14, lineHeight: 1.6, fontWeight: 500, color: "oklch(0.38 0.04 255)" }}>{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section style={{ background: "linear-gradient(140deg, oklch(0.18 0.05 264) 0%, oklch(0.26 0.09 258) 55%, oklch(0.22 0.07 252) 100%)", padding: "80px 0", textAlign: "center", color: "#fff", borderTop: "2px solid var(--ink)" }}>
          <div className="devizia-container">
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(40px, 5vw, 66px)", textTransform: "uppercase", lineHeight: 0.88, margin: "0 0 16px" }}>
              Commencez aujourd'hui.<br />C'est gratuit.
            </h2>
            <p style={{ maxWidth: 480, margin: "0 auto 28px", fontSize: 16, opacity: 0.8, fontWeight: 500 }}>Aucune carte bancaire. Passez Pro quand vous êtes prêt.</p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Créer mon compte gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
