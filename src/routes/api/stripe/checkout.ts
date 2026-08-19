import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isStripeEnabled()) {
          return new Response(JSON.stringify({ error: "Stripe non configuré" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const { priceId, planName, email, userId, successUrl, cancelUrl } = body;

          if (!priceId) {
            return new Response(JSON.stringify({ error: "priceId manquant (le forfait n'a pas été spécifié)" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const sessionOptions: any = {
            payment_method_types: ["card", "sepa_debit"],
            line_items: [
              {
                price: priceId, // ID du prix Stripe (ex: price_1Pox...)
                quantity: 1,
              },
            ],
            mode: "subscription",
            customer_email: email, // Pré-remplir l'email si disponible
            success_url: successUrl || request.headers.get("referer") || "http://localhost:5173",
            cancel_url: cancelUrl || request.headers.get("referer") || "http://localhost:5173",
            metadata: {
              source: "saas_subscription",
              plan_tier: planName || "pro",
            },
          };
          
          if (userId) {
            sessionOptions.client_reference_id = userId;
            sessionOptions.metadata.user_id = userId;
          }

          const session = await stripe.checkout.sessions.create(sessionOptions);

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur Stripe Checkout:", err);
          return new Response(JSON.stringify({ error: "Erreur serveur" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
