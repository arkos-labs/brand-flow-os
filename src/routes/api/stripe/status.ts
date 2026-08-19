import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const Route = createFileRoute("/api/stripe/status")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { userId } = body;

          if (!userId) {
            return new Response(JSON.stringify({ error: "Utilisateur non fourni." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = getSupabaseAdmin();
          const { data: org } = await supabase
            .from("organizations")
            .select("stripe_customer_id")
            .eq("owner_id", userId)
            .not("stripe_customer_id", "is", null)
            .limit(1)
            .single();

          const customerId = org?.stripe_customer_id;

          if (!customerId) {
            return new Response(JSON.stringify({ plan: null, cancel_at: null }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const customer = await stripe.customers.retrieve(customerId, {
            expand: ["subscriptions"],
          });

          if (customer.deleted) {
            return new Response(JSON.stringify({ plan: null, cancel_at: null }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const subscriptions = customer.subscriptions?.data;
          const activeSub = subscriptions?.find(s => s.status === "active" || s.status === "trialing");

          if (!activeSub) {
            return new Response(JSON.stringify({ plan: null, cancel_at: null }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({ 
            plan: activeSub.items.data[0]?.price.id,
            cancel_at: activeSub.cancel_at,
            cancel_at_period_end: activeSub.cancel_at_period_end,
            current_period_end: activeSub.current_period_end
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Stripe status error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
