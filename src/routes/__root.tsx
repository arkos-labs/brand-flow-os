import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { LanguageProvider } from "@/lib/i18n";
import { AppShell } from "@/components/AppShell";
import { SupabaseDataProvider, useSupabaseData } from "@/lib/supabase-context";
import { ThemeProvider } from "@/lib/theme";
import { Toaster } from "@/components/ui/sonner";

// Routes publiques (pas besoin d'être connecté)
const PUBLIC_ROUTES = new Set([
  "/",
  "/connexion",
  "/inscription",
  "/mot-de-passe-oublie",
  "/tarifs",
  "/fonctionnalites",
  "/fonctionnement",
  "/centre-aide",
  "/contactez-nous",
  "/conditions-utilisation",
  "/confidentialite",
  "/legal",
  "/plan-site",
  "/mises-a-jour",
  "/nouveautes",
  "/rendez-vous",
  "/benefices",
]);

function isPublicRoute(pathname: string): boolean {
  // Vérifie correspondance exacte OU préfixe (ex: /portail/xxx)
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith("/portail/")) return true;
  return false;
}

// ── Garde d'authentification ─────────────────────────────────────────────────

function AuthGuard({ children }: { children: ReactNode }) {
  const { session, isLoading } = useSupabaseData();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;

    const pathname = location.pathname;

    if (!session && !isPublicRoute(pathname)) {
      // Non connecté → redirige vers /connexion
      navigate({ to: "/connexion", replace: true });
      return;
    }

    if (session && (pathname === "/connexion" || pathname === "/inscription")) {
      // Déjà connecté → redirige vers le tableau de bord
      navigate({ to: "/tableau-de-bord", replace: true });
    }
  }, [session, isLoading, location.pathname, navigate]);

  // Écran de chargement pendant la vérification de session
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Chargement de votre espace…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// ── Composants d'erreur / 404 ─────────────────────────────────────────────────

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page introuvable</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu se charger
        </h1>
        <div className="mt-4 text-sm text-red-600 bg-red-50/50 p-4 rounded-xl border border-red-100 text-left overflow-auto max-h-[50vh] font-mono whitespace-pre-wrap w-full">
          <strong>{error.name}: {error.message}</strong>
          {"\n\n"}
          {error.stack}
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}

import { DataProvider } from "@/lib/data-context";

// ── Route racine ───────────────────────────────────────────────────────────────

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ClearQuote — Business OS devis & facturation" },
      {
        name: "description",
        content:
          "Devis interactifs, facturation Factur-X, CRM et trésorerie prédictive pour freelances, agences et TPE.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "ClearQuote" },
      { property: "og:image", content: "https://clearquote.fr/og-default.png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://clearquote.fr/og-default.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "ClearQuote",
          "url": "https://clearquote.fr",
          "logo": "https://clearquote.fr/og-default.png",
          "description": "ClearQuote est un logiciel de devis, facturation et gestion commerciale pour artisans, indépendants et petites entreprises françaises. Conformité Factur-X 2026 incluse.",
          "foundingLocation": { "@type": "Place", "addressCountry": "FR" },
          "sameAs": [
            "https://www.linkedin.com/company/clearquote",
            "https://twitter.com/clearquote"
          ],
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "customer support",
            "availableLanguage": "French",
            "url": "https://clearquote.fr/contactez-nous"
          }
        }),
      },
    ],
  }),

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          {/* SupabaseDataProvider remplace DataProvider — gère auth + données */}
          <SupabaseDataProvider>
            <DataProvider>
              <AuthGuard>
                <AppShell>
                  <Outlet />
                </AppShell>
                <Toaster position="top-right" richColors />
              </AuthGuard>
            </DataProvider>
          </SupabaseDataProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
