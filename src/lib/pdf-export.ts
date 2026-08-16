/**
 * pdf-export.ts — v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Génération PDF identique à l'aperçu : on rend <DocumentTemplate> via
 * renderToStaticMarkup (HTML+CSS inline) et on l'injecte dans une iframe
 * cachée avant d'appeler window.print().
 *
 * Résultat : l'aperçu ET le PDF téléchargé utilisent exactement le même rendu.
 *
 * Factur-X : le fichier XML est téléchargé en parallèle (format réglementaire
 * FR 2026 EN16931). Le PDF visuel + l'XML constituent ensemble un dossier
 * Factur-X complet.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { DocumentTemplate, type DocumentData, type DocumentCompany } from "@/components/DocumentTemplate";
import { generateFacturxXml, type FxDocument, type FxLineItem } from "./facturx-xml";
import { downloadBlob } from "./facturx-embed";
import type { CompanySettings, Quote, Invoice } from "./data-context";

// ─── Convertisseurs de types ──────────────────────────────────────────────────

export function companyToDocCompany(c: CompanySettings): DocumentCompany {
  return {
    name:              c.name || "Mon Entreprise",
    legalForm:         c.legalForm,
    address:           c.address || "",
    postalCode:        c.postalCode || "",
    city:              c.city || "",
    country:           c.country,
    phone:             c.phone,
    email:             c.email,
    website:           c.website,
    siret:             c.siret,
    vatNumber:         c.vatNumber,
    capital:           c.capital,
    rcs:               c.rcs,
    logoBase64:        c.logoBase64,
    bankName:          c.bankName,
    iban:              c.iban,
    bic:               c.bic,
    paymentTermsDays:  c.paymentTermsDays,
    lateInterestRate:  c.lateInterestRate,
    recoveryFee:       c.recoveryFee,
    footerNote:        c.footerNote,
    primaryColor:      c.primaryColor,
  };
}

export function quoteToDocumentData(quote: Quote): DocumentData {
  const details = quote.details;
  const vatRate  = details?.vatRate ?? 20;
  const totalHT  = details?.totalHT  ?? quote.amount / (1 + vatRate / 100);
  const totalTTC = details?.totalTTC ?? quote.amount;

  const allItems = [
    ...(details?.items ?? []),
    ...(details?.upsells ?? []),
  ].filter((i) => i.label && Number(i.priceHT) > 0);

  const items = allItems.length > 0
    ? allItems.map((i) => ({
        id:          i.id,
        description: i.label,
        qty:         Number(i.qty),
        unit:        i.unit || "u",
        priceHT:     Number(i.priceHT),
        vatRate,
      }))
    : [{
        id:          "default",
        description: "Prestation",
        qty:         1,
        unit:        "forfait",
        priceHT:     totalHT,
        vatRate,
      }];

  // validité +30j ou valeur déjà stockée
  const dueOrValidUntil = (quote as Quote & { validityDate?: string }).validityDate
    || addDays(quote.date, 30);

  return {
    type:             "devis",
    number:           quote.number,
    date:             quote.date,
    dueOrValidUntil,
    serviceAddress:   details?.serviceAddress,
    client: {
      name:        quote.client,
      address:     details?.address,
      postalCode:  details?.postalCode,
      city:        details?.city,
      phone:       details?.phone,
      email:       details?.email,
      siret:       details?.siret,
    },
    items,
    ...(quote.signatureData ? {
      signature: {
        name: quote.signatureData.signerName,
        date: quote.signatureData.signedAt,
        image: quote.signatureData.image,
      }
    } : {}),
  };
}

export function invoiceToDocumentData(invoice: Invoice): DocumentData {
  const vatRate  = 20;
  const totalTTC = invoice.amount;
  const totalHT  = Math.round((totalTTC / (1 + vatRate / 100)) * 100) / 100;

  const rawItems = (invoice as Invoice & { items?: Array<{ id: string; label: string; qty: number; priceHT: number; vatRate?: number }> }).items;

  const items = rawItems && rawItems.length > 0
    ? rawItems.map((i) => ({
        id:          i.id,
        description: i.label,
        qty:         Number(i.qty),
        unit:        i.unit || "u",
        priceHT:     Number(i.priceHT),
        vatRate:     i.vatRate ?? vatRate,
      }))
    : [{
        id:          "default",
        description: `Prestation de services — Facture ${invoice.number}`,
        qty:         1,
        unit:        "forfait",
        priceHT:     totalHT,
        vatRate,
      }];

  return {
    type:            "facture",
    number:          invoice.number,
    date:            invoice.date,
    dueOrValidUntil: invoice.due,
    client: {
      name:       invoice.client,
      siret:      invoice.details?.siret || (invoice as Invoice & { clientSiret?: string }).clientSiret,
      address:    invoice.details?.address,
      postalCode: invoice.details?.postalCode,
      city:       invoice.details?.city,
      email:      invoice.details?.email,
      phone:      invoice.details?.phone,
    },
    items,
    depositPaid:     invoice.paidAmount && invoice.paidAmount < totalTTC
      ? invoice.paidAmount
      : undefined,
  };
}

import * as htmlToImage from 'html-to-image';
import jsPDF from 'jspdf';
import { embedFacturxInPdf } from "./facturx-embed";

// ─── Génération de PDF via html-to-image + jsPDF ─────────────────────────────
// (On n'utilise pas html2canvas/html2pdf.js car ils plantent sur le format 'oklch' de Tailwind v4)

async function generatePdfBlob(html: string): Promise<Blob> {
  // Attendre que toutes les polices soient chargées pour éviter les problèmes de rendu
  await document.fonts.ready;

  const container = document.createElement("div");
  // Masqué mais dans le viewport pour forcer le rendu par le navigateur
  container.style.position = "fixed";
  container.style.left = "0";
  container.style.top = "0";
  container.style.zIndex = "-9999";
  container.style.width = "1050px"; // Largeur pour matcher le template
  container.style.backgroundColor = "#ffffff";
  
  // Envelopper dans un div global pour s'assurer que les styles globaux s'appliquent
  container.innerHTML = `
    <div style="font-family: 'Inter', sans-serif; background-color: #ffffff; color: #000000; padding: 0; min-height: 1485px;">
      ${html}
    </div>
  `;
  
  document.body.appendChild(container);

  try {
    // Laisser le temps au DOM de se mettre en place (les images et SVG)
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Convertir le DOM en image JPEG via SVG foreignObject (gère parfaitement oklch)
    const dataUrl = await htmlToImage.toJpeg(container, { 
      quality: 0.98, 
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      skipFonts: false,
      style: {
        transform: 'scale(1)',
        transformOrigin: 'top left'
      }
    });
    
    // Créer le PDF A4
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculer la hauteur en respectant le ratio de l'élément rendu
    const pdfHeight = (container.offsetHeight * pdfWidth) / container.offsetWidth;
    let finalWidth = pdfWidth;
    let finalHeight = pdfHeight;
    let xOffset = 0;

    // Si le document est plus grand qu'une page A4, on le réduit proportionnellement
    if (pdfHeight > pageHeight) {
      const scaleToFit = pageHeight / pdfHeight;
      finalWidth = pdfWidth * scaleToFit;
      finalHeight = pageHeight;
      xOffset = (pdfWidth - finalWidth) / 2;
    }

    pdf.addImage(dataUrl, 'JPEG', xOffset, 0, finalWidth, finalHeight);
    
    return pdf.output('blob');
  } finally {
    document.body.removeChild(container);
  }
}

function escHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0] ?? iso;
}

// ─── API publique ──────────────────────────────────────────────────────────────

/**
 * Génère le devis en format PDF (Base64) pour l'envoi par e-mail.
 */
export async function generateQuotePdfBase64(quote: Quote, company: CompanySettings): Promise<string> {
  const docData    = quoteToDocumentData(quote);
  const docCompany = companyToDocCompany(company);

  // 1. HTML
  const element = createElement(DocumentTemplate, { doc: docData, company: docCompany, id: "print-doc" });
  const html    = renderToStaticMarkup(element);
  
  // 2. Brut
  const rawPdfBlob = await generatePdfBlob(html);

  // 3. XML (Optionnel, mais on peut l'inclure)
  const vatRate  = quote.details?.vatRate ?? 20;
  const totalHT  = quote.details?.totalHT  ?? quote.amount / (1 + vatRate / 100);
  const totalVAT = (quote.details?.totalTTC ?? quote.amount) - totalHT;
  const totalTTC = quote.details?.totalTTC ?? quote.amount;

  const fxLines: FxLineItem[] = docData.items.map((item, i) => ({
    lineNumber:  i + 1,
    description: item.description,
    qty:         item.qty,
    unitPrice:   item.priceHT,
    vatRate:     item.vatRate,
    total:       item.qty * item.priceHT,
  }));

  const fxDoc: FxDocument = {
    type: "quote",
    number: quote.number,
    issueDate: quote.date,
    currency: "EUR",
    seller: buildFxSeller(company),
    buyer: { name: quote.client, siret: quote.details?.siret || "", address: quote.details?.address || "" },
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
  let finalPdfBlob = rawPdfBlob;
  
  try {
    finalPdfBlob = await embedFacturxInPdf(rawPdfBlob, xml, quote.number, quote.date);
  } catch (err) {
    console.error("Erreur Factur-X:", err);
  }

  // Convert blob to base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64data = (reader.result as string).split(',')[1];
      resolve(base64data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(finalPdfBlob);
  });
}


/**
 * Exporte un devis en PDF en le téléchargeant directement.
 * Embarque le XML Factur-X à l'intérieur du fichier PDF généré.
 */
export async function exportQuotePdf(quote: Quote, company: CompanySettings): Promise<void> {
  const docData    = quoteToDocumentData(quote);
  const docCompany = companyToDocCompany(company);

  // ── 1. Générer le code HTML ──────────────────────────────
  const element = createElement(DocumentTemplate, { doc: docData, company: docCompany, id: "print-doc" });
  const html    = renderToStaticMarkup(element);
  
  // ── 2. Générer le PDF brut via html2pdf ─────────────────────────────────
  const rawPdfBlob = await generatePdfBlob(html);

  // ── 3. Générer le XML Factur-X ───────────────────────────────────────────────────────
  const vatRate  = quote.details?.vatRate ?? 20;
  const totalHT  = quote.details?.totalHT  ?? quote.amount / (1 + vatRate / 100);
  const totalVAT = (quote.details?.totalTTC ?? quote.amount) - totalHT;
  const totalTTC = quote.details?.totalTTC ?? quote.amount;

  const fxLines: FxLineItem[] = docData.items.map((item, i) => ({
    lineNumber:  i + 1,
    description: item.description,
    qty:         item.qty,
    unitPrice:   item.priceHT,
    vatRate:     item.vatRate,
    total:       item.qty * item.priceHT,
  }));

  const fxDoc: FxDocument = {
    type: "quote",
    number: quote.number,
    issueDate: quote.date,
    currency: "EUR",
    seller: buildFxSeller(company),
    buyer: { name: quote.client, siret: quote.details?.siret || "", address: quote.details?.address || "" },
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
  
  // ── 4. Embarquer le XML dans le PDF et télécharger ─────────────────────────
  try {
    const finalPdfBlob = await embedFacturxInPdf(rawPdfBlob, xml, quote.number, quote.date);
    downloadBlob(finalPdfBlob, `Devis_${quote.number}.pdf`);
  } catch (err) {
    console.error("Erreur d'embarquement Factur-X:", err);
    // Fallback: télécharger le PDF brut si pdf-lib plante
    downloadBlob(rawPdfBlob, `Devis_${quote.number}.pdf`);
  }
}

/**
 * Exporte une facture en PDF (même template que l'aperçu) + télécharge le XML Factur-X.
 */
export async function exportInvoicePdf(invoice: Invoice, company: CompanySettings): Promise<void> {
  const docData    = invoiceToDocumentData(invoice);
  const docCompany = companyToDocCompany(company);

  // ── 1. Générer le code HTML ──────────────────────────────
  const element = createElement(DocumentTemplate, { doc: docData, company: docCompany, id: "print-doc" });
  const html    = renderToStaticMarkup(element);
  
  // ── 2. Générer le PDF brut via html2pdf ─────────────────────────────────
  const rawPdfBlob = await generatePdfBlob(html);

  // ── 3. Générer le XML Factur-X ───────────────────────────────────────────────────────
  const vatRate  = 20;
  const totalTTC = invoice.amount;
  const totalHT  = Math.round((totalTTC / (1 + vatRate / 100)) * 100) / 100;
  const totalVAT = totalTTC - totalHT;

  const fxLines: FxLineItem[] = docData.items.map((item, i) => ({
    lineNumber:  i + 1,
    description: item.description,
    qty:         item.qty,
    unitPrice:   item.priceHT,
    vatRate:     item.vatRate,
    total:       item.qty * item.priceHT,
  }));

  const fxDoc: FxDocument = {
    type: "invoice",
    number: invoice.number,
    issueDate: invoice.date,
    dueDate: invoice.due,
    currency: "EUR",
    seller: buildFxSeller(company),
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
  
  // ── 4. Embarquer le XML dans le PDF et télécharger ─────────────────────────
  try {
    const finalPdfBlob = await embedFacturxInPdf(rawPdfBlob, xml, invoice.number, invoice.date);
    downloadBlob(finalPdfBlob, `Facture_${invoice.number}.pdf`);
  } catch (err) {
    console.error("Erreur d'embarquement Factur-X:", err);
    downloadBlob(rawPdfBlob, `Facture_${invoice.number}.pdf`);
  }
}

// ─── Helpers Factur-X ─────────────────────────────────────────────────────────

function buildFxSeller(c: CompanySettings): FxDocument["seller"] {
  return {
    name:       c.name || "",
    legalForm:  c.legalForm || "",
    siret:      c.siret || "",
    vatNumber:  c.vatNumber || "",
    address:    c.address || "",
    postalCode: c.postalCode || "",
    city:       c.city || "",
    country:    c.country || "FR",
    email:      c.email || "",
    phone:      c.phone || "",
    capital:    c.capital || "",
    rcs:        c.rcs || "",
    iban:       c.iban || "",
    bic:        c.bic || "",
    bankName:   c.bankName || "",
  };
}

// ─── Rétrocompatibilité (blob pour envoi email) ────────────────────────────────

/** Génère le HTML du document sans lancer l'impression — utile pour email/preview */
export function buildDocumentHtml(
  docData: DocumentData,
  docCompany: DocumentCompany,
): string {
  const element = createElement(DocumentTemplate, { doc: docData, company: docCompany, id: "email-doc" });
  return renderToStaticMarkup(element);
}


