import { createFileRoute } from "@tanstack/react-router";
import { openai, isOpenAIEnabled } from "@/lib/openai";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/ai/ocr-expense")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Auth obligatoire : l'endpoint appelle l'API OpenAI (coût) et peut
        // analyser une URL arbitraire. Seuls les utilisateurs connectés le font.
        const auth = await requireAuthenticatedUserId(request);
        if ("error" in auth) return auth.error;

        if (!isOpenAIEnabled()) {
          return new Response(JSON.stringify({ error: "OpenAI non configuré" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const { imageUrl } = await request.json(); // Base64 ou URL publique
          if (!imageUrl) {
            return new Response(JSON.stringify({ error: "Image manquante" }), { status: 400 });
          }

          // Sécurité : on n'accepte que du base64 (data:image/...) ou des URLs https.
          // Refuse file://, http://, gopher://… → empêche l'abus SSRF/coût via OpenAI
          // (OpenAI télécharge l'URL côté serveur).
          const isDataUri =
            typeof imageUrl === "string" && /^data:image\/[a-z0-9.+-]+;base64,/i.test(imageUrl);
          const isHttps = typeof imageUrl === "string" && /^https:\/\//i.test(imageUrl);
          if (!isDataUri && !isHttps) {
            return new Response(JSON.stringify({ error: "unsupported_image_url" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Tu es un assistant comptable expert en OCR de reçus et factures. 
Analyse l'image fournie et extrais les informations suivantes au format JSON :
- supplier (nom du fournisseur)
- amount (montant TTC total, nombre)
- tax (montant de la TVA, nombre)
- category (catégorie de dépense : 'hardware', 'software', 'travel', 'meals', 'office', 'services', 'other')
- date (date au format YYYY-MM-DD)
Retourne UNIQUEMENT l'objet JSON.`
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Extrais les données de ce reçu." },
                  { type: "image_url", image_url: { url: imageUrl } }
                ]
              }
            ],
          });

          const content = response.choices[0]?.message.content || "{}";
          let data = {};
          try {
            data = JSON.parse(content.replace(/```json/g, "").replace(/```/g, ""));
          } catch (e) {
            console.error("Erreur parsing JSON OpenAI OCR", e);
          }

          return new Response(JSON.stringify(data), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur OpenAI OCR:", err);
          return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
        }
      },
    },
  },
});
