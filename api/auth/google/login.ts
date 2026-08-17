import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orgId = typeof req.query.orgId === "string" ? req.query.orgId : "";
  // Où rediriger une fois le token obtenu (ex: /parametres ou /rendez-vous).
  const returnTo =
    typeof req.query.returnTo === "string" ? req.query.returnTo : "/parametres";

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).send("Missing Google Client ID or Redirect URI");
  }

  // gmail.send : envoi d'emails (devis/factures)
  // calendar.readonly : lecture des rendez-vous (Google Calendar / Appointment Schedules)
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly email profile",
  );
  // state encode orgId + returnTo pour que le callback sache où rediriger.
  const state = encodeURIComponent(`${orgId}::${returnTo}`);
  const authUrl =
    `https://accounts.google.com/o/oauth2/v2/auth` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&access_type=offline` +
    `&prompt=consent` +
    `&state=${state}`;

  return res.redirect(302, authUrl);
}
