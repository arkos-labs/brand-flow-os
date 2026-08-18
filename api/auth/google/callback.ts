import { VercelRequest, VercelResponse } from "@vercel/node";

const ALLOWED_RETURN_PATHS = new Set(["/parametres", "/rendez-vous"]);

function safeReturnTo(value: string): string {
  return ALLOWED_RETURN_PATHS.has(value) ? value : "/parametres";
}

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const error = typeof req.query.error === "string" ? req.query.error : null;
  const rawState = typeof req.query.state === "string" ? req.query.state : "";

  // On efface systématiquement le cookie de nonce (usage unique).
  const clearStateCookie = "go_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/";

  let orgId = "";
  let returnTo = "/parametres";
  let stateNonce = "";
  try {
    const decoded = JSON.parse(Buffer.from(decodeURIComponent(rawState), "base64url").toString("utf8"));
    orgId = typeof decoded.o === "string" ? decoded.o : "";
    returnTo = safeReturnTo(typeof decoded.r === "string" ? decoded.r : "/parametres");
    stateNonce = typeof decoded.n === "string" ? decoded.n : "";
  } catch {
    // state invalide/absent → traité comme une tentative sans nonce valide
  }

  const proto = (req.headers["x-forwarded-proto"] as string) || "https";
  const host = req.headers.host;
  const baseUrl = `${proto}://${host}`;
  const redirectUrl = new URL(returnTo, baseUrl);

  const cookieNonce = parseCookie(req.headers.cookie, "go_state");

  if (error || !code) {
    res.setHeader("Set-Cookie", clearStateCookie);
    redirectUrl.searchParams.set("google_error", error || "no_code");
    return res.redirect(302, redirectUrl.toString());
  }

  // Vérification anti-CSRF : le nonce reçu dans `state` doit correspondre
  // exactement au cookie httpOnly posé par /api/auth/google/login.
  if (!stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
    res.setHeader("Set-Cookie", clearStateCookie);
    redirectUrl.searchParams.set("google_error", "invalid_state");
    return res.redirect(302, redirectUrl.toString());
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || process.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    res.setHeader("Set-Cookie", clearStateCookie);
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
      res.setHeader("Set-Cookie", clearStateCookie);
      redirectUrl.searchParams.set("google_error", "failed_to_get_refresh_token");
      return res.redirect(302, redirectUrl.toString());
    }

    // Le refresh token n'est PLUS jamais mis dans l'URL (historique navigateur,
    // logs, headers Referer). Il est posé dans un cookie httpOnly de très
    // courte durée, à usage unique, consommé par /api/auth/google/consume-token
    // juste après la redirection.
    const tokenCookie = `go_token=${encodeURIComponent(tokenData.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=120; Path=/api/auth/google`;
    res.setHeader("Set-Cookie", [clearStateCookie, tokenCookie]);

    redirectUrl.searchParams.set("google_connected", "1");
    return res.redirect(302, redirectUrl.toString());
  } catch (err: any) {
    console.error("Error exchanging code for token:", err);
    res.setHeader("Set-Cookie", clearStateCookie);
    redirectUrl.searchParams.set("google_error", "server_error");
    return res.redirect(302, redirectUrl.toString());
  }
}
