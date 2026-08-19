import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/quotes/send")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { to, subject, html, pdfBase64, pdfFilename, artisanEmail } = body;

          if (!to || !subject || !html || !pdfBase64 || !pdfFilename) {
            return new Response(JSON.stringify({ error: 'Champs requis manquants', message: 'Les champs to, subject, html, pdfBase64 et pdfFilename sont obligatoires.' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(to)) {
            return new Response(JSON.stringify({ error: 'Email invalide', message: `L'adresse email "${to}" n'est pas valide. Vérifiez l'email du client dans sa fiche.` }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            });
          }

          const resendApiKey = process.env.RESEND_API_KEY;
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'Devis <onboarding@resend.dev>';

          if (!resendApiKey) {
            return new Response(JSON.stringify({
              error: 'Clé API Resend manquante',
              message: 'La variable RESEND_API_KEY n\'est pas configurée. Ajoutez-la dans Vercel → Settings → Environment Variables (sans le préfixe VITE_).'
            }), {
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

            let friendlyMessage = sendData?.message || 'Erreur inconnue de Resend.';
            if (friendlyMessage.includes('domain') || friendlyMessage.includes('verified')) {
              friendlyMessage = `Domaine d'envoi non vérifié. Vous utilisez "${fromEmail}" qui est le domaine de test Resend. Il ne peut envoyer qu'à votre propre adresse email. Pour envoyer à vos clients, vérifiez votre domaine sur resend.com/domains.`;
            } else if (friendlyMessage.includes('Invalid `to`') || friendlyMessage.includes('email address')) {
              friendlyMessage = `Adresse email du destinataire invalide : "${to}". Vérifiez l'email du client dans sa fiche.`;
            } else if (sendData?.name === 'validation_error') {
              friendlyMessage = `Erreur de validation Resend : ${friendlyMessage}`;
            }

            return new Response(JSON.stringify({ error: 'Échec de l\'envoi', message: friendlyMessage, details: sendData }), {
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
    }
  }
});
