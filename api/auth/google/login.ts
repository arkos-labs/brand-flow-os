import { VercelRequest, VercelResponse } from "@vercel/node";
import { randomBytes } from "crypto";

// Chemins internes autorisés pour la redirection post-connexion Google.
// Empêche un état falsifié de rediriger vers un domaine externe (open redirect).
const ALLOWED_RETURN_PATHS = new Set(["/parametres", "/rendez-vous"]);

function safeReturnTo(value: string): string {
  return ALLOWED_RETURN_PATHS.has(value) ? value : "/parametres";
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const orgId = typeof req.query.orgId === "string" ? req.query.orgId : "";
  // Où rediriger une fois le token obtenu (ex: /parametres ou /rendez-vous).
  const returnTo = safeReturnTo(
    typeof req.query.returnTo === "string" ? req.query.returnTo : "/parametres",
  );

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return res.status(500).send("Missing Google Client ID or Redirect URI");
  }

  // Nonce anti-CSRF : généré côté serveur, posé en cookie httpOnly, et
  // renvoyé par Google dans `state`. Le callback vérifie que les deux
  // correspondent avant d'échanger le code — bloque le CSRF sur le flux OAuth.
  const nonce = randomBytes(16).toString("hex");
  res.setHeader(
    "Set-Cookie",
    `go_state=${nonce}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
  );

  // gmail.send : envoi d'emails (devis/factures)
  // calendar.readonly : lecture des rendez-vous (Google Calendar / Appointment Schedules)
  const scope = encodeURIComponent(
    "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly email profile",
  );
  const state = encodeURIComponent(
    Buffer.from(JSON.stringify({ o: orgId, r: returnTo, n: nonce })).toString("base64url"),
  );
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
