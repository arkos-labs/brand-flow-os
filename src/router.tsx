import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// ── Résilience aux déploiements ────────────────────────────────────────────
// Après chaque déploiement Vercel, les anciens fichiers JS (hash dans le nom,
// ex: clients-C0qPS_kT.js) sont supprimés du serveur. Si un utilisateur a
// laissé l'onglet ouvert (ou vient d'un lien en cache) et navigue vers une
// route chargée en lazy (code-splitting), le navigateur tente de récupérer
// l'ancien chunk qui n'existe plus → "Failed to fetch dynamically imported
// module". Vite déclenche l'évènement "vite:preloadError" dans ce cas : on
// l'intercepte pour recharger la page une seule fois et récupérer la
// dernière version des assets, au lieu de laisser l'utilisateur bloqué.
if (typeof window !== "undefined") {
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const key = "cq-reload-after-preload-error";
    if (sessionStorage.getItem(key)) return; // évite une boucle infinie si le déploiement est réellement cassé
    sessionStorage.setItem(key, "1");
    window.location.reload();
  });
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
