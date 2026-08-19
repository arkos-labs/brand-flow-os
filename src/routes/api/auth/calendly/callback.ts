import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/calendly/callback')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url)
        const code = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        const baseUrl = `${url.protocol}//${url.host}`
        const rdvUrl = new URL('/rendez-vous', baseUrl)

        if (error || !code) {
          rdvUrl.searchParams.set('calendly_error', error || 'no_code')
          return new Response(null, {
            status: 302,
            headers: { Location: rdvUrl.toString() },
          })
        }

        const clientId =
          process.env['VITE_CALENDLY_CLIENT_ID'] || process.env['CALENDLY_CLIENT_ID']
        const clientSecret =
          process.env['VITE_CALENDLY_CLIENT_SECRET'] ||
          process.env['CALENDLY_CLIENT_SECRET']
        const redirectUri =
          process.env['VITE_CALENDLY_REDIRECT_URI'] ||
          process.env['CALENDLY_REDIRECT_URI']

        if (!clientId || !clientSecret || !redirectUri) {
          return new Response('Missing Calendly Client Credentials', {
            status: 500,
          })
        }

        try {
          const tokenResponse = await fetch(
            'https://auth.calendly.com/oauth/token',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

          if (!tokenResponse.ok || !tokenData.access_token) {
            console.error('Calendly Token Error:', tokenData)
            rdvUrl.searchParams.set('calendly_error', 'failed_to_get_token')
            return new Response(null, {
              status: 302,
              headers: { Location: rdvUrl.toString() },
            })
          }

          // Redirige vers la page rendez-vous avec les tokens.
          // Le frontend les sauvegarde en DB (organizations.payload) et nettoie l'URL.
          rdvUrl.searchParams.set('calendly_access_token', tokenData.access_token)
          rdvUrl.searchParams.set(
            'calendly_refresh_token',
            tokenData.refresh_token,
          )

          return new Response(null, {
            status: 302,
            headers: { Location: rdvUrl.toString() },
          })
        } catch (err: any) {
          console.error('Error exchanging code for Calendly token:', err)
          rdvUrl.searchParams.set('calendly_error', 'server_error')
          return new Response(null, {
            status: 302,
            headers: { Location: rdvUrl.toString() },
          })
        }
      },
    }
  }
})
