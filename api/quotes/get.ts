import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.query;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Préfère les variables sans préfixe VITE_ (jamais exposées au client par
  // construction) ; on garde le fallback VITE_ tant que les nouvelles
  // variables ne sont pas encore ajoutées dans les réglages Vercel.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase configuration");
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Le devis est identifié UNIQUEMENT par son token public (UUID aléatoire,
    // impossible à deviner) — jamais par son numéro, qui est séquentiel.
    const { data: quote, error: fetchError } = await supabaseAdmin
      .from("quotes")
      .select("payload, organization_id")
      .eq("payload->>publicToken", token)
      .single();

    if (fetchError || !quote) {
      console.error("Failed to fetch quote:", fetchError);
      return res.status(404).json({ error: "Quote not found" });
    }

    // On renvoie aussi les infos de l'entreprise (nom, logo, email) pour que
    // la page publique du portail puisse s'afficher correctement même quand
    // le lien a été copié tel quel (sans les paramètres q/c encodés dans
    // l'URL générée par l'email) — sinon la page plantait faute de données.
    let company: Record<string, unknown> | null = null;
    if (quote.organization_id) {
      const { data: org } = await supabaseAdmin
        .from("organizations")
        .select("payload")
        .eq("id", quote.organization_id)
        .single();
      company = (org?.payload as Record<string, unknown>) ?? null;
    }

    return res.status(200).json({ quote: quote.payload, company });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
