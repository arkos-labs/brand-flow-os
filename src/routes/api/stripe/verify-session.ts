// src/routes/api/stripe/verify-session.ts
import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env["VITE_STRIPE_PRICE_PRO"] ?? ""]: "pro",
  [process.env["VITE_STRIPE_PRICE_AGENCY"] ?? ""]: "agency",
};

export const Route = createFileRoute("/api/stripe/verify-session")({
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
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const userId = auth.userId;

          const { sessionId } = await request.json();
          if (!sessionId) {
            return new Response(JSON.stringify({ error: "sessionId manquant" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ["subscription"],
          });

          // Vérifie que la session appartient bien à cet utilisateur
          if (
            session.client_reference_id !== userId &&
            session.metadata?.["user_id"] !== userId
          ) {
            return new Response(JSON.stringify({ error: "Session invalide" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (session.payment_status !== "paid" && session.status !== "complete") {
            return new Response(JSON.stringify({ plan_tier: null, status: session.status }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = getSupabaseAdmin();
          const customerId = session.customer as string;

          // Sauvegarde stripe_customer_id si pas encore fait
          if (customerId) {
            await supabase
              .from("organizations")
              .update({ stripe_customer_id: customerId })
              .eq("owner_id", userId);
          }

          // Détermine le plan depuis la subscription
          let planTier = session.metadata?.["plan_tier"] || "pro";
          const sub = session.subscription as any;
          if (sub?.items?.data?.[0]?.price?.id) {
            const priceId = sub.items.data[0].price.id;
            planTier = PRICE_TO_PLAN[priceId] || planTier;
          }

          // Sync plan dans profiles + organizations
          await Promise.all([
            supabase.from("profiles").update({ plan_tier: planTier }).eq("id", userId),
            supabase.from("organizations").update({ plan_tier: planTier }).eq("owner_id", userId),
          ]);

          console.log(`✅ verify-session: user=${userId} → ${planTier}`);

          return new Response(JSON.stringify({ plan_tier: planTier, status: "synced" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Erreur verify-session:", err);
          return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
