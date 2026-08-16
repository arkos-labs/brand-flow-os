import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/auth/google/callback')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')

    const baseUrl = `${url.protocol}//${url.host}`
    const settingsUrl = new URL('/parametres', baseUrl)

    if (error || !code) {
      settingsUrl.searchParams.set('google_error', error || 'no_code')
      return new Response(null, {
        status: 302,
        headers: { Location: settingsUrl.toString() },
      })
    }

    const clientId =
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const clientSecret =
      process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
    const redirectUri =
      process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response('Missing Google Client Credentials', { status: 500 })
    }

    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
      })

      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok || !tokenData.refresh_token) {
        console.error('Google Token Error:', tokenData)
        settingsUrl.searchParams.set(
          'google_error',
          'failed_to_get_refresh_token',
        )
        return new Response(null, {
          status: 302,
          headers: { Location: settingsUrl.toString() },
        })
      }

      // Redirige vers les paramètres avec le refresh token
      // Le frontend le sauvegarde en DB et nettoie l'URL
      settingsUrl.searchParams.set('google_token', tokenData.refresh_token)

      return new Response(null, {
        status: 302,
        headers: { Location: settingsUrl.toString() },
      })
    } catch (err: any) {
      console.error('Error exchanging code for token:', err)
      settingsUrl.searchParams.set('google_error', 'server_error')
      return new Response(null, {
        status: 302,
        headers: { Location: settingsUrl.toString() },
      })
    }
  },
})
