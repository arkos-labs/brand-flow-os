import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Construit les headers à envoyer aux endpoints API sécurisés. Ajoute le
 * token d'authentification (JWT Supabase) dans le header Authorization pour
 * que le serveur puisse vérifier la session au lieu de faire confiance à un
 * `userId` fourni par le client.
 */
export function authHeaders(
  session: { access_token?: string | null } | null,
  extra: Record<string, string> = {},
): Record<string, string> {
  const headers: Record<string, string> = { ...extra };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}
