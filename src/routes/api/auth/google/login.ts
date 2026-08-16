import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/auth/google/login')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const orgId = url.searchParams.get('orgId') || ''

    const clientId =
      process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
    const redirectUri =
      process.env.VITE_GOOGLE_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return new Response('Missing Google Client ID or Redirect URI', {
        status: 500,
      })
    }

    const scope = encodeURIComponent(
      'https://www.googleapis.com/auth/gmail.send email profile',
    )
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${scope}` +
      `&access_type=offline` +
      `&prompt=consent` +
      `&state=${orgId}`

    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    })
  },
})
