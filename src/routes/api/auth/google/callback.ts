import { createFileRoute } from '@tanstack/react-router'

const ALLOWED_RETURN_PATHS = new Set(['/parametres', '/rendez-vous'])

function safeReturnTo(value: string): string {
  return ALLOWED_RETURN_PATHS.has(value) ? value : '/parametres'
}

function parseCookie(header: string | null, name: string): string | null {
  if (!header) return null
  const match = header.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  const value = match?.[1]
  return value ? decodeURIComponent(value) : null
}

export const Route = createFileRoute('/api/auth/google/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')
        const rawState = url.searchParams.get('state') || ''

        const clearStateCookie =
          'go_state=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/'

        let returnTo = '/parametres'
        let stateNonce = ''
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(rawState)))
          returnTo = safeReturnTo(
            typeof decoded.r === 'string' ? decoded.r : '/parametres',
          )
          stateNonce = typeof decoded.n === 'string' ? decoded.n : ''
        } catch {
          // state invalide/absent → traité comme une tentative sans nonce valide
        }

        const baseUrl = `${url.protocol}//${url.host}`
        const redirectUrl = new URL(returnTo, baseUrl)
        const cookieNonce = parseCookie(request.headers.get('cookie'), 'go_state')

        if (error || !code) {
          redirectUrl.searchParams.set('google_error', error || 'no_code')
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl.toString(), 'Set-Cookie': clearStateCookie },
          })
        }

        // Vérification anti-CSRF : le nonce reçu dans `state` doit correspondre
        // exactement au cookie httpOnly posé par /api/auth/google/login.
        if (!stateNonce || !cookieNonce || stateNonce !== cookieNonce) {
          redirectUrl.searchParams.set('google_error', 'invalid_state')
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl.toString(), 'Set-Cookie': clearStateCookie },
          })
        }

        const clientId =
          process.env['GOOGLE_CLIENT_ID'] || process.env['VITE_GOOGLE_CLIENT_ID']
        const clientSecret = process.env['GOOGLE_CLIENT_SECRET']
        const redirectUri =
          process.env['GOOGLE_REDIRECT_URI'] || process.env['VITE_GOOGLE_REDIRECT_URI']

        if (!clientId || !clientSecret || !redirectUri) {
          return new Response('Missing Google Client Credentials', {
            status: 500,
            headers: { 'Set-Cookie': clearStateCookie },
          })
        }

        try {
          const tokenResponse = await fetch(
            'https://oauth2.googleapis.com/token',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
              }).toString(),
            },
          )

          const tokenData = await tokenResponse.json()

          if (!tokenResponse.ok || !tokenData.refresh_token) {
            console.error('Google Token Error:', tokenData)
            redirectUrl.searchParams.set(
              'google_error',
              'failed_to_get_refresh_token',
            )
            return new Response(null, {
              status: 302,
              headers: { Location: redirectUrl.toString(), 'Set-Cookie': clearStateCookie },
            })
          }

          // Le refresh token n'est plus jamais mis dans l'URL. Il est posé
          // dans un cookie httpOnly de très courte durée, à usage unique,
          // consommé par /api/auth/google/consume-token.
          const tokenCookie = `go_token=${encodeURIComponent(tokenData.refresh_token)}; HttpOnly; Secure; SameSite=Lax; Max-Age=120; Path=/api/auth/google`

          redirectUrl.searchParams.set('google_connected', '1')
          const headers = new Headers({ Location: redirectUrl.toString() })
          // append() (plutôt que set()) permet d'envoyer deux cookies distincts.
          headers.append('Set-Cookie', clearStateCookie)
          headers.append('Set-Cookie', tokenCookie)
          return new Response(null, { status: 302, headers })
        } catch (err: any) {
          console.error('Error exchanging code for token:', err)
          redirectUrl.searchParams.set('google_error', 'server_error')
          return new Response(null, {
            status: 302,
            headers: { Location: redirectUrl.toString(), 'Set-Cookie': clearStateCookie },
          })
        }
      },
    },
  },
})
