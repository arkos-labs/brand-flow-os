// Vercel Node.js — bodyParser DÉSACTIVÉ : Stripe exige le body brut pour la vérification de signature.
import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "nodejs",
  api: { bodyParser: false },
};

function getRawBody(req: VercelRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => { data += chunk; });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!webhookSecret || !stripeKey) {
    console.error("⚠️ STRIPE_WEBHOOK_SECRET ou STRIPE_SECRET_KEY manquant.");
    return res.status(400).json({ error: "Configuration Stripe manquante" });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-01-27.acacia" as any });

  let event: Stripe.Event;
  try {
    const rawBody = await getRawBody(req);
    const signature = req.headers["stripe-signature"] as string;
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature invalide:", err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("⚠️ Variables Supabase admin manquantes.");
    return res.status(500).json({ error: "Configuration Supabase manquante" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id || session.metadata?.user_id;
      const planTier = session.metadata?.plan_tier || "pro";

      console.log("✅ checkout.session.completed — email:", session.customer_email, "plan:", planTier);

      if (!userId) {
        console.warn("⚠️ userId manquant dans la session Stripe.");
        break;
      }

      // 1. Récupérer l'organization_id depuis profiles
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (profileError || !profileData?.organization_id) {
        console.error("❌ Profil introuvable pour userId:", userId, profileError?.message);
        break;
      }

      const orgId = profileData.organization_id;

      // 2. Mettre à jour organizations (pas profiles !)
      const { error: orgError } = await supabase
        .from("organizations")
        .update({
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          plan_tier: planTier,
        })
        .eq("id", orgId);

      if (orgError) {
        console.error("❌ Erreur mise à jour organization:", orgError.message);
      } else {
        console.log(`✅ Organization ${orgId} mise à jour — plan: ${planTier}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      // Rétrograder au plan solo si l'abonnement est annulé
      const { error } = await supabase
        .from("organizations")
        .update({ plan_tier: "solo", stripe_subscription_id: null })
        .eq("stripe_customer_id", sub.customer as string);

      if (error) console.error("❌ Erreur rétrogradation plan:", error.message);
      else console.log("✅ Abonnement annulé — plan remis à solo");
      break;
    }

    case "invoice.paid":
      console.log("✅ Facture payée pour:", (event.data.object as Stripe.Invoice).customer_email);
      break;

    case "invoice.payment_failed":
      console.log("❌ Échec paiement pour:", (event.data.object as Stripe.Invoice).customer_email);
      break;

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return res.status(200).json({ received: true });
}
