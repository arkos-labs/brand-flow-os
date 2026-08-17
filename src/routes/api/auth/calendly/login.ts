import { createAPIFileRoute } from '@tanstack/react-start/api'

export const APIRoute = createAPIFileRoute('/api/auth/calendly/login')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const orgId = url.searchParams.get('orgId') || ''

    const clientId =
      process.env.VITE_CALENDLY_CLIENT_ID || process.env.CALENDLY_CLIENT_ID
    const redirectUri =
      process.env.VITE_CALENDLY_REDIRECT_URI ||
      process.env.CALENDLY_REDIRECT_URI

    if (!clientId || !redirectUri) {
      return new Response('Missing Calendly Client ID or Redirect URI', {
        status: 500,
      })
    }

    const authUrl =
      `https://auth.calendly.com/oauth/authorize` +
      `?client_id=${clientId}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${orgId}`

    return new Response(null, {
      status: 302,
      headers: { Location: authUrl },
    })
  },
})
