import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { dbQuoteToLegacyQuote, dbOrgToCompanySettings } from "@/lib/portal-adapters";
import { isDocusealEnabled } from "@/lib/docuseal";

// Route publique (pas d'authentification). Le devis est identifié UNIQUEMENT
// par son `payload->>publicToken` (uuid aléatoire généré à l'envoi).
//
// ⚠️ SÉCURITÉ : on NE recherche JAMAIS par `id` ni par `number`. Ces deux
// identifiants sont devinables/énumérables (numéros séquentiels DV-YYYY-NNN,
// UUID de la base) et permettraient à un attaquant d'accéder à n'importe quel
// devis d'un autre compte sans posséder le lien public. Seul le token aléatoire
// (présent dans l'email client) donne accès. C'est un correctif de faille IDOR
// (Broken Object Level Authorization).
export const Route = createFileRoute("/api/quotes/get")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        // Le token vient de l'URL publique : on borne strictement son format.
        if (!token || !/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
          return new Response(JSON.stringify({ error: "missing_token" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          // Recherche STRICTE par publicToken (champ JSONB payload->>'publicToken').
          // Aucun repli sur id/number : c'est volontaire (voir en-tête).
          const { data: quote, error: byTokenError } = await admin
            .from("quotes")
            .select("*")
            .filter("payload->>publicToken", "eq", token)
            .maybeSingle();

          if (byTokenError || !quote) {
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

          let planTier = "solo";
          if (org.owner_id) {
            const { data: profile } = await admin
              .from("profiles")
              .select("plan_tier")
              .eq("id", org.owner_id)
              .maybeSingle();
            if (profile) planTier = profile.plan_tier || "solo";
          }

          return new Response(
            JSON.stringify({
              quote: dbQuoteToLegacyQuote(quote),
              company: { ...dbOrgToCompanySettings(org), plan: planTier },
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
