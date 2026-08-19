// Vercel Node.js serverless function — NE PAS passer en 'edge' :
// le package `stripe` utilise des APIs Node.js incompatibles avec l'Edge runtime.
import Stripe from "stripe";

export const config = {
  runtime: "nodejs",
};

function isStripeEnabled() {
  return !!process.env.STRIPE_SECRET_KEY;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isStripeEnabled()) {
    return new Response(JSON.stringify({ error: "Stripe non configuré" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-01-27.acacia" as any,
    });

    const body = await req.json();
    const { priceId, planName, email, userId, successUrl, cancelUrl } = body;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "priceId manquant (le forfait n'a pas été spécifié)" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
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

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erreur Stripe Checkout:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erreur serveur" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
