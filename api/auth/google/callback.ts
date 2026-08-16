export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const orgId = url.searchParams.get("state") || "";

  // The base URL of the app, to redirect back to the frontend
  const baseUrl = url.origin; 
  // We want to redirect back to the app's settings page
  const settingsUrl = new URL("/parametres", baseUrl);

  if (error || !code) {
    settingsUrl.searchParams.set("google_error", error || "no_code");
    return new Response(null, {
      status: 302,
      headers: { Location: settingsUrl.toString() },
    });
  }

  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = new URL("/api/auth/google/callback", url.origin).toString();

  if (!clientId || !clientSecret || !redirectUri) {
    return new Response("Missing Google Client Credentials", { status: 500 });
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.refresh_token) {
      console.error("Google Token Error:", tokenData);
      settingsUrl.searchParams.set("google_error", "failed_to_get_refresh_token");
      return new Response(null, {
        status: 302,
        headers: { Location: settingsUrl.toString() },
      });
    }

    // Redirect back to frontend with the refresh token in URL
    // The frontend will save it to the DB and clear the URL
    settingsUrl.searchParams.set("google_token", tokenData.refresh_token);
    
    return new Response(null, {
      status: 302,
      headers: { Location: settingsUrl.toString() },
    });
  } catch (err: any) {
    console.error("Error exchanging code for token:", err);
    settingsUrl.searchParams.set("google_error", "server_error");
    return new Response(null, {
      status: 302,
      headers: { Location: settingsUrl.toString() },
    });
  }
}
