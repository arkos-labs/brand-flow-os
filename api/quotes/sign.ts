import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { quoteNumber, signatureData, orgId } = req.body;

  if (!quoteNumber || !signatureData || !orgId) {
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

    // We fetch the current quote from the database to update its status
    const { data: quote, error: fetchError } = await supabaseAdmin
      .from("quotes")
      .select("payload")
      .eq("number", quoteNumber)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !quote) {
      console.error("Failed to fetch quote:", fetchError);
      return res.status(404).json({ error: "Quote not found" });
    }

    const payload = quote.payload as any;
    payload.status = { fr: "Signé", en: "Signed" };
    payload.signedAt = signatureData.signedAt;
    payload.signatureData = signatureData;

    // Update the quote
    const { error: updateError } = await supabaseAdmin
      .from("quotes")
      .update({
        status: "accepted",
        payload: payload,
      })
      .eq("number", quoteNumber)
      .eq("organization_id", orgId);

    if (updateError) {
      console.error("Failed to update quote:", updateError);
      return res.status(500).json({ error: "Failed to update quote" });
    }

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error("API Error:", err.message);
    return res.status(500).json({ error: "Internal server error" });
  }
}
