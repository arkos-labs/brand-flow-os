import { createFileRoute } from '@tanstack/react-router'

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

// Liste tous les calendriers auxquels le compte Google connecté a accès
// (perso, pro, calendriers d'équipe partagés avec lui, etc.)
export const Route = createFileRoute('/api/calendar/list')({
  server: {
    handlers: {
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
          const { access_token } = await refreshGoogleToken(refreshToken)

          const res = await fetch(
            'https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader',
            { headers: { Authorization: `Bearer ${access_token}` } },
          )
          const data = await res.json()
          if (!res.ok) {
            console.error('Google CalendarList error:', data)
            throw new Error(
              'Impossible de récupérer la liste des calendriers',
            )
          }

          const calendars = (data.items || []).map((cal: any) => ({
            id: cal.id,
            name: cal.summaryOverride || cal.summary,
            primary: !!cal.primary,
          }))

          return new Response(JSON.stringify({ calendars }), {
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
    },
  },
})
