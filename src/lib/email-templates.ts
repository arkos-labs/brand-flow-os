import { Quote, CompanySettings } from "./data-context";

export function generateQuoteEmailHtml(quote: Quote, company: CompanySettings, templateId: string = "modele-1"): string {
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };
  
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  };

  const totalHT = quote.details?.items.reduce((acc, item) => acc + (Number(item.priceHT) * Number(item.qty)), 0) || 0;
  const tvaAmount = quote.amount - totalHT;

  if (templateId === "modele-relance") {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; }
        .header { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        ${company.logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 50px;" /></div>` : ''}
        <div class="header">Relance : Devis ${quote.number} en attente</div>
        <p>Bonjour <strong>${quote.client}</strong>,</p>
        <p>Sauf erreur de notre part, nous n'avons pas encore reçu votre validation pour le devis <strong>${quote.number}</strong> d'un montant de <strong>${formatMoney(quote.amount)} TTC</strong>.</p>
        <p>Ce devis arrive bientôt à expiration. Si vous avez des questions ou souhaitez apporter des modifications, n'hésitez pas à nous contacter.</p>
        <a href="http://localhost:5173/portail/${quote.number}" class="btn">Consulter et signer le devis</a>
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Cordialement,<br>${company.name || "L'équipe"}</p>
    </div>
</body>
</html>`;
  }

  if (templateId === "modele-merci") {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; }
        .container { max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; border-top: 4px solid #10b981; }
        .header { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        ${company.logoBase64 ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 50px;" /></div>` : ''}
        <div class="header">Merci pour votre confiance !</div>
        <p>Bonjour <strong>${quote.client}</strong>,</p>
        <p>Nous vous remercions pour la signature du devis <strong>${quote.number}</strong>.</p>
        <p>Notre équipe va commencer à préparer l'intervention. Vous recevrez très prochainement votre facture ou une demande d'acompte (le cas échéant).</p>
        <a href="http://localhost:5173/portail/${quote.number}" class="btn">Accéder à mon espace client</a>
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8;">Cordialement,<br>${company.name || "L'équipe"}</p>
    </div>
</body>
</html>`;
  }

  // Fallback to "modele-1" (Devis complet)
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { box-sizing: border-box; }
        @page {
            size: A4;
            margin: 15mm;
            background-color: #f8f9fa;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #212529;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            background-color: #f8f9fa;
        }
        
        /* HEADER FULL BLEED */
        .header {
            background-color: #0f172a;
            color: #ffffff;
            margin: -15mm -15mm 25px -15mm;
            padding: 25px 15mm;
            display: table;
            width: 100%;
        }
        .header-left {
            display: table-cell;
            vertical-align: middle;
            width: 50%;
        }
        .header-right {
            display: table-cell;
            vertical-align: middle;
            text-align: right;
            width: 50%;
        }
        .logo-container {
            margin-bottom: 8px;
            min-height: 60px;
        }
        .company-logo {
            max-width: 180px;
            max-height: 60px;
            object-fit: contain;
            display: block;
        }
        .company-siret {
            font-size: 9pt;
            color: #94a3b8;
        }
        .doc-title {
            font-size: 26pt;
            font-weight: bold;
            letter-spacing: 2px;
            color: #38bdf8;
            margin: 0 0 5px 0;
            text-transform: uppercase;
        }
        .doc-meta {
            font-size: 10pt;
            color: #cbd5e1;
            line-height: 1.4;
        }

        /* MAIN CONTENT AREA */
        .main-container {
            background-color: #ffffff;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border: 1px solid #e2e8f0;
        }

        /* ADDRESSES */
        .address-section {
            display: table;
            width: 100%;
            margin-bottom: 35px;
        }
        .address-col {
            display: table-cell;
            width: 50%;
            vertical-align: top;
        }
        .address-box {
            padding-right: 20px;
        }
        .address-box-client {
            background-color: #f0f9ff;
            padding: 15px;
            border-left: 4px solid #0ea5e9;
            border-radius: 4px;
        }
        .label {
            font-size: 8pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
        }
        .address-text {
            font-size: 11pt;
            line-height: 1.5;
            color: #334155;
        }
        .bold { font-weight: bold; color: #0f172a; }

        /* TABLE */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        th {
            font-size: 9pt;
            font-weight: bold;
            color: #64748b;
            text-transform: uppercase;
            text-align: left;
            padding: 10px 10px 10px 0;
            border-bottom: 2px solid #0f172a;
        }
        th.right, td.right { text-align: right; padding-right: 0; }
        td {
            padding: 15px 10px 15px 0;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: top;
        }
        .item-name {
            font-weight: bold;
            font-size: 11pt;
            color: #0f172a;
            margin-bottom: 4px;
        }
        .item-desc {
            font-size: 9pt;
            color: #64748b;
        }

        /* TOTALS */
        .totals-wrapper {
            display: table;
            width: 100%;
            margin-bottom: 40px;
        }
        .totals-spacer { display: table-cell; width: 50%; }
        .totals-box { display: table-cell; width: 50%; }
        .total-row {
            display: table;
            width: 100%;
            padding: 8px 0;
            font-size: 11pt;
        }
        .total-label { display: table-cell; text-align: left; color: #64748b; }
        .total-val { display: table-cell; text-align: right; font-weight: bold; color: #334155;}
        
        .total-ttc-row {
            display: table;
            width: 100%;
            background-color: #0f172a;
            color: #ffffff;
            padding: 12px 15px;
            margin-top: 10px;
            border-radius: 4px;
        }
        .total-ttc-label { display: table-cell; text-align: left; font-weight: bold; font-size: 12pt; }
        .total-ttc-val { display: table-cell; text-align: right; font-weight: bold; font-size: 14pt; color: #38bdf8; }

        /* SIGNATURE */
        .signature-section {
            display: table;
            width: 100%;
            margin-top: 20px;
        }
        .sig-box {
            display: table-cell;
            width: 100%;
            border: 1px solid #e2e8f0;
            background-color: #fafaf9;
            padding: 20px;
            border-radius: 6px;
        }
        .sig-header {
            font-weight: bold;
            color: #0f172a;
            font-size: 11pt;
            margin-bottom: 5px;
        }
        .sig-legal {
            font-size: 8pt;
            color: #64748b;
            margin-bottom: 40px;
            line-height: 1.4;
        }
        .sig-fields {
            display: table;
            width: 100%;
        }
        .sig-field {
            display: table-cell;
            width: 50%;
            font-weight: bold;
            color: #94a3b8;
            font-size: 9pt;
        }

        /* FOOTER */
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 8pt;
            color: #94a3b8;
            line-height: 1.5;
        }
    </style>
</head>
<body>

    <div class="header">
        <div class="header-left">
            <div class="logo-container">
                ${company.logoBase64 ? `<img class="company-logo" src="${company.logoBase64}" alt="Logo">` : `<h1 class="company-name" style="margin: 0; font-size: 22pt; color: white;">${company.name || "MON ENTREPRISE"}</h1>`}
            </div>
            <div class="company-siret">SIRET : ${company.siret || ""} &bull; TVA : ${company.vatNumber || ""}</div>
        </div>
        <div class="header-right">
            <h2 class="doc-title">DEVIS</h2>
            <div class="doc-meta">
                Réf : <strong>${quote.number}</strong><br>
                Date : ${formatDate(quote.date)}
            </div>
        </div>
    </div>

    <div class="main-container">
        
        <div class="address-section">
            <div class="address-col">
                <div class="address-box">
                    <div class="label">Émetteur</div>
                    <div class="address-text">
                        <span class="bold">${company.name || "Mon Entreprise SAS"}</span><br>
                        ${company.address || ""}<br>
                        ${company.postalCode || ""} ${company.city || ""}<br>
                        ${company.email || ""}
                    </div>
                </div>
            </div>
            <div class="address-col">
                <div class="address-box-client">
                    <div class="label">Client</div>
                    <div class="address-text">
                        <span class="bold">${quote.client}</span><br>
                        ${quote.details?.address || ""}<br>
                    </div>
                </div>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Désignation</th>
                    <th class="right" style="width: 10%;">Qté</th>
                    <th class="right" style="width: 25%;">Prix Unitaire HT</th>
                    <th class="right" style="width: 25%;">Total HT</th>
                </tr>
            </thead>
            <tbody>
                ${quote.details?.items.filter(i => i.label).map(item => `
                <tr>
                    <td>
                        <div class="item-name">${item.label}</div>
                    </td>
                    <td class="right">${item.qty}</td>
                    <td class="right">${formatMoney(Number(item.priceHT))}</td>
                    <td class="right">${formatMoney(Number(item.priceHT) * Number(item.qty))}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>

        <div class="totals-wrapper">
            <div class="totals-spacer"></div>
            <div class="totals-box">
                <div class="total-row">
                    <div class="total-label">Total HT</div>
                    <div class="total-val">${formatMoney(quote.details?.totalHT || quote.amount)}</div>
                </div>
                <div class="total-row">
                    <div class="total-label">TVA (${quote.details?.vatRate || 20}%)</div>
                    <div class="total-val">${formatMoney((quote.details?.totalTTC || quote.amount) - (quote.details?.totalHT || quote.amount))}</div>
                </div>
                <div class="total-ttc-row">
                    <div class="total-ttc-label">TOTAL TTC</div>
                    <div class="total-ttc-val">${formatMoney(quote.details?.totalTTC || quote.amount)}</div>
                </div>
            </div>
        </div>

        <div class="signature-section">
            <div class="sig-box">
                <div class="sig-header">Accord et Signature</div>
                <div class="sig-legal">En signant ce devis, le client accepte les Conditions Générales de Vente sans réserve.<br>Document valable jusqu'au ${formatDate(quote.date)}.</div>
                <div class="sig-fields">
                    <div class="sig-field">Fait à : ..........................................<br><br>Date : ..........................................</div>
                    <div class="sig-field" style="text-align:right; padding-right:20px;">Signature du client :</div>
                </div>
            </div>
        </div>

    </div>

    <div class="footer">
        ${company.name || "Entreprise"} - RCS ${company.siret || ""}<br>
        En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.
    </div>

</body>
</html>
  `;
}
