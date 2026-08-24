import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Helper : met à jour plan_tier sur profiles + organization associée
async function updatePlanTier(userId: string, planTier: string, stripeCustomerId?: string | null, stripeSubscriptionId?: string | null) {
  const supabaseAdmin = getSupabaseAdmin();
  const updateData: Record<string, unknown> = { plan_tier: planTier };
  if (stripeCustomerId !== undefined) updateData.stripe_customer_id = stripeCustomerId;
  if (stripeSubscriptionId !== undefined) updateData.stripe_subscription_id = stripeSubscriptionId;

  const { data: updatedProfile, error } = await supabaseAdmin
    .from("profiles")
    .update(updateData)
    .eq("id", userId)
    .select("organization_id")
    .single();

  if (error) {
    console.error("Erreur mise à jour profiles:", error.message);
    return;
  }
  console.log(`✅ profiles.plan_tier = ${planTier} pour user ${userId}`);

  if (updatedProfile?.organization_id) {
    const { error: orgError } = await supabaseAdmin
      .from("organizations")
      .update({ plan_tier: planTier })
      .eq("id", updatedProfile.organization_id);
    if (orgError) {
      console.error("Erreur mise à jour organizations:", orgError.message);
    } else {
      console.log(`✅ organizations.plan_tier = ${planTier}`);
    }
  }
}

// Helper : retrouver userId depuis stripe_customer_id quand client_reference_id absent
async function userIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text();
          const signature = request.headers.get("stripe-signature");

          if (!signature) {
            return new Response("No signature", { status: 400 });
          }

          const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
          if (!webhookSecret) {
            console.warn("⚠️ STRIPE_WEBHOOK_SECRET non configuré.");
            return new Response("Webhook secret not configured", { status: 400 });
          }

          const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

          switch (event.type) {
            // ─── Nouveau checkout réussi ─────────────────────────────────────
            case "checkout.session.completed": {
              const session = event.data.object;
              const userId = session.client_reference_id || session.metadata?.['user_id'];
              const planTier = session.metadata?.['plan_tier'] || "pro";

              console.log("✅ checkout.session.completed:", session.customer_email, "→", planTier);

              if (userId) {
                await updatePlanTier(userId, planTier, session.customer as string, session.subscription as string);
              } else {
                console.warn("⚠️ userId manquant dans la session Stripe.");
              }
              break;
            }

            // ─── Abonnement mis à jour (downgrade / upgrade) ─────────────────
            // FIX B4 : gérer les changements de plan en cours d'abonnement
            case "customer.subscription.updated": {
              const sub = event.data.object;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
              const userId = await userIdFromCustomer(customerId);

              if (!userId) {
                console.warn("⚠️ customer.subscription.updated : aucun profil trouvé pour customer", customerId);
                break;
              }

              // Lire le plan depuis les métadonnées ou l'item de prix
              const planTier: string = (sub.metadata?.['plan_tier']) ||
                (sub.items?.data?.[0]?.price?.id === process.env['VITE_STRIPE_PRICE_AGENCY'] ? "agency" :
                  sub.items?.data?.[0]?.price?.id === process.env['VITE_STRIPE_PRICE_PRO'] ? "pro" : "solo");

              console.log("🔄 customer.subscription.updated → plan:", planTier, "status:", sub.status);

              // Remettre en solo si l'abonnement est suspendu / incomplet
              const effectivePlan = (sub.status === "active" || sub.status === "trialing") ? planTier : "solo";
              await updatePlanTier(userId, effectivePlan);
              break;
            }

            // ─── Abonnement résilié ──────────────────────────────────────────
            // FIX B4 : sans ce handler, les utilisateurs gardent Pro/Agency à vie
            // après résiliation — CRITIQUE pour le modèle freemium.
            case "customer.subscription.deleted": {
              const sub = event.data.object;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
              const userId = await userIdFromCustomer(customerId);

              if (!userId) {
                console.warn("⚠️ customer.subscription.deleted : aucun profil trouvé pour customer", customerId);
                break;
              }

              console.log("❌ customer.subscription.deleted : retour en solo pour user", userId);
              await updatePlanTier(userId, "solo", undefined, null);
              break;
            }

            // ─── Facture payée (renouvellement mensuel) ──────────────────────
            case "invoice.paid": {
              const invoice = event.data.object;
              console.log("✅ Facture d'abonnement payée pour:", invoice.customer_email);
              break;
            }

            // ─── Échec de paiement ───────────────────────────────────────────
            case "invoice.payment_failed": {
              const invoice = event.data.object;
              // TODO phase 2 : envoyer un email de relance de paiement via Resend
              console.error("❌ Échec du paiement pour:", invoice.customer_email);
              break;
            }

            default:
              console.log(`Unhandled event type ${event.type}`);
          }

          return new Response(JSON.stringify({ received: true }), { status: 200 });
        } catch (err: any) {
          console.error("Webhook Error:", err.message);
          // Ne pas exposer les détails internes au client.
          return new Response("Webhook Error", { status: 400 });
        }
      },
    },
  },
});
