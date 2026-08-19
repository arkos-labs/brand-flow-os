import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { createDocusealSubmission, isDocusealEnabled } from "@/lib/docuseal";

// Démarre une session de signature DocuSeal pour un devis (identifié comme
// les autres routes /api/quotes/* : publicToken → id → number). Retourne
// l'URL de signature à ouvrir/embarquer côté client. Si DocuSeal n'est pas
// configuré, renvoie 501 pour laisser le front retomber sur la signature
// maison (canvas).
export const Route = createFileRoute("/api/quotes/docuseal-start")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isDocusealEnabled()) {
          return new Response(JSON.stringify({ error: "docuseal_not_configured" }), {
            status: 501,
            headers: { "Content-Type": "application/json" },
          });
        }

        const body = await request.json().catch(() => null);
        const token = typeof body?.token === "string" ? body.token : null;

        if (!token || !/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
          return new Response(JSON.stringify({ error: "invalid_input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          let quote: Record<string, unknown> | null = null;
          const byToken = await admin.from("quotes").select("id, number, status, payload").filter("payload->>publicToken", "eq", token).maybeSingle();
          if (!byToken.error && byToken.data) quote = byToken.data;
          if (!quote) { const byId = await admin.from("quotes").select("id, number, status, payload").eq("id", token).maybeSingle(); if (!byId.error && byId.data) quote = byId.data; }
          if (!quote) { const byNum = await admin.from("quotes").select("id, number, status, payload").eq("number", token).maybeSingle(); if (!byNum.error && byNum.data) quote = byNum.data; }
          const error = null;

          if (!quote) {
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (quote.status === "accepted") {
            return new Response(JSON.stringify({ error: "already_signed" }), {
              status: 409,
              headers: { "Content-Type": "application/json" },
            });
          }

          const payload = (quote.payload as Record<string, any>) ?? {};
          const clientEmail = payload.clientEmail || payload.details?.email;
          const clientName = payload.client || "Client";

          if (!clientEmail) {
            return new Response(JSON.stringify({ error: "missing_client_email" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const submission = await createDocusealSubmission(
            { email: clientEmail, name: clientName },
            { quoteId: quote.id, quoteNumber: quote.number },
          );

          // On mémorise l'id de submission pour réconcilier le webhook,
          // sans toucher au statut (le webhook `form.completed` fera foi).
          await admin
            .from("quotes")
            .update({ payload: { ...payload, docusealSubmissionId: submission.submissionId } })
            .eq("id", quote.id);

          return new Response(JSON.stringify({ signUrl: submission.signUrl }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur /api/quotes/docuseal-start:", err);
          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
