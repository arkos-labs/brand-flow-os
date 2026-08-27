import { createFileRoute } from "@tanstack/react-router";
import { stripe, isStripeEnabled } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/stripe/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isStripeEnabled()) {
          return new Response(JSON.stringify({ error: "Stripe non configuré" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const body = await request.json();
          const { priceId, planName, email, successUrl, cancelUrl } = body;

          // Vérifie la session serveur : on utilise l'id authentifié, jamais
          // le `userId` du corps (falsifiable). SÉCURITÉ (IDOR).
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const userId = auth.userId;

          if (!priceId) {
            return new Response(JSON.stringify({ error: "priceId manquant (le forfait n'a pas été spécifié)" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          let hasCustomer = false;
          let customerId = undefined;
          
          if (userId) {
            const supabase = getSupabaseAdmin();
            const { data: org } = await supabase
              .from("organizations")
              .select("stripe_customer_id")
              .eq("owner_id", userId)
              .single();
              
            if (org?.stripe_customer_id) {
              hasCustomer = true;
              customerId = org.stripe_customer_id;
            }
          }

          const sessionOptions: any = {
            payment_method_types: ["card"],
            line_items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
            mode: "subscription",
            subscription_data: (planName === "pro" || planName === "agency") && !hasCustomer ? {} : undefined,
            success_url: successUrl || request.headers.get("referer") || "http://localhost:5173",
            cancel_url: cancelUrl || request.headers.get("referer") || "http://localhost:5173",
            metadata: {
              source: "saas_subscription",
              plan_tier: planName || "pro",
            },
          };
          
          if (customerId) {
            sessionOptions.customer = customerId;
          } else if (email) {
            sessionOptions.customer_email = email;
          }
          
          if (userId) {
            sessionOptions.client_reference_id = userId;
            sessionOptions.metadata.user_id = userId;
          }

          let session;
          try {
            session = await stripe.checkout.sessions.create(sessionOptions);
          } catch (err: any) {
            // Si le client Stripe n'existe plus (ex: supprimé manuellement ou passage Live/Test), on le détache et on réessaie
            if (err.message && err.message.includes("No such customer")) {
              console.warn("Client Stripe introuvable, création d'un nouveau client.");
              if (userId) {
                const supabase = getSupabaseAdmin();
                await supabase.from("organizations").update({ stripe_customer_id: null }).eq("owner_id", userId);
              }
              delete sessionOptions.customer;
              if (email) {
                sessionOptions.customer_email = email;
              }
              session = await stripe.checkout.sessions.create(sessionOptions);
            } else {
              throw err;
            }
          }

          return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err: any) {
          console.error("Erreur Stripe Checkout:", err);
          return new Response(JSON.stringify({ error: err.message || "Erreur serveur" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
