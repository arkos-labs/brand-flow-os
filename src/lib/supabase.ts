import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env['VITE_SUPABASE_URL'] as string;
const SUPABASE_ANON_KEY = import.meta.env['VITE_SUPABASE_ANON_KEY'] as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Retourne l'organization_id de l'utilisateur connecté (via profiles).
 *
 * Si le profil n'a pas encore d'organisation liée (ex: inscription avec
 * confirmation email — l'organisation n'était alors jamais créée, ou créée
 * mais jamais reliée au profil), on en crée une par défaut et on la lie
 * automatiquement ici. Sans ça, l'utilisateur reste bloqué avec une
 * organisation "null" : rien ne se charge et rien ne s'enregistre, même si
 * l'appli semble fonctionner normalement (c'était la cause du bug "je ne
 * vois rien sur la plateforme").
 */
export async function getMyOrgId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  if (profile?.organization_id) return profile.organization_id;

  // Pas d'organisation liée → on en crée une par défaut et on la lie au profil.
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({ name: "Mon entreprise", owner_id: user.id })
    .select("id")
    .single();

  if (orgError || !newOrg) {
    console.error("Impossible de créer l'organisation par défaut :", orgError);
    return null;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ organization_id: newOrg.id })
    .eq("id", user.id);

  if (profileError) {
    console.error("Impossible de lier l'organisation au profil :", profileError);
    return null;
  }

  return newOrg.id;
}
