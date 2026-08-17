import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { getMyOrgId } from "@/lib/supabase";
import { Calendar, Clock, User, Video, ExternalLink, Loader2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/rendez-vous")({
  component: RendezVousPage,
});

type CalendarEvent = {
  id: string;
  name: string;
  attendeeName: string | null;
  attendeeEmail: string | null;
  startTime: string;
  endTime: string;
  status: string;
  location: string | null;
};

type GoogleCalendar = {
  id: string;
  name: string;
  primary: boolean;
};

function formatDuration(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.round(ms / 60000);
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function RendezVousPage() {
  const { t } = useI18n();
  const { company, updateCompany } = useData();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  useEffect(() => {
    getMyOrgId().then(setOrgId);
  }, []);

  // Gère le retour du flux OAuth Google (redirection depuis /api/auth/google/callback,
  // qui renvoie ici grâce au paramètre returnTo=/rendez-vous)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googleToken = params.get("google_token");
    const googleError = params.get("google_error");

    if (googleToken) {
      updateCompany({ ...company, google_refresh_token: googleToken });
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleError) {
      setConnectError(googleError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isConnected = !!company.google_refresh_token;
  const selectedCalendarId = company.google_calendar_id || "primary";

  // Liste des calendriers accessibles (perso, équipes partagées…)
  const { data: calendars, isLoading: isLoadingCalendars } = useQuery({
    queryKey: ["calendar-list", company.google_refresh_token],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar/list?refresh_token=${encodeURIComponent(company.google_refresh_token!)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur inconnue");
      return json.calendars as GoogleCalendar[];
    },
    enabled: isConnected,
    staleTime: 5 * 60_000,
  });

  const {
    data,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["calendar-events", company.google_refresh_token, selectedCalendarId],
    queryFn: async () => {
      const res = await fetch(
        `/api/calendar/events?refresh_token=${encodeURIComponent(company.google_refresh_token!)}&calendar_id=${encodeURIComponent(selectedCalendarId)}`,
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur inconnue");
      return json.events as CalendarEvent[];
    },
    enabled: isConnected,
    staleTime: 60_000,
  });

  const appointments = (data || []).map((event) => ({
    id: event.id,
    name: event.attendeeName || event.name,
    email: event.attendeeEmail || "Pas d'invité",
    date: new Date(event.startTime).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }),
    time: new Date(event.startTime).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: formatDuration(event.startTime, event.endTime),
    type: event.name,
    status: event.status === "confirmed" ? "Confirmé" : "Annulé",
    link: event.location,
  }));

  const connectHref = orgId
    ? `/api/auth/google/login?orgId=${orgId}&returnTo=/rendez-vous`
    : "#";

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={t("app.rendezvous.title" as Key)}
        subtitle={t("app.rendezvous.subtitle" as Key)}
        action={
          isConnected ? (
            <span className="flex h-9 items-center gap-2 rounded-[var(--shape-control)] border-2 border-success/30 bg-success/10 px-4 text-sm font-semibold text-success">
              <Calendar className="h-4 w-4" />
              Google Calendar connecté
            </span>
          ) : (
            <a
              href={connectHref}
              aria-disabled={!orgId}
              className="flex h-9 items-center gap-2 rounded-[var(--shape-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <Calendar className="h-4 w-4" />
              Connecter Google Calendar
            </a>
          )
        }
      />

      {connectError && (
        <div className="mt-4 flex items-center gap-2 rounded-[var(--shape-control)] border-2 border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          La connexion à Google Calendar a échoué. Merci de réessayer.
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 rounded-[var(--shape-control)] border-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
          Astuce : créez vos types de rendez-vous (diagnostic, devis, intervention…) gratuitement dans{" "}
          <a
            href="https://calendar.google.com/calendar/u/0/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-primary hover:underline"
          >
            Google Calendar → Créneaux de rendez-vous
          </a>
          , puis connectez votre compte ici pour voir vos réservations.
        </div>
      )}

      {isConnected && calendars && calendars.length > 1 && (
        <div className="mt-4 flex items-center gap-3 rounded-[var(--shape-control)] border-2 border-navy/20 bg-card px-4 py-3">
          <label htmlFor="calendar-select" className="shrink-0 text-sm font-semibold text-foreground">
            Calendrier affiché :
          </label>
          <select
            id="calendar-select"
            value={selectedCalendarId}
            onChange={(e) => updateCompany({ ...company, google_calendar_id: e.target.value })}
            className="h-9 flex-1 rounded-[var(--shape-control)] border-2 border-navy/20 bg-background px-3 text-sm font-medium text-foreground focus:border-primary focus:outline-none"
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.name}{cal.primary ? " (principal)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {!isConnected ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--shape-control)] border-2 border-dashed border-navy/20 bg-card py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Aucun rendez-vous synchronisé</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Vous n'avez pas de rendez-vous actuellement. Connectez votre compte Google Calendar pour que vos prochains événements s'affichent directement ici.
            </p>
            <a
              href={connectHref}
              className="mt-6 flex h-10 items-center gap-2 rounded-[var(--shape-control)] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
            >
              <Calendar className="h-4 w-4" />
              Connecter mon compte
            </a>
          </div>
        ) : isLoading || isLoadingCalendars ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--shape-control)] border-2 border-dashed border-navy/20 bg-card py-16 px-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-sm text-muted-foreground">Chargement de vos rendez-vous Google Calendar…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center rounded-[var(--shape-control)] border-2 border-dashed border-destructive/30 bg-card py-16 px-4 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="mt-4 text-sm text-muted-foreground">
              Impossible de récupérer vos rendez-vous ({(error as Error)?.message}).
            </p>
            {(error as Error)?.message === "invalid_grant" && (
              <a
                href={connectHref}
                className="mt-4 flex h-9 items-center gap-2 rounded-[var(--shape-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground"
              >
                Reconnecter Google Calendar
              </a>
            )}
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <div key={apt.id} className="flex flex-col gap-4 rounded-[var(--shape-control)] border-2 border-navy/20 bg-card p-5 shadow-offset-sm transition-all hover:border-primary lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 lg:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--shape-control)] bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{apt.name}</h3>
                  <p className="text-sm text-muted-foreground">{apt.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {apt.date} à {apt.time}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {apt.duration}</span>
                    <span className="rounded border border-border bg-secondary/50 px-2 py-0.5 text-secondary-foreground">{apt.type}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-start gap-2 lg:items-end">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${apt.status === "Confirmé" ? "border-success/30 bg-success/10 text-success" : "border-warning/30 bg-warning/10 text-warning"}`}>
                  {apt.status}
                </span>
                {apt.link ? (
                  <a href={apt.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                    <Video className="h-4 w-4" />
                    Rejoindre l'appel
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                    <Video className="h-4 w-4" />
                    Lien non disponible
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-[var(--shape-control)] border-2 border-dashed border-navy/20 bg-card py-16 px-4 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Calendar className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Aucun rendez-vous à venir</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Votre compte Google Calendar est connecté mais aucun événement n'est planifié pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
