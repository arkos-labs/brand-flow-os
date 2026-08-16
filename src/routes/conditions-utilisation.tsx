import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/conditions-utilisation")({
  head: () => ({
    meta: [
      { title: "Conditions d'utilisation — ClearQuote" },
    ],
  }),
  component: ConditionsUtilisationPage,
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

function ConditionsUtilisationPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Légal</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Conditions d'utilisation
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Les conditions générales de vente et d'utilisation de nos services.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 800, background: "var(--paper)", border: "2px solid var(--ink)", padding: "60px", boxShadow: "8px 8px 0 var(--ink)" }}>
            <div style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink)", display: "flex", flexDirection: "column", gap: "24px" }}>
              <p><strong>Dernière mise à jour : 15 Août 2026</strong></p>
              
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>1. Objet</h2>
              <p>Les présentes Conditions Générales d'Utilisation et de Vente (CGUV) régissent l'utilisation de la plateforme logicielle en mode SaaS "ClearQuote", éditée par la société ClearQuote SAS.</p>
              
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>2. Accès au service</h2>
              <p>Le service est accessible via internet à tout professionnel (B2B). L'utilisateur est seul responsable du bon fonctionnement de son équipement informatique ainsi que de son accès à internet.</p>

              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>3. Obligation de l'utilisateur</h2>
              <p>L'utilisateur s'engage à fournir des informations exactes lors de la création de ses documents commerciaux. ClearQuote génère des factures conformes (Factur-X) basées sur les données saisies, mais la responsabilité finale des mentions légales obligatoires sur les factures incombe à l'émetteur (l'utilisateur).</p>

              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>4. Tarifs et abonnement</h2>
              <p>L'utilisation de base est gratuite (Plan Solo, limité à 3 documents). Les fonctionnalités avancées requièrent un abonnement payant. Les prix sont indiqués HT. L'abonnement est sans engagement de durée et peut être résilié à tout moment depuis les paramètres du compte.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
