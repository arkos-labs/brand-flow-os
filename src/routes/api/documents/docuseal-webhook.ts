import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { verifyDocusealWebhook } from "@/lib/docuseal";

// Webhook DocuSeal — à configurer dans DocuSeal sur
// `<ton domaine>/api/documents/docuseal-webhook`, événement "form.completed".
// Réconcilie via `docusealSubmissionId` stocké dans quotes.payload par
// /api/quotes/docuseal-start, puis verrouille le devis exactement comme
// /api/quotes/sign (même colonne `status`, même structure de payload) afin
// que le reste de l'app (liste des devis, factures liées…) n'ait pas à
// distinguer signature maison et signature DocuSeal.
export const Route = createFileRoute("/api/documents/docuseal-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        const signature = request.headers.get("x-docuseal-signature");

        const event = await verifyDocusealWebhook(rawBody, signature).catch(() => null);
        if (!event) {
          return new Response(JSON.stringify({ error: "invalid_signature" }), {
            status: 401,
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
