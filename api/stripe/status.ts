// api/stripe/status.ts
import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Stripe non configuré" });

  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId manquant" });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer stripe_subscription_id via profile → organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", userId)
      .single();

    if (!profile?.organization_id) return res.status(404).json({ error: "Organisation introuvable" });

    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_subscription_id, stripe_customer_id")
      .eq("id", profile.organization_id)
      .single();

    if (!org?.stripe_subscription_id) return res.status(404).json({ error: "Aucun abonnement actif" });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });
    const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);

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
