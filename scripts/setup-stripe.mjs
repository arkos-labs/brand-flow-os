import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Replace with your actual STRIPE_SECRET_KEY if not in process.env
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error("ERREUR: Veuillez définir STRIPE_SECRET_KEY dans votre environnement avant d'exécuter ce script.");
  console.log("Exemple: STRIPE_SECRET_KEY=sk_test_... node scripts/setup-stripe.mjs");
  process.exit(1);
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2024-06-20",
});

async function createProducts() {
  console.log("⏳ Création des produits sur Stripe...");

  try {
    // 1. Create PRO Plan
    const proProduct = await stripe.products.create({
      name: "ClearQuote Pro",
      description: "Devis et factures illimités, personnalisation complète",
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1999, // 19.99 €
      currency: "eur",
      recurring: { interval: "month" },
      metadata: { plan_tier: "pro" },
    });
    console.log(`✅ Pro Plan créé: ${proPrice.id}`);

    // 2. Create AGENCY Plan
    const agencyProduct = await stripe.products.create({
      name: "ClearQuote Agency",
      description: "Jusqu'à 5 utilisateurs, marque blanche, API",
    });

    const agencyPrice = await stripe.prices.create({
      product: agencyProduct.id,
      unit_amount: 4999, // 49.99 €
      currency: "eur",
      recurring: { interval: "month" },
      metadata: { plan_tier: "agency" },
    });
    console.log(`✅ Agency Plan créé: ${agencyPrice.id}`);

    // 3. Update .env.local
    const envPath = path.resolve(__dirname, "../.env.local");
    let envContent = "";
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    // Append variables if they don't exist
    let newEnvContent = envContent;
    if (!newEnvContent.includes("VITE_STRIPE_PRICE_PRO")) {
      newEnvContent += `\nVITE_STRIPE_PRICE_PRO="${proPrice.id}"`;
    } else {
      newEnvContent = newEnvContent.replace(/VITE_STRIPE_PRICE_PRO=".+"/, `VITE_STRIPE_PRICE_PRO="${proPrice.id}"`);
    }

    if (!newEnvContent.includes("VITE_STRIPE_PRICE_AGENCY")) {
      newEnvContent += `\nVITE_STRIPE_PRICE_AGENCY="${agencyPrice.id}"`;
    } else {
      newEnvContent = newEnvContent.replace(/VITE_STRIPE_PRICE_AGENCY=".+"/, `VITE_STRIPE_PRICE_AGENCY="${agencyPrice.id}"`);
    }

    fs.writeFileSync(envPath, newEnvContent);
    console.log(`✅ Fichier .env.local mis à jour avec les nouveaux prix.`);
    console.log("⚠️ N'oubliez pas de relancer votre serveur de développement.");
  } catch (error) {
    console.error("❌ Erreur lors de la création des produits Stripe:", error.message);
  }
}

createProducts();
