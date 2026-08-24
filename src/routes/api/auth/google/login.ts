import { createFileRoute } from '@tanstack/react-router'

// Chemins internes autorisés pour la redirection post-connexion Google.
// Empêche un état falsifié de rediriger vers un domaine externe (open redirect).
const ALLOWED_RETURN_PATHS = new Set(['/parametres', '/rendez-vous'])

function safeReturnTo(value: string): string {
  return ALLOWED_RETURN_PATHS.has(value) ? value : '/parametres'
}

function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export const Route = createFileRoute('/api/auth/google/login')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const orgId = url.searchParams.get('orgId') || ''
        const returnTo = safeReturnTo(url.searchParams.get('returnTo') || '/parametres')

        const clientId =
          process.env['GOOGLE_CLIENT_ID'] || process.env['VITE_GOOGLE_CLIENT_ID']
        const redirectUri =
          process.env['GOOGLE_REDIRECT_URI'] || process.env['VITE_GOOGLE_REDIRECT_URI']

        if (!clientId || !redirectUri) {
          return new Response('Missing Google Client ID or Redirect URI', {
            status: 500,
          })
        }

        // Nonce anti-CSRF : posé en cookie httpOnly, vérifié au retour par le
        // callback (doit correspondre au nonce encodé dans `state`).
        const nonce = randomNonce()

        const scope = encodeURIComponent(
          'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly email profile',
        )
        const state = encodeURIComponent(
          btoa(JSON.stringify({ o: orgId, r: returnTo, n: nonce })),
        )
        const authUrl =
          `https://accounts.google.com/o/oauth2/v2/auth` +
          `?client_id=${clientId}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code` +
          `&scope=${scope}` +
          `&access_type=offline` +
          `&prompt=consent` +
          `&state=${state}`

        return new Response(null, {
          status: 302,
          headers: {
            Location: authUrl,
            'Set-Cookie': `go_state=${nonce}; HttpOnly; Secure; SameSite=Lax; Max-Age=600; Path=/`,
          },
        })
      },
    },
  },
})
