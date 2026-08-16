import { createFileRoute, Link } from "@tanstack/react-router";
import {
  UserPlus, FileText, Send, CheckCircle2, ArrowRight,
  Zap, Clock, TrendingUp, ShieldCheck, Menu, X,
} from "lucide-react";
import React, { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/fonctionnement")({
  head: () => ({
    meta: [
      { title: "Comment ça marche — ClearQuote | De l'inscription au paiement en 4 étapes" },
      {
        name: "description",
        content:
          "Découvrez comment ClearQuote fonctionne : créez votre compte, rédigez un devis en quelques minutes, envoyez-le au client, recevez votre paiement. Aucune formation requise.",
      },
      { property: "og:title", content: "Comment fonctionne ClearQuote — 4 étapes simples" },
      { property: "og:description", content: "De l'inscription au paiement en quelques minutes. ClearQuote simplifie l'administratif des artisans, freelances et TPE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: "https://clearquote.fr/fonctionnement" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": "Comment utiliser ClearQuote pour gérer ses devis et factures",
          "description": "Guide étape par étape pour créer, envoyer et encaisser vos devis et factures avec ClearQuote.",
          "step": [
            { "@type": "HowToStep", "position": 1, "name": "Créer votre espace", "text": "Inscrivez-vous en 2 minutes et configurez votre entreprise : logo, SIRET, TVA, coordonnées bancaires." },
            { "@type": "HowToStep", "position": 2, "name": "Rédiger un devis", "text": "Sélectionnez ou créez vos prestations depuis le catalogue, ajoutez le client et générez un PDF professionnel en quelques secondes." },
            { "@type": "HowToStep", "position": 3, "name": "Envoyer et suivre", "text": "Envoyez le devis par email avec notification d'ouverture. Le client signe électroniquement depuis son téléphone." },
            { "@type": "HowToStep", "position": 4, "name": "Facturer et encaisser", "text": "Convertissez le devis en facture Factur-X en un clic. Relances automatiques et paiement en ligne intégré." },
          ],
        }),
      },
    ],
  }),
  component: FonctionnementPage,
});

const STEPS = [
  {
    num: "01",
    icon: UserPlus,
    title: "Créez votre espace",
    desc: "Inscrivez-vous en 2 minutes. Entrez votre SIRET — ClearQuote récupère automatiquement le nom, l'adresse et les informations légales de votre entreprise via l'API SIRENE. Ajoutez votre logo et vous êtes prêt.",
    details: ["Aucune installation logicielle", "Import automatique SIRET / Pappers", "Paramétrage TVA adapté à votre activité", "Logo et couleurs de votre marque"],
    color: "var(--signal)",
  },
  {
    num: "02",
    icon: FileText,
    title: "Rédigez votre devis",
    desc: "Sélectionnez vos prestations depuis votre catalogue enregistré, ajustez les quantités et laissez ClearQuote calculer totaux, TVA et mentions légales obligatoires. En moins de 3 minutes, votre devis est prêt.",
    details: ["Catalogue de prestations réutilisable", "Calcul automatique TVA multi-taux", "Numérotation séquentielle automatique", "Aperçu PDF en temps réel"],
    color: "var(--orange)",
  },
  {
    num: "03",
    icon: Send,
    title: "Envoyez et suivez",
    desc: "Envoyez le devis par email depuis ClearQuote. Vous êtes notifié quand le client l'ouvre. Il signe électroniquement depuis son téléphone ou son ordinateur — sans compte, sans friction.",
    details: ["Notification d'ouverture en temps réel", "Signature électronique en un clic", "Chat intégré pour négocier avant signature", "Relance automatique si pas de réponse"],
    color: "var(--green)",
  },
  {
    num: "04",
    icon: CheckCircle2,
    title: "Facturez et encaissez",
    desc: "Devis signé ? Convertissez-le en facture Factur-X conforme en un clic. Paiement par carte, virement ou prélèvement SEPA. ClearQuote relance automatiquement en cas de retard.",
    details: ["Conversion devis → facture en 1 clic", "Facture Factur-X conforme 2026", "Paiement Stripe, SEPA intégré", "Relances automatiques multi-canaux"],
    color: "var(--signal)",
  },
];

const FAQ = [
  {
    q: "Combien de temps faut-il pour créer mon premier devis ?",
    a: "En moyenne, les nouveaux utilisateurs créent leur premier devis en moins de 5 minutes après l'inscription. L'interface est conçue pour aller à l'essentiel : vous choisissez vos prestations, vous sélectionnez le client et le PDF est généré automatiquement.",
  },
  {
    q: "Mon client doit-il créer un compte pour signer le devis ?",
    a: "Non. Votre client reçoit un lien sécurisé par email. Il peut consulter, commenter et signer le devis directement depuis son téléphone ou son ordinateur, sans aucune inscription.",
  },
  {
    q: "Comment ClearQuote s'intègre-t-il à ma comptabilité ?",
    a: "ClearQuote génère des exports comptables au format FEC (Fichier des Écritures Comptables) et CSV, compatibles avec Pennylane, Tiime, Xero et QuickBooks. Votre expert-comptable peut accéder directement à vos données.",
  },
  {
    q: "Que se passe-t-il si un client ne paie pas ?",
    a: "ClearQuote envoie des relances automatiques par email aux échéances que vous définissez. Un calcul automatique des pénalités de retard légales (taux BCE + 10%) est inclus sur chaque facture en retard.",
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


function FonctionnementPage() {
  return (
    <div className="devizia-page">
      <PublicNav />

      <main id="contenu">
        {/* Hero */}
        <section style={{ background: "linear-gradient(160deg, oklch(0.52 0.2 258) 0%, oklch(0.68 0.16 255) 28%, oklch(0.88 0.06 255) 55%, oklch(0.978 0.012 255) 80%)", padding: "140px 0 72px", textAlign: "center" }}>
          <div className="devizia-container">
            <span className="devizia-eyebrow"><Zap size={13} /> Simple par conception</span>
            <h1 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(48px, 6vw, 80px)", textTransform: "uppercase", lineHeight: 0.88, color: "#fff", margin: "20px 0 18px" }}>
              De l'inscription<br />au paiement.<br /><em style={{ color: "oklch(0.85 0.12 255)", fontStyle: "normal" }}>En 4 étapes.</em>
            </h1>
            <p style={{ maxWidth: 560, margin: "0 auto 32px", fontSize: 17, fontWeight: 500, color: "oklch(0.92 0.04 255)", lineHeight: 1.55 }}>
              Aucune formation. Aucune configuration complexe. ClearQuote est conçu pour les professionnels qui veulent facturer vite et bien — pas pour les experts en logiciels.
            </p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* Étapes */}
        <section style={{ padding: "80px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 900 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
              {STEPS.map((step, i) => (
                <article key={step.num} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "start" }}>
                  {/* Numéro */}
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, background: step.color, border: "2px solid var(--ink)", boxShadow: "4px 4px 0 var(--ink)", display: "grid", placeItems: "center", color: "#fff" }}>
                      <step.icon size={24} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div style={{ width: 2, height: 40, background: "var(--ink)", margin: "8px auto 0", opacity: 0.2 }} />
                    )}
                  </div>
                  {/* Contenu */}
                  <div style={{ background: "var(--paper)", border: "2px solid var(--ink)", padding: "24px 28px", boxShadow: "4px 4px 0 var(--ink)" }}>
                    <p style={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 9, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: step.color, marginBottom: 8 }}>
                      Étape {step.num}
                    </p>
                    <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.02em", margin: "0 0 12px" }}>{step.title}</h2>
                    <p style={{ fontSize: 15, lineHeight: 1.6, fontWeight: 500, margin: "0 0 18px", color: "oklch(0.32 0.04 258)" }}>{step.desc}</p>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {step.details.map((d) => (
                        <li key={d} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, background: "oklch(0.96 0.02 255)", padding: "4px 10px", border: "1px solid var(--ink)", borderRadius: 0 }}>
                          <CheckCircle2 size={11} style={{ color: step.color }} /> {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Chiffres clés */}
        <section style={{ background: "var(--ink)", color: "#fff", padding: "64px 0" }}>
          <div className="devizia-container">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 32, textAlign: "center" }}>
              {[
                { val: "< 3 min", label: "pour créer un devis" },
                { val: "1 clic", label: "devis → facture Factur-X" },
                { val: "100%", label: "conforme 2026" },
                { val: "0 €", label: "pour commencer" },
              ].map((s) => (
                <div key={s.label}>
                  <p style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: 52, lineHeight: 1, color: "var(--signal)", margin: "0 0 8px" }}>{s.val}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.65, textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ padding: "72px 0", background: "var(--cream)" }}>
          <div className="devizia-container" style={{ maxWidth: 740 }}>
            <span className="section-kicker">Questions fréquentes</span>
            <h2 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 50px)", textTransform: "uppercase", lineHeight: 0.9, margin: "12px 0 40px" }}>
              On répond à vos questions
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
              Prêt à voir comment ça marche ?
            </h2>
            <p style={{ maxWidth: 480, margin: "0 auto 28px", fontSize: 16, opacity: 0.8, fontWeight: 500 }}>Testez ClearQuote gratuitement. Pas de carte bancaire, pas d'engagement.</p>
            <Link to="/inscription" className="devizia-button devizia-button--hero">Créer mon espace gratuitement <ArrowRight size={16} /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
