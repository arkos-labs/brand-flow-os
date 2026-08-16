/**
 * DocumentTemplate.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Template universel devis / facture — identique en aperçu et en impression PDF.
 *
 * Usage aperçu :
 *   <DocumentTemplate type="devis" doc={quote} company={company} />
 *
 * Usage impression :
 *   import { printDocument } from "@/lib/document-pdf";
 *   printDocument("document-preview-id");
 *
 * Conforme France 2026 : SIRET, TVA, mentions légales, pénalités de retard,
 * indemnité de recouvrement, numérotation séquentielle.
 */

import { type FC } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentType = "devis" | "facture" | "avoir" | "acompte";

export type DocumentLineItem = {
  id: string;
  description: string;
  detail?: string;       // Sous-description / remarque
  qty: number;
  unit?: string;         // "h", "m²", "u", "forfait"
  priceHT: number;
  vatRate: number;       // 0, 5.5, 10, 20
};

export type DocumentCompany = {
  name: string;
  legalForm?: string;    // EI, SARL, SAS…
  address: string;
  postalCode: string;
  city: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  siret?: string;
  vatNumber?: string;    // TVA intracommunautaire
  capital?: string;      // Capital social
  rcs?: string;
  logoBase64?: string;
  // Coordonnées bancaires
  bankName?: string;
  iban?: string;
  bic?: string;
  // Documents
  quotePrefix?: string;
  invoicePrefix?: string;
  paymentTermsDays?: number;
  lateInterestRate?: string;
  recoveryFee?: string;
  footerNote?: string;
  primaryColor?: string;
};

export type DocumentClient = {
  name: string;
  companyName?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  siret?: string;
  vatNumber?: string;
};

export type DocumentData = {
  type: DocumentType;
  number: string;
  date: string;          // ISO
  // Devis : date de validité | Facture : date d'échéance
  dueOrValidUntil?: string;
  // Facture d'acompte
  depositPercent?: number;
  // Avoir
  creditedInvoiceNumber?: string;
  // Référence interne / commande client
  reference?: string;
  // Objet du document
  subject?: string;
  // Adresse de chantier / livraison
  serviceAddress?: string;
  client: DocumentClient;
  items: DocumentLineItem[];
  // Acompte déjà versé (facture finale)
  depositPaid?: number;
  // Notes / conditions particulières
  notes?: string;
  signature?: {
    name: string;
    date: string;
    image?: string;
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

function fmtDate(iso: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type VatGroup = { rate: number; base: number; amount: number };

function computeTotals(items: DocumentLineItem[]) {
  const totalHT = items.reduce((s, l) => s + l.qty * l.priceHT, 0);

  // Regrouper TVA par taux
  const vatMap = new Map<number, VatGroup>();
  for (const line of items) {
    const base = line.qty * line.priceHT;
    const amount = base * (line.vatRate / 100);
    const existing = vatMap.get(line.vatRate);
    if (existing) {
      existing.base += base;
      existing.amount += amount;
    } else {
      vatMap.set(line.vatRate, { rate: line.vatRate, base, amount });
    }
  }

  const vatGroups = [...vatMap.values()].sort((a, b) => b.rate - a.rate);
  const totalVAT = vatGroups.reduce((s, g) => s + g.amount, 0);
  const totalTTC = totalHT + totalVAT;

  return { totalHT, vatGroups, totalVAT, totalTTC };
}


// ─── Composant principal ──────────────────────────────────────────────────────

export type DocumentTemplateProps = {
  doc: DocumentData;
  company: DocumentCompany;
  id?: string;
};

export const DocumentTemplate: FC<DocumentTemplateProps> = ({
  doc,
  company,
  id = "doc-template",
}) => {
  const { totalHT, vatGroups, totalVAT, totalTTC } = computeTotals(doc.items);
  const isInvoice = doc.type === "facture" || doc.type === "acompte" || doc.type === "avoir";
  const docTitle = isInvoice ? "Facture" : "Devis";
  
  // Format the document number nicely
  const docNumStr = doc.number || "";
  
  const resteDu = totalTTC - (doc.depositPaid ?? 0);

  return (
    <>
      <style>{`
        /* ===== RESET & BASE ===== */
        #${id} {
            --doc-text: #1a2d4a;
            --doc-muted: #6b7d99;
            font-family: 'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #ffffff;
            width: 1050px;
            min-height: 1485px;
            box-sizing: border-box;
            position: relative;
            color: var(--doc-text);
            display: flex;
            flex-direction: column;
            /* Reset all margins inside */
        }
        #${id} * {
            box-sizing: border-box;
        }

        /* ===== BANDEAU SUPÉRIEUR ===== */
        #${id} .top-bar {
            background: linear-gradient(135deg, #f8faff 0%, #e8edf5 100%);
            border-bottom: 1px solid #d1dbe8;
            padding: 25px 40px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            min-height: 140px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .logo-area {
            display: flex;
            align-items: center;
            gap: 25px;
            flex-shrink: 0;
        }
        #${id} .logo-placeholder {
            width: 120px;
            height: 120px;
            background: rgba(0,0,0,0.03);
            border: 2px dashed rgba(0,0,0,0.15);
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: rgba(0,0,0,0.4);
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            text-align: center;
            padding: 8px;
            flex-shrink: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .logo-placeholder img {
            max-width: 100%;
            max-height: 110px;
            object-fit: contain;
        }
        
        #${id} .right-header {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            flex: 1;
        }
        #${id} .company-name-header {
            color: #0f1a3a;
            font-size: 26px;
            font-weight: 800;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }
        #${id} .company-sub {
            color: #4a5d7a;
            font-size: 11px;
            font-weight: 500;
            letter-spacing: 0.3px;
        }
        #${id} .badge-devis {
            background: #ffffff;
            padding: 8px 24px;
            border-radius: 30px;
            color: #0f1a3a;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1px;
            border: 1px solid #d1dbe8;
            box-shadow: 0 4px 6px rgba(0,0,0,0.02);
            text-transform: uppercase;
            margin-top: 8px;
            white-space: nowrap;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .badge-devis span {
            color: #e59f00;
        }

        #${id} .content {
            padding: 25px 40px 0;
            flex-grow: 1;
        }

        #${id} .footer-wrapper {
            margin-top: auto;
            padding: 0 40px 20px;
            width: 100%;
            flex-shrink: 0;
        }

        /* ===== TITRE DEVIS ===== */
        #${id} .devis-title {
            text-align: center;
            margin: 0 0 25px;
        }
        #${id} .devis-title h2 {
            margin: 0;
            font-size: 28px;
            font-weight: 800;
            color: #0f1a3a;
            letter-spacing: 3px;
            text-transform: uppercase;
            position: relative;
            display: inline-block;
        }
        #${id} .devis-title h2::after {
            content: '';
            position: absolute;
            bottom: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 50px;
            height: 3px;
            background: linear-gradient(90deg, #ffd700, #f5a623);
            border-radius: 3px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ===== DOUBLE INFO ===== */
        #${id} .double-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0;
            background: #f8faff;
            border-radius: 12px;
            margin-bottom: 25px;
            border: 1px solid #e8edf5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .info-panel {
            padding: 18px 24px;
        }
        #${id} .info-panel:first-child {
            border-right: 1px solid #e0e6ef;
        }
        #${id} .panel-header {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 16px;
            font-weight: 700;
            color: #0f1a3a;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-bottom: 6px;
            border-bottom: 2px solid #e8edf5;
        }
        #${id} .panel-header .highlight {
            color: #ffd700;
            font-size: 14px;
            font-weight: 700;
            background: rgba(255,215,0,0.15);
            padding: 2px 10px;
            border-radius: 10px;
            margin-left: auto;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .info-row {
            display: grid;
            grid-template-columns: 140px 1fr;
            gap: 4px 8px;
            font-size: 16px;
            line-height: 1.6;
        }
        #${id} .info-row .label {
            color: var(--doc-muted);
            font-weight: 500;
        }
        #${id} .info-row .value {
            color: var(--doc-text);
            font-weight: 500;
        }
        #${id} .info-row .value strong {
            color: #0f1a3a;
            font-weight: 700;
        }

        /* ===== META GRID FACTURE / DEVIS ===== */
        #${id} .doc-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            background: #f8faff;
            border-radius: 10px;
            padding: 15px 25px;
            margin-bottom: 25px;
            border: 1px solid #e8edf5;
        }
        #${id} .doc-meta-grid .meta-label {
            font-size: 12px;
            color: #6b7d99;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        #${id} .doc-meta-grid .meta-value {
            font-size: 16px;
            font-weight: 700;
            color: #0f1a3a;
            margin-top: 2px;
        }
        #${id} .badge-status {
            display: inline-block;
            padding: 2px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
        }
        #${id} .badge-status.en-attente {
            background: #fff3cd;
            color: #856404;
            border: 1px solid #ffc107;
        }

        /* ===== TABLEAU ===== */
        #${id} .table-container {
            margin: 20px 0;
            border-radius: 10px;
            overflow: hidden;
            border: 1px solid #e8edf5;
        }
        #${id} table {
            width: 100%;
            border-collapse: collapse;
            font-size: 16px;
        }
        #${id} table thead {
            background: linear-gradient(135deg, #0f1a3a, #1a2d5e);
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} table th {
            padding: 10px 14px;
            text-align: left;
            color: white;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        #${id} table td {
            padding: 10px 14px;
            border-bottom: 1px solid #f0f3f8;
            color: var(--doc-text);
            vertical-align: top;
        }
        #${id} table tr:last-child td {
            border-bottom: none;
        }
        #${id} table .text-right {
            text-align: right;
        }
        #${id} table .text-center {
            text-align: center;
        }
        #${id} .doc-line-desc {
            font-weight: 600;
            color: #0f1a3a;
            font-size: 18px;
            margin-bottom: 2px;
        }
        #${id} .doc-line-detail {
            font-size: 14px;
            color: var(--doc-muted);
        }

        /* ===== TOTAUX ===== */
        #${id} .totals-box {
            display: flex;
            justify-content: flex-end;
            margin-top: 10px;
        }
        #${id} .totals-card {
            background: linear-gradient(135deg, #f8faff, #eef4fc);
            border-radius: 12px;
            padding: 15px 25px;
            min-width: 320px;
            white-space: nowrap;
            border: 1px solid #e0e8f2;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        #${id} .totals-card .line {
            display: flex;
            justify-content: space-between;
            gap: 40px;
            padding: 4px 0;
            font-size: 14px;
            color: var(--doc-text);
        }
        #${id} .totals-card .line.total {
            font-size: 20px;
            font-weight: 800;
            color: #0f1a3a;
            border-top: 2px solid #1e3c72;
            padding-top: 10px;
            margin-top: 6px;
        }
        #${id} .totals-card .line.total .amount {
            color: #1e3c72;
        }
        #${id} .totals-card .line.deposit {
            color: var(--doc-muted);
            font-style: italic;
        }
        #${id} .totals-card .line.due {
            font-size: 15px;
            font-weight: 700;
            color: #166534;
            background: #f0fdf4;
            padding: 6px 8px;
            margin-top: 4px;
            border-radius: 4px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* ===== BAS DE PAGE ===== */
        #${id} .footer-modern {
            display: grid;
            grid-template-columns: 1.6fr 1fr;
            gap: 30px;
            margin-top: 25px;
            padding-top: 20px;
            border-top: 2px solid #eef2f7;
        }
        #${id} .conditions {
            font-size: 12px;
            color: var(--doc-text);
            line-height: 1.6;
        }
        #${id} .conditions strong {
            color: #0f1a3a;
            font-size: 13px;
        }
        #${id} .conditions ul {
            list-style: none;
            padding: 0;
            margin: 4px 0 8px;
        }
        #${id} .conditions ul li::before {
            content: "• ";
            color: #ffd700;
            font-weight: 700;
        }
        #${id} .signature-area {
            text-align: right;
        }
        #${id} .signature-area .sign-block {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            margin-top: 6px;
        }
        #${id} .signature-area .sign-line {
            width: 160px;
            border-bottom: 1.5px solid #1a2d4a;
            padding-bottom: 4px;
            font-size: 14px;
            color: var(--doc-muted);
        }
        #${id} .signature-area .contact-name {
            font-weight: 700;
            color: #0f1a3a;
            font-size: 14px;
        }
        #${id} .signature-area .contact-detail {
            font-size: 14px;
            color: var(--doc-muted);
        }

        /* ===== MENTIONS LÉGALES ===== */
        #${id} .legal-footer {
            margin-top: 20px;
            padding: 10px 0 0;
            border-top: 1px solid #eef2f7;
            font-size: 10px;
            color: #9aabbf;
            text-align: center;
            letter-spacing: 0.3px;
        }
        
        /* ── Watermark brouillon ── */
        #${id} .doc-watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-size: 80pt;
            font-weight: 900;
            color: rgba(0,0,0,0.04);
            pointer-events: none;
            white-space: nowrap;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            z-index: 0;
        }
      `}</style>

      <div id={id}>
        {doc.number.includes("BROUILLON") && (
          <div className="doc-watermark">BROUILLON</div>
        )}
        
        {/* ===== BANDEAU SUPÉRIEUR ===== */}
        <div className="top-bar">
          <div className="logo-area">
            {company.logoBase64 ? (
              <img
                src={company.logoBase64}
                alt="Logo"
                style={{ maxHeight: 110, maxWidth: 160, objectFit: "contain" }}
              />
            ) : (
              <div className="logo-placeholder">
                LOGO<br />
                <span style={{ fontSize: "9px", fontWeight: 400 }}>Votre logo</span>
              </div>
            )}
          </div>
          <div className="right-header">
            <div className="company-name-header">{company.name}</div>
            <div className="company-sub">
              {company.address} {company.postalCode} {company.city}
            </div>
            <div className="company-sub">
              {company.phone && `📞 ${company.phone}`} 
              {company.phone && company.email && " · "} 
              {company.email && `✉ ${company.email}`}
              {(company.phone || company.email) && company.website && " · "}
              {company.website && `🌐 ${company.website}`}
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div className="badge-devis">
                📄 {docTitle} n° <span>{docNumStr}</span>
              </div>
              {doc.signature && (
                <div style={{
                  background: "#10b981",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  ✓ SIGNÉ
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== CONTENU ===== */}
        <div className="content">
          <div className="devis-title">
            <h2>{docTitle}</h2>
          </div>

          {/* ===== DOUBLE INFO ===== */}
          <div className="double-info">
            {/* Émetteur */}
            <div className="info-panel">
              <div className="panel-header">
                <span className="icon">🏢</span> Émetteur
              </div>
              <div className="info-row">
                <span className="label">Nom / Raison sociale</span>
                <span className="value"><strong>{company.name}</strong></span>

                <span className="label">Adresse</span>
                <span className="value">
                  {company.address}<br />
                  {company.postalCode} {company.city}
                </span>

                {company.phone && (
                  <>
                    <span className="label">Téléphone</span>
                    <span className="value">{company.phone}</span>
                  </>
                )}

                {company.email && (
                  <>
                    <span className="label">Email</span>
                    <span className="value">{company.email}</span>
                  </>
                )}

                {company.website && (
                  <>
                    <span className="label">Site web</span>
                    <span className="value">{company.website.replace(/^https?:\/\//, '')}</span>
                  </>
                )}

                {company.siret && (
                  <>
                    <span className="label">SIRET</span>
                    <span className="value">{company.siret}</span>
                  </>
                )}

                {company.vatNumber && (
                  <>
                    <span className="label">TVA intra.</span>
                    <span className="value">{company.vatNumber}</span>
                  </>
                )}
              </div>
            </div>

            {/* Destinataire */}
            <div className="info-panel">
              <div className="panel-header">
                <span className="icon">👤</span> Destinataire
              </div>
              <div className="info-row">
                <span className="label">Nom / Raison sociale</span>
                <span className="value"><strong>{doc.client.name}</strong></span>

                {doc.client.address && (
                  <>
                    <span className="label">Adresse</span>
                    <span className="value">
                      {doc.client.address}
                      {(doc.client.postalCode || doc.client.city) && <br />}
                      {doc.client.postalCode} {doc.client.city}
                    </span>
                  </>
                )}

                {doc.client.phone && (
                  <>
                    <span className="label">Téléphone</span>
                    <span className="value">{doc.client.phone}</span>
                  </>
                )}

                {doc.client.email && (
                  <>
                    <span className="label">Email</span>
                    <span className="value">{doc.client.email}</span>
                  </>
                )}

                {doc.client.siret && (
                  <>
                    <span className="label">SIRET</span>
                    <span className="value">{doc.client.siret}</span>
                  </>
                )}
                
                {doc.client.vatNumber && (
                  <>
                    <span className="label">TVA intra.</span>
                    <span className="value">{doc.client.vatNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ===== INFOS DOCUMENT ===== */}
          <div className="doc-meta-grid">
            <div>
              <div className="meta-label">N° de {doc.type}</div>
              <div className="meta-value">{doc.number}</div>
            </div>
            <div>
              <div className="meta-label">Date d'émission</div>
              <div className="meta-value" style={{ color: "#1a2d4a" }}>{fmtDate(doc.date)}</div>
            </div>
            <div>
              <div className="meta-label">Statut</div>
              <div style={{ marginTop: "2px" }}>
                <span className="badge-status en-attente">⏳ En attente</span>
              </div>
            </div>
            <div>
              <div className="meta-label">
                {isInvoice ? "Date d'échéance" : "Valable jusqu'au"}
              </div>
              <div className="meta-value" style={{ color: "#1a2d4a" }}>
                {doc.dueOrValidUntil ? fmtDate(doc.dueOrValidUntil) : (isInvoice ? "À réception" : "1 mois")}
              </div>
            </div>
            <div>
              <div className="meta-label">Mode de règlement</div>
              <div className="meta-value" style={{ color: "#1a2d4a" }}>Virement / Chèque</div>
            </div>
            <div>
              <div className="meta-label">Délai de paiement</div>
              <div className="meta-value" style={{ color: "#1a2d4a" }}>{company.paymentTermsDays || 30} jours</div>
            </div>
          </div>

          {/* ===== TABLEAU ===== */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40%" }}>Description des prestations</th>
                  <th style={{ width: "10%" }} className="text-center">Qté</th>
                  <th style={{ width: "10%" }} className="text-center">Unité</th>
                  <th style={{ width: "14%" }} className="text-right">Prix Unit. HT</th>
                  <th style={{ width: "10%" }} className="text-right">TVA</th>
                  <th style={{ width: "16%" }} className="text-right">Total HT</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((line) => {
                  const lineTotalHT = line.qty * line.priceHT;
                  return (
                    <tr key={line.id}>
                      <td>
                        <div className="doc-line-desc">{line.description}</div>
                        {line.detail && (
                          <div className="doc-line-detail">{line.detail}</div>
                        )}
                      </td>
                      <td className="text-center">{line.qty}</td>
                      <td className="text-center">{line.unit ?? "u"}</td>
                      <td className="text-right">{fmt(line.priceHT)} €</td>
                      <td className="text-right">{line.vatRate} %</td>
                      <td className="text-right">{fmt(lineTotalHT)} €</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div> {/* Fin de .content */}

        <div className="footer-wrapper">
          {/* ===== TOTAUX ===== */}
            <div className="totals-box">
              <div className="totals-card">
                <div className="line">
                  <span>Sous-total HT</span>
                  <span>{fmt(totalHT)} €</span>
                </div>
                
                {vatGroups.map((g) => (
                  <div className="line" key={g.rate}>
                    <span>TVA ({g.rate}%)</span>
                    <span>{fmt(g.amount)} €</span>
                  </div>
                ))}
                
                <div className="line total">
                  <span>Total TTC</span>
                  <span className="amount">{fmt(totalTTC)} €</span>
                </div>

                {doc.depositPaid != null && doc.depositPaid > 0 && (
                  <>
                    <div className="line deposit">
                      <span>Acompte versé</span>
                      <span>− {fmt(doc.depositPaid)} €</span>
                    </div>
                    <div className="line due">
                      <span>Reste à payer</span>
                      <span>{fmt(resteDu)} €</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ===== BAS DE PAGE ===== */}
            <div className="footer-modern">
              <div className="conditions">
                <strong>📌 Conditions de règlement</strong>
                <ul>
                  <li>
                    {company.paymentTermsDays 
                      ? `Paiement à ${company.paymentTermsDays} jours.` 
                      : "Paiement à réception."}
                  </li>
                  {company.lateInterestRate && (
                    <li>Pénalités de retard : {company.lateInterestRate}% annuel.</li>
                  )}
                  {company.recoveryFee && (
                    <li>Indemnité forfaitaire de recouvrement : {company.recoveryFee}.</li>
                  )}
                </ul>
                
                {company.iban && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>🏦 Coordonnées bancaires</strong><br/>
                    IBAN : {company.iban} {company.bic && `— BIC : ${company.bic}`}
                  </div>
                )}
                
                {doc.notes && (
                  <div style={{ marginTop: "10px" }}>
                    <strong>📝 Notes particulières</strong><br/>
                    {doc.notes}
                  </div>
                )}
              </div>
              
              <div className="signature-area">
                {!isInvoice && (
                  <>
                    <div><strong>🗂 Cachet & signature du client</strong></div>
                    {doc.signature ? (
                      <div
                        className="sign-block"
                        style={{
                          border: "1px solid #10b981", // emerald-500
                          borderRadius: "8px",
                          marginTop: "10px",
                          padding: "16px",
                          backgroundColor: "#f0fdf4", // emerald-50
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px"
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: "bold", color: "#047857" }}>
                          ✓ Devis accepté et signé
                        </span>
                        <span style={{ fontSize: "11px", color: "#065f46" }}>
                          Signé par : <strong>{doc.signature.name}</strong>
                        </span>
                        <span style={{ fontSize: "11px", color: "#065f46" }}>
                          Le : {fmtDate(doc.signature.date)}
                        </span>
                        {doc.signature.image && (
                          <div style={{ marginTop: "8px", width: "100%", maxWidth: "200px" }}>
                            <img 
                              src={doc.signature.image} 
                              alt="Signature" 
                              style={{ width: "100%", height: "auto", mixBlendMode: "multiply", borderBottom: "1px solid #10b981", paddingBottom: "4px" }} 
                            />
                          </div>
                        )}
                        <span style={{ fontSize: "10px", color: "#059669", marginTop: "4px", fontStyle: "italic" }}>
                          "Bon pour accord"
                        </span>
                      </div>
                    ) : (
                      <div 
                        className="sign-block" 
                        style={{ 
                          border: "1px dashed #9aabbf", 
                          borderRadius: "8px", 
                          height: "100px", 
                          marginTop: "10px", 
                          padding: "10px", 
                          backgroundColor: "rgba(255,255,255,0.5)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-start",
                          justifyContent: "flex-end"
                        }}
                      >
                        <span style={{ fontSize: "11px", fontWeight: "600", color: "#0f1a3a", borderBottom: "1px solid #1a2d4a", paddingBottom: "2px", width: "100%" }}>
                          Date et signature
                        </span>
                        <span style={{ fontSize: "9px", color: "var(--doc-muted)", marginTop: "4px" }}>
                          Précédé de la mention "Bon pour accord"
                        </span>
                      </div>
                    )}
                  </>
                )}
                <div style={{ marginTop: "18px", paddingTop: "12px", borderTop: "1px solid #eef2f7", width: "100%", textAlign: "right" }}>
                  <div className="contact-name">{company.name}</div>
                  {doc.date && <div className="contact-detail">Fait le {fmtDate(doc.date)}</div>}
                  {doc.dueOrValidUntil && (
                    <div className="contact-detail">
                      {isInvoice ? "Échéance au" : "Valable jusqu'au"} {fmtDate(doc.dueOrValidUntil)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== MENTIONS LÉGALES ===== */}
            <div className="legal-footer">
              {company.name} {company.legalForm && `(${company.legalForm})`}
              {company.capital && ` au capital de ${company.capital}`}
              {company.rcs && ` · RCS ${company.rcs}`}
              {company.siret && ` · SIRET ${company.siret}`}
              {company.vatNumber && ` · N° TVA ${company.vatNumber}`}
              <br />
              {company.footerNote || "Document généré par Devizia"}
            </div>
          </div>
      </div>
    </>
  );
};
