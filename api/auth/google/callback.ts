import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const error = typeof req.query.error === "string" ? req.query.error : null;
  const rawState = typeof req.query.state === "string" ? req.query.state : "";

  // state = "orgId::returnTo" (returnTo par défaut = /parametres pour compat
  // avec les connexions faites avant l'ajout du scope Calendar).
  const [, returnToRaw] = decodeURIComponent(rawState).split("::");
  const returnTo = returnToRaw || "/parametres";

  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host;
  const baseUrl = `${proto}://${host}`;
  const redirectUrl = new URL(returnTo, baseUrl);

  if (error || !code) {
    redirectUrl.searchParams.set("google_error", error || "no_code");
    return res.redirect(302, redirectUrl.toString());
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return res.status(500).send("Missing Google Client Credentials");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.refresh_token) {
      console.error("Google Token Error:", tokenData);
      redirectUrl.searchParams.set("google_error", "failed_to_get_refresh_token");
      return res.redirect(302, redirectUrl.toString());
    }

    // Redirige vers la page d'origine avec le refresh token.
    // Le frontend le sauvegarde en DB et nettoie l'URL.
    redirectUrl.searchParams.set("google_token", tokenData.refresh_token);

    return res.redirect(302, redirectUrl.toString());
  } catch (err: any) {
    console.error("Error exchanging code for token:", err);
    redirectUrl.searchParams.set("google_error", "server_error");
    return res.redirect(302, redirectUrl.toString());
  }
}
