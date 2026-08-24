import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/stripe/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { customerId, targetPlanId, returnUrl } = body;

          // Vérifie la session serveur : on utilise l'id authentifié, jamais
          // le `userId` du corps (falsifiable). SÉCURITÉ (IDOR).
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const userId = auth.userId;

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

          const portalOptions: Stripe.BillingPortal.SessionCreateParams = {
            customer: finalCustomerId,
            return_url: returnUrl || request.headers.get("referer") || "http://localhost:5173/parametres",
          };

          // Redirection directe vers le changement de forfait si un plan cible est fourni
          if (targetPlanId) {
            const targetPriceId = targetPlanId === "pro" 
              ? process.env.VITE_STRIPE_PRICE_PRO 
              : process.env.VITE_STRIPE_PRICE_AGENCY;

            if (targetPriceId) {
              const subscriptions = await stripe.subscriptions.list({
                customer: finalCustomerId,
                status: "active",
                limit: 1,
              });

              if (subscriptions.data.length > 0) {
                const sub = subscriptions.data[0];
                // Vérifier que l'abonnement n'est pas en cours d'annulation, car le flux de mise à jour échouerait
                if (!sub.cancel_at_period_end) {
                  portalOptions.flow_data = {
                    type: "subscription_update_confirm",
                    subscription_update_confirm: {
                      subscription: sub.id,
                      items: [{
                        id: sub.items.data[0].id,
                        price: targetPriceId,
                        quantity: 1,
                      }],
                    },
                  };
                }
              }
            }
          }

          const session = await stripe.billingPortal.sessions.create(portalOptions);

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
