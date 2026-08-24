import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/stripe/cancel")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // Vérifie la session serveur : on utilise l'id authentifié, jamais
          // le `userId` du corps (falsifiable). SÉCURITÉ (IDOR).
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const userId = auth.userId;

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
            return new Response(JSON.stringify({ error: "Client Stripe introuvable." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const customer = await stripe.customers.retrieve(customerId, {
            expand: ["subscriptions"],
          });

          if (customer.deleted) {
            return new Response(JSON.stringify({ error: "Client supprimé." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const subscriptions = customer.subscriptions?.data;
          if (!subscriptions || subscriptions.length === 0) {
            return new Response(JSON.stringify({ error: "Aucun abonnement actif trouvé." }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Annuler tous les abonnements actifs à la fin de la période
          for (const sub of subscriptions) {
            if (sub.status === "active" || sub.status === "trialing") {
              await stripe.subscriptions.update(sub.id, {
                cancel_at_period_end: true,
              });
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Cancel subscription error:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
