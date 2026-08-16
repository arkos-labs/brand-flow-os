import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/contactez-nous")({
  head: () => ({
    meta: [
      { title: "Contactez-nous — ClearQuote" },
      { name: "description", content: "Contactez l'équipe ClearQuote pour toute question sur votre compte, la facturation ou une demande de démonstration." },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/contactez-nous" }],
  }),
  component: ContactezNousPage,
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

function ContactezNousPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Support</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Contactez-nous
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Nous sommes là pour vous aider.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 1000, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>
            
            {/* Formulaire */}
            <div style={{ background: "var(--paper)", border: "2px solid var(--ink)", padding: "40px", boxShadow: "6px 6px 0 var(--ink)" }}>
              <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 28, textTransform: "uppercase", margin: "0 0 24px" }}>Envoyez-nous un message</h2>
              <form style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Nom complet</label>
                  <input type="text" style={{ width: "100%", padding: "14px", border: "2px solid var(--ink)", background: "#fff", outline: "none", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Adresse email</label>
                  <input type="email" style={{ width: "100%", padding: "14px", border: "2px solid var(--ink)", background: "#fff", outline: "none", fontFamily: "inherit" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Sujet</label>
                  <select style={{ width: "100%", padding: "14px", border: "2px solid var(--ink)", background: "#fff", outline: "none", fontFamily: "inherit" }}>
                    <option>Support technique</option>
                    <option>Question commerciale</option>
                    <option>Partenariat</option>
                    <option>Autre</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: "8px" }}>Message</label>
                  <textarea rows={5} style={{ width: "100%", padding: "14px", border: "2px solid var(--ink)", background: "#fff", outline: "none", fontFamily: "inherit", resize: "vertical" }}></textarea>
                </div>
                <button type="button" className="devizia-button" style={{ marginTop: "10px", width: "100%" }}>Envoyer le message</button>
              </form>
            </div>

            {/* Infos de contact */}
            <div style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              <div>
                <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 24, textTransform: "uppercase", margin: "0 0 12px", color: "var(--signal)" }}>Discutons de votre projet</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)", margin: 0 }}>Notre équipe est basée en France et vous répond généralement en moins de 2 heures pendant les jours ouvrés.</p>
              </div>

              <div style={{ background: "var(--ink)", color: "#fff", padding: "32px", border: "2px solid var(--ink)", boxShadow: "6px 6px 0 var(--signal)" }}>
                <div style={{ marginBottom: "24px" }}>
                  <strong style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 10, textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>Email Direct</strong>
                  <a href="mailto:support@clearquote.fr" style={{ color: "#fff", fontSize: 18, fontWeight: 600, textDecoration: "none" }}>support@clearquote.fr</a>
                </div>
                <div style={{ marginBottom: "24px" }}>
                  <strong style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 10, textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>Bureaux</strong>
                  <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5 }}>15 Avenue des Champs-Élysées<br/>75008 Paris, France</p>
                </div>
                <div>
                  <strong style={{ display: "block", fontFamily: "IBM Plex Mono, monospace", fontSize: 10, textTransform: "uppercase", opacity: 0.7, marginBottom: "4px" }}>Horaires</strong>
                  <p style={{ margin: 0, fontSize: 14 }}>Lun - Ven : 9h00 - 18h00</p>
                </div>
              </div>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
