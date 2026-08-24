import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { dbOrgToCompanySettings, dbInvoiceToLegacyInvoice } from "@/lib/portal-adapters";
import { generateInvoiceEmailHtml } from "@/lib/email-templates";
import { generateInvoicePdfBase64 } from "@/lib/pdf-export";

export const Route = createFileRoute("/api/cron/relances")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        // Authentification par token secret pour le cron
        const url = new URL(request.url);
        const secret = url.searchParams.get("secret");

        if (!secret || secret !== process.env['CRON_SECRET']) {
          return new Response(JSON.stringify({ error: "Non autorisé" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const resendApiKey = process.env['RESEND_API_KEY'];
        const fromEmail = process.env['RESEND_FROM_EMAIL'] || 'Relance <onboarding@resend.dev>';

        if (!resendApiKey) {
          return new Response(JSON.stringify({ error: "RESEND_API_KEY manquante" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          // 1. Trouver les factures en retard (due_date < aujourd'hui) et statut != 'paid'
          const today = new Date().toISOString().split('T')[0];
          const { data: invoices, error } = await admin
            .from("invoices")
            .select("*, organizations(*)")
            .lt("due_date", today)
            .neq("status", "paid")
            .neq("status", "draft");

          if (error) throw error;
          if (!invoices || invoices.length === 0) {
            return new Response(JSON.stringify({ message: "Aucune facture en retard trouvée." }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          let relancesEnvoyees = 0;
          const erreurs: string[] = [];

          // 2. Pour chaque facture, envoyer un email de relance via Resend
          for (const inv of invoices) {
            const org = inv.organizations;
            if (!org) continue;

            const legacyInvoice = dbInvoiceToLegacyInvoice(inv);
            const legacyOrg = dbOrgToCompanySettings(org);

            if (!legacyInvoice.clientEmail) continue;

            try {
              const html = generateInvoiceEmailHtml(legacyInvoice, legacyOrg, "modele-relance");
              const pdfBase64 = await generateInvoicePdfBase64(legacyInvoice, legacyOrg);

              // FIX M1: envoi réel via Resend (remplace la simulation console.log)
              const sendResponse = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${resendApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: fromEmail,
                  to: [legacyInvoice.clientEmail],
                  reply_to: legacyOrg.email || undefined,
                  subject: `Relance de paiement — Facture ${legacyInvoice.number}`,
                  html,
                  attachments: [
                    {
                      filename: `${legacyInvoice.number}.pdf`,
                      content: pdfBase64,
                    },
                  ],
                }),
              });

              if (!sendResponse.ok) {
                const sendData = await sendResponse.json().catch(() => ({}));
                console.error(`Resend erreur pour ${legacyInvoice.number}:`, sendData);
                erreurs.push(`${legacyInvoice.number}: ${sendData?.message ?? "erreur Resend"}`);
                continue;
              }

              console.log(`✅ Relance envoyée à ${legacyInvoice.clientEmail} pour la facture ${legacyInvoice.number}`);

              // 3. Marquer la facture comme relancée (évite les doublons au prochain cron)
              await admin
                .from("invoices")
                .update({ last_reminder_sent_at: new Date().toISOString() })
                .eq("id", inv.id);

              relancesEnvoyees++;
            } catch (invoiceErr) {
              console.error(`Erreur traitement facture ${inv.id}:`, invoiceErr);
              erreurs.push(String(inv.id));
            }
          }

          return new Response(
            JSON.stringify({
              message: `${relancesEnvoyees} relance(s) envoyée(s).`,
              erreurs: erreurs.length ? erreurs : undefined,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          console.error("Erreur Cron Relances:", err);
          return new Response(JSON.stringify({ error: "Erreur serveur" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
