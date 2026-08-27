// src/routes/api/stripe/cancel.ts
import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/stripe/cancel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isStripeEnabled()) {
          return new Response(JSON.stringify({ error: "stripe_disabled" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const userId = auth.userId;

          const supabase = getSupabaseAdmin();
          const { data: org } = await supabase
            .from("organizations")
            .select("id, stripe_customer_id")
            .eq("owner_id", userId)
            .single();

          if (!org?.stripe_customer_id) {
            return new Response(
              JSON.stringify({ error: "Aucun abonnement actif trouvé." }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Cherche la subscription active
          let subscriptions;
          try {
            subscriptions = await stripe.subscriptions.list({
              customer: org.stripe_customer_id,
              status: "all",
              limit: 5,
            });
          } catch (err: any) {
            if (err.message && err.message.includes("No such customer")) {
              await supabase.from("organizations").update({ stripe_customer_id: null }).eq("owner_id", userId);
              subscriptions = { data: [] };
            } else {
              throw err;
            }
          }

          const active = subscriptions.data.find(
            (s) => s.status === "active" || s.status === "trialing"
          );

          if (!active) {
            // Pas de subscription Stripe — downgrade direct en DB (compte test ou plan manuel)
            await Promise.all([
              supabase.from("organizations").update({ plan_tier: "solo" }).eq("owner_id", userId),
              supabase.from("profiles").update({ plan_tier: "solo" }).eq("id", userId),
            ]);
            return new Response(JSON.stringify({ ok: true, fallback: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Résiliation à la fin de la période en cours (pas immédiate)
          await stripe.subscriptions.update(active.id, {
            cancel_at_period_end: true,
          });

          // PAF : log de résiliation
          try {
            const ip =
              request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
            await supabase.rpc("insert_audit_log", {
              p_user_id: userId,
              p_action: "subscription_cancelled",
              p_resource_type: "organization",
              p_resource_id: org.id,
              p_metadata: {
                stripe_subscription_id: active.id,
                cancel_at_period_end: true,
              },
              p_ip_address: ip,
            });
          } catch (_) {}

          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Erreur /api/stripe/cancel:", err);
          return new Response(JSON.stringify({ error: err.message || "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
