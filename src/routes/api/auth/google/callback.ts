import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/auth/google/callback')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const error = url.searchParams.get('error')
    const rawState = url.searchParams.get('state') || ''

    // state = "orgId::returnTo" (returnTo par défaut = /parametres pour compat
    // avec les connexions faites avant l'ajout du scope Calendar).
    const [, returnToRaw] = decodeURIComponent(rawState).split('::')
    const returnTo = returnToRaw || '/parametres'

    const baseUrl = `${url.protocol}//${url.host}`
    const redirectUrl = new URL(returnTo, baseUrl)

    if (error || !code) {
      redirectUrl.searchParams.set('google_error', error || 'no_code')
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
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
        redirectUrl.searchParams.set(
          'google_error',
          'failed_to_get_refresh_token',
        )
        return new Response(null, {
          status: 302,
          headers: { Location: redirectUrl.toString() },
        })
      }

      // Redirige vers la page d'origine avec le refresh token.
      // Le frontend le sauvegarde en DB et nettoie l'URL.
      redirectUrl.searchParams.set('google_token', tokenData.refresh_token)

      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      })
    } catch (err: any) {
      console.error('Error exchanging code for token:', err)
      redirectUrl.searchParams.set('google_error', 'server_error')
      return new Response(null, {
        status: 302,
        headers: { Location: redirectUrl.toString() },
      })
    }
  },
})
