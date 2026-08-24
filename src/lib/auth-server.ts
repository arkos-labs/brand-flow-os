/**
 * auth-server.ts — Vérification d'authentification côté serveur.
 *
 * Les endpoints API qui utilisent le client "service role" (qui bypass RLS)
 * ne doivent JAMAIS faire confiance à un `userId` reçu dans le corps de la
 * requête : un attaquant pourrait le falsifier pour agir au nom d'un autre
 * compte (Broken Object Level Authorization). À la place, ils doivent
 * vérifier le token d'authentification (JWT) de l'utilisateur connecté et
 * utiliser l'id que Supabase renvoie, qui ne peut pas être falsifié.
 */
import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Récupère le token d'authentification de la requête.
 * Ordre : header `Authorization: Bearer <token>` puis cookie `sb-access-token`.
 */
export function getAccessToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) {
    return auth.slice(7).trim() || null;
  }
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)sb-access-token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Vérifie le token et retourne l'id de l'utilisateur authentifié.
 * Retourne null si le token est absent ou invalide.
 */
export async function getAuthenticatedUserId(
  request: Request,
): Promise<string | null> {
  const token = getAccessToken(request);
  if (!token) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return data.user.id;
  } catch {
    return null;
  }
}

/**
 * Retourne l'id authentifié, ou bien répond 401 et retourne null.
 */
export async function requireAuthenticatedUserId(
  request: Request,
): Promise<{ userId: string } | { error: Response }> {
  const userId = await getAuthenticatedUserId(request);
  if (!userId) {
    return {
      error: new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }
  return { userId };
}
