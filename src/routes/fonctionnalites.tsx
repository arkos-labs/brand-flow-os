import { createFileRoute, Link } from "@tanstack/react-router";
import {
  FileText, ReceiptEuro, KanbanSquare, Clock, TrendingUp,
  ShieldCheck, Sparkles, ArrowRight, Check, Zap, Users,
  CreditCard, Bell, Download, Globe2, Menu, X,
} from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/fonctionnalites")({
  head: () => ({
    meta: [
      { title: "Fonctionnalités — ClearQuote | Devis, Facturation, CRM et Trésorerie" },
      {
        name: "description",
        content:
          "Découvrez toutes les fonctionnalités ClearQuote : création de devis professionnels, facturation Factur-X conforme 2026, CRM Kanban, suivi du temps, trésorerie prédictive et relances automatiques. Pensé pour les artisans, freelances et TPE.",
      },
      { property: "og:title", content: "Fonctionnalités ClearQuote — Tout ce dont vous avez besoin" },
      { property: "og:description", content: "Devis, factures, CRM, temps et trésorerie dans un seul outil conforme Factur-X 2026." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/fonctionnalites" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "ClearQuote",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://clearquote.fr",
          "description": "Logiciel de devis et facturation pour artisans, freelances et TPE. Conforme Factur-X 2026.",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EUR" },
          "featureList": [
            "Création de devis professionnels",
            "Facturation électronique Factur-X",
            "CRM Kanban pipeline commercial",
            "Suivi du temps par projet",
            "Trésorerie prédictive",
            "Relances automatiques",
            "Portail client avec signature",
            "Conformité loi anti-fraude TVA 2026",
          ],
        }),
      },
    ],
  }),
  component: FonctionnalitesPage,
});

const FEATURES = [
  {
    icon: FileText,
    title: "Devis professionnels",
    color: "var(--signal)",
    items: [
      "Éditeur ligne par ligne avec catalogue de prestations",
      "Numérotation automatique séquentielle (DV-YYYY-NNN)",
      "Statuts temps réel : brouillon → envoyé → signé",
      "Génération PDF instantanée aux couleurs de votre marque",
      "Envoi par email avec suivi d'ouverture",
      "Signature électronique client intégrée",
    ],
  },
  {
    icon: ReceiptEuro,
    title: "Facturation Factur-X 2026",
    color: "var(--green)",
    items: [
      "Format Factur-X obligatoire dès 2026 (PDF + XML embarqué)",
      "Numérotation inaltérable et séquentielle (FA-YYYY-NNNN)",
      "Avoirs automatiques — jamais d'édition directe d'une facture validée",
      "Piste d'Audit Fiable (PAF) horodatée IP + timestamp",
      "Conformité loi anti-fraude TVA et LME",
      "TVA 20%, 10%, 5,5% et auto-liquidation",
    ],
  },
  {
    icon: KanbanSquare,
    title: "CRM & Pipeline commercial",
    color: "var(--orange)",
    items: [
      "Vue Kanban glisser-déposer : prospect → devis → gagné",
      "Fiche client complète avec historique 360°",
      "Auto-complétion SIRET via API SIRENE / Pappers",
      "Validation TVA intracommunautaire (VIES)",
      "Formulaire de demande de devis intégrable sur votre site",
      "Relances intelligentes par email",
    ],
  },
  {
    icon: Clock,
    title: "Suivi du temps",
    color: "#7c3aed",
    items: [
      "Chronomètre par client et par projet",
      "Facturation en un clic des heures non facturées",
      "Analyse de rentabilité : coût équipe vs prix vendu",
      "Rapports hebdomadaires et mensuels",
      "Multi-projets simultanés",
    ],
  },
  {
    icon: TrendingUp,
    title: "Trésorerie prédictive",
    color: "var(--signal)",
    items: [
      "Graphique de cashflow prévisionnel sur 90 jours",
      "Probabilité de paiement par facture",
      "Alertes solde bas avant échéance",
      "Intégration dépenses fournisseurs",
      "Export comptable (FEC, CSV)",
    ],
  },
  {
    icon: ShieldCheck,
    title: "Conformité & Sécurité",
    color: "var(--green)",
    items: [
      "Hébergement européen — souveraineté des données RGPD",
      "Row Level Security multi-tenant",
      "Archivage 10 ans des documents fiscaux",
      "Chiffrement des données au repos et en transit",
      "Export de vos données à tout moment",
    ],
  },
];

const FAQ = [
  {
    q: "ClearQuote est-il conforme à la réforme de facturation électronique 2026 ?",
    a: "Oui. ClearQuote génère nativement des fichiers Factur-X (PDF + XML embarqué), le seul format hybride accepté par l'administration fiscale française à partir de 2026. Chaque document est horodaté et archivé dans la Piste d'Audit Fiable.",
  },
  {
    q: "Puis-je importer mon catalogue de prestations existant ?",
    a: "Oui. ClearQuote accepte l'import CSV pour votre catalogue de produits et prestations. Vous pouvez aussi créer vos lignes directement dans l'éditeur et les sauvegarder en un clic.",
  },
  {
    q: "La signature électronique est-elle juridiquement valable ?",
    a: "ClearQuote intègre une signature simple conforme eIDAS. Pour les contrats à fort enjeu, une signature qualifiée certifiée est disponible en option.",
  },
  {
    q: "Y a-t-il une limite au nombre de devis et factures ?",
    a: "Le plan Solo permet 3 documents par mois. Les plans Pro et Agency offrent des documents illimités avec toutes les fonctionnalités.",
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


function FonctionnalitesPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        {/* Hero */}
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Fonctionnalités complètes</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Tout ce dont vous avez besoin.<br /><em style={{ color: "oklch(0.85 0.12 255)", fontStyle: "normal" }}>Sans le superflu.</em>
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              ClearQuote réunit devis, facturation, CRM, suivi du temps et trésorerie dans un espace de travail unique — conforme aux obligations françaises 2026.
            </p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* Grille fonctionnalités */}
        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
              {FEATURES.map((f) => (
                <article key={f.title} style={{ background: "var(--paper)", border: "2px solid var(--ink)", padding: "28px 24px", boxShadow: "4px 4px 0 var(--ink)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                    <span style={{ display: "grid", placeItems: "center", width: 40, height: 40, background: f.color, color: "#fff", flexShrink: 0 }}>
                      <f.icon size={18} />
                    </span>
                    <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 20, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>{f.title}</h2>
                  </div>
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {f.items.map((item) => (
                      <li key={item} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.45, fontWeight: 500 }}>
                        <Check size={14} style={{ color: "var(--green)", flexShrink: 0, marginTop: 2 }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Bandeau conformité */}
        <section style={{ background: "var(--ink)", color: "#fff", padding: "48px 0", textAlign: "center" }}>
          <div className="devizia-container">
            <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.55, marginBottom: 10 }}>Conformité légale</p>
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 52px)", textTransform: "uppercase", lineHeight: 0.9, margin: "0 0 16px" }}>
              Factur-X · PAF · Loi anti-fraude TVA · RGPD
            </h2>
            <p style={{ maxWidth: 600, margin: "0 auto 28px", fontSize: 15, opacity: 0.75, fontWeight: 500 }}>
              Tous vos documents sont conformes aux obligations fiscales françaises et européennes en vigueur en 2026. Aucune mise à jour manuelle de votre côté.
            </p>
            <Link to="/tarifs" className="devizia-button" style={{ background: "var(--signal)", color: "#fff", border: "2px solid #fff" }}>
              Voir les formules <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* FAQ SEO */}
        <section style={{ padding: "72px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 740 }}>
            <span className="section-kicker">Questions fréquentes</span>
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 50px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 40px" }}>
              Tout ce que vous voulez savoir
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
              Prêt à gagner du temps ?
            </h2>
            <p style={{ maxWidth: 480, margin: "0 auto 28px", fontSize: 16, opacity: 0.8, fontWeight: 500 }}>Créez votre espace ClearQuote en moins de 2 minutes. Aucune carte bancaire requise.</p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
