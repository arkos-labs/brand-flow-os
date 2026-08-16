import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { quoteNumber, orgId, reason, refusedAt } = req.body;

  if (!quoteNumber || !orgId) {
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
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Vérifier que le devis appartient bien à cette organisation
    const { data: quote, error: fetchError } = await supabaseAdmin
      .from("quotes")
      .select("id, payload")
      .eq("number", quoteNumber)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !quote) {
      console.error("Failed to fetch quote:", fetchError);
      return res.status(404).json({ error: "Quote not found" });
    }

    // Mettre à jour le payload pour les routes qui lisent le JSON brut
    const payload = (quote.payload as Record<string, unknown>) ?? {};
    payload.status = { fr: "Refusé", en: "Refused" };
    payload.refusedAt = refusedAt ?? new Date().toISOString();
    if (reason) payload.refuseReason = reason;

    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "refused",
        payload,
      })
      .eq("number", quoteNumber)
      .eq("organization_id", orgId);

    if (updateError) {
      console.error("Failed to update quote:", updateError);
      return res.status(500).json({ error: "Failed to update quote" });
    }

    return res.status(200).json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("API Error:", message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
