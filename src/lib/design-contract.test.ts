import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles.css", "utf8");
const button = readFileSync("src/components/ui/button.tsx", "utf8");
const catalogue = readFileSync("src/routes/catalogue.tsx", "utf8");
const pipeline = readFileSync("src/routes/pipeline.tsx", "utf8");
const devis = readFileSync("src/routes/devis.tsx", "utf8");
const factures = readFileSync("src/routes/factures.tsx", "utf8");
const connexion = readFileSync("src/routes/connexion.tsx", "utf8");

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

assert.ok(connexion.includes("Devizia"), "Connexion doit afficher la marque Devizia");
assert.ok(!connexion.includes("InvoicePro"), "Connexion ne doit plus afficher la marque InvoicePro");
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
