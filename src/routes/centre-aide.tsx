import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/centre-aide")({
  head: () => ({
    meta: [
      { title: "Centre d'aide — ClearQuote" },
      { name: "description", content: "Trouvez des réponses à vos questions sur ClearQuote : devis, factures, compte, facturation électronique Factur-X et conformité 2026." },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/centre-aide" }],
  }),
  component: CentreAidePage,
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

function CentreAidePage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Support</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Centre d'aide
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Trouvez des réponses rapides à vos questions ou contactez notre équipe.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 1000 }}>
            
            {/* Barre de recherche */}
            <div style={{ marginBottom: 48, background: "var(--ink)", padding: "32px", border: "2px solid var(--ink)", boxShadow: "8px 8px 0 var(--signal)" }}>
              <h2 style={{ color: "#fff", fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "0 0 16px" }}>Comment pouvons-nous vous aider ?</h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <input 
                  type="text" 
                  placeholder="Rechercher un article (ex: créer une facture)" 
                  style={{ flex: 1, padding: "16px", border: "2px solid var(--ink)", background: "#fff", fontFamily: "IBM Plex Mono, monospace", fontSize: 14, outline: "none" }}
                />
                <button className="devizia-button" style={{ background: "var(--signal)", border: "2px solid #fff", color: "#fff" }}>Rechercher</button>
              </div>
            </div>

            {/* Catégories */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 32 }}>
              {[
                { title: "Premiers pas", desc: "Configuration du compte, importation des clients et catalogue." },
                { title: "Devis & Facturation", desc: "Création, envoi, relances et conformité Factur-X." },
                { title: "CRM & Clients", desc: "Gestion des fiches clients, pipeline commercial." },
                { title: "Trésorerie & Paiements", desc: "Suivi des encaissements, paiements en ligne." },
                { title: "Mon Compte", desc: "Abonnement, factures ClearQuote, utilisateurs." },
                { title: "Problèmes techniques", desc: "Résolution des bugs courants et statut du système." }
              ].map(cat => (
                <Link to="/contactez-nous" key={cat.title} style={{ display: "block", textDecoration: "none", color: "inherit", background: "var(--paper)", border: "2px solid var(--ink)", padding: "28px", boxShadow: "4px 4px 0 var(--ink)", transition: "transform 0.1s" }} onMouseEnter={e => e.currentTarget.style.transform = "translate(2px, 2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translate(0, 0)"}>
                  <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 22, textTransform: "uppercase", margin: "0 0 10px" }}>{cat.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.5, color: "var(--muted)", margin: 0 }}>{cat.desc}</p>
                </Link>
              ))}
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
