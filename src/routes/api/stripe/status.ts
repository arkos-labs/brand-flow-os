// src/routes/api/stripe/status.ts
import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/stripe/status")({
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
            .select("stripe_customer_id, plan_tier")
            .eq("owner_id", userId)
            .single();

          if (!org?.stripe_customer_id) {
            return new Response(JSON.stringify({ status: "no_customer" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const subscriptions = await stripe.subscriptions.list({
            customer: org.stripe_customer_id,
            status: "all",
            limit: 5,
          });

          const active = subscriptions.data.find(
            (s) => s.status === "active" || s.status === "trialing"
          );

          if (!active) {
            return new Response(JSON.stringify({ status: "no_active_subscription" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const item = active.items.data[0];
          return new Response(
            JSON.stringify({
              status: active.status,
              cancelAtPeriodEnd: active.cancel_at_period_end,
              currentPeriodEnd: (active as { current_period_end?: number }).current_period_end ?? null,
              priceId: item?.price.id,
              planTier: org.plan_tier,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err: any) {
          console.error("Erreur /api/stripe/status:", err);
          return new Response(JSON.stringify({ error: err.message || "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
