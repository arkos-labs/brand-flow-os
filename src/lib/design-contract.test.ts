import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles.css", "utf8");
const button = readFileSync("src/components/ui/button.tsx", "utf8");
const catalogue = readFileSync("src/routes/catalogue.tsx", "utf8");

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

console.log("design-contract.test.ts: OK");
