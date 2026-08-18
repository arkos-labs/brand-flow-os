import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { dbQuoteToLegacyQuote, dbOrgToCompanySettings } from "@/lib/portal-adapters";
import { isDocusealEnabled } from "@/lib/docuseal";

// Route publique (pas d'authentification). Le devis est identifié par son
// `payload->>publicToken` (uuid aléatoire généré à l'envoi), avec repli sur
// `id` puis sur `number` pour compatibilité avec d'anciens liens. Jamais de
// filtre par organization_id ici : seul le token fait foi.
export const Route = createFileRoute("/api/quotes/get")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        // Le token vient de l'URL publique : on borne strictement son
        // format avant de l'injecter dans un filtre PostgREST `.or()`.
        if (!token || !/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
          return new Response(JSON.stringify({ error: "missing_token" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          const { data: quote, error: quoteError } = await admin
            .from("quotes")
            .select("*")
            .or(`payload->>publicToken.eq.${token},id.eq.${token},number.eq.${token}`)
            .maybeSingle();

          if (quoteError || !quote) {
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          const { data: org } = await admin
            .from("organizations")
            .select("*")
            .eq("id", quote.organization_id)
            .maybeSingle();

          if (!org) {
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(
            JSON.stringify({
              quote: dbQuoteToLegacyQuote(quote),
              company: dbOrgToCompanySettings(org),
              docusealEnabled: isDocusealEnabled(),
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (err) {
          console.error("Erreur /api/quotes/get:", err);
          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
