import { VercelRequest, VercelResponse } from "@vercel/node";

// Rafraîchit l'access token Google à partir du refresh_token stocké
// (le même token que celui utilisé pour l'envoi d'emails Gmail, avec en
// plus le scope calendar.readonly).
async function refreshGoogleToken(refreshToken: string) {
  const clientId = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret =
    process.env.VITE_GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId || "",
      client_secret: clientSecret || "",
    }).toString(),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error("Google refresh error:", data);
    throw new Error(data.error === "invalid_grant" ? "invalid_grant" : "Impossible de rafraîchir le token Google");
  }
  return data as { access_token: string };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const refreshToken =
    typeof req.query.refresh_token === "string" ? req.query.refresh_token : null;
  // Permet de choisir un calendrier précis (équipe, agenda partagé…).
  // Par défaut : calendrier principal du compte connecté.
  const calendarId =
    typeof req.query.calendar_id === "string" ? req.query.calendar_id : "primary";

  if (!refreshToken) {
    return res.status(400).json({ error: "missing_refresh_token" });
  }

  try {
    const { access_token } = await refreshGoogleToken(refreshToken);

    // Événements à venir sur le calendrier sélectionné (là où Google Calendar
    // "Créneaux de rendez-vous" crée les événements réservés par les clients).
    const params = new URLSearchParams({
      timeMin: new Date().toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "50",
    });
    const eventsRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
      { headers: { Authorization: `Bearer ${access_token}` } },
    );
    const eventsData = await eventsRes.json();
    if (!eventsRes.ok) {
      console.error("Google Calendar API error:", eventsData);
      throw new Error("Impossible de récupérer les événements Google Calendar");
    }

    const events = (eventsData.items || [])
      // On ne garde que les événements avec un horaire précis (pas les événements "journée entière")
      .filter((event: any) => event.start?.dateTime)
      .map((event: any) => {
        const attendee = (event.attendees || []).find((a: any) => !a.organizer);
        return {
          id: event.id,
          name: event.summary || "Rendez-vous",
          attendeeName: attendee?.displayName || null,
          attendeeEmail: attendee?.email || null,
          attendeePhone: attendee?.additionalGuests ? null : null,
          startTime: event.start.dateTime,
          endTime: event.end.dateTime,
          status: event.status, // "confirmed" | "cancelled" | "tentative"
          // Lien visio (Google Meet ou autre) séparé de l'adresse physique.
          meetLink: event.hangoutLink || null,
          // Adresse / lieu textuel (ex: adresse du client pour une intervention à domicile).
          address: event.location || null,
          // Détails complets du RDV (souvent remplis automatiquement par les
          // "Créneaux de rendez-vous" Google Calendar : prestation, options, prix…).
          description: event.description || null,
          // Lien vers l'événement dans Google Calendar (pour partager / voir plus de détails).
          htmlLink: event.htmlLink || null,
          organizer: event.organizer?.email || null,
          created: event.created || null,
        };
      });

    return res.status(200).json({ events });
  } catch (err: any) {
    const message = err.message || "server_error";
    return res.status(message === "invalid_grant" ? 401 : 500).json({ error: message });
  }
}
