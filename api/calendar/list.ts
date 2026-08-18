import { VercelRequest, VercelResponse } from "@vercel/node";

async function refreshGoogleToken(refreshToken: string) {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId || "",
      client_secret: clientSecret || "",
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error("Google refresh error:", data);
    throw new Error(data.error === "invalid_grant" ? "invalid_grant" : "Impossible de rafraîchir le token Google");
  }
  return data as { access_token: string };
}

// Liste tous les calendriers auxquels le compte Google connecté a accès
// (perso, pro, calendriers d'équipe partagés avec lui, etc.)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Le refresh token voyage dans le corps de la requête, jamais dans l'URL
  // (query string) — évite qu'il finisse dans les logs serveur, l'historique
  // du navigateur ou les headers Referer.
  const body = (req.body ?? {}) as Record<string, unknown>;
  const refreshToken = typeof body.refresh_token === "string" ? body.refresh_token : null;

  if (!refreshToken) {
    return res.status(400).json({ error: "missing_refresh_token" });
  }

  try {
    const { access_token } = await refreshGoogleToken(refreshToken);

    const calRes = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const data = await calRes.json();
    if (!calRes.ok) {
      console.error("Google CalendarList error:", data);
      throw new Error("Impossible de récupérer la liste des calendriers");
    }

    const calendars = (data.items || []).map((cal: any) => ({
      id: cal.id,
      name: cal.summaryOverride || cal.summary,
      primary: !!cal.primary,
    }));

    return res.status(200).json({ calendars });
  } catch (err: any) {
    const message = err.message || "server_error";
    return res.status(message === "invalid_grant" ? 401 : 500).json({ error: message });
  }
}
