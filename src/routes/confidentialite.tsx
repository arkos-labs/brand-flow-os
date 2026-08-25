import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/confidentialite")({
  head: () => ({
    meta: [
      { title: "Politique de confidentialité — ClearQuote" },
      { name: "description", content: "Politique de confidentialité de ClearQuote : collecte, traitement et protection de vos données personnelles (RGPD)." },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/confidentialite" }],
  }),
  component: ConfidentialitePage,
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

function ConfidentialitePage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Légal</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Politique de confidentialité
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Découvrez comment nous protégeons vos données personnelles.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 800, background: "var(--paper)", border: "2px solid var(--ink)", padding: "60px", boxShadow: "8px 8px 0 var(--ink)" }}>
            <div style={{ fontSize: 16, lineHeight: 1.7, color: "var(--ink)", display: "flex", flexDirection: "column", gap: "24px" }}>
              <p><strong>Dernière mise à jour : 15 Août 2026</strong></p>
              
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>1. Collecte des données</h2>
              <p>Chez ClearQuote, la protection de vos données personnelles est notre priorité. Nous collectons uniquement les informations nécessaires au bon fonctionnement de notre service de facturation et CRM : nom, adresse email, informations d'entreprise (SIRET, adresse), et les données relatives à vos devis et factures.</p>
              
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>2. Utilisation des données</h2>
              <p>Vos données sont utilisées exclusivement pour :</p>
              <ul style={{ paddingLeft: "20px" }}>
                <li>Générer vos documents commerciaux (Factur-X, PDF).</li>
                <li>Assurer la conformité légale de votre facturation.</li>
                <li>Vous fournir un support technique.</li>
                <li>Améliorer nos services.</li>
              </ul>

              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>3. Hébergement et Sécurité</h2>
              <p>Toutes vos données sont hébergées sur des serveurs sécurisés situés en France (AWS Paris / Scaleway). Nous utilisons des protocoles de chiffrement avancés (TLS 1.3 en transit, AES-256 au repos) pour garantir l'intégrité et la confidentialité de vos informations financières.</p>

              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "24px 0 0" }}>4. Vos droits (RGPD)</h2>
              <p>Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification, de portabilité et de suppression de vos données. Vous pouvez exercer ces droits à tout moment en nous contactant à <strong>privacy@clearquote.fr</strong>.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
