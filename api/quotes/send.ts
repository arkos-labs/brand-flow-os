export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  try {
    const body = await req.json();
    const { to, subject, html, pdfBase64, pdfFilename, refreshToken } = body;

    if (!to || !subject || !html || !pdfBase64 || !pdfFilename || !refreshToken) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return new Response(JSON.stringify({ error: 'Missing Google Client Credentials on Server' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 1. Get new access token using the refresh token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("Failed to refresh token:", tokenData);
      return new Response(JSON.stringify({ error: 'Failed to refresh Google access token' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const accessToken = tokenData.access_token;

    // 2. Construct the MIME message
    const boundary = "devizia-boundary-" + Date.now().toString(16);
    
    let rawMessage = 
      `To: ${to}\r\n` +
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: text/html; charset="UTF-8"\r\n\r\n` +
      `${html}\r\n\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/pdf; name="${pdfFilename}"\r\n` +
      `Content-Disposition: attachment; filename="${pdfFilename}"\r\n` +
      `Content-Transfer-Encoding: base64\r\n\r\n` +
      `${pdfBase64.replace(/(.{76})/g, "$1\r\n")}\r\n` +
      `--${boundary}--`;

    // 3. Base64url encode the entire MIME message
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // 4. Send via Gmail API
    const sendResponse = await fetch("https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=multipart", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error("Failed to send email:", sendData);
      return new Response(JSON.stringify({ error: 'Failed to send email via Gmail', details: sendData }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ success: true, messageId: sendData.id }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error: any) {
    console.error("Error in send API:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: error.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
