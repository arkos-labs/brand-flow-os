import { Quote, Invoice, CompanySettings } from "./data-context";

export function generateQuoteEmailHtml(quote: Quote, company: CompanySettings, templateId: string = "modele-1", baseUrl: string = "", orgId: string = ""): string {
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
  
  const qData = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(quote)))));
  const cData = encodeURIComponent(btoa(unescape(encodeURIComponent(JSON.stringify(company)))));
  
  // Le lien utilise le token public du devis (UUID aléatoire, impossible à
  // deviner) plutôt que son numéro (séquentiel, devinable) — voir /api/quotes/*.
  const portalId = quote.publicToken || quote.number;
  const portalUrl = baseUrl ? `${baseUrl}/portail/${portalId}?q=${qData}&c=${cData}&org=${orgId}` : `https://brand-flow-os-opal.vercel.app/portail/${portalId}?q=${qData}&c=${cData}&org=${orgId}`;

  if (templateId === "modele-relance") {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8f9fa; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #ef4444; }
        .header { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        ${company.logoBase64 ? `<div style="text-align: left; margin-bottom: 30px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 50px;" /></div>` : ''}
        <div class="header">Relance : Devis ${quote.number} en attente</div>
        <p>Bonjour <strong>${quote.client}</strong>,</p>
        <p>Sauf erreur de notre part, nous n'avons pas encore reçu votre validation pour le devis <strong>${quote.number}</strong> d'un montant de <strong>${formatMoney(quote.amount)} TTC</strong>.</p>
        <p>Ce devis arrive bientôt à expiration. Vous le trouverez en pièce jointe de cet e-mail. Si vous avez des questions ou souhaitez apporter des modifications, n'hésitez pas à nous contacter.</p>
        <p>Si vous êtes d'accord avec cette proposition, vous pouvez consulter et signer électroniquement le devis en ligne en cliquant sur le bouton ci-dessous :</p>
        <div style="text-align: center;">
            <a href="${portalUrl}" class="btn">Consulter et signer le devis</a>
        </div>
        <p style="margin-top: 30px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">Cordialement,<br><strong>${company.name || "L'équipe"}</strong><br>${company.phone || ""}</p>
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
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8f9fa; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border-top: 4px solid #10b981; }
        .header { font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px; }
        .btn { display: inline-block; background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; margin-bottom: 20px; font-weight: bold; font-size: 16px; }
    </style>
</head>
<body>
    <div class="container">
        ${company.logoBase64 ? `<div style="text-align: left; margin-bottom: 30px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 50px;" /></div>` : ''}
        <div class="header">Merci pour votre confiance !</div>
        <p>Bonjour <strong>${quote.client}</strong>,</p>
        <p>Nous vous remercions pour la signature du devis <strong>${quote.number}</strong>.</p>
        <p>Notre équipe va commencer à préparer l'intervention. Vous recevrez très prochainement votre facture ou une demande d'acompte (le cas échéant). Une copie de votre devis signé est jointe à cet e-mail.</p>
        <div style="text-align: center;">
            <a href="${portalUrl}" class="btn">Accéder à mon espace client</a>
        </div>
        <p style="margin-top: 30px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">Cordialement,<br><strong>${company.name || "L'équipe"}</strong><br>${company.phone || ""}</p>
    </div>
</body>
</html>`;
  }

  // STANDARD QUOTE TEMPLATE
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8f9fa; padding: 20px; margin: 0; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); border-top: 4px solid #0f172a; }
        .header { font-size: 22px; font-weight: bold; color: #0f172a; margin-bottom: 25px; }
        .btn { display: inline-block; background-color: #0f172a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin-top: 25px; margin-bottom: 25px; font-weight: bold; font-size: 16px; transition: background-color 0.2s; }
        .btn:hover { background-color: #1e293b; }
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .summary-label { color: #64748b; font-size: 14px; }
        .summary-val { font-weight: bold; color: #0f172a; }
        .summary-total { font-size: 18px; color: #38bdf8; font-weight: bold; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0; }
    </style>
</head>
<body>
    <div class="container">
        ${company.logoBase64 ? `<div style="text-align: left; margin-bottom: 35px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 55px;" /></div>` : ''}
        
        <div class="header">Votre devis ${quote.number}</div>
        
        <p>Bonjour <strong>${quote.client}</strong>,</p>
        <p>Veuillez trouver ci-joint notre proposition commerciale concernant votre projet.</p>
        
        <div class="summary-box">
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 15px;">
                <tr>
                    <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Date du devis</td>
                    <td style="text-align: right; font-weight: bold; color: #0f172a; padding-bottom: 8px;">${formatDate(quote.date)}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-size: 14px; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">Valable jusqu'au</td>
                    <td style="text-align: right; font-weight: bold; color: #0f172a; padding-bottom: 15px; border-bottom: 1px solid #e2e8f0;">${formatDate(new Date(new Date(quote.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}</td>
                </tr>
                <tr>
                    <td style="color: #64748b; font-size: 14px; padding-top: 15px;">Montant HT</td>
                    <td style="text-align: right; font-weight: bold; color: #0f172a; padding-top: 15px;">${formatMoney(quote.details?.totalHT || quote.amount)}</td>
                </tr>
                <tr>
                    <td style="color: #0f172a; font-size: 18px; font-weight: bold; padding-top: 15px;">TOTAL TTC</td>
                    <td style="text-align: right; font-weight: bold; font-size: 20px; color: #38bdf8; padding-top: 15px;">${formatMoney(quote.details?.totalTTC || quote.amount)}</td>
                </tr>
            </table>
        </div>

        <p>Vous trouverez le détail complet des prestations dans le document PDF en pièce jointe.</p>
        
        <p>Si cette proposition vous convient, vous pouvez consulter et <strong>signer le devis électroniquement</strong> de manière sécurisée en cliquant sur le bouton ci-dessous :</p>
        
        <div style="text-align: center;">
            <a href="${portalUrl}" class="btn">Consulter et signer le devis</a>
        </div>
        
        <p style="margin-top: 35px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5;">
            Cordialement,<br>
            <strong style="color: #334155;">${company.name || "L'équipe"}</strong><br>
            ${company.phone ? `${company.phone}<br>` : ''}
            ${company.email ? `${company.email}` : ''}
        </p>
    </div>
</body>
</html>
  `;
}

export function generateInvoiceEmailHtml(
  invoice: Invoice,
  company: CompanySettings,
  templateId: string = "modele-1",
): string {
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

  const totalHT = invoice.totalHT ?? Math.round((invoice.amount / 1.2) * 100) / 100;
  const totalVAT = invoice.totalVAT ?? (invoice.amount - totalHT);
  const isLate = invoice.status === "late" || invoice.status === "overdue";

  if (templateId === "modele-relance") {
    return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8f9fa; padding: 20px; margin: 0; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #ef4444; }
  .btn { display: inline-block; background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 15px; }
</style>
</head>
<body>
  <div class="container">
    ${company.logoBase64 ? `<div style="margin-bottom: 30px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 50px;" /></div>` : ''}
    <div style="font-size: 20px; font-weight: bold; color: #0f172a; margin-bottom: 20px;">⚠️ Relance — Facture ${invoice.number} impayée</div>
    <p>Bonjour <strong>${invoice.client}</strong>,</p>
    <p>Sauf erreur de notre part, la facture <strong>${invoice.number}</strong> d'un montant de <strong>${formatMoney(invoice.amount)} TTC</strong>, échue le <strong>${formatDate(invoice.due)}</strong>, n'a pas encore été réglée.</p>
    <p>Nous vous invitons à régulariser cette situation dans les meilleurs délais. La facture est jointe à cet email.</p>
    <p>Si le paiement a déjà été effectué, merci d'ignorer ce message ou de nous en informer.</p>
    <p style="margin-top: 30px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
      Cordialement,<br><strong>${company.name || "L'équipe"}</strong><br>${company.phone || ""}
    </p>
  </div>
</body>
</html>`;
  }

  // MODELE STANDARD
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #334155; line-height: 1.6; background-color: #f8f9fa; padding: 20px; margin: 0; }
  .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border: 1px solid #e2e8f0; border-radius: 12px; border-top: 4px solid #0f172a; }
  .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
  .iban-box { background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0; }
</style>
</head>
<body>
  <div class="container">
    ${company.logoBase64 ? `<div style="margin-bottom: 35px;"><img src="${company.logoBase64}" alt="Logo" style="max-height: 55px;" /></div>` : ''}
    <div style="font-size: 22px; font-weight: bold; color: #0f172a; margin-bottom: 20px;">Votre facture ${invoice.number}</div>
    <p>Bonjour <strong>${invoice.client}</strong>,</p>
    <p>Veuillez trouver ci-joint votre facture pour les prestations réalisées. Retrouvez le détail complet dans le document PDF en pièce jointe.</p>

    <div class="summary-box">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Date de facturation</td>
          <td style="text-align: right; font-weight: bold; color: #0f172a; padding-bottom: 8px;">${formatDate(invoice.date)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px;">Date d'échéance</td>
          <td style="text-align: right; font-weight: bold; color: ${isLate ? '#ef4444' : '#0f172a'}; padding-bottom: 8px;">${formatDate(invoice.due)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-size: 14px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">Montant HT</td>
          <td style="text-align: right; font-weight: bold; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px;">${formatMoney(totalHT)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-size: 14px; padding-top: 12px;">TVA (20%)</td>
          <td style="text-align: right; color: #64748b; padding-top: 12px;">${formatMoney(totalVAT)}</td>
        </tr>
        <tr>
          <td style="color: #0f172a; font-size: 18px; font-weight: bold; padding-top: 12px;">TOTAL TTC</td>
          <td style="text-align: right; font-weight: bold; font-size: 20px; color: #0ea5e9; padding-top: 12px;">${formatMoney(invoice.amount)}</td>
        </tr>
      </table>
    </div>

    ${(company.iban || company.bankName) ? `
    <div class="iban-box">
      <p style="font-weight: bold; color: #15803d; margin: 0 0 8px 0; font-size: 14px;">💳 Coordonnées bancaires pour le règlement</p>
      ${company.bankName ? `<p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>Banque :</strong> ${company.bankName}</p>` : ''}
      ${company.iban ? `<p style="margin: 4px 0; font-size: 13px; color: #374151; font-family: monospace;"><strong>IBAN :</strong> ${company.iban}</p>` : ''}
      ${company.bic ? `<p style="margin: 4px 0; font-size: 13px; color: #374151;"><strong>BIC :</strong> ${company.bic}</p>` : ''}
    </div>` : ''}

    <p style="margin-top: 30px; font-size: 13px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; line-height: 1.5;">
      Cordialement,<br>
      <strong style="color: #334155;">${company.name || "L'équipe"}</strong><br>
      ${company.phone ? `${company.phone}<br>` : ''}
      ${company.email ? company.email : ''}
    </p>
  </div>
</body>
</html>`;
}
