import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/BrandLogo";
import { Facebook, Twitter, Instagram, Linkedin, Globe, Phone, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white mt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Newsletter CTA Section */}
        <div 
          className="relative -mt-32 mb-16 px-6 py-10 sm:px-12 sm:py-14 flex flex-col md:flex-row items-center justify-between gap-8"
          style={{
            background: "var(--signal)",
            border: "3px solid var(--ink)",
            boxShadow: "9px 9px 0 var(--ink)",
            color: "#fff"
          }}
        >
          <div className="flex-1">
            <h3 style={{ fontFamily: "Barlow Condensed, sans-serif", fontWeight: 900, fontSize: "clamp(32px, 4vw, 44px)", textTransform: "uppercase", lineHeight: 0.9, margin: "0 0 12px" }}>
              Restez informé de nos nouveautés
            </h3>
            <p style={{ fontSize: 16, fontWeight: 500, color: "oklch(0.92 0.04 255)", margin: 0 }}>
              Abonnez-vous à notre newsletter pour recevoir nos dernières mises à jour.
            </p>
          </div>
          <div className="w-full md:w-auto flex-1 max-w-md">
            <form className="flex flex-col sm:flex-row gap-3 w-full">
              <input 
                type="email" 
                placeholder="Entrez votre email" 
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  border: "2px solid var(--ink)",
                  background: "var(--paper)",
                  color: "var(--ink)",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontSize: 13,
                  fontWeight: 600,
                  outline: "none"
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = "3px solid #fff";
                  e.currentTarget.style.outlineOffset = "2px";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = "none";
                }}
              />
              <button 
                type="button"
                style={{
                  background: "var(--ink)",
                  color: "#fff",
                  border: "2px solid var(--ink)",
                  boxShadow: "4px 4px 0 #fff",
                  padding: "12px 20px",
                  fontFamily: "IBM Plex Mono, monospace",
                  fontWeight: 800,
                  fontSize: 12,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "transform 0.12s, box-shadow 0.12s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translate(2px, 2px)";
                  e.currentTarget.style.boxShadow = "2px 2px 0 #fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translate(0, 0)";
                  e.currentTarget.style.boxShadow = "4px 4px 0 #fff";
                }}
              >
                S'abonner
              </button>
            </form>
            <p style={{ fontSize: 11, fontFamily: "IBM Plex Mono, monospace", fontWeight: 600, color: "oklch(0.85 0.05 255)", marginTop: 12, textAlign: "left" }}>
              Vous pourrez vous désabonner à tout moment.<br />
              Lisez notre <a href="#" style={{ textDecoration: "underline", textUnderlineOffset: 3, color: "#fff" }}>politique de confidentialité</a> ici
            </p>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 pb-12">
          {/* Brand Info */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <BrandLogo className="h-8 w-auto" priority />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm font-medium">
              ClearQuote simplifie les devis, factures, relances et paiements des artisans, indépendants et petites entreprises. Pilotez votre activité avec sérénité.
            </p>
            <div className="flex items-center gap-3 text-slate-800">
              <a href="#" className="hover:bg-slate-200 transition-colors bg-slate-100 p-2.5 rounded-full"><Facebook className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" className="hover:bg-slate-200 transition-colors bg-slate-100 p-2.5 rounded-full"><Twitter className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" className="hover:bg-slate-200 transition-colors bg-slate-100 p-2.5 rounded-full"><Instagram className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" className="hover:bg-slate-200 transition-colors bg-slate-100 p-2.5 rounded-full"><Linkedin className="h-4 w-4" strokeWidth={2.5} /></a>
              <a href="#" className="hover:bg-slate-200 transition-colors bg-slate-100 p-2.5 rounded-full"><Globe className="h-4 w-4" strokeWidth={2.5} /></a>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-base tracking-tight">Entreprise</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li><Link to="/fonctionnement" className="hover:text-[#4375F1] transition-colors">Comment ça marche</Link></li>
              <li><Link to="/fonctionnalites" className="hover:text-[#4375F1] transition-colors">Fonctionnalités</Link></li>
              <li><Link to="/benefices" className="hover:text-[#4375F1] transition-colors">Bénéfices</Link></li>
              <li><Link to="/tarifs" className="hover:text-[#4375F1] transition-colors">Tarifs</Link></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-base tracking-tight">Support</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li><Link to="/centre-aide" className="hover:text-[#4375F1] transition-colors">Centre d'aide</Link></li>
              <li><Link to="/contactez-nous" className="hover:text-[#4375F1] transition-colors">Contactez-nous</Link></li>
              <li><Link to="/nouveautes" className="hover:text-[#4375F1] transition-colors">Nouveautés</Link></li>
              <li><Link to="/mises-a-jour" className="hover:text-[#4375F1] transition-colors">Mises à jour à venir</Link></li>
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h4 className="font-bold text-slate-900 mb-6 text-base tracking-tight">Nous contacter</h4>
            <ul className="space-y-4 text-sm font-semibold text-slate-500">
              <li className="flex items-center gap-3">
                <div className="bg-[#4375F1] text-white p-1.5 rounded-md"><Mail className="h-3.5 w-3.5 shrink-0" /></div>
                <span>support@clearquote.fr</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-200 py-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-slate-500 font-semibold">
          <p>© Copyright by ClearQuote. Tous droits réservés.</p>
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
            <Link to="/confidentialite" className="hover:text-slate-900 transition-colors">Politique de confidentialité</Link>
            <Link to="/conditions-utilisation" className="hover:text-slate-900 transition-colors">Conditions d'utilisation</Link>
            <Link to="/legal" className="hover:text-slate-900 transition-colors">Légal</Link>
            <Link to="/plan-site" className="hover:text-slate-900 transition-colors">Plan du site</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
