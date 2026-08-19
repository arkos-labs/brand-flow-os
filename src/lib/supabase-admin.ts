import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase "service role" — usage serveur uniquement (jamais importé
 * côté navigateur). Bypass RLS, donc chaque route qui l'utilise doit filtrer
 * elle-même par organization_id / id de devis pour ne jamais exposer les
 * données d'une autre organisation.
 */
export function getSupabaseAdmin() {
  const url = process.env['SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_SERVICE_KEY'];

  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants côté serveur — vérifier les variables d'environnement.",
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
