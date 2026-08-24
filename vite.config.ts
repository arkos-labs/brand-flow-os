if (!process.env['VERCEL']) {
  process.env['NITRO_PRESET'] = 'node-server';
} else {
  // Force Node.js lambda runtime on Vercel (pas Edge) pour les routes qui utilisent
  // des packages Node.js-only comme `stripe` — sinon Vercel retourne du HTML 404
  // au lieu de JSON, causant "Unexpected token 'T'... not valid JSON".
  process.env['NITRO_PRESET'] = 'vercel';
}
// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // FIX B1: passer le preset nitro explicitement dans defineConfig pour ne pas être
  // silencieusement écrasé par la valeur par défaut "cloudflare" de @lovable.dev/vite-tanstack-config.
  // Sans ça, toutes les routes /api/* renvoient 404 en production Vercel.
  nitro: {
    preset: process.env['VERCEL'] ? 'vercel' : 'node-server',
  },
});
