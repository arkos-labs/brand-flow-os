import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const Route = createFileRoute("/api/quotes/refuse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => null);
        const token = typeof body?.token === "string" ? body.token : null;
        const reason = typeof body?.reason === "string" ? body.reason : null;

        if (!token || !/^[A-Za-z0-9_-]{1,64}$/.test(token)) {
          return new Response(JSON.stringify({ error: "invalid_input" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const admin = getSupabaseAdmin();

          let quote: Record<string, unknown> | null = null;
          const byToken = await admin.from("quotes").select("id, status, payload").filter("payload->>publicToken", "eq", token).maybeSingle();
          if (!byToken.error && byToken.data) quote = byToken.data;
          if (!quote) { const byId = await admin.from("quotes").select("id, status, payload").eq("id", token).maybeSingle(); if (!byId.error && byId.data) quote = byId.data; }
          if (!quote) { const byNum = await admin.from("quotes").select("id, status, payload").eq("number", token).maybeSingle(); if (!byNum.error && byNum.data) quote = byNum.data; }
          const fetchError = null;

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

          const refusedAt = typeof body?.refusedAt === "string" ? body.refusedAt : new Date().toISOString();
          const payload = (quote.payload as Record<string, unknown>) ?? {};

          const { error: updateError } = await admin
            .from("quotes")
            .update({
              status: "rejected",
              payload: {
                ...payload,
                status: { fr: "Refusé", en: "Refused" },
                refusedAt,
                refuseReason: reason,
              },
            })
            .eq("id", quote.id);

          if (updateError) throw new Error(updateError.message);

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur /api/quotes/refuse:", err);
          return new Response(JSON.stringify({ error: "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
