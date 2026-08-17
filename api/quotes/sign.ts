import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token, signatureData } = req.body;

  if (!token || !signatureData) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 1. Récupérer le devis via son token public (UUID aléatoire, impossible
    //       à deviner) — jamais via son numéro + organization_id ────────────────
    const { data: quote, error: fetchError } = await supabaseAdmin
      .from("quotes")
      .select("id, number, organization_id, payload, total_ttc")
      .eq("payload->>publicToken", token)
      .single();

    if (fetchError || !quote) {
      console.error("Failed to fetch quote:", fetchError);
      return res.status(404).json({ error: "Quote not found" });
    }

    const quoteNumber = quote.number;
    const orgId = quote.organization_id;

    const { data: org } = await supabaseAdmin
      .from("organizations")
      .select("email, name")
      .eq("id", orgId)
      .single();

    // ── 2. Mettre à jour le statut dans Supabase ──────────────────────────────
    const payload = (quote.payload as Record<string, unknown>) ?? {};
    payload.status = { fr: "Signé", en: "Signed" };
    payload.signedAt = signatureData.signedAt;
    payload.signatureData = signatureData;

    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "accepted",
        payload,
      })
      .eq("id", quote.id);

    if (updateError) {
      console.error("Failed to update quote:", updateError);
      return res.status(500).json({ error: "Failed to update quote" });
    }

    // ── 3. Envoyer la notification email à l'artisan ──────────────────────────
    const artisanEmail = org?.email;
    const artisanName = org?.name ?? "votre entreprise";
    const clientName = signatureData.signerName ?? (payload.client as string) ?? "Le client";
    const signedAt = new Date(signatureData.signedAt ?? Date.now()).toLocaleString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
    const totalTTC = quote.total_ttc
      ? new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(Number(quote.total_ttc))
      : null;

    const resendApiKey = process.env.RESEND_API_KEY ?? process.env.VITE_RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL ?? process.env.VITE_RESEND_FROM_EMAIL ?? "ClearQuote <onboarding@resend.dev>";

    if (artisanEmail && resendApiKey) {
      const emailHtml = buildNotificationEmail({
        artisanName,
        clientName,
        quoteNumber,
        signedAt,
        totalTTC,
        signerName: signatureData.signerName,
      });

      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [artisanEmail],
          subject: `✅ Devis ${quoteNumber} signé par ${clientName}`,
          html: emailHtml,
        }),
      });

      if (!sendRes.ok) {
        // La mise à jour Supabase a déjà réussi — on log l'erreur sans bloquer
        console.error("Notification email failed:", await sendRes.text());
      }
    } else {
      console.warn("Notification skipped — no artisan email or Resend key configured");
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", message);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// ── Template email ─────────────────────────────────────────────────────────────

function buildNotificationEmail(params: {
  artisanName: string;
  clientName: string;
  quoteNumber: string;
  signedAt: string;
  totalTTC: string | null;
  signerName?: string;
}): string {
  const { artisanName, clientName, quoteNumber, signedAt, totalTTC, signerName } = params;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Devis signé</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);">

          <!-- Header vert -->
          <tr>
            <td style="background:linear-gradient(135deg,#059669,#10b981);padding:36px 40px;text-align:center;">
              <div style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:50%;width:64px;height:64px;line-height:64px;font-size:32px;margin-bottom:16px;">✅</div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Devis accepté et signé !
              </h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">
                ${clientName} vient de signer votre devis
              </p>
            </td>
          </tr>

          <!-- Corps -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Bonjour ${artisanName},<br /><br />
                Bonne nouvelle — <strong>${clientName}</strong> a accepté et signé votre devis électroniquement.
                Vous pouvez maintenant démarrer la mission et convertir ce devis en facture.
              </p>

              <!-- Carte récap -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;">Référence du devis</td>
                        <td align="right" style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;font-family:monospace;">${quoteNumber}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;border-top:1px solid #e2e8f0;">Signé par</td>
                        <td align="right" style="padding:6px 0;color:#111827;font-size:13px;font-weight:600;border-top:1px solid #e2e8f0;">${signerName ?? clientName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#6b7280;font-size:13px;border-top:1px solid #e2e8f0;">Date et heure</td>
                        <td align="right" style="padding:6px 0;color:#111827;font-size:13px;border-top:1px solid #e2e8f0;">${signedAt}</td>
                      </tr>
                      ${totalTTC ? `
                      <tr>
                        <td style="padding:10px 0 6px;color:#6b7280;font-size:13px;border-top:1px solid #e2e8f0;">Montant TTC</td>
                        <td align="right" style="padding:10px 0 6px;color:#059669;font-size:16px;font-weight:700;border-top:1px solid #e2e8f0;">${totalTTC}</td>
                      </tr>` : ""}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="https://clearquote.fr/devis" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.1px;">
                      Voir le devis dans ClearQuote →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;padding-top:24px;border-top:1px solid #f1f5f9;color:#9ca3af;font-size:12px;text-align:center;">
                Ce message est envoyé automatiquement par ClearQuote · <a href="https://clearquote.fr" style="color:#9ca3af;">clearquote.fr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
