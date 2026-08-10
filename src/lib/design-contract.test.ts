import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const styles = readFileSync("src/styles.css", "utf8");
const button = readFileSync("src/components/ui/button.tsx", "utf8");

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

console.log("design-contract.test.ts: OK");
