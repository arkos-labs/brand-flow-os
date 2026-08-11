/**
 * catalogue-io.ts
 * Import CSV et Export Excel (.xlsx) du catalogue de prestations
 */

import * as XLSX from "xlsx";
import type { Product, ProductCategory, ProductUnit, VatRate } from "./demo-data";

// ── Colonnes CSV/Excel ────────────────────────────────────────────────────────

export const CSV_HEADERS = [
  "ref",
  "label_fr",
  "label_en",
  "description_fr",
  "description_en",
  "categorie",       // main-oeuvre | materiaux | deplacement | sous-traitance | equipement | autre
  "unite",           // h | j | forfait | m2 | ml | unite | km
  "prix_ht",
  "tva",             // 0 | 5.5 | 10 | 20
  "actif",           // 1 | 0
] as const;

const VALID_CATEGORIES = new Set<ProductCategory>([
  "main-oeuvre", "materiaux", "deplacement", "sous-traitance", "equipement", "autre",
]);
const VALID_UNITS = new Set<ProductUnit>([
  "h", "j", "forfait", "m2", "ml", "unite", "km",
]);
const VALID_VAT = new Set<number>([0, 5.5, 10, 20]);

// ── Export Excel ──────────────────────────────────────────────────────────────

export interface ExportRow {
  Référence: string;
  "Libellé FR": string;
  "Libellé EN": string;
  "Description FR": string;
  "Description EN": string;
  Catégorie: string;
  Unité: string;
  "Prix HT (€)": number | string;
  "TVA (%)": number;
  Actif: string;
}

export function exportCatalogueToExcel(products: Product[], filename = "catalogue-prestations.xlsx") {
  // Feuille 1 : données
  const rows: ExportRow[] = products.map((p) => ({
    Référence: p.ref,
    "Libellé FR": p.label.fr,
    "Libellé EN": p.label.en,
    "Description FR": p.description.fr,
    "Description EN": p.description.en,
    Catégorie: p.category,
    Unité: p.unit,
    "Prix HT (€)": typeof p.priceHT === "string" ? parseFloat(p.priceHT) || 0 : p.priceHT,
    "TVA (%)": p.vatRate,
    Actif: p.active ? "Oui" : "Non",
  }));

  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes
  ws["!cols"] = [
    { wch: 14 }, // Référence
    { wch: 30 }, // Libellé FR
    { wch: 30 }, // Libellé EN
    { wch: 40 }, // Description FR
    { wch: 40 }, // Description EN
    { wch: 16 }, // Catégorie
    { wch: 10 }, // Unité
    { wch: 12 }, // Prix HT
    { wch: 8  }, // TVA
    { wch: 8  }, // Actif
  ];

  // Feuille 2 : modèle + aide
  const helpData = [
    ["MODÈLE D'IMPORT CSV / EXCEL — ClearQuote"],
    [""],
    ["Colonne", "Valeurs autorisées", "Exemple"],
    ["ref", "Texte libre (unique)", "MO-PLO-001"],
    ["label_fr", "Texte libre", "Main-d'œuvre plomberie"],
    ["label_en", "Texte libre", "Plumbing labour"],
    ["description_fr", "Texte libre (facultatif)", "Pose, soudure et raccordements"],
    ["description_en", "Texte libre (facultatif)", "Installation and connections"],
    ["categorie", "main-oeuvre | materiaux | deplacement | sous-traitance | equipement | autre", "main-oeuvre"],
    ["unite", "h | j | forfait | m2 | ml | unite | km", "h"],
    ["prix_ht", "Nombre décimal (point ou virgule)", "65.00"],
    ["tva", "0 | 5.5 | 10 | 20", "10"],
    ["actif", "1 (actif) | 0 (inactif)", "1"],
  ];

  const wsHelp = XLSX.utils.aoa_to_sheet(helpData);
  wsHelp["!cols"] = [{ wch: 16 }, { wch: 58 }, { wch: 30 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Catalogue");
  XLSX.utils.book_append_sheet(wb, wsHelp, "Aide & Modèle");

  XLSX.writeFile(wb, filename);
}

// ── Téléchargement modèle CSV ─────────────────────────────────────────────────

export function downloadCsvTemplate() {
  const lines = [
    CSV_HEADERS.join(";"),
    "MO-PLO-001;Main-d'œuvre plomberie;Plumbing labour;Pose et raccordements;Installation and connections;main-oeuvre;h;65;10;1",
    "MAT-CUI-001;Tube cuivre 22mm;Copper pipe 22mm;Longueur de 2m;2m length;materiaux;ml;8.50;10;1",
  ].join("\r\n");

  // BOM UTF-8 pour Excel
  const bom = "﻿";
  const blob = new Blob([bom + lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modele-catalogue.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Import CSV ────────────────────────────────────────────────────────────────

export type ImportRow = {
  ref: string;
  label_fr: string;
  label_en: string;
  description_fr: string;
  description_en: string;
  category: ProductCategory;
  unit: ProductUnit;
  priceHT: number;
  vatRate: VatRate;
  active: boolean;
};

export type ParseResult = {
  rows: ImportRow[];
  errors: { line: number; message: string }[];
  skipped: number;
};

/**
 * Parse un fichier CSV (séparateur `;` ou `,`, encodage UTF-8 ou Latin-1).
 * La première ligne doit être un en-tête (ordre flexible).
 */
export function parseCatalogueCSV(text: string): ParseResult {
  const rows: ImportRow[] = [];
  const errors: { line: number; message: string }[] = [];
  let skipped = 0;

  // Nettoyer BOM UTF-8
  const clean = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = clean.split("\n").filter((l) => l.trim() !== "");

  if (lines.length < 2) {
    return { rows: [], errors: [{ line: 0, message: "Fichier vide ou sans données." }], skipped: 0 };
  }

  // Détecter le séparateur
  const firstLine = lines[0] ?? "";
  const sep = firstLine.includes(";") ? ";" : ",";

  // Parser l'en-tête
  const headerLine = firstLine.toLowerCase();
  const headers = headerLine.split(sep).map((h) => h.trim().replace(/^"|"$/g, ""));

  // Mapping flexible des colonnes
  const colIdx = (names: string[]): number => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const idxRef      = colIdx(["ref", "référence", "reference"]);
  const idxLabelFr  = colIdx(["label_fr", "libellé fr", "libelle fr", "nom fr", "libellé"]);
  const idxLabelEn  = colIdx(["label_en", "libellé en", "libelle en", "nom en"]);
  const idxDescFr   = colIdx(["description_fr", "description fr", "desc fr", "description"]);
  const idxDescEn   = colIdx(["description_en", "description en", "desc en"]);
  const idxCat      = colIdx(["categorie", "catégorie", "category"]);
  const idxUnit     = colIdx(["unite", "unité", "unit"]);
  const idxPrice    = colIdx(["prix_ht", "prix ht", "prix", "price_ht", "price", "tarif"]);
  const idxVat      = colIdx(["tva", "vat", "taux_tva"]);
  const idxActive   = colIdx(["actif", "active", "enabled"]);

  if (idxLabelFr === -1) {
    return {
      rows: [],
      errors: [{ line: 1, message: "Colonne 'label_fr' introuvable. Vérifiez l'en-tête." }],
      skipped: 0,
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const lineNum = i + 1;
    const raw = lines[i] ?? "";
    if (!raw.trim()) continue;

    const cells = raw.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));

    const get = (idx: number, fallback = "") =>
      idx !== -1 && idx < cells.length ? (cells[idx] ?? fallback).trim() : fallback;

    const labelFr = get(idxLabelFr);
    if (!labelFr) {
      skipped++;
      continue; // ligne vide / sans libellé
    }

    // Catégorie
    let category: ProductCategory = "autre";
    const rawCat = get(idxCat, "autre").toLowerCase();
    if (VALID_CATEGORIES.has(rawCat as ProductCategory)) {
      category = rawCat as ProductCategory;
    } else if (rawCat && rawCat !== "autre") {
      errors.push({ line: lineNum, message: `Catégorie inconnue : "${rawCat}". Valeur par défaut : "autre".` });
    }

    // Unité
    let unit: ProductUnit = "h";
    const rawUnit = get(idxUnit, "h").toLowerCase();
    if (VALID_UNITS.has(rawUnit as ProductUnit)) {
      unit = rawUnit as ProductUnit;
    } else if (rawUnit) {
      errors.push({ line: lineNum, message: `Unité inconnue : "${rawUnit}". Valeur par défaut : "h".` });
    }

    // Prix HT
    const rawPrice = get(idxPrice, "0").replace(",", ".");
    const priceHT = parseFloat(rawPrice);
    if (isNaN(priceHT)) {
      errors.push({ line: lineNum, message: `Prix invalide : "${rawPrice}".` });
    }

    // TVA
    const rawVat = get(idxVat, "20").replace(",", ".");
    const vatNum = parseFloat(rawVat);
    const vatRate: VatRate = VALID_VAT.has(vatNum) ? (vatNum as VatRate) : 20;
    if (!VALID_VAT.has(vatNum)) {
      errors.push({ line: lineNum, message: `TVA invalide : "${rawVat}". Valeur par défaut : 20%.` });
    }

    // Actif
    const rawActive = get(idxActive, "1").toLowerCase();
    const active = rawActive !== "0" && rawActive !== "non" && rawActive !== "false" && rawActive !== "no";

    rows.push({
      ref: get(idxRef, `REF-${String(rows.length + 1).padStart(3, "0")}`),
      label_fr: labelFr,
      label_en: get(idxLabelEn, labelFr),
      description_fr: get(idxDescFr),
      description_en: get(idxDescEn),
      category,
      unit,
      priceHT: isNaN(priceHT) ? 0 : priceHT,
      vatRate,
      active,
    });
  }

  return { rows, errors, skipped };
}

/**
 * Convertit des ImportRow[] en Product[] (avec génération d'IDs)
 */
export function importRowsToProducts(rows: ImportRow[], existingCount: number): Product[] {
  return rows.map((r, i) => ({
    id: `import-${Date.now()}-${i}`,
    ref: r.ref || `REF-${String(existingCount + i + 1).padStart(3, "0")}`,
    label: { fr: r.label_fr, en: r.label_en },
    description: { fr: r.description_fr, en: r.description_en },
    category: r.category,
    unit: r.unit,
    priceHT: r.priceHT,
    vatRate: r.vatRate,
    active: r.active,
    upsells: [],
  }));
}
