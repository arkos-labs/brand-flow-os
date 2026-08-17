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

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

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
      .select("payload")
      .eq("payload->>publicToken", token)
      .single();

    if (fetchError || !quote) {
      console.error("Failed to fetch quote:", fetchError);
      return res.status(404).json({ error: "Quote not found" });
    }

    return res.status(200).json({ quote: quote.payload });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
