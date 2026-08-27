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

          const downgradeToSoloAndReload = async () => {
            await Promise.all([
              supabase.from("organizations").update({ plan_tier: "solo", stripe_customer_id: null }).eq("owner_id", userId),
              supabase.from("profiles").update({ plan_tier: "solo" }).eq("id", userId),
            ]);
            return new Response(
              JSON.stringify({
                url: body.returnUrl || "http://localhost:5173/parametres",
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          };

          if (!org?.stripe_customer_id) {
            return await downgradeToSoloAndReload();
          }

          // Vérifie qu'une subscription active existe avant d'ouvrir le portail
          let subscriptions;
          try {
            subscriptions = await stripe.subscriptions.list({
              customer: org.stripe_customer_id,
              status: "all",
              limit: 5,
            });
          } catch (err: any) {
            if (err.message && err.message.includes("No such customer")) {
              return await downgradeToSoloAndReload();
            }
            throw err;
          }

          const activeSub = subscriptions.data.find(
            (s) => s.status === "active" || s.status === "trialing"
          );

          if (!activeSub) {
            return await downgradeToSoloAndReload();
          }

          if (body.targetPriceId) {
            // Mise à niveau (upgrade) instantanée via API pour une expérience fluide (1-click)
            await stripe.subscriptions.update(activeSub.id, {
              items: [
                {
                  id: activeSub.items.data[0].id,
                  price: body.targetPriceId,
                },
              ],
              proration_behavior: "always_invoice", // facture le prorata immédiatement
            });

            // Déduction du nom du plan (pro ou agency) pour mettre à jour la base de données instantanément
            const isAgency = body.targetPriceId.includes("price_1U6E5F7tsPmmReQdP1CVwC6X") || 
                             (process.env.VITE_STRIPE_PRICE_AGENCY && body.targetPriceId === process.env.VITE_STRIPE_PRICE_AGENCY);
            const newPlan = isAgency ? "agency" : "pro";

            await Promise.all([
              supabase.from("organizations").update({ plan_tier: newPlan }).eq("owner_id", userId),
              supabase.from("profiles").update({ plan_tier: newPlan }).eq("id", userId),
            ]);

            // Retourne l'URL actuelle pour forcer le rafraîchissement de la page
            return new Response(JSON.stringify({ url: body.returnUrl || "http://localhost:5173/parametres" }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Crée la session Customer Portal Stripe (uniquement pour accéder au portail général maintenant)
          const session = await stripe.billingPortal.sessions.create({
            customer: org.stripe_customer_id,
            return_url: returnUrl,
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
