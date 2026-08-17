import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/auth/google/login')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const orgId = url.searchParams.get('orgId') || ''
    // Où rediriger une fois le token obtenu (ex: /parametres ou /rendez-vous).
    const returnTo = url.searchParams.get('returnTo') || '/parametres'

    const clientId =
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const redirectUri =
      process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return new Response('Missing Google Client ID or Redirect URI', {
        status: 500,
      })
    }

    // gmail.send : envoi d'emails (devis/factures)
    // calendar.readonly : lecture des rendez-vous (Google Calendar / Appointment Schedules)
    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly email profile',
    )
    // state encode orgId + returnTo pour que le callback sache où rediriger.
    const state = encodeURIComponent(`${orgId}::${returnTo}`)
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
      headers: { Location: authUrl },
    })
  },
})
