import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileCheck2,
  FileText,
  Hammer,
  Menu,
  MousePointerClick,
  ReceiptText,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { Footer } from "@/components/Footer";
import "./homepage.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ClearQuote — Un devis propre. Une facture prête. La journée est finie." },
      {
        name: "description",
        content:
          "ClearQuote simplifie les devis, factures, relances et paiements des artisans, indépendants et petites entreprises. Pilotez votre activité avec sérénité.",
      },
      {
        property: "og:title",
        content: "ClearQuote — L'administratif avance, la journée se termine",
      },
      {
        property: "og:description",
        content:
          "Créez, envoyez et suivez vos devis et factures depuis un seul outil pensé pour les petites entreprises.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const problems = [
  {
    number: "01",
    title: "Les devis attendent le soir",
    text: "Préparez un document propre pendant que les détails du besoin sont encore frais.",
    result: "Créer sans repartir de zéro",
    icon: Clock3,
  },
  {
    number: "02",
    title: "Les relances passent à la trappe",
    text: "Retrouvez ce qui est envoyé, accepté ou à encaisser au même endroit.",
    result: "Savoir quoi relancer, au bon moment",
    icon: Send,
  },
  {
    number: "03",
    title: "La trésorerie reste floue",
    text: "Visualisez les montants attendus et les échéances sans multiplier les tableaux.",
    result: "Décider avec une vue claire",
    icon: BarChart3,
  },
];

const workflow = [
  {
    step: "01",
    title: "Créez",
    text: "Décrivez la mission, ajoutez vos prestations et laissez ClearQuote structurer un devis professionnel.",
    icon: Sparkles,
  },
  {
    step: "02",
    title: "Envoyez",
    text: "Partagez votre document et suivez son avancée sans chercher dans vos messages.",
    icon: Send,
  },
  {
    step: "03",
    title: "Encaissez",
    text: "Transformez le devis accepté en facture et gardez les paiements à portée de vue.",
    icon: Banknote,
  },
];

const capabilities = [
  { icon: Sparkles, title: "Devis assistés", text: "Une base claire, modifiable et prête à envoyer." },
  { icon: FileCheck2, title: "Factures Factur-X", text: "Des documents structurés pour préparer la facturation électronique." },
  { icon: Users, title: "Clients centralisés", text: "Coordonnées, documents et historique réunis." },
  { icon: TrendingUp, title: "Pipeline commercial", text: "Chaque opportunité visible, de la demande à la signature." },
  { icon: WalletCards, title: "Trésorerie lisible", text: "Échéances et encaissements dans une même vue." },
  { icon: ReceiptText, title: "Dépenses suivies", text: "Une vision plus juste de ce qui entre et de ce qui sort." },
];

const profiles = [
  {
    icon: Hammer,
    label: "Artisans",
    title: "Du chantier au devis, sans détour.",
    text: "Créez et retrouvez vos documents depuis votre téléphone, au bureau comme sur le terrain.",
  },
  {
    icon: BriefcaseBusiness,
    label: "Indépendants",
    title: "Une image pro dès le premier échange.",
    text: "Cadrez vos missions, envoyez vos propositions et suivez vos règlements avec méthode.",
  },
  {
    icon: Building2,
    label: "Petites entreprises",
    title: "L'équipe avance avec la même information.",
    text: "Centralisez clients, ventes et facturation dans un espace simple à prendre en main.",
  },
];

const faqs = [
  ["Faut-il être à l'aise avec les logiciels de gestion ?", "Non. ClearQuote est pensé pour aller à l'essentiel : créer un document, l'envoyer et suivre son statut. Les fonctions avancées restent disponibles quand vous en avez besoin."],
  ["Puis-je utiliser ClearQuote depuis mon téléphone ?", "Oui. L'interface s'adapte aux écrans mobiles pour consulter votre activité et gérer vos documents en déplacement."],
  ["Mes factures peuvent-elles être générées en Factur-X ?", "Oui. ClearQuote prend en charge la génération de documents Factur-X, avec un PDF lisible et les données structurées associées."],
  ["ClearQuote convient-il à mon métier ?", "ClearQuote s'adresse aux artisans, indépendants et petites équipes de services. Le catalogue et les documents s'adaptent à vos prestations."],
  ["Puis-je essayer avant de choisir une offre ?", "Oui. Créez votre espace pour découvrir le produit, puis consultez la page Tarifs pour choisir la formule adaptée à votre activité."],
] as const;

function PublicHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="devizia-header">
      <div className="devizia-container devizia-header__inner">
        <Link to="/" className="flex items-center" aria-label="ClearQuote, accueil">
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
          <Link to="/inscription" className="devizia-button devizia-button--small">
            Essayer gratuitement <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <button
          className="devizia-menu-button"
          type="button"
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          aria-controls="devizia-mobile-menu"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav id="devizia-mobile-menu" className="devizia-mobile-nav" aria-label="Navigation mobile">
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

function ProductPreview() {
  return (
    <div className="product-stage" aria-label="Aperçu de l'interface ClearQuote">
      <div className="product-stage__glow" />
      <div className="product-window">
        <div className="product-window__bar">
          <div className="window-dots" aria-hidden="true"><i /><i /><i /></div>
          <span>app.clearquote.fr</span>
          <BadgeCheck aria-label="Espace sécurisé" />
        </div>
        <div className="product-window__body">
          <aside className="product-sidebar">
            <span className="mini-logo">D</span>
            <i className="active" /><i /><i /><i /><i />
          </aside>
          <div className="quote-sheet">
            <div className="quote-sheet__head">
              <div><small>DEVIS</small><strong>Rénovation espace accueil</strong></div>
              <span className="status-pill"><CheckCircle2 /> Prêt à envoyer</span>
            </div>
            <div className="client-row"><span>Client</span><strong>Atelier Horizon</strong></div>
            <div className="quote-line"><span><i />Conception & préparation</span><strong>680 €</strong></div>
            <div className="quote-line"><span><i />Réalisation de la prestation</span><strong>2 450 €</strong></div>
            <div className="quote-line"><span><i />Finitions & livraison</span><strong>520 €</strong></div>
            <div className="quote-total"><span>Total HT</span><strong>3 650 €</strong></div>
          </div>
        </div>
      </div>
      <div className="floating-card floating-card--top">
        <span className="floating-card__icon"><Sparkles /></span>
        <span><small>Assistant ClearQuote</small><strong>Devis structuré en quelques instants</strong></span>
      </div>
      <div className="floating-card floating-card--bottom">
        <span className="floating-card__icon floating-card__icon--green"><Check /></span>
        <span><small>Suivi</small><strong>Vous savez toujours où en est le client</strong></span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="devizia-hero">
      <div className="devizia-hero__grid" aria-hidden="true" />
      <div className="devizia-container devizia-hero__layout">
        <div className="devizia-hero__copy">
          <div className="devizia-eyebrow"><Zap /> Devis · Factures · Paiements</div>
          <h1>Un devis propre.<br />Une facture prête.<br /><em>La journée est finie.</em></h1>
          <p>ClearQuote vous aide à gérer l’administratif vite et bien, sur ordinateur comme sur le terrain. Moins de clics, plus de visibilité, rien qui traîne.</p>
          <div className="devizia-hero__actions">
            <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight /></Link>
            <a href="#fonctionnement" className="devizia-text-link"><MousePointerClick /> Voir comment ça marche</a>
          </div>
          <ul className="hero-checks" aria-label="Avantages">
            <li><Check /> Prise en main rapide</li>
            <li><Check /> Utilisable sur mobile</li>
            <li><Check /> Sans installation</li>
          </ul>
        </div>
        <ProductPreview />
      </div>
      <div className="devizia-container audience-strip">
        <span>Conçu pour celles et ceux qui font tourner leur activité</span>
        <div><strong><Hammer /> Artisans</strong><strong><BriefcaseBusiness /> Indépendants</strong><strong><Building2 /> Petites entreprises</strong></div>
      </div>
    </section>
  );
}

function Problems() {
  return (
    <section id="benefices" className="devizia-section devizia-problems">
      <div className="devizia-container">
        <div className="section-heading section-heading--split">
          <div><span className="section-kicker">Le quotidien, en plus simple</span><h2>Moins d’administratif.<br />Plus d’esprit libre.</h2></div>
          <p>ClearQuote enlève les petites frictions qui prennent du temps, dispersent l’information et retardent les encaissements.</p>
        </div>
        <div className="problem-grid">
          {problems.map(({ number, title, text, result, icon: Icon }) => (
            <article className="problem-card" key={number}>
              <div className="problem-card__top"><span>{number}</span><Icon /></div>
              <h3>{title}</h3><p>{text}</p>
              <div className="problem-card__result"><CheckCircle2 /> {result}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflow() {
  return (
    <section id="fonctionnement" className="devizia-section workflow-section">
      <div className="devizia-container">
        <div className="section-heading section-heading--center"><span className="section-kicker">Un parcours sans détour</span><h2>Du besoin au paiement,<br />en trois gestes simples.</h2></div>
        <div className="workflow-grid">
          {workflow.map(({ step, title, text, icon: Icon }, index) => (
            <article className="workflow-step" key={step}>
              <span className="workflow-step__number">{step}</span>
              <div className="workflow-step__icon"><Icon /></div>
              <h3>{title}</h3><p>{text}</p>
              {index < workflow.length - 1 && <ChevronRight className="workflow-step__arrow" aria-hidden="true" />}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="fonctionnalites" className="devizia-section features-section">
      <div className="devizia-container features-layout">
        <div className="features-copy">
          <span className="section-kicker section-kicker--light">Tout votre suivi, au même endroit</span>
          <h2>Un outil complet.<br /><em>Jamais compliqué.</em></h2>
          <p>Chaque fonction répond à une question concrète : que faut-il envoyer, relancer ou encaisser aujourd’hui ?</p>
          <Link to="/inscription" className="devizia-button devizia-button--light">Découvrir ClearQuote <ArrowRight /></Link>
        </div>
        <div className="capability-grid">
          {capabilities.map(({ icon: Icon, title, text }) => (
            <article className="capability" key={title}><Icon /><div><h3>{title}</h3><p>{text}</p></div></article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pillars() {
  return (
    <section className="devizia-section pillars-section">
      <div className="devizia-container">
        <div className="section-heading section-heading--center"><span className="section-kicker">Bien plus que des documents</span><h2>La sérénité aujourd’hui.<br />La maîtrise pour demain.</h2></div>
        <div className="pillars-grid">
          <article className="pillar pillar--main"><div className="pillar__icon"><Clock3 /></div><span>Votre priorité</span><h3>Temps & sérénité</h3><p>Vos informations sont rangées, vos prochaines actions sont visibles et vos documents avancent sans grignoter votre temps personnel.</p><div className="pillar__quote">« Je sais ce qui reste à faire avant de fermer la journée. »</div></article>
          <article className="pillar"><div className="pillar__icon"><TrendingUp /></div><span>Votre élan</span><h3>Performance & croissance</h3><p>Répondez plus vite, suivez vos opportunités et évitez que les factures oubliées freinent votre activité.</p></article>
          <article className="pillar"><div className="pillar__icon"><ShieldCheck /></div><span>Votre confiance</span><h3>Conformité & contrôle</h3><p>Gardez des documents structurés, une numérotation cohérente et une vision nette de chaque étape.</p></article>
        </div>
      </div>
    </section>
  );
}

function Profiles() {
  return (
    <section id="profils" className="devizia-section profiles-section">
      <div className="devizia-container">
        <div className="section-heading section-heading--split"><div><span className="section-kicker">ClearQuote s’adapte à votre réalité</span><h2>Votre métier change.<br />La simplicité reste.</h2></div><p>Un même espace de travail, avec les bons réflexes pour chaque façon d’entreprendre.</p></div>
        <div className="profile-list">
          {profiles.map(({ icon: Icon, label, title, text }, index) => (
            <article className="profile-row" key={label}><span className="profile-row__index">0{index + 1}</span><div className="profile-row__label"><Icon /> {label}</div><h3>{title}</h3><p>{text}</p></article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingAndFaq() {
  return (
    <section id="faq" className="devizia-section faq-section">
      <div className="devizia-container faq-layout">
        <div className="pricing-bridge">
          <span className="section-kicker section-kicker--light">Commencez à votre rythme</span>
          <h2>Le bon outil.<br />La formule qui vous ressemble.</h2>
          <p>Découvrez les offres ClearQuote et choisissez selon votre volume de documents, votre équipe et vos besoins de pilotage.</p>
          <Link to="/tarifs" className="devizia-button devizia-button--light">Voir les tarifs <ArrowRight /></Link>
          <div className="pricing-bridge__note"><ShieldCheck /><span><strong>Pas de mauvaise surprise</strong><small>Les fonctionnalités et limites sont clairement présentées.</small></span></div>
        </div>
        <div className="faq-list">
          <span className="section-kicker">Questions fréquentes</span>
          <h2>Vous vous demandez peut-être…</h2>
          {faqs.map(([question, answer], index) => (
            <details key={question} open={index === 0}><summary>{question}<span>+</span></summary><p>{answer}</p></details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="final-cta">
      <div className="final-cta__orb" aria-hidden="true" />
      <div className="devizia-container final-cta__inner">
        <span className="section-kicker section-kicker--light">Votre prochaine soirée commence ici</span>
        <h2>Faites avancer l’administratif.<br /><em>Puis passez à autre chose.</em></h2>
        <p>Créez votre espace ClearQuote et rassemblez enfin devis, factures et suivi dans un outil qui va droit au but.</p>
        <Link to="/inscription" className="devizia-button devizia-button--hero">Commencer gratuitement <ArrowRight /></Link>
      </div>
    </section>
  );
}


function LandingPage() {
  return (
    <div className="devizia-page">
      <a href="#contenu" className="devizia-skip-link">Aller au contenu</a>
      <PublicHeader />
      <main id="contenu"><Hero /><Problems /><Workflow /><Features /><Pillars /><Profiles /><PricingAndFaq /><FinalCta /></main>
      <Footer />
    </div>
  );
}
