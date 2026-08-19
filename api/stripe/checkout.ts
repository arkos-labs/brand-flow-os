// Vercel Node.js serverless function — NE PAS passer en 'edge' :
// le package `stripe` utilise des APIs Node.js incompatibles avec l'Edge runtime.
import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(400).json({ error: "Stripe non configuré" });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    const { priceId, planName, email, userId, successUrl, cancelUrl } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: "priceId manquant (le forfait n'a pas été spécifié)" });
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data:
        planName === "pro" || planName === "agency"
          ? { trial_period_days: 14 }
          : undefined,
      customer_email: email,
      success_url: successUrl || "https://clearquote.fr/tableau-de-bord?payment=success",
      cancel_url: cancelUrl || "https://clearquote.fr/tarifs?payment=cancelled",
      metadata: {
        source: "saas_subscription",
        plan_tier: planName || "pro",
        ...(userId ? { user_id: userId } : {}),
      },
      ...(userId ? { client_reference_id: userId } : {}),
    };

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Erreur Stripe Checkout:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
