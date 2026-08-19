import { createFileRoute } from "@tanstack/react-router";
import { openai, isOpenAIEnabled } from "@/lib/openai";

export const Route = createFileRoute("/api/ai/ocr-expense")({
  server: {
    handlers: {
      POST: async ({ request }) => {
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
