import { Quote, CompanySettings } from "./data-context";

export function generateQuoteEmailHtml(quote: Quote, company: CompanySettings, templateId: string = "modele-1", baseUrl: string = ""): string {
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
  const portalUrl = baseUrl ? `${baseUrl}/portail/${quote.number}` : `https://brand-flow-os-opal.vercel.app/portail/${quote.number}`;

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
