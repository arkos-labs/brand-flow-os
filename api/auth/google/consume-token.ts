import { VercelRequest, VercelResponse } from "@vercel/node";

function parseCookie(header: string | undefined, name: string): string | null {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Consomme le cookie httpOnly de très courte durée posé par
// /api/auth/google/callback juste après l'échange OAuth. Le front-end
// appelle cet endpoint une seule fois (juste après avoir vu
// ?google_connected=1 dans l'URL) pour récupérer le refresh token et
// l'enregistrer en base — le token ne transite jamais par l'URL ni par
// window.location, donc jamais par l'historique navigateur ou les logs.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = parseCookie(req.headers.cookie, "go_token");

  // Le cookie est toujours effacé, que le token ait été trouvé ou non (usage unique).
  res.setHeader(
    "Set-Cookie",
    "go_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/auth/google",
  );

  if (!token) {
    return res.status(404).json({ error: "no_token" });
  }

  return res.status(200).json({ token });
}
