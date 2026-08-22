import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Stripe non configuré" });

  try {
    const { priceId, planName, email, userId, successUrl, cancelUrl } = req.body;

    if (!priceId) return res.status(400).json({ error: "Price ID manquant" });

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Récupérer le stripe_customer_id existant si disponible
    let existingCustomerId: string | undefined;
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();
      if (profile?.organization_id) {
        const { data: org } = await supabase
          .from("organizations")
          .select("stripe_customer_id")
          .eq("id", profile.organization_id)
          .single();
        existingCustomerId = org?.stripe_customer_id || undefined;
      }
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl || `${req.headers.origin}/parametres?payment=success`,
      cancel_url: cancelUrl || `${req.headers.origin}/parametres?payment=cancelled`,
      metadata: { userId: userId || "", planName: planName || "" },
      subscription_data: {
        metadata: { userId: userId || "", planName: planName || "" },
      },
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (email) {
      sessionParams.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: session.url });

  } catch (err: any) {
    console.error("Erreur Stripe checkout:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
