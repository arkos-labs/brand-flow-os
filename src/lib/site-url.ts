// src/lib/site-url.ts
// Résolution du domaine public de l'application, utilisé pour les URLs
// absolues générées côté serveur (ex. URL de retour du portail Stripe).
//
// Priorité :
//   1. SITE_URL (recommandé — à définir au déploiement, ex. https://clearquote.fr)
//   2. PUBLIC_SITE_URL (variante)
//   3. VERCEL_URL (domaine injecté automatiquement par Vercel, ex. app.vercel.app)
//   4. http://localhost:5173 (développement local)
//
// Ne jamais hardcoder un domaine ici : il est piloté par l'environnement.
export function getSiteUrl(): string {
  const fromEnv =
    process.env["SITE_URL"] ||
    process.env["PUBLIC_SITE_URL"] ||
    (process.env["VERCEL_URL"] ? `https://${process.env["VERCEL_URL"]}` : "");
  return (fromEnv || "http://localhost:5173").replace(/\/+$/, "");
}
