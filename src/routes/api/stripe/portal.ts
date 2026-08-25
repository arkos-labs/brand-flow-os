// src/routes/api/stripe/portal.ts
import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";
import { getSiteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/api/stripe/portal")({
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

          const body = await request.json().catch(() => ({}));
          const returnUrl =
            typeof body?.returnUrl === "string"
              ? body.returnUrl
              : request.headers.get("referer") || `${getSiteUrl()}/parametres`;

          const supabase = getSupabaseAdmin();
          const { data: org } = await supabase
            .from("organizations")
            .select("stripe_customer_id")
            .eq("owner_id", userId)
            .single();

          if (!org?.stripe_customer_id) {
            return new Response(
              JSON.stringify({
                error:
                  "Aucun abonnement actif trouvé. Choisissez un forfait pour créer votre abonnement.",
              }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          // Vérifie qu'une subscription active existe avant d'ouvrir le portail
          const subscriptions = await stripe.subscriptions.list({
            customer: org.stripe_customer_id,
            status: "all",
            limit: 5,
          });

          const activeSub = subscriptions.data.find(
            (s) => s.status === "active" || s.status === "trialing"
          );

          if (!activeSub) {
            return new Response(
              JSON.stringify({
                error:
                  "Aucun abonnement actif trouvé. Souscrivez d'abord à un forfait payant.",
              }),
              {
                status: 404,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          const flowData: any = {};
          if (!activeSub.cancel_at_period_end) {
            if (body.targetPriceId) {
              flowData.flow_data = {
                type: "subscription_update_confirm",
                subscription_update_confirm: {
                  subscription: activeSub.id,
                  items: [
                    {
                      id: activeSub.items.data[0].id,
                      price: body.targetPriceId,
                      quantity: 1,
                    },
                  ],
                },
              };
            } else if (body.action === "cancel") {
              flowData.flow_data = {
                type: "subscription_cancel",
                subscription_cancel: {
                  subscription: activeSub.id,
                },
              };
            }
          }

          // Crée la session Customer Portal Stripe
          const session = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: returnUrl,
            ...flowData,
          });

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Erreur /api/stripe/portal:", err);
          return new Response(JSON.stringify({ error: err.message || "server_error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
