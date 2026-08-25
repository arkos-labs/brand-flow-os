// src/routes/api/stripe/webhook.ts
import { createFileRoute } from "@tanstack/react-router";
import { stripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// Map price IDs → plan tier (côté serveur, pas d'env VITE_ ici)
const PRICE_TO_PLAN: Record<string, string> = {
  [process.env['VITE_STRIPE_PRICE_PRO'] || "price_1U6E5F7tsPmmReQdupg0eEY2"]: "pro",
  [process.env['VITE_STRIPE_PRICE_AGENCY'] || "price_1U6E5F7tsPmmReQdP1CVwC6X"]: "agency",
  "price_1U8SWn7tsPmmReQdfSCfN8II": "agency", // Test Agency ID fallback
};

function getPlanFromPriceId(priceId: string | undefined): string | null {
  if (!priceId) return null;
  return PRICE_TO_PLAN[priceId] ?? null;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

// FIX : stripe_customer_id est sur la table organizations, pas profiles
async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const { data } = await getSupabaseAdmin()
    .from("organizations")
    .select("owner_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data?.owner_id ?? null;
}

async function syncPlanTier(userId: string, planTier: string) {
  const supabase = getSupabaseAdmin();
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("profiles").update({ plan_tier: planTier }).eq("id", userId),
    supabase.from("organizations").update({ plan_tier: planTier }).eq("owner_id", userId),
  ]);
  if (e1) console.error("syncPlanTier profiles:", e1.message);
  if (e2) console.error("syncPlanTier organizations:", e2.message);
  console.log(`✅ Plan sync: user=${userId} → ${planTier}`);
}

// ──────────────────────────────────────────────
// Route
// ──────────────────────────────────────────────

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const sig = request.headers.get("stripe-signature");
        const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];

        if (!sig || !webhookSecret) {
          console.error("Webhook: signature ou secret manquant");
          return new Response("Missing signature", { status: 400 });
        }

        const rawBody = await request.text();
        let event: any;

        try {
          event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
        } catch (err: any) {
          console.error("Webhook signature invalide:", err.message);
          return new Response(`Webhook Error: ${err.message}`, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object;
              const userId = session.client_reference_id || session.metadata?.['user_id'];
              const customerId = session.customer as string;

              if (!userId) {
                console.warn("⚠️ checkout.session.completed: userId manquant");
                break;
              }

              if (customerId) {
                await supabase
                  .from("organizations")
                  .update({ stripe_customer_id: customerId })
                  .eq("owner_id", userId);
              }

              if (session.subscription) {
                const sub = await stripe.subscriptions.retrieve(session.subscription as string);
                const priceId = sub.items.data[0]?.price.id;
                const planTier = getPlanFromPriceId(priceId) || session.metadata?.['plan_tier'] || "pro";
                console.log(`✅ checkout.session.completed: user=${userId} → ${planTier}`);
                await syncPlanTier(userId, planTier);
              }
              break;
            }

            case "customer.subscription.updated": {
              const sub = event.data.object;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
              const userId = await getUserIdFromCustomer(customerId);

              if (!userId) {
                console.warn("⚠️ subscription.updated: aucun user pour customer", customerId);
                break;
              }

              if (sub.cancel_at_period_end) {
                console.log(`Subscription ${sub.id} annulée en fin de période — plan conservé`);
                break;
              }

              const priceId = sub.items?.data?.[0]?.price?.id;
              const planTier = getPlanFromPriceId(priceId) || sub.metadata?.['plan_tier'];

              if (!planTier) {
                console.warn("⚠️ subscription.updated: priceId inconnu:", priceId);
                break;
              }

              const effectivePlan = (sub.status === "active" || sub.status === "trialing")
                ? planTier
                : "solo";

              console.log(`🔄 subscription.updated: user=${userId} → ${effectivePlan} (status: ${sub.status})`);
              await syncPlanTier(userId, effectivePlan);
              break;
            }

            case "customer.subscription.deleted": {
              const sub = event.data.object;
              const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
              const userId = await getUserIdFromCustomer(customerId);

              if (!userId) {
                console.warn("⚠️ subscription.deleted: aucun user pour customer", customerId);
                break;
              }

              console.log(`❌ subscription.deleted: user=${userId} → solo`);
              await syncPlanTier(userId, "solo");
              break;
            }

            case "invoice.paid": {
              const invoice = event.data.object;
              console.log("✅ Facture payée pour:", invoice.customer_email);
              break;
            }

            case "invoice.payment_failed": {
              const invoice = event.data.object;
              const customerId = invoice.customer as string;
              const userId = await getUserIdFromCustomer(customerId);
              console.error(`❌ Échec paiement pour: ${invoice.customer_email}`);

              if (userId) {
                try {
                  await supabase.rpc("insert_audit_log", {
                    p_user_id: userId,
                    p_action: "payment_failed",
                    p_resource_type: "organization",
                    p_resource_id: null,
                    p_metadata: { invoice_id: invoice.id, amount_due: invoice.amount_due },
                    p_ip_address: "stripe-webhook",
                  });
                } catch (auditErr) {
                  // Log d'audit best-effort : on ne bloque pas le webhook.
                  console.error("Audit log failed (payment_failed):", auditErr);
                }
              }
              break;
            }

            default:
              console.log(`Unhandled event: ${event.type}`);
          }
        } catch (err: any) {
          console.error(`Erreur traitement webhook ${event.type}:`, err);
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
