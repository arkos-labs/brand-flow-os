import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

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

          const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
          if (!webhookSecret) {
            console.warn("⚠️ STRIPE_WEBHOOK_SECRET non configuré.");
            return new Response("Webhook secret not configured", { status: 400 });
          }

          const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              // C'est ici que l'on pourra enregistrer que l'utilisateur a payé son abonnement
              // dans Supabase (par exemple, en mettant à jour la table "organizations" ou "profiles").
              const userId = session.client_reference_id || session.metadata?.user_id;
              const planTier = session.metadata?.plan_tier || "pro";

              console.log("✅ Checkout session completed pour l'email:", session.customer_email);
              console.log("Subscription ID:", session.subscription);
              
              const supabaseAdmin = getSupabaseAdmin();

              if (userId) {
                // 1. Mettre à jour profiles avec le nouveau plan
                const { data: updatedProfile, error } = await supabaseAdmin.from("profiles")
                  .update({ 
                     stripe_customer_id: session.customer,
                     stripe_subscription_id: session.subscription,
                     plan_tier: planTier
                  })
                  .eq("id", userId)
                  .select("organization_id")
                  .single();
                  
                if (error) {
                  console.error("Erreur lors de la mise à jour Supabase (profiles):", error.message);
                } else {
                  console.log("✅ Plan mis à jour dans profiles :", planTier);

                  // FIX INCOHÉRENCE DB : aligner organizations.plan_tier sur profiles.plan_tier
                  // pour éviter la divergence signalée dans le rapport QA.
                  if (updatedProfile?.organization_id) {
                    const { error: orgError } = await supabaseAdmin.from("organizations")
                      .update({ plan_tier: planTier })
                      .eq("id", updatedProfile.organization_id);
                    if (orgError) {
                      console.error("Erreur lors de la mise à jour Supabase (organizations):", orgError.message);
                    } else {
                      console.log("✅ Plan mis à jour dans organizations :", planTier);
                    }
                  }
                }
              } else {
                console.warn("⚠️ Impossible de lier l'abonnement : userId manquant dans la session Stripe.");
              }
              break;
            }
            case "invoice.paid": {
              const invoice = event.data.object;
              console.log("✅ Facture d'abonnement payée pour:", invoice.customer_email);
              break;
            }
            case "invoice.payment_failed": {
              const invoice = event.data.object;
              console.log("❌ Échec du paiement pour:", invoice.customer_email);
              break;
            }
            default:
              console.log(`Unhandled event type ${event.type}`);
          }

          return new Response(JSON.stringify({ received: true }), { status: 200 });
        } catch (err: any) {
          console.error("Webhook Error:", err.message);
          // Ne pas exposer les détails internes (err.message) au client.
          return new Response("Webhook Error", { status: 400 });
        }
      },
    },
  },
});
