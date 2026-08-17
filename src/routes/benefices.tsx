import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock, TrendingUp, ShieldCheck, Smartphone, Euro,
  ArrowRight, Check, Zap, Star, Menu, X,
} from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/benefices")({
  head: () => ({
    meta: [
      { title: "Bénéfices — ClearQuote | Pourquoi choisir ClearQuote pour votre activité" },
      {
        name: "description",
        content:
          "ClearQuote fait gagner en moyenne 4 heures par semaine aux artisans, freelances et TPE. Moins d'administratif, plus de visibilité sur vos encaissements, conformité 2026 garantie. Découvrez les bénéfices concrets.",
      },
      { property: "og:title", content: "Pourquoi choisir ClearQuote — Les bénéfices concrets" },
      { property: "og:description", content: "4h gagnées par semaine en moyenne. Zéro devis oublié. Conformité Factur-X 2026 incluse. Découvrez ce que ClearQuote change vraiment." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://clearquote.fr/benefices" },
      { property: "og:image", content: "https://clearquote.fr/og-default.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/benefices" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          "name": "Bénéfices de ClearQuote",
          "description": "Les avantages concrets de ClearQuote pour les artisans, freelances et TPE.",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Gain de temps", "description": "4 heures gagnées par semaine en moyenne grâce à l'automatisation des devis, factures et relances." },
            { "@type": "ListItem", "position": 2, "name": "Conformité légale 2026", "description": "Documents Factur-X, Piste d'Audit Fiable et loi anti-fraude TVA inclus sans action de votre part." },
            { "@type": "ListItem", "position": 3, "name": "Meilleure visibilité financière", "description": "Trésorerie prédictive et tableau de bord KPIs pour piloter votre activité en temps réel." },
            { "@type": "ListItem", "position": 4, "name": "Encaissement plus rapide", "description": "Relances automatiques et paiement en ligne intégré réduisent le délai moyen de paiement de 12 jours." },
          ],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "ClearQuote convient-il aux artisans du BTP ?",
              "acceptedAnswer": { "@type": "Answer", "text": "Oui. ClearQuote est particulièrement adapté aux artisans BTP : TVA à 10% sur travaux de rénovation, acomptes et soldes. La numérotation est conforme aux exigences de l'URSSAF." },
            },
            {
              "@type": "Question",
              "name": "Est-ce que ClearQuote remplace un expert-comptable ?",
              "acceptedAnswer": { "@type": "Answer", "text": "Non. ClearQuote simplifie et automatise la gestion commerciale et documentaire, mais ne remplace pas les conseils d'un expert-comptable. Il génère des exports compatibles avec les logiciels comptables pour faciliter la collaboration." },
            },
          ],
        }),
      },
    ],
  }),
  component: BeneficesPage,
});

const BENEFITS = [
  {
    icon: Clock,
    stat: "4h",
    statLabel: "gagnées / semaine",
    title: "Moins d'administratif, plus de chantier",
    desc: "Un devis Word prend 25 minutes en moyenne. Sur ClearQuote, vous en créez un en 3 minutes. Relances automatiques, conversion devis → facture en un clic, rappels d'échéances : tout ce qui prend du temps est automatisé.",
    color: "var(--signal)",
    points: ["Devis en 3 minutes chrono", "Relances automatiques sans effort", "Conversion devis → facture en 1 clic", "Rappels d'échéances intégrés"],
  },
  {
    icon: Euro,
    stat: "−12j",
    statLabel: "délai de paiement moyen",
    title: "Encaissez plus vite",
    desc: "Les clients qui reçoivent un lien de paiement avec leur facture paient en moyenne 12 jours plus tôt. ClearQuote intègre le paiement par carte et virement SEPA directement sur la facture.",
    color: "var(--green)",
    points: ["Paiement carte et SEPA sur la facture", "Rappels automatiques J+7, J+14, J+30", "Calcul automatique des pénalités légales", "Historique des encaissements en temps réel"],
  },
  {
    icon: ShieldCheck,
    stat: "100%",
    statLabel: "conforme 2026",
    title: "Zéro risque légal",
    desc: "La réforme de facturation électronique 2026 oblige toutes les entreprises françaises à émettre des factures au format Factur-X. ClearQuote le fait automatiquement. Vous n'avez rien à changer.",
    color: "var(--orange)",
    points: ["Factur-X natif (PDF + XML embarqué)", "Piste d'Audit Fiable horodatée", "Conformité loi anti-fraude TVA", "Archivage 10 ans inclus"],
  },
  {
    icon: TrendingUp,
    stat: "360°",
    statLabel: "visibilité financière",
    title: "Pilotez votre activité",
    desc: "Fini les fins de mois surprises. Le tableau de bord ClearQuote affiche votre chiffre d'affaires en temps réel, les factures en attente et une projection de trésorerie sur 90 jours.",
    color: "var(--signal)",
    points: ["CA temps réel et comparatif N-1", "Prévision de trésorerie 90 jours", "Alertes factures en retard", "Taux de conversion devis / factures"],
  },
  {
    icon: Smartphone,
    stat: "100%",
    statLabel: "mobile & terrain",
    title: "Depuis le chantier ou le bureau",
    desc: "ClearQuote fonctionne sur téléphone, tablette et ordinateur. Créez un devis depuis le chantier, signez-le avec le client sur place. Tout se synchronise en temps réel.",
    color: "var(--green)",
    points: ["Interface responsive optimisée mobile", "Signature client sur place", "Accès hors connexion en lecture", "Notifications push en temps réel"],
  },
];

const TESTIMONIALS = [
  {
    name: "Karim B.",
    role: "Électricien indépendant — Lyon",
    text: "Avant ClearQuote, je faisais mes devis sur Word et j'oubliais souvent de relancer. Maintenant tout est automatique. J'ai récupéré au moins 3-4h par semaine.",
    stars: 5,
  },
  {
    name: "Sophie M.",
    role: "Graphiste freelance — Paris",
    text: "Le portail client est une révolution. Mes clients signent directement depuis leur téléphone et je suis notifiée aussitôt. Plus de devis qui traînent des semaines.",
    stars: 5,
  },
  {
    name: "Entreprise Lefebvre",
    role: "Plomberie-Chauffage — Lille",
    text: "On facture par acomptes sur des chantiers importants. ClearQuote gère ça parfaitement, avec la bonne TVA à 10%. Un gain de temps énorme.",
    stars: 5,
  },
];

const FAQ = [
  {
    q: "ClearQuote convient-il aux artisans du BTP ?",
    a: "Oui. ClearQuote est particulièrement adapté aux artisans BTP : TVA à 10% sur travaux de rénovation, acomptes et soldes. La numérotation est conforme aux exigences de l'URSSAF.",
  },
  {
    q: "Est-ce que ClearQuote remplace un expert-comptable ?",
    a: "Non. ClearQuote simplifie et automatise la gestion commerciale et documentaire, mais ne remplace pas les conseils d'un expert-comptable. Il génère des exports compatibles avec les logiciels comptables pour faciliter la collaboration.",
  },
  {
    q: "Que se passe-t-il si je veux arrêter ?",
    a: "Vous pouvez exporter l'intégralité de vos données (devis, factures, clients) en CSV ou PDF à tout moment, sans frais. Vos documents archivés restent accessibles pendant 10 ans conformément à la loi.",
  },
  {
    q: "ClearQuote fonctionne-t-il pour les auto-entrepreneurs ?",
    a: "Oui. Le plan Solo est gratuit jusqu'à 3 documents par mois, idéal pour démarrer. Le plan Pro à 29€/mois n'a aucune limite de documents et inclut toutes les fonctionnalités.",
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

const navLinkStyle: React.CSSProperties = { color: "oklch(0.75 0.03 255)", fontSize: 12, fontWeight: 500, textDecoration: "none", lineHeight: 1.6 };
const navTitleStyle: React.CSSProperties = { fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "oklch(0.58 0.2 258)", marginBottom: 10, display: "block" };


function BeneficesPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        {/* Hero */}
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Résultats concrets</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Ce que ClearQuote<br />change vraiment.<br /><em style={{ color: "oklch(0.85 0.12 255)", fontStyle: "normal" }}>Pour vous.</em>
            </h1>
            <p style={{ maxWidth: 560, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Moins de temps sur l'administratif. Des encaissements plus rapides. Une conformité légale sans effort. Voici ce que nos utilisateurs gagnent concrètement.
            </p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* Bénéfices */}
        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container">
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
              {BENEFITS.map((b, i) => (
                <article key={b.title} style={{ display: "grid", gridTemplateColumns: i % 2 === 0 ? "1fr 1fr" : "1fr 1fr", gap: 40, alignItems: "center" }}>
                  {/* Stat side */}
                  <div style={{ order: i % 2 === 0 ? 0 : 1, background: "var(--ink)", padding: "48px 40px", textAlign: "center", border: "2px solid var(--ink)", boxShadow: "6px 6px 0 var(--ink)" }}>
                    <div style={{ display: "inline-grid", placeItems: "center", width: 56, height: 56, background: b.color, marginBottom: 20 }}>
                      <b.icon size={24} color="#fff" />
                    </div>
                    <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 80, lineHeight: 1, color: b.color, margin: "0 0 4px" }}>{b.stat}</p>
                    <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#fff", opacity: 0.6 }}>{b.statLabel}</p>
                  </div>
                  {/* Text side */}
                  <div style={{ order: i % 2 === 0 ? 1 : 0 }}>
                    <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(26px, 3vw, 38px)", textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 14px" }}>{b.title}</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.65, fontWeight: 500, color: "oklch(0.35 0.04 258)", margin: "0 0 20px" }}>{b.desc}</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {b.points.map((p) => (
                        <li key={p} style={{ display: "flex", gap: 10, fontSize: 13.5, fontWeight: 600 }}>
                          <Check size={14} style={{ color: b.color, flexShrink: 0, marginTop: 2 }} /> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Témoignages */}
        <section style={{ padding: "72px 0", background: "var(--ink)", color: "#fff" }}>
          <div className="devizia-container">
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <span className="section-kicker" style={{ background: "var(--signal)" }}>Témoignages</span>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 52px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 0", color: "#fff" }}>
                Ils utilisent ClearQuote
              </h2>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
              {TESTIMONIALS.map((t) => (
                <blockquote key={t.name} style={{ background: "oklch(0.28 0.045 265)", border: "2px solid oklch(0.35 0.045 270)", padding: "24px", margin: 0 }}>
                  <div style={{ display: "flex", gap: 2, marginBottom: 14 }}>
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} size={14} fill="var(--warning)" color="var(--warning)" />
                    ))}
                  </div>
                  <p style={{ fontSize: 14.5, lineHeight: 1.65, fontWeight: 500, color: "oklch(0.88 0.02 260)", margin: "0 0 18px", fontStyle: "italic" }}>"{t.text}"</p>
                  <footer>
                    <p style={{ fontWeight: 700, fontSize: 13, margin: "0 0 2px", color: "#fff" }}>{t.name}</p>
                    <p style={{ fontSize: 11, opacity: 0.5, margin: 0, fontFamily: "IBM Plex Mono, monospace" }}>{t.role}</p>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 740 }}>
            <span className="section-kicker">Questions fréquentes</span>
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 50px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 40px" }}>
              Vos questions, nos réponses
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

        {/* CTA */}
        <section style={{ background: "linear-gradient(140deg, oklch(0.18 0.05 264) 0%, oklch(0.26 0.09 258) 55%, oklch(0.22 0.07 252) 100%)", padding: "80px 0", textAlign: "center", color: "#fff", borderTop: "2px solid var(--ink)" }}>
          <div className="devizia-container">
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(40px, 5vw, 66px)", textTransform: "uppercase", lineHeight: 0.88, margin: "0 0 16px" }}>
              Essayez, vous verrez la différence.
            </h2>
            <p style={{ maxWidth: 480, margin: "0 auto 28px", fontSize: 16, opacity: 0.8, fontWeight: 500 }}>Gratuit jusqu'à 3 documents par mois. Aucune carte bancaire requise.</p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
