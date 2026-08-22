import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Stripe non configuré" });

  try {
    const { subscriptionId, userId } = req.body;

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let stripeSubscriptionId = subscriptionId;

    if (!stripeSubscriptionId && userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("stripe_subscription_id")
          .eq("id", profile.organization_id)
          .single();
        stripeSubscriptionId = org?.stripe_subscription_id;
      }
    }

    if (!stripeSubscriptionId) {
      return res.status(200).json({ status: "none", plan: "solo" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    return res.status(200).json({
      status: subscription.status,
      cancel_at_period_end: subscription.cancel_at_period_end,
      current_period_end: subscription.current_period_end,
      current_period_start: subscription.current_period_start,
    });

  } catch (err: any) {
    console.error("Erreur Stripe status:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
