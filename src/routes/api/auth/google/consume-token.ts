import { createFileRoute } from '@tanstack/react-router'

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// Consomme le cookie httpOnly de très courte durée posé par
// /api/auth/google/callback juste après l'échange OAuth. Le front-end
// appelle cet endpoint une seule fois (juste après avoir vu
// ?google_connected=1 dans l'URL) pour récupérer le refresh token et
// l'enregistrer en base — le token ne transite jamais par l'URL ni par
// window.location, donc jamais par l'historique navigateur ou les logs.
export const Route = createFileRoute('/api/auth/google/consume-token')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = parseCookie(request.headers.get('cookie'), 'go_token')
        const clearTokenCookie =
          'go_token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/api/auth/google'

        if (!token) {
          return new Response(JSON.stringify({ error: 'no_token' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearTokenCookie },
          })
        }

        return new Response(JSON.stringify({ token }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearTokenCookie },
        })
      },
    },
  },
})
