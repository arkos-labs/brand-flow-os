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

          // Cherche d'abord par token dans le payload JSON (cas normal — lien
          // envoyé par email). Si non trouvé, repli sur id (UUID) puis number
          // (compatibilité anciens liens). `.or()` PostgREST ne supporte pas
          // les filtres JSONB dans la même clause — on enchaîne les requêtes.
          let quote: Record<string, unknown> | null = null;
          let quoteError: { message: string } | null = null;

          // 1. Recherche par publicToken (champ JSONB payload->>'publicToken')
          const byToken = await admin
            .from("quotes")
            .select("*")
            .filter("payload->>publicToken", "eq", token)
            .maybeSingle();
          if (!byToken.error && byToken.data) {
            quote = byToken.data;
          }

          // 2. Repli : id UUID exact
          if (!quote) {
            const byId = await admin
              .from("quotes")
              .select("*")
              .eq("id", token)
              .maybeSingle();
            if (!byId.error && byId.data) quote = byId.data;
          }

          // 3. Repli : numéro de devis (ex. DV-2026-001)
          if (!quote) {
            const byNumber = await admin
              .from("quotes")
              .select("*")
              .eq("number", token)
              .maybeSingle();
            if (!byNumber.error && byNumber.data) quote = byNumber.data;
            else quoteError = byNumber.error;
          }

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
