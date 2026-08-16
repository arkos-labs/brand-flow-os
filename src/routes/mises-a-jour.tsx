import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/mises-a-jour")({
  head: () => ({
    meta: [
      { title: "Mises à jour à venir — ClearQuote" },
    ],
  }),
  component: MisesAJourPage,
});

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

function MisesAJourPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Roadmap</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Mises à jour à venir
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Découvrez ce que nous vous préparons pour les mois à venir.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 900 }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
              {[
                {
                  quarter: "T4 2026",
                  status: "En cours",
                  color: "var(--signal)",
                  items: [
                    { title: "Application Mobile", desc: "Versions natives iOS et Android pour gérer vos devis sur le terrain." },
                    { title: "Paiement en plusieurs fois", desc: "Permettez à vos clients de régler en 3x ou 4x sans frais via notre partenaire." }
                  ]
                },
                {
                  quarter: "T1 2027",
                  status: "Planifié",
                  color: "var(--orange)",
                  items: [
                    { title: "Intégration bancaire directe", desc: "Rapprochement automatique de vos factures avec votre compte bancaire (DSP2)." },
                    { title: "Portail expert-comptable", desc: "Accès dédié pour votre comptable avec export FEC automatisé mensuellement." }
                  ]
                },
                {
                  quarter: "T2 2027",
                  status: "À l'étude",
                  color: "var(--ink)",
                  items: [
                    { title: "Gestion des stocks", desc: "Suivi des quantités et alertes de réapprovisionnement." },
                    { title: "API Publique", desc: "Connectez ClearQuote à vos propres outils internes." }
                  ]
                }
              ].map((phase, i) => (
                <div key={i} style={{ background: "var(--paper)", border: "2px solid var(--ink)", padding: "32px", boxShadow: `6px 6px 0 ${phase.color}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 36, textTransform: "uppercase", margin: 0 }}>{phase.quarter}</h2>
                    <span style={{ font: "700 10px 'IBM Plex Mono', monospace", textTransform: "uppercase", background: phase.color, color: "#fff", padding: "4px 8px" }}>{phase.status}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {phase.items.map((item, j) => (
                      <div key={j}>
                        <h3 style={{ font: "800 18px 'Barlow Condensed', sans-serif", textTransform: "uppercase", margin: "0 0 8px" }}>{item.title}</h3>
                        <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
