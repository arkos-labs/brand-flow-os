import Stripe from "stripe";

export const stripe = new Stripe(process.env['STRIPE_SECRET_KEY'] || "dummy-key", {
  apiVersion: "2025-01-27.acacia" as any, // fallback pour la version actuelle supportée par le SDK
  typescript: true,
});

export function isStripeEnabled() {
  return !!process.env['STRIPE_SECRET_KEY'];
}
