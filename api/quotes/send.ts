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
    const { to, subject, html, pdfBase64, pdfFilename, artisanEmail } = body;

    if (!to || !subject || !html || !pdfBase64 || !pdfFilename) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    const resendApiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY;
    const fromEmail = process.env.VITE_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'Devis <onboarding@resend.dev>';

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: 'Missing Resend API Key on Server' }), { 
        status: 500, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // Send via Resend API
    const sendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        reply_to: artisanEmail || undefined,
        subject: subject,
        html: html,
        attachments: [
          {
            filename: pdfFilename,
            content: pdfBase64,
          }
        ]
      }),
    });

    const sendData = await sendResponse.json();

    if (!sendResponse.ok) {
      console.error("Failed to send email via Resend:", sendData);
      return new Response(JSON.stringify({ error: 'Failed to send email via Resend', details: sendData }), { 
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
