import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";

export const Route = createFileRoute("/api/stripe/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { customerId, userId, returnUrl } = body;
          let finalCustomerId = customerId;

          if (!finalCustomerId && userId) {
            const { getSupabaseAdmin } = await import("@/lib/supabase-admin");
            const supabase = getSupabaseAdmin();
            const { data: org } = await supabase
              .from("organizations")
              .select("stripe_customer_id")
              .eq("owner_id", userId)
              .not("stripe_customer_id", "is", null)
              .limit(1)
              .single();
            if (org?.stripe_customer_id) {
              finalCustomerId = org.stripe_customer_id;
            }
          }

          if (!finalCustomerId) {
            return new Response(JSON.stringify({ error: "Client Stripe introuvable." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await stripe.billingPortal.sessions.create({
            customer: finalCustomerId,
            return_url: returnUrl || request.headers.get("referer") || "http://localhost:5173/parametres",
          });

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Portal error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
