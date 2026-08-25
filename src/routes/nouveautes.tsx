import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Menu, X, Zap } from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/nouveautes")({
  head: () => ({
    meta: [
      { title: "Nouveautés — ClearQuote" },
      { name: "description", content: "Découvrez les dernières nouveautés de ClearQuote : trésorerie, signature électronique et conformité Factur-X." },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/nouveautes" }],
  }),
  component: NouveautesPage,
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

function NouveautesPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Actu</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              Nouveautés
            </h1>
            <p style={{ maxWidth: 580, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Découvrez les dernières fonctionnalités ajoutées à ClearQuote.
            </p>
          </div>
        </section>

        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: "40px" }}>
            
            {[
              {
                version: "Mise à jour d'Août 2026",
                title: "Nouveau tableau de bord de trésorerie",
                date: "14 Août 2026",
                features: ["Visualisation de la trésorerie sur 90 jours", "Export comptable en un clic", "Intégration bancaire améliorée"],
                desc: "Nous avons entièrement repensé le tableau de bord pour vous donner une vision plus claire de vos encaissements et décaissements à venir."
              },
              {
                version: "Mise à jour de Juillet 2026",
                title: "Signature électronique qualifiée",
                date: "22 Juillet 2026",
                features: ["Signature certifiée eIDAS", "Relances automatiques pour signature", "Stockage sécurisé des preuves"],
                desc: "Faites signer vos devis les plus importants avec une signature électronique qualifiée, offrant une valeur légale incontestable."
              },
              {
                version: "Mise à jour de Juin 2026",
                title: "Conformité totale Factur-X",
                date: "10 Juin 2026",
                features: ["Génération native PDF + XML", "Piste d'Audit Fiable (PAF) automatique", "Contrôles de cohérence TVA"],
                desc: "ClearQuote est désormais 100% prêt pour la réforme de la facturation électronique 2026. Vos documents sont générés au format Factur-X sans action de votre part."
              }
            ].map((update, i) => (
              <div key={i} style={{ background: "var(--paper)", border: "2px solid var(--ink)", padding: "40px", boxShadow: "6px 6px 0 var(--ink)", position: "relative" }}>
                <div style={{ position: "absolute", top: -16, left: 32, background: "var(--signal)", color: "#fff", padding: "6px 14px", font: "700 11px 'IBM Plex Mono', monospace", border: "2px solid var(--ink)", textTransform: "uppercase" }}>
                  {update.date}
                </div>
                <span style={{ display: "block", color: "var(--muted)", font: "600 12px 'IBM Plex Mono', monospace", textTransform: "uppercase", marginBottom: "8px" }}>{update.version}</span>
                <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 800, fontSize: 32, textTransform: "uppercase", margin: "0 0 16px" }}>{update.title}</h2>
                <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink)", margin: "0 0 24px" }}>{update.desc}</p>
                <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "12px" }}>
                  {update.features.map(feat => (
                    <li key={feat} style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "600", fontSize: "14px" }}>
                      <div style={{ width: 6, height: 6, background: "var(--signal)", borderRadius: "50%" }}></div>
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
