// api/stripe/portal.ts
import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export const config = { runtime: "nodejs" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.STRIPE_SECRET_KEY) return res.status(400).json({ error: "Stripe non configuré" });

  try {
    const { customerId, userId, returnUrl } = req.body;

    let stripeCustomerId = customerId;

    // Fallback : récupérer le customerId via userId si non fourni
    if (!stripeCustomerId && userId) {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
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
        stripeCustomerId = org?.stripe_customer_id;
      }
    }

    if (!stripeCustomerId) {
      return res.status(400).json({ error: "Aucun compte Stripe trouvé. Avez-vous déjà un abonnement ?" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-01-27.acacia" as any });

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: returnUrl || `${req.headers.origin}/parametres`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Erreur Stripe portal:", err);
    return res.status(500).json({ error: err.message || "Erreur serveur" });
  }
}
