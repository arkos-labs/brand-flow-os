import Stripe from "stripe";
import fs from "fs";
import path from "path";

// On s'assure que la clé est bien passée
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("ERREUR: Veuillez définir STRIPE_SECRET_KEY dans votre environnement.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

async function main() {
  console.log("⏳ Création du Webhook sur Stripe...");

  try {
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: "https://devie-ia.vercel.app/api/stripe/webhook",
      enabled_events: [
        "checkout.session.completed",
      ],
    });

    console.log("✅ Webhook créé avec succès !");
    console.log("URL:", webhookEndpoint.url);
    console.log("Secret (whsec_...):", webhookEndpoint.secret);

    // Mettre à jour .env.local
    const envPath = path.join(process.cwd(), ".env.local");
    let envContent = "";
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }

    if (envContent.includes("STRIPE_WEBHOOK_SECRET=")) {
      envContent = envContent.replace(/STRIPE_WEBHOOK_SECRET=.*/g, `STRIPE_WEBHOOK_SECRET="${webhookEndpoint.secret}"`);
    } else {
      envContent += `\nSTRIPE_WEBHOOK_SECRET="${webhookEndpoint.secret}"\n`;
    }

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Fichier .env.local mis à jour avec le secret du Webhook.");
  } catch (error) {
    console.error("❌ Erreur lors de la création du Webhook:", error.message);
  }
}

main();
