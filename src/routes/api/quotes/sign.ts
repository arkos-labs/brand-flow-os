import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const Route = createFileRoute("/api/quotes/sign")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const token = typeof body?.token === "string" ? body.token : null;
        const signatureData = body?.signatureData ?? null;

        if (!token || !/^[A-Za-z0-9_-]{1,64}$/.test(token) || !signatureData?.signerName || signatureData.consent !== true) {
          return new Response(JSON.stringify({ error: "invalid_input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          // Recherche STRICTE par publicToken. Aucun repli sur id/number :
          // ce sont des identifiants devinables qui permettraient de signer
          // un devis d'un autre compte sans posséder le lien public (IDOR).
          const { data: quote, error: byTokenError } = await admin
            .from("quotes")
            .select("id, status, payload, organization_id")
            .filter("payload->>publicToken", "eq", token)
            .maybeSingle();

          if (byTokenError || !quote) {
            return new Response(JSON.stringify({ error: "not_found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Devis déjà verrouillé (signé) : conformité anti-fraude, on ne
          // re-signe jamais un document déjà finalisé.
          if (quote.status === "accepted") {
            return new Response(JSON.stringify({ ok: true, alreadySigned: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const signedAt =
            typeof signatureData.signedAt === "string" ? signatureData.signedAt : new Date().toISOString();
          const payload = (quote.payload as Record<string, unknown>) ?? {};

          const { error: updateError } = await admin
            .from("quotes")
            .update({
              status: "accepted",
              payload: {
                ...payload,
                status: { fr: "Signé", en: "Signed" },
                signatureData,
                signedAt,
              },
            })
            .eq("id", quote.id);

          if (updateError) throw new Error(updateError.message);

          // PAF: audit log obligatoire — signature est un acte irréversible (anti-fraude France 2026)
          try {
            const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
            await admin.rpc("insert_audit_log", {
              p_user_id: null, // action client (pas d'auth JWT côté portail public)
              p_action: "quote_signed",
              p_resource_type: "quote",
              p_resource_id: quote.id,
              p_metadata: {
                signerName: signatureData.signerName,
                signedAt,
                token,
              },
              p_ip_address: ip,
            });
          } catch (auditErr) {
            console.error("Audit log failed (sign):", auditErr);
          }

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur /api/quotes/sign:", err);
          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
