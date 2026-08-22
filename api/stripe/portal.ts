import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Stripe non configuré" });

  // ⚠️ SÉCURITÉ : Liste blanche des price IDs autorisés (empêche l'assignation arbitraire de plan)
  const ALLOWED_PRICE_IDS = [
    "price_1U6E5F7tsPmmReQdupg0eEY2", // Pro 19.99€/mois
    "price_1U6E5F7tsPmmReQdP1CVwC6X", // Agency 49.99€/mois
  ];

  try {
    const { customerId, userId, returnUrl, targetPriceId } = req.body;

    // Validation du targetPriceId côté serveur
    if (targetPriceId && !ALLOWED_PRICE_IDS.includes(targetPriceId)) {
      return res.status(400).json({ error: "Prix non autorisé" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let stripeCustomerId = customerId;
    let stripeSubscriptionId: string | undefined;

    // Récupération du customer/subscription depuis Supabase si nécessaire
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("stripe_customer_id, stripe_subscription_id")
          .eq("id", profile.organization_id)
          .single();

        if (!stripeCustomerId) stripeCustomerId = org?.stripe_customer_id;
        stripeSubscriptionId = org?.stripe_subscription_id;
      }
    }

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "Aucun compte Stripe trouvé. Avez-vous déjà un abonnement ?" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });
    const origin = returnUrl || `${req.headers.origin}/parametres`;

    // Changement de plan avec prorata (upgrade/downgrade)
    if (targetPriceId && stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      const subscriptionItemId = subscription.items.data[0]?.id;

      if (!subscriptionItemId) {
        return res.status(400).json({ error: "Aucun item d'abonnement trouvé" });
      }

      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: origin,
        flow_data: {
          type: "subscription_update_confirm",
          subscription_update_confirm: {
            subscription: stripeSubscriptionId,
            items: [{ id: subscriptionItemId, price: targetPriceId, quantity: 1 }],
          },
          after_completion: {
            type: "redirect",
            redirect: { return_url: origin },
          },
        },
      });

      return res.status(200).json({ url: session.url });
    }

    // Portail standard (gestion générale : annulation, moyens de paiement, etc.)
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: origin,
    });

    return res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error("Erreur Stripe portal:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
