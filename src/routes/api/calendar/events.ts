import { createAPIFileRoute } from '@tanstack/react-start/api'

// Rafraîchit l'access token Google à partir du refresh_token stocké
// (le même token que celui utilisé pour l'envoi d'emails Gmail, avec en
// plus le scope calendar.readonly).
async function refreshGoogleToken(refreshToken: string) {
  const clientId =
    process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret =
    process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

  const res = await fetch('https://oauth2.googleapis.com/token', {
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
    console.error('Google refresh error:', data)
    throw new Error(
      data.error === 'invalid_grant'
        ? 'invalid_grant'
        : 'Impossible de rafraîchir le token Google',
    )
  }
  return data as { access_token: string }
}

export const APIRoute = createAPIFileRoute('/api/calendar/events')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const refreshToken = url.searchParams.get('refresh_token')
    // Permet de choisir un calendrier précis (équipe, agenda partagé…).
    // Par défaut : calendrier principal du compte connecté.
    const calendarId = url.searchParams.get('calendar_id') || 'primary'

    if (!refreshToken) {
      return new Response(
        JSON.stringify({ error: 'missing_refresh_token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    try {
      const { access_token } = await refreshGoogleToken(refreshToken)

      // Événements à venir sur le calendrier sélectionné (là où Google Calendar
      // "Créneaux de rendez-vous" crée les événements réservés par les clients).
      const params = new URLSearchParams({
        timeMin: new Date().toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '50',
      })
      const eventsRes = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
        { headers: { Authorization: `Bearer ${access_token}` } },
      )
      const eventsData = await eventsRes.json()
      if (!eventsRes.ok) {
        console.error('Google Calendar API error:', eventsData)
        throw new Error('Impossible de récupérer les événements Google Calendar')
      }

      const events = (eventsData.items || [])
        // On ne garde que les événements avec un horaire précis (pas les événements "journée entière")
        .filter((event: any) => event.start?.dateTime)
        .map((event: any) => {
          const attendee = (event.attendees || []).find(
            (a: any) => !a.organizer,
          )
          return {
            id: event.id,
            name: event.summary || 'Rendez-vous',
            attendeeName: attendee?.displayName || null,
            attendeeEmail: attendee?.email || null,
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
            status: event.status, // "confirmed" | "cancelled" | "tentative"
            location:
              event.hangoutLink || event.location || event.htmlLink || null,
          }
        })

      return new Response(JSON.stringify({ events }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err: any) {
      const message = err.message || 'server_error'
      return new Response(JSON.stringify({ error: message }), {
        status: message === 'invalid_grant' ? 401 : 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
})
