import { createAPIFileRoute } from '@tanstack/react-start/api'

// Calendly access tokens expirent au bout de ~2h : on les rafraîchit
// systématiquement avec le refresh_token avant d'appeler l'API.
async function refreshCalendlyToken(refreshToken: string) {
  const clientId =
    process.env.VITE_CALENDLY_CLIENT_ID || process.env.CALENDLY_CLIENT_ID
  const clientSecret =
    process.env.VITE_CALENDLY_CLIENT_SECRET ||
    process.env.CALENDLY_CLIENT_SECRET

  const res = await fetch('https://auth.calendly.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId || '',
      client_secret: clientSecret || '',
    }).toString(),
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) {
    throw new Error('Impossible de rafraîchir le token Calendly')
  }
  return data as { access_token: string; refresh_token: string }
}

export const APIRoute = createAPIFileRoute('/api/calendly/events')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const refreshToken = url.searchParams.get('refresh_token')

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'missing_refresh_token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    try {
      const tokens = await refreshCalendlyToken(refreshToken)

      const meRes = await fetch('https://api.calendly.com/users/me', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const me = await meRes.json()
      if (!meRes.ok) {
        throw new Error('Impossible de récupérer le profil Calendly')
      }
      const userUri = me.resource.uri

      const eventsRes = await fetch(
        `https://api.calendly.com/scheduled_events?user=${encodeURIComponent(userUri)}&sort=start_time:asc&count=50`,
        { headers: { Authorization: `Bearer ${tokens.access_token}` } },
      )
      const eventsData = await eventsRes.json()
      if (!eventsRes.ok) {
        throw new Error('Impossible de récupérer les événements Calendly')
      }

      // Pour chaque événement, on récupère le premier invité (nom/email).
      const events = await Promise.all(
        (eventsData.collection || []).map(async (event: any) => {
          let inviteeName: string | null = null
          let inviteeEmail: string | null = null
          try {
            const inviteesRes = await fetch(
              `${event.uri}/invitees?count=1`,
              { headers: { Authorization: `Bearer ${tokens.access_token}` } },
            )
            const inviteesData = await inviteesRes.json()
            const invitee = inviteesData.collection?.[0]
            if (invitee) {
              inviteeName = invitee.name
              inviteeEmail = invitee.email
            }
          } catch {
            // pas bloquant si la récupération de l'invité échoue
          }

          return {
            id: event.uri,
            name: event.name,
            inviteeName,
            inviteeEmail,
            startTime: event.start_time,
            endTime: event.end_time,
            status: event.status,
            location:
              event.location?.join_url ||
              event.location?.location ||
              null,
          }
        }),
      )

      return new Response(
        JSON.stringify({
          events,
          // On renvoie le nouveau refresh_token : Calendly peut le faire tourner
          // à chaque rafraîchissement, il faut le persister côté client.
          refreshToken: tokens.refresh_token,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      )
    } catch (err: any) {
      console.error('Calendly events error:', err)
      return new Response(
        JSON.stringify({ error: err.message || 'server_error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      )
    }
  },
})
