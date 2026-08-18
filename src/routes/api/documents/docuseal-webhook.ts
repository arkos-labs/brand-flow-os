import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyDocusealWebhookSecret } from "@/lib/docuseal";

// Webhook DocuSeal — configuré dans DocuSeal sur
// `<domaine>/api/documents/docuseal-webhook?secret=...`, événement
// "form.completed". Le secret est vérifié via le query param (cette
// version de DocuSeal ne signe pas ses webhooks par header).
//
// Réconcilie via `docusealSubmissionId` stocké dans quotes.payload par
// /api/quotes/docuseal-start, puis verrouille le devis exactement comme
// /api/quotes/sign (même colonne `status`, même structure de payload).
export const Route = createFileRoute("/api/documents/docuseal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        if (!verifyDocusealWebhookSecret(url.searchParams.get("secret"))) {
          return new Response(JSON.stringify({ error: "invalid_secret" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const event = await request.json().catch(() => null);
        if (!event) {
          return new Response(JSON.stringify({ error: "invalid_body" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (event.event_type !== "form.completed") {
          return new Response(JSON.stringify({ ok: true, ignored: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const submissionId = event.data?.submission_id ?? event.data?.id;
          const signerName = event.data?.name ?? event.data?.email ?? "Client";
          const signedAt = event.data?.completed_at ?? new Date().toISOString();
          const documentUrl = event.data?.documents?.[0]?.url ?? null;

          const admin = getSupabaseAdmin();

          const { data: quote, error } = await admin
            .from("quotes")
            .select("id, status, payload")
            .eq("payload->>docusealSubmissionId", String(submissionId))
            .maybeSingle();

          if (error || !quote) {
            console.error("Webhook DocuSeal : devis introuvable pour submission", submissionId);
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (quote.status === "accepted") {
            return new Response(JSON.stringify({ ok: true, alreadySigned: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const payload = (quote.payload as Record<string, unknown>) ?? {};

          const { error: updateError } = await admin
            .from("quotes")
            .update({
              status: "accepted",
              payload: {
                ...payload,
                status: { fr: "Signé", en: "Signed" },
                signedAt,
                signatureData: { signerName, signedAt, consent: true, source: "docuseal" },
                docusealDocumentUrl: documentUrl,
              },
            })
            .eq("id", quote.id);

          if (updateError) throw new Error(updateError.message);

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur /api/documents/docuseal-webhook:", err);
          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
