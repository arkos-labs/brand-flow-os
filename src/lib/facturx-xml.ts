/**
 * Générateur XML Factur-X (CII — Cross-Industry Invoice)
 * Profil : EN16931 (conforme Factur-X 1.0)
 * Standard : UN/CEFACT CII D16B + EN 16931-1:2017
 *
 * Références légales :
 *  - Ordonnance n° 2014-697 du 26 juin 2014 (facturation électronique B2G)
 *  - Loi de finances 2024 (généralisation B2B à partir de 2026)
 *  - Décret n° 2022-1299 du 7 octobre 2022
 *  - Spécification Factur-X v1.0 EN16931 — FNFE/AIFE
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type FxSeller = {
  name: string;
  legalForm?: string;
  siret?: string;
  vatNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
  capital?: string;
  rcs?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
};

export type FxBuyer = {
  name: string;
  type?: "pro" | "particulier";
  siret?: string;
  vatNumber?: string;
  address?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  email?: string;
  phone?: string;
};

export type FxLineItem = {
  lineNumber: number;
  description: string;
  qty: number;
  unitPrice: number; // HT
  vatRate: number;   // ex: 20, 10, 5.5, 0
  total: number;     // HT
};

export type FxDocument = {
  type: "invoice" | "quote";
  number: string;
  issueDate: string;   // YYYY-MM-DD
  dueDate?: string;    // YYYY-MM-DD (factures seulement)
  currency: "EUR";
  seller: FxSeller;
  buyer: FxBuyer;
  lines: FxLineItem[];
  vatRate: number;
  totalHT: number;
  totalVAT: number;
  totalTTC: number;
  paymentTermsDays?: number;
  lateInterestRate?: string;
  recoveryFee?: string;
  footerNote?: string;
  notes?: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Formate une date ISO → format 102 (YYYYMMDD) utilisé dans CII */
function yyyymmdd(iso: string): string {
  return iso.replace(/-/g, "");
}

/** 2 décimales fixes */
function n(v: number): string {
  return v.toFixed(2);
}

/** Échappe les caractères XML */
function x(s: string | undefined | null): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Code pays ISO 3166-1 alpha-2 */
function countryCode(c: string | undefined): string {
  if (!c) return "FR";
  const map: Record<string, string> = {
    France: "FR", "États-Unis": "US", "United States": "US",
    "Royaume-Uni": "GB", "United Kingdom": "GB", Allemagne: "DE",
    Germany: "DE", Belgique: "BE", Belgium: "BE", Suisse: "CH",
    Switzerland: "CH", Luxembourg: "LU", Italie: "IT", Italy: "IT",
    Espagne: "ES", Spain: "ES", "Pays-Bas": "NL", Netherlands: "NL",
  };
  return map[c] ?? (c.length === 2 ? c.toUpperCase() : "FR");
}

/** Catégorie TVA EN16931 */
function vatCategory(rate: number): string {
  if (rate === 0) return "Z"; // TVA nulle / exonération
  return "S"; // Taux standard
}

// ── Générateur principal ──────────────────────────────────────────────────────

export function generateFacturxXml(doc: FxDocument): string {
  const isInvoice = doc.type === "invoice";

  // TypeCode: 380 = Commercial Invoice, 84 = Devis/Pro-forma
  const typeCode = isInvoice ? "380" : "84";

  // Profile URI Factur-X EN16931
  const profileId = "urn:cen.eu:en16931:2017#conformant#urn:factur-x.eu:1p0:en16931";

  // ── Lignes de document ────────────────────────────────────────────────────
  const linesXml = doc.lines
    .map((line) => `
    <ram:IncludedSupplyChainTradeLineItem>
      <ram:AssociatedDocumentLineDocument>
        <ram:LineID>${line.lineNumber}</ram:LineID>
      </ram:AssociatedDocumentLineDocument>
      <ram:SpecifiedTradeProduct>
        <ram:Name>${x(line.description)}</ram:Name>
      </ram:SpecifiedTradeProduct>
      <ram:SpecifiedLineTradeAgreement>
        <ram:NetPriceProductTradePrice>
          <ram:ChargeAmount>${n(line.unitPrice)}</ram:ChargeAmount>
        </ram:NetPriceProductTradePrice>
      </ram:SpecifiedLineTradeAgreement>
      <ram:SpecifiedLineTradeDelivery>
        <ram:BilledQuantity unitCode="C62">${n(line.qty)}</ram:BilledQuantity>
      </ram:SpecifiedLineTradeDelivery>
      <ram:SpecifiedLineTradeSettlement>
        <ram:ApplicableTradeTax>
          <ram:TypeCode>VAT</ram:TypeCode>
          <ram:CategoryCode>${vatCategory(line.vatRate)}</ram:CategoryCode>
          <ram:RateApplicablePercent>${n(line.vatRate)}</ram:RateApplicablePercent>
        </ram:ApplicableTradeTax>
        <ram:SpecifiedTradeSettlementLineMonetarySummation>
          <ram:LineTotalAmount>${n(line.total)}</ram:LineTotalAmount>
        </ram:SpecifiedTradeSettlementLineMonetarySummation>
      </ram:SpecifiedLineTradeSettlement>
    </ram:IncludedSupplyChainTradeLineItem>`)
    .join("\n");

  // ── Vendeur ───────────────────────────────────────────────────────────────
  const sellerXml = `
      <ram:SellerTradeParty>
        <ram:Name>${x(doc.seller.name)}</ram:Name>
        ${doc.seller.siret ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${x(doc.seller.siret)}</ram:ID>
          ${doc.seller.legalForm ? `<ram:TradingBusinessName>${x(doc.seller.legalForm)}</ram:TradingBusinessName>` : ""}
        </ram:SpecifiedLegalOrganization>` : ""}
        ${doc.seller.email ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${x(doc.seller.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ""}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${x(doc.seller.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${x(doc.seller.address)}</ram:LineOne>
          <ram:CityName>${x(doc.seller.city)}</ram:CityName>
          <ram:CountryID>${countryCode(doc.seller.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${doc.seller.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${x(doc.seller.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ""}
      </ram:SellerTradeParty>`;

  // ── Acheteur ──────────────────────────────────────────────────────────────
  const buyerXml = `
      <ram:BuyerTradeParty>
        <ram:Name>${x(doc.buyer.name)}</ram:Name>
        ${doc.buyer.siret ? `<ram:SpecifiedLegalOrganization>
          <ram:ID schemeID="0002">${x(doc.buyer.siret)}</ram:ID>
        </ram:SpecifiedLegalOrganization>` : ""}
        ${doc.buyer.email ? `<ram:URIUniversalCommunication>
          <ram:URIID schemeID="EM">${x(doc.buyer.email)}</ram:URIID>
        </ram:URIUniversalCommunication>` : ""}
        <ram:PostalTradeAddress>
          <ram:PostcodeCode>${x(doc.buyer.postalCode)}</ram:PostcodeCode>
          <ram:LineOne>${x(doc.buyer.address)}</ram:LineOne>
          <ram:CityName>${x(doc.buyer.city)}</ram:CityName>
          <ram:CountryID>${countryCode(doc.buyer.country)}</ram:CountryID>
        </ram:PostalTradeAddress>
        ${doc.buyer.vatNumber ? `<ram:SpecifiedTaxRegistration>
          <ram:ID schemeID="VA">${x(doc.buyer.vatNumber)}</ram:ID>
        </ram:SpecifiedTaxRegistration>` : ""}
      </ram:BuyerTradeParty>`;

  // ── Règlement / paiement ──────────────────────────────────────────────────
  const paymentTermsXml = doc.dueDate
    ? `
      <ram:SpecifiedTradePaymentTerms>
        <ram:Description>${x(`Paiement à ${doc.paymentTermsDays ?? 30} jours — Pénalités de retard : ${doc.lateInterestRate ?? "10.5"}% — Indemnité forfaitaire de recouvrement : ${doc.recoveryFee ?? "40"} €`)}</ram:Description>
        <ram:DueDateDateTime>
          <udt:DateTimeString format="102">${yyyymmdd(doc.dueDate)}</udt:DateTimeString>
        </ram:DueDateDateTime>
      </ram:SpecifiedTradePaymentTerms>`
    : "";

  // Coordonnées bancaires (si disponibles, pour BankTransfer)
  const creditorXml =
    doc.seller.iban
      ? `
      <ram:SpecifiedTradeSettlementPaymentMeans>
        <ram:TypeCode>30</ram:TypeCode>
        <ram:PayeePartyCreditorFinancialAccount>
          <ram:IBANID>${x(doc.seller.iban)}</ram:IBANID>
        </ram:PayeePartyCreditorFinancialAccount>
        ${doc.seller.bic ? `<ram:PayeeSpecifiedCreditorFinancialInstitution>
          <ram:BICID>${x(doc.seller.bic)}</ram:BICID>
        </ram:PayeeSpecifiedCreditorFinancialInstitution>` : ""}
      </ram:SpecifiedTradeSettlementPaymentMeans>`
      : "";

  // ── Note de bas (mentions légales) ───────────────────────────────────────
  const noteXml = doc.notes
    ? `
    <ram:IncludedNote>
      <ram:Content>${x(doc.notes)}</ram:Content>
    </ram:IncludedNote>`
    : "";

  // ── Assemblage final ──────────────────────────────────────────────────────
  return `<?xml version="1.0" encoding="UTF-8"?>
<!--
  Document Factur-X (EN16931) — généré par InvoicePro
  Date de génération : ${new Date().toISOString()}
  Numéro : ${x(doc.number)}
  Conforme : Factur-X v1.0 / EN 16931-1:2017 / CII D16B
-->
<rsm:CrossIndustryInvoice
  xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100"
  xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100"
  xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100"
  xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

  <!-- §1 — Contexte du document -->
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>${profileId}</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>

  <!-- §2 — En-tête du document -->
  <rsm:ExchangedDocument>
    <ram:ID>${x(doc.number)}</ram:ID>
    <ram:TypeCode>${typeCode}</ram:TypeCode>
    <ram:IssueDateTime>
      <udt:DateTimeString format="102">${yyyymmdd(doc.issueDate)}</udt:DateTimeString>
    </ram:IssueDateTime>${noteXml}
  </rsm:ExchangedDocument>

  <!-- §3 — Transaction commerciale -->
  <rsm:SupplyChainTradeTransaction>

    <!-- §3.1 — Lignes -->
    ${linesXml}

    <!-- §3.2 — Accord commercial (vendeur / acheteur) -->
    <ram:ApplicableHeaderTradeAgreement>
      ${sellerXml}
      ${buyerXml}
    </ram:ApplicableHeaderTradeAgreement>

    <!-- §3.3 — Livraison -->
    <ram:ApplicableHeaderTradeDelivery/>

    <!-- §3.4 — Règlement -->
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${doc.currency}</ram:InvoiceCurrencyCode>
      ${creditorXml}
      <ram:ApplicableTradeTax>
        <ram:CalculatedAmount>${n(doc.totalVAT)}</ram:CalculatedAmount>
        <ram:TypeCode>VAT</ram:TypeCode>
        <ram:BasisAmount>${n(doc.totalHT)}</ram:BasisAmount>
        <ram:CategoryCode>${vatCategory(doc.vatRate)}</ram:CategoryCode>
        <ram:RateApplicablePercent>${n(doc.vatRate)}</ram:RateApplicablePercent>
      </ram:ApplicableTradeTax>
      ${paymentTermsXml}
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${n(doc.totalHT)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${n(doc.totalHT)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${doc.currency}">${n(doc.totalVAT)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${n(doc.totalTTC)}</ram:GrandTotalAmount>
        <ram:DuePayableAmount>${n(doc.totalTTC)}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>

  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>`;
}

// ── Téléchargement XML ────────────────────────────────────────────────────────

export function downloadXml(xmlString: string, filename: string): void {
  const blob = new Blob([xmlString], { type: "application/xml;charset=UTF-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
