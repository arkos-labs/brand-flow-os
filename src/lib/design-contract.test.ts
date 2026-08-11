import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const styles = readFileSync("src/styles.css", "utf8");
const button = readFileSync("src/components/ui/button.tsx", "utf8");
const catalogue = readFileSync("src/routes/catalogue.tsx", "utf8");
const pipeline = readFileSync("src/routes/pipeline.tsx", "utf8");
const devis = readFileSync("src/routes/devis.tsx", "utf8");
const factures = readFileSync("src/routes/factures.tsx", "utf8");
const connexion = readFileSync("src/routes/connexion.tsx", "utf8");
const inscription = readFileSync("src/routes/inscription.tsx", "utf8");
const motDePasseOublie = readFileSync("src/routes/mot-de-passe-oublie.tsx", "utf8");
const accueil = readFileSync("src/routes/index.tsx", "utf8");
const tarifs = readFileSync("src/routes/tarifs.tsx", "utf8");
const appShell = readFileSync("src/components/AppShell.tsx", "utf8");
const brandLogo = existsSync("src/components/BrandLogo.tsx")
  ? readFileSync("src/components/BrandLogo.tsx", "utf8")
  : "";

assert.ok(existsSync("public/brand/clearquote-logo.png"), "Le logo horizontal ClearQuote doit exister");
assert.ok(existsSync("public/brand/clearquote-mark.png"), "Le symbole compact ClearQuote doit exister");
assert.ok(existsSync("public/favicon.ico"), "Le favicon ClearQuote doit exister");
assert.ok(brandLogo.includes("compact?: boolean"), "BrandLogo doit accepter la variante compacte");
assert.ok(brandLogo.includes("/brand/clearquote-logo.png"), "BrandLogo doit utiliser le logo horizontal");
assert.ok(brandLogo.includes("/brand/clearquote-mark.png"), "BrandLogo doit utiliser le symbole compact");
assert.ok(
  brandLogo.includes('compact ? "Symbole ClearQuote" : "ClearQuote"'),
  "Le logo horizontal doit avoir exactement ClearQuote comme texte alternatif",
);
assert.ok(brandLogo.includes("Symbole ClearQuote"), "Le symbole compact doit avoir un texte alternatif ClearQuote");

for (const [name, source] of [
  ["Accueil", accueil],
  ["Connexion", connexion],
  ["Inscription", inscription],
  ["Mot de passe oublié", motDePasseOublie],
  ["Tarifs", tarifs],
  ["AppShell", appShell],
] as const) {
  assert.ok(source.includes('from "@/components/BrandLogo"'), `${name} doit importer BrandLogo`);
  assert.ok(source.includes("<BrandLogo"), `${name} doit afficher BrandLogo`);
}

assert.ok(!accueil.includes("function Logo"), "L'accueil ne doit plus définir son logo textuel");
assert.ok(!tarifs.includes("function Logo"), "Les tarifs ne doivent plus définir leur logo textuel");
for (const [name, source] of [
  ["Connexion", connexion],
  ["Inscription", inscription],
  ["Mot de passe oublié", motDePasseOublie],
  ["AppShell", appShell],
] as const) {
  assert.ok(!/>\s*(?:IP|D)\s*</.test(source), `${name} ne doit plus afficher un monogramme textuel`);
}

const mobileHeaderStart = appShell.indexOf("{/* Hamburger mobile */}");
const mobileHeaderEnd = appShell.indexOf("{/* Recherche + contexte */}", mobileHeaderStart);
const mobileHeader = appShell.slice(mobileHeaderStart, mobileHeaderEnd);
assert.ok(mobileHeader.includes("<BrandLogo compact"), "L'en-tête mobile doit afficher la marque compacte");
assert.ok(mobileHeader.includes("lg:hidden"), "La marque de l'en-tête doit être réservée au mobile");

const sidebarBrandStart = appShell.indexOf("{/* ── Brand ── */}");
const sidebarBrandEnd = appShell.indexOf("<nav", sidebarBrandStart);
const sidebarBrand = appShell.slice(sidebarBrandStart, sidebarBrandEnd);
const drawerStart = appShell.indexOf("{/* ── Drawer mobile (slide-in) ── */}");
const drawerEnd = appShell.indexOf('<div className="lg:pl-64">', drawerStart);
const mobileDrawer = appShell.slice(drawerStart, drawerEnd);
assert.ok(sidebarBrand.includes("onCloseDrawer &&"), "Le drawer doit intégrer son bouton de fermeture dans la zone de marque");
assert.ok(sidebarBrand.includes("compact={Boolean(onCloseDrawer)}"), "Le drawer doit réserver sa largeur avec le symbole compact");
assert.ok(sidebarBrand.includes("text-navy"), "Le bouton de fermeture du drawer doit avoir un contraste suffisant");
assert.ok(mobileDrawer.includes("onCloseDrawer={() => setMobileOpen(false)}"), "Le drawer doit transmettre sa fermeture à la zone de marque");
assert.ok(!mobileDrawer.includes("absolute right-2 top-2"), "Le bouton du drawer ne doit pas chevaucher la carte de marque");

function buttonOpeningBefore(source: string, label: string) {
  const labelIndex = source.indexOf(label);
  assert.notEqual(labelIndex, -1, `Libellé introuvable : ${label}`);
  const openingStart = source.lastIndexOf("<button", labelIndex);
  assert.notEqual(openingStart, -1, `Bouton introuvable avant : ${label}`);
  return source.slice(openingStart, source.indexOf("</button>", labelIndex));
}

for (const signature of [
  "--shadow-offset",
  "--shape-control",
  ".app-workspace",
  "prefers-reduced-motion",
]) {
  assert.ok(styles.includes(signature), `styles.css doit contenir ${signature}`);
}

assert.ok(button.includes("shadow-offset"), "Le bouton principal doit utiliser shadow-offset");
assert.ok(button.includes("border-2"), "Le bouton principal doit utiliser une bordure de 2 px");
assert.ok(
  catalogue.includes('from "@/components/ui/button"'),
  "Catalogue doit utiliser le composant Button partagé",
);
assert.ok(
  /openNew[\s\S]{0,220}ml-auto|ml-auto[\s\S]{0,220}openNew/.test(catalogue),
  "Nouvelle prestation doit être séparée à droite avec ml-auto",
);

for (const route of ["clients", "devis", "factures", "pipeline", "tableau-de-bord", "parametres"]) {
  const source = readFileSync(`src/routes/${route}.tsx`, "utf8");
  const buttonOpenings = [...source.matchAll(/<button\b[\s\S]*?>/g)].map(([opening]) => opening);
  assert.ok(
    !buttonOpenings.some((opening) =>
      /rounded-(?:lg|xl)[^"\n]*bg-primary|bg-primary[^"\n]*rounded-(?:lg|xl)/.test(opening),
    ),
    `${route}.tsx contient encore une ancienne signature de bouton principal`,
  );
}

const pipelineActions = pipeline.slice(
  pipeline.indexOf("Boutons d'action selon la colonne"),
  pipeline.indexOf("</article>", pipeline.indexOf("Boutons d'action selon la colonne")),
);
const pipelineButtons = [...pipelineActions.matchAll(/<button\b[\s\S]*?className="([^"]+)"/g)].map((match) => match[1]!);
assert.ok(pipelineButtons.length >= 6, "Les actions du Pipeline doivent être détectées");
assert.ok(
  pipelineButtons.every((opening) => opening.includes("rounded-[var(--shape-control)]") && opening.includes("border-2")),
  "Tous les boutons Pipeline doivent utiliser le rayon court et une bordure de 2 px",
);

const generateNow = buttonOpeningBefore(devis, "Générer maintenant");
assert.ok(
  generateNow.includes("shadow-offset") || generateNow.includes("shadow-["),
  "Générer maintenant doit utiliser une ombre décalée",
);

const validatePayment = buttonOpeningBefore(factures, 'title="Valider le paiement"');
assert.ok(
  validatePayment.includes("bg-success") && validatePayment.includes("border-2"),
  "Valider doit rester vert et utiliser une bordure de 2 px",
);

const elevatedCard = styles.slice(styles.indexOf("@utility card-elevated"), styles.indexOf("@utility surface-navy"));
assert.ok(
  elevatedCard.includes("border: 2px") && elevatedCard.includes("var(--shape-control)"),
  "card-elevated doit utiliser une bordure de 2 px et le rayon court",
);

function productionSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return productionSourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts") ? [path] : [];
  });
}

const legacyBrandOccurrences = productionSourceFiles("src").flatMap((file) =>
  readFileSync(file, "utf8")
    .split(/\r?\n/)
    .flatMap((line, index) => {
      if (!/\b(?:Devizia|InvoicePro)\b/i.test(line)) return [];
      const technicalIdentifier = /["'`][^"'`]*\b(?:devizia|invoicepro)[_-][^"'`]*["'`]/i;
      return technicalIdentifier.test(line) ? [] : [`${file}:${index + 1}: ${line.trim()}`];
    }),
);
assert.deepEqual(
  legacyBrandOccurrences,
  [],
  "Aucune ancienne marque produit ne doit subsister dans les sources de production",
);

assert.ok(connexion.includes("ClearQuote"), "Connexion doit afficher la marque ClearQuote");
assert.ok(!connexion.includes("Devizia"), "Connexion ne doit plus afficher la marque Devizia");
assert.ok(
  connexion.includes('<h1 id="connexion-title"'),
  "Le titre visible du formulaire doit être le titre principal accessible",
);
for (const signature of [
  "devizia-auth-grid",
  "border-2",
  "rounded-[var(--shape-control)]",
  "shadow-offset",
  "handleSubmit",
  "handleDevAccess",
  "setShowPassword",
]) {
  assert.ok(connexion.includes(signature), `Connexion doit conserver ${signature}`);
}

console.log("design-contract.test.ts: OK");
