import { createFileRoute } from "@tanstack/react-router";
import { openai, isOpenAIEnabled } from "@/lib/openai";

export const Route = createFileRoute("/api/ai/generate-quote")({
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
          const { prompt } = await request.json();
          if (!prompt) {
            return new Response(JSON.stringify({ error: "Prompt manquant" }), { status: 400 });
          }

          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content: `Tu es un assistant expert en rédaction de devis professionnels. 
Génère un tableau JSON contenant des articles de devis basés sur la description de l'utilisateur.
Le format attendu est un tableau d'objets avec:
- label (description de la prestation)
- qty (quantité, nombre)
- priceHT (prix unitaire HT, nombre)
- vatRate (taux de TVA en %, nombre, généralement 20)
Retourne UNIQUEMENT le tableau JSON sans texte additionnel.`
              },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" } // Optionnel si on force un format spécifique
          });

          const content = response.choices[0]?.message.content || "[]";
          let items = [];
          try {
            // L'API renvoie parfois un objet { items: [...] } ou directement un tableau
            const parsed = JSON.parse(content);
            items = Array.isArray(parsed) ? parsed : (parsed.items || []);
          } catch (e) {
            console.error("Erreur parsing JSON OpenAI", e);
          }

          return new Response(JSON.stringify({ items }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("Erreur OpenAI:", err);
          return new Response(JSON.stringify({ error: "Erreur serveur" }), { status: 500 });
        }
      },
    },
  },
});
