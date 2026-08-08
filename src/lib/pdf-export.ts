/**
 * Générateur PDF — Devis & Factures InvoicePro
 * Layout A4 professionnel avec toutes les mentions légales obligatoires France 2026
 *
 * Mentions légales incluses (art. L441-9, L441-3 C.com et CGI) :
 *  - Numérotation séquentielle
 *  - Identité vendeur (SIRET, TVA, forme juridique, capital, RCS)
 *  - Identité acheteur
 *  - Description des prestations, quantités, prix unitaires HT
 *  - Taux et montant de TVA
 *  - Montant TTC
 *  - Délai de paiement (Loi LME : 30j nets ou 45j fdm)
 *  - Taux de pénalités de retard (BCE + 10 pts minimum)
 *  - Indemnité forfaitaire de recouvrement (40€ légal, B2B)
 *  - Condition d'escompte
 *
 * Export additionnel :
 *  - XML Factur-X EN16931 téléchargé en parallèle
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { generateFacturxXml, FxDocument, FxLineItem } from "./facturx-xml";
import { embedFacturxInPdf, downloadBlob } from "./facturx-embed";
import type { CompanySettings } from "./data-context";
import type { Quote, Invoice } from "./data-context";

// ── Constantes de mise en page ────────────────────────────────────────────────

const PAGE_W = 210;  // A4 largeur (mm)
const PAGE_H = 297;  // A4 hauteur (mm)
const ML = 15;       // Marge gauche
const MR = 195;      // Marge droite
const CW = 180;      // Largeur contenu
const MT = 18;       // Marge top

// Palette couleurs (Navy InvoicePro) par défaut
const COLOR_NAVY    = [15, 23, 42]  as [number, number, number];
const COLOR_PRIMARY = [99, 102, 241] as [number, number, number]; // indigo-500
const COLOR_MUTED   = [107, 114, 128] as [number, number, number]; // gray-500
const COLOR_BORDER  = [229, 231, 235] as [number, number, number]; // gray-200
const COLOR_BG_LIGHT= [248, 250, 252] as [number, number, number]; // slate-50
const COLOR_WHITE   = [255, 255, 255] as [number, number, number];
const COLOR_BLACK   = [0, 0, 0]      as [number, number, number];

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : COLOR_NAVY;
}


// ── Helpers internes ──────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function setColor(
  doc: jsPDF,
  type: "text" | "draw" | "fill",
  rgb: [number, number, number],
) {
  if (type === "text") doc.setTextColor(...rgb);
  else if (type === "draw") doc.setDrawColor(...rgb);
  else doc.setFillColor(...rgb);
}

function drawHRule(doc: jsPDF, y: number, color = COLOR_BORDER, lw = 0.3) {
  doc.setLineWidth(lw);
  setColor(doc, "draw", color);
  doc.line(ML, y, MR, y);
}

/** Texte aligné à droite */
function textRight(doc: jsPDF, text: string, rightX: number, y: number) {
  const w = doc.getTextWidth(text);
  doc.text(text, rightX - w, y);
}

// ── BLOC EN-TÊTE ─────────────────────────────────────────────────────────────

function drawHeader(
  doc: jsPDF,
  docType: "DEVIS" | "FACTURE",
  number: string,
  issueDate: string,
  dueDate: string | undefined,
  validUntil: string | undefined,
  company: CompanySettings,
): number {
  let y = MT;
  const template = docType === "DEVIS" ? (company.defaultQuoteTemplate || "classic") : (company.defaultInvoiceTemplate || "classic");
  const primaryColor = company.primaryColor ? hexToRgb(company.primaryColor) : COLOR_NAVY;
  
  // ── Bande de fond ──────────────────────────────────────────────────
  if (template === "classic") {
    setColor(doc, "fill", COLOR_NAVY);
    doc.rect(0, 0, PAGE_W, 52, "F");
  } else if (template === "modern") {
    setColor(doc, "fill", primaryColor);
    doc.rect(0, 0, PAGE_W, 10, "F");
    setColor(doc, "fill", COLOR_NAVY);
    doc.rect(0, 10, PAGE_W, 42, "F");
  } else if (template === "bold") {
    setColor(doc, "fill", primaryColor);
    doc.rect(0, 0, PAGE_W, 60, "F");
  } else if (template === "minimal" || template === "elegant") {
    setColor(doc, "fill", primaryColor);
    doc.rect(0, 0, PAGE_W, 3, "F");
  }

  // ── Logo et Informations Société ──────────────────────────────────────────
  let nameX = ML;
  let rightY = 16;
  const isLightText = template === "classic" || template === "modern" || template === "bold";
  
  if (template === "elegant") {
    if (company.logoBase64) {
      try {
        const match = company.logoBase64.match(/data:image\/(png|jpeg|jpg|webp)/i);
        const ext = match ? match[1].toUpperCase().replace("JPG", "JPEG") : "PNG";
        const logoW = 40;
        const logoH = 20;
        doc.addImage(company.logoBase64, ext, (PAGE_W - logoW) / 2, 8, logoW, logoH);
      } catch (e) { console.error("Logo error", e); }
    }
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, "text", COLOR_BLACK);
    const companyName = company.name || "Mon Entreprise";
    const nameW = doc.getTextWidth(companyName);
    doc.text(companyName, (PAGE_W - nameW) / 2, 34);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, "text", COLOR_MUTED);
    const sellerLines: string[] = [];
    if (company.address) sellerLines.push(`${company.address} — ${company.postalCode} ${company.city}`);
    if (company.siret) sellerLines.push(`SIRET ${company.siret}${company.vatNumber ? `  ·  TVA ${company.vatNumber}` : ""}`);
    sellerLines.forEach((line, i) => {
      const lineW = doc.getTextWidth(line);
      doc.text(line, (PAGE_W - lineW) / 2, 39 + i * 4.5);
    });
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    setColor(doc, "text", primaryColor);
    textRight(doc, docType, MR, 20);
    
    doc.setFontSize(10);
    setColor(doc, "text", COLOR_MUTED);
    textRight(doc, `N° ${number}  |  Date : ${fmtDate(issueDate)}`, MR, 26);
    if (dueDate) textRight(doc, `Échéance : ${fmtDate(dueDate)}`, MR, 31);
    
    y = 55;
    
  } else {
    if (company.logoBase64) {
      try {
        const match = company.logoBase64.match(/data:image\/(png|jpeg|jpg|webp)/i);
        const ext = match ? match[1].toUpperCase().replace("JPG", "JPEG") : "PNG";
        const logoW = template === "bold" ? 34 : 28;
        const logoH = template === "bold" ? 17 : 14;
        doc.addImage(company.logoBase64, ext, ML, template === "modern" ? 14 : 8, logoW, logoH);
        nameX = ML + logoW + 5;
      } catch (e) { console.error("Logo error", e); }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(template === "bold" ? 16 : 13);
    setColor(doc, "text", isLightText ? COLOR_WHITE : COLOR_BLACK);
    const nameStartY = template === "modern" ? 22 : 16;
    doc.text(company.name || "Mon Entreprise", nameX, nameStartY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(doc, "text", isLightText ? [180, 190, 210] : COLOR_MUTED);
    const sellerLines: string[] = [];
    if (company.address) sellerLines.push(`${company.address} — ${company.postalCode} ${company.city}`);
    if (company.phone || company.email) sellerLines.push([company.phone, company.email].filter(Boolean).join("  ·  "));
    if (company.siret) sellerLines.push(`SIRET ${company.siret}${company.vatNumber ? `  ·  TVA ${company.vatNumber}` : ""}`);
    sellerLines.forEach((line, i) => {
      doc.text(line, nameX, nameStartY + 6 + i * 4.5);
    });

    if (template === "classic") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      setColor(doc, "text", COLOR_WHITE);
      textRight(doc, docType, MR, rightY);
      rightY += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      setColor(doc, "text", [180, 190, 210]);
      textRight(doc, `N° ${number}`, MR, rightY);
      rightY += 6;
      textRight(doc, `Émis le ${fmtDate(issueDate)}`, MR, rightY);
      
    } else if (template === "modern") {
      rightY = 22;
      setColor(doc, "fill", COLOR_WHITE);
      doc.roundedRect(MR - 45, rightY - 6, 45, 9, 1, 1, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      setColor(doc, "text", primaryColor);
      textRight(doc, docType, MR - 2, rightY);
      rightY += 10;
      
      doc.setFontSize(9);
      setColor(doc, "text", COLOR_WHITE);
      textRight(doc, `N° ${number}`, MR, rightY);
      rightY += 5;
      textRight(doc, `Émis le ${fmtDate(issueDate)}`, MR, rightY);
      
    } else if (template === "bold") {
      rightY = 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(30);
      setColor(doc, "text", COLOR_WHITE);
      textRight(doc, docType, MR, rightY);
      rightY += 10;
      
      doc.setFontSize(11);
      textRight(doc, `N° ${number}  |  Émis le ${fmtDate(issueDate)}`, MR, rightY);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      setColor(doc, "text", primaryColor);
      textRight(doc, docType, MR, rightY);
      rightY += 8;
      
      doc.setFontSize(10);
      setColor(doc, "text", COLOR_MUTED);
      textRight(doc, `N° ${number}  |  ${fmtDate(issueDate)}`, MR, rightY);
    }

    rightY += 6;
    if (dueDate) {
      if (isLightText) setColor(doc, "text", [180, 190, 210]);
      textRight(doc, `Échéance : ${fmtDate(dueDate)}`, MR, rightY);
    }
    if (validUntil) {
      if (isLightText) setColor(doc, "text", [180, 190, 210]);
      textRight(doc, `Valable jusqu'au ${fmtDate(validUntil)}`, MR, dueDate ? rightY + 6 : rightY);
    }
    
    y = template === "minimal" ? 45 : (template === "bold" ? 70 : 62);
  }

  return y;
}

// ── BLOC CLIENT ───────────────────────────────────────────────────────────────

function drawClientBlock(
  doc: jsPDF,
  clientName: string,
  details: {
    siret?: string;
    vatNumber?: string;
    address?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    email?: string;
    phone?: string;
  },
  y: number,
): number {
  // Fond léger
  setColor(doc, "fill", COLOR_BG_LIGHT);
  doc.rect(ML, y, CW, 36, "F");
  setColor(doc, "draw", COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(ML, y, CW, 36);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  setColor(doc, "text", COLOR_MUTED);
  doc.text("DESTINATAIRE", ML + 4, y + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  setColor(doc, "text", COLOR_BLACK);
  doc.text(clientName, ML + 4, y + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  setColor(doc, "text", COLOR_MUTED);

  const infoLines: string[] = [];
  if (details.address) infoLines.push(details.address);
  if (details.postalCode || details.city)
    infoLines.push(`${details.postalCode ?? ""} ${details.city ?? ""}`.trim());
  if (details.siret) infoLines.push(`SIRET ${details.siret}`);
  if (details.vatNumber) infoLines.push(`N° TVA ${details.vatNumber}`);
  if (details.email || details.phone)
    infoLines.push([details.email, details.phone].filter(Boolean).join("  ·  "));

  infoLines.forEach((line, i) => {
    doc.text(line, ML + 4, y + 18 + i * 4.5);
  });

  return y + 42;
}

// ── TABLE DES PRESTATIONS ─────────────────────────────────────────────────────

function drawLinesTable(
  doc: jsPDF,
  items: { description: string; qty: number; unitPrice: number; total: number }[],
  vatRate: number,
  startY: number,
): number {
  const totalHT = items.reduce((s, i) => s + i.total, 0);
  const totalVAT = totalHT * (vatRate / 100);
  const totalTTC = totalHT + totalVAT;

  autoTable(doc, {
    startY,
    margin: { left: ML, right: PAGE_W - MR },
    head: [["#", "Description / Prestation", "Qté", "Prix unit. HT", "Total HT"]],
    body: items.map((item, i) => [
      String(i + 1),
      item.description,
      String(item.qty),
      fmt(item.unitPrice),
      fmt(item.total),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
    },
    headStyles: {
      fillColor: COLOR_NAVY,
      textColor: COLOR_WHITE,
      fontStyle: "bold",
      fontSize: 7.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: "auto" },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 32, halign: "right" },
      4: { cellWidth: 32, halign: "right", fontStyle: "bold" },
    },
    alternateRowStyles: { fillColor: COLOR_BG_LIGHT },
    bodyStyles: { textColor: [30, 30, 30] as [number, number, number] },
    tableLineColor: COLOR_BORDER,
    tableLineWidth: 0.2,
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── Bloc totaux (droite) ─────────────────────────────────────────────────
  const TX = MR - 72; // x départ colonne labels
  const VX = MR;      // x alignement valeurs

  let ty = afterTable + 2;
  const rowH = 6;

  const drawTotalRow = (label: string, value: string, bold = false, accent = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 9 : 8.5);
    setColor(doc, "text", accent ? COLOR_PRIMARY : (bold ? COLOR_BLACK : COLOR_MUTED));
    doc.text(label, TX, ty);
    textRight(doc, value, VX, ty);
    ty += rowH;
  };

  drawTotalRow("Total HT", fmt(totalHT));
  drawTotalRow(`TVA ${vatRate}%`, fmt(totalVAT));

  // Ligne séparatrice avant TTC
  drawHRule(doc, ty - 1.5, COLOR_NAVY, 0.5);
  ty += 2;

  // Fond sur ligne TTC
  setColor(doc, "fill", [238, 242, 255]);
  doc.rect(TX - 4, ty - 4.5, VX - TX + 4 + 4, 8.5, "F");
  drawTotalRow("TOTAL TTC", fmt(totalTTC), true, true);

  // Acompte (30%)
  ty += 1;
  drawHRule(doc, ty - 1, COLOR_BORDER);
  ty += 3;
  drawTotalRow("Acompte (30%)", fmt(totalTTC * 0.3));

  return ty + 4;
}

// ── BLOC MENTIONS LÉGALES ─────────────────────────────────────────────────────

function drawLegalMentions(
  doc: jsPDF,
  isInvoice: boolean,
  company: CompanySettings,
  y: number,
): number {
  // Vérifier qu'on a assez de place (sinon nouvelle page)
  const remaining = PAGE_H - y - 28; // 28 = footer
  if (remaining < 55) {
    doc.addPage();
    y = MT;
  }

  drawHRule(doc, y, COLOR_BORDER);
  y += 5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  setColor(doc, "text", [80, 80, 80]);
  doc.text("CONDITIONS ET MENTIONS LÉGALES", ML, y);
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(doc, "text", COLOR_MUTED);

  const lateRate   = company.lateInterestRate   || "10.5";
  const recovFee   = company.recoveryFee         || "40";
  const payTerms   = company.paymentTermsDays    || 30;

  const lines: string[] = [];

  if (isInvoice) {
    lines.push(
      `Paiement à ${payTerms} jours nets date de facture (Loi LME n° 2008-776 du 4 août 2008).`,
      `En cas de retard de paiement, des pénalités de ${lateRate}% (taux BCE + 10 points) seront exigibles de plein droit`,
      `dès le lendemain de la date d'échéance, sans mise en demeure préalable (art. L441-10 C. com.).`,
      `Une indemnité forfaitaire de recouvrement de ${recovFee} € sera due en sus (art. D441-5 C. com.).`,
      `Aucun escompte n'est accordé pour paiement anticipé.`,
      `La propriété des biens/prestations reste acquise au vendeur jusqu'au paiement complet du prix.`,
    );
  } else {
    lines.push(
      `Ce devis est valable 30 jours à compter de sa date d'émission.`,
      `La prestation débutera à réception d'un acompte de 30% du montant TTC.`,
      `Paiement : ${payTerms} jours nets date de facture. Pénalités de retard : ${lateRate}%.`,
      `Tout devis signé vaut bon de commande et engagement ferme des deux parties.`,
    );
  }

  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, CW);
    doc.text(wrapped, ML, y);
    y += wrapped.length * 3.8;
  });

  return y + 3;
}

// ── PIED DE PAGE ──────────────────────────────────────────────────────────────

function drawFooter(doc: jsPDF, company: CompanySettings, pageNum: number, totalPages: number) {
  const fy = PAGE_H - 18;

  // Fond
  setColor(doc, "fill", [241, 245, 249]);
  doc.rect(0, fy - 2, PAGE_W, 22, "F");
  setColor(doc, "draw", COLOR_BORDER);
  doc.setLineWidth(0.2);
  doc.line(0, fy - 2, PAGE_W, fy - 2);

  doc.setFontSize(6.5);
  setColor(doc, "text", [130, 130, 150]);
  doc.setFont("helvetica", "normal");

  // Ligne 1 : raison sociale + forme juridique + capital
  let footLine1 = company.name || "";
  if (company.legalForm) footLine1 += ` — ${company.legalForm}`;
  if (company.capital) footLine1 += ` — Capital social : ${company.capital} €`;
  if (company.rcs) footLine1 += ` — ${company.rcs}`;

  // Ligne 2 : SIRET + TVA + adresse
  let footLine2 = "";
  if (company.siret) footLine2 += `SIRET ${company.siret}`;
  if (company.vatNumber) footLine2 += `  ·  N° TVA ${company.vatNumber}`;
  if (company.address) footLine2 += `  ·  ${company.address}, ${company.postalCode} ${company.city}`;
  if (company.email) footLine2 += `  ·  ${company.email}`;

  // Ligne 3 : IBAN si facture
  let footLine3 = "";
  if (company.iban) {
    footLine3 = `Virement bancaire — ${company.bankName ? company.bankName + "  ·  " : ""}IBAN ${company.iban}${company.bic ? `  ·  BIC ${company.bic}` : ""}`;
  }

  // Mention footer personnalisée (si saisie dans les paramètres)
  const customNote = company.footerNote && company.footerNote !== footLine1
    ? company.footerNote
    : "";

  const noteToUse = customNote || [footLine1, footLine2].filter(Boolean).join("  ·  ");
  const wrapped = doc.splitTextToSize(noteToUse, CW);
  doc.text(wrapped, ML, fy + 3);

  if (footLine3) {
    doc.text(footLine3, ML, fy + 3 + wrapped.length * 3.5);
  }

  // Pagination
  doc.setFontSize(7);
  textRight(doc, `Page ${pageNum} / ${totalPages}`, MR, fy + 3);
}

// ── EXPORT DEVIS ──────────────────────────────────────────────────────────────

export async function generateQuotePdfDoc(quote: Quote, company: CompanySettings): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const issueDate = quote.date;
  const validUntil = addDays(issueDate, 30);

  const details = quote.details;
  const allItems = [
    ...(details?.items ?? []),
    ...(details?.upsells ?? []),
  ].filter((i) => i.label && Number(i.priceHT) > 0);

  const vatRate  = details?.vatRate ?? 20;
  const totalHT  = details?.totalHT ?? quote.amount / (1 + vatRate / 100);
  const totalTTC = details?.totalTTC ?? quote.amount;
  const totalVAT = totalTTC - totalHT;

  // ── Construction PDF ──────────────────────────────────────────────────────
  let y = drawHeader(doc, "DEVIS", quote.number, issueDate, undefined, validUntil, company);

  // Bloc client
  const clientDetails = {
    siret: details?.siret,
    address: details?.address,
    phone: details?.phone,
  };
  y = drawClientBlock(doc, quote.client, clientDetails, y + 4);

  // Référence
  y += 6;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  setColor(doc, "text", COLOR_MUTED);
  if (details?.serviceAddress) {
    doc.text(`Adresse d'intervention : ${details.serviceAddress}`, ML, y);
    y += 5;
  }

  // Table
  const lineItems = allItems.map((item) => ({
    description: item.label,
    qty: Number(item.qty),
    unitPrice: Number(item.priceHT),
    total: Number(item.priceHT) * Number(item.qty),
  }));

  if (lineItems.length === 0) {
    lineItems.push({ description: "Prestation", qty: 1, unitPrice: totalHT, total: totalHT });
  }

  y = drawLinesTable(doc, lineItems, vatRate, y + 4);

  // Mentions légales
  y = drawLegalMentions(doc, false, company, y + 6);

  // Footer (toutes les pages)
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, company, p, totalPages);
  }

  // Factur-X XML generation is now handled in exportQuotePdf if needed
  return doc;
}

export async function exportQuotePdf(quote: Quote, company: CompanySettings): Promise<void> {
  const doc = await generateQuotePdfDoc(quote, company);
  
  // ── Factur-X (XML) ──────────────────────────────────────────────────────
  const issueDate = quote.date;
  const details = quote.details;
  const allItems = [
    ...(details?.items ?? []),
    ...(details?.upsells ?? []),
  ].filter((i) => i.label && Number(i.priceHT) > 0);
  const vatRate  = details?.vatRate ?? 20;
  const totalHT  = details?.totalHT ?? quote.amount / (1 + vatRate / 100);
  const totalTTC = details?.totalTTC ?? quote.amount;
  const totalVAT = totalTTC - totalHT;

  const fxLines = allItems.map((item, i) => ({
    lineNumber: i + 1,
    description: item.label,
    qty: Number(item.qty),
    unitPrice: Number(item.priceHT),
    vatRate,
    total: Number(item.qty) * Number(item.priceHT),
  }));

  const fxDoc: FxDocument = {
    type: "quote",
    number: quote.number,
    issueDate,
    currency: "EUR",
    seller: {
      name: company.name,
      legalForm: company.legalForm || "",
      siret: company.siret || "",
      vatNumber: company.vatNumber || "",
      address: company.address || "",
      postalCode: company.postalCode || "",
      city: company.city || "",
      country: company.country || "",
      email: company.email || "",
      phone: company.phone || "",
      capital: company.capital || "",
      rcs: company.rcs || "",
      iban: company.iban || "",
      bic: company.bic || "",
      bankName: company.bankName || "",
    },
    buyer: {
      name: quote.client,
      siret: details?.siret || "",
      address: details?.address || "",
      phone: details?.phone || "",
    },
    lines: fxLines,
    vatRate,
    totalHT,
    totalVAT,
    totalTTC,
    paymentTermsDays: company.paymentTermsDays,
    lateInterestRate: company.lateInterestRate,
    recoveryFee: company.recoveryFee,
  };

  const xml = generateFacturxXml(fxDoc);

  // Hybrid PDF/A-3 : embed the XML inside the PDF (true Factur-X)
  const pdfBlob = doc.output("blob");
  const hybridBlob = await embedFacturxInPdf(pdfBlob, xml, quote.number, issueDate);
  downloadBlob(hybridBlob, `${quote.number}_facturx.pdf`);
}

export async function exportQuotePdfBlob(quote: Quote, company: CompanySettings): Promise<Blob> {
  const doc = await generateQuotePdfDoc(quote, company);
  return doc.output("blob");
}

// ── EXPORT FACTURE ────────────────────────────────────────────────────────────

export async function exportInvoicePdf(invoice: Invoice, company: CompanySettings): Promise<void> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const issueDate = invoice.date;
  const dueDate   = invoice.due;

  const vatRate  = 20; // Par défaut (le modèle Invoice simplifié n'a pas le détail TVA)
  const totalTTC = invoice.amount;
  const totalHT  = totalTTC / (1 + vatRate / 100);
  const totalVAT = totalTTC - totalHT;

  // ── Construction PDF ──────────────────────────────────────────────────────
  let y = drawHeader(doc, "FACTURE", invoice.number, issueDate, dueDate, undefined, company);

  y = drawClientBlock(doc, invoice.client, {}, y + 4);

  // Numéro de bon de commande / référence devis (si disponible — extension future)
  y += 8;

  // Table prestation (simplifié : une seule ligne car le modèle Invoice n'a pas les détails)
  const lineItems = [
    {
      description: `Prestation de services — Facture ${invoice.number}`,
      qty: 1,
      unitPrice: Math.round(totalHT * 100) / 100,
      total: Math.round(totalHT * 100) / 100,
    },
  ];

  y = drawLinesTable(doc, lineItems, vatRate, y);

  // ── Bloc paiement ─────────────────────────────────────────────────────────
  if (company.iban || company.bankName) {
    y += 4;
    drawHRule(doc, y, COLOR_BORDER);
    y += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    setColor(doc, "text", [60, 60, 60]);
    doc.text("MODALITÉS DE PAIEMENT", ML, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    setColor(doc, "text", COLOR_MUTED);
    if (company.bankName) { doc.text(`Banque : ${company.bankName}`, ML, y); y += 4.5; }
    if (company.iban)     { doc.text(`IBAN : ${company.iban}`, ML, y); y += 4.5; }
    if (company.bic)      { doc.text(`BIC / SWIFT : ${company.bic}`, ML, y); y += 4.5; }
  }

  // Mentions légales
  y = drawLegalMentions(doc, true, company, y + 6);

  // Cachet (espace signature)
  const sigY = Math.min(y + 6, PAGE_H - 55);
  drawHRule(doc, sigY, COLOR_BORDER);
  y = sigY + 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  setColor(doc, "text", COLOR_MUTED);
  doc.text("Cachet et signature du client :", ML, y);
  // Cadre signature
  setColor(doc, "draw", COLOR_BORDER);
  doc.setLineWidth(0.3);
  doc.rect(ML, y + 3, 60, 20);

  // Tampon "ORIGINAL"
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setColor(doc, "text", [220, 230, 245]);
  doc.text("ORIGINAL", MR - 75, y + 18);

  // Footer (toutes les pages)
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    drawFooter(doc, company, p, totalPages);
  }

  // ── Génération Factur-X & téléchargement hybride ────────────────────────
  const fxLines: FxLineItem[] = lineItems.map((item, i) => ({
    lineNumber: i + 1,
    description: item.description,
    qty: item.qty,
    unitPrice: item.unitPrice,
    vatRate,
    total: item.total,
  }));

  const fxDoc: FxDocument = {
    type: "invoice",
    number: invoice.number,
    issueDate,
    dueDate,
    currency: "EUR",
    seller: {
      name: company.name,
      legalForm: company.legalForm,
      siret: company.siret,
      vatNumber: company.vatNumber,
      address: company.address,
      postalCode: company.postalCode,
      city: company.city,
      country: company.country,
      email: company.email,
      phone: company.phone,
      capital: company.capital,
      rcs: company.rcs,
      iban: company.iban,
      bic: company.bic,
      bankName: company.bankName,
    },
    buyer: { name: invoice.client },
    lines: fxLines,
    vatRate,
    totalHT,
    totalVAT,
    totalTTC,
    paymentTermsDays: company.paymentTermsDays,
    lateInterestRate: company.lateInterestRate,
    recoveryFee: company.recoveryFee,
  };

  const xml = generateFacturxXml(fxDoc);
  // Hybrid PDF/A-3 : embed the XML inside the PDF (true Factur-X)
  const pdfBlob = doc.output("blob");
  const hybridBlob = await embedFacturxInPdf(pdfBlob, xml, invoice.number, issueDate);
  downloadBlob(hybridBlob, `${invoice.number}_facturx.pdf`);
}
