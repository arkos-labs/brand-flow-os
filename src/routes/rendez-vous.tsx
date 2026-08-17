import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { getMyOrgId } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Loader2,
  AlertCircle,
  CalendarCheck2,
  CalendarPlus,
} from "lucide-react";

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

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => (w[0] ?? "").toUpperCase())
    .join("");
}

function avatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-sky-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-blue-700",
    "bg-teal-500",
  ];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return colors[h % colors.length] ?? colors[0]!;
}

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
    subtitle: event.attendeeName ? event.name : event.attendeeEmail || "Pas d'invité",
    email: event.attendeeEmail,
    date: new Date(event.startTime).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    }),
    time: new Date(event.startTime).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    duration: formatDuration(event.startTime, event.endTime),
    status: event.status === "confirmed" ? "Confirmé" : "Annulé",
    link: event.location,
  }));

  const connectHref = orgId
    ? `/api/auth/google/login?orgId=${orgId}&returnTo=/rendez-vous`
    : "#";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={t("app.rendezvous.title" as Key)}
        subtitle={t("app.rendezvous.subtitle" as Key)}
        action={
          isConnected ? (
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
              <CalendarCheck2 className="h-3.5 w-3.5" />
              Google Calendar connecté
            </span>
          ) : (
            <Button asChild>
              <a href={connectHref} aria-disabled={!orgId}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Connecter Google Calendar
              </a>
            </Button>
          )
        }
      />

      {connectError && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          La connexion à Google Calendar a échoué. Merci de réessayer.
        </div>
      )}

      {!isConnected && (
        <div className="mt-4 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Astuce : créez vos types de rendez-vous (diagnostic, devis, intervention…) gratuitement dans{" "}
          <a
            href="https://calendar.google.com/calendar/u/0/appointments"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            Google Calendar → Créneaux de rendez-vous
          </a>
          , puis connectez votre compte ici pour voir vos réservations.
        </div>
      )}

      {isConnected && calendars && calendars.length > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="calendar-select" className="shrink-0 text-sm font-medium text-foreground">
            Calendrier :
          </label>
          <select
            id="calendar-select"
            value={selectedCalendarId}
            onChange={(e) => updateCompany({ ...company, google_calendar_id: e.target.value })}
            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {calendars.map((cal) => (
              <option key={cal.id} value={cal.id}>
                {cal.name}{cal.primary ? " (principal)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {!isConnected ? (
          <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Aucun rendez-vous synchronisé</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Connectez votre compte Google Calendar pour que vos prochains rendez-vous s'affichent directement ici.
              </p>
            </div>
            <Button asChild className="mt-2">
              <a href={connectHref}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Connecter mon compte
              </a>
            </Button>
          </div>
        ) : isLoading || isLoadingCalendars ? (
          <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de vos rendez-vous…</p>
          </div>
        ) : isError ? (
          <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
            <AlertCircle className="h-6 w-6 text-destructive" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Impossible de récupérer vos rendez-vous ({(error as Error)?.message}).
            </p>
            {(error as Error)?.message === "invalid_grant" && (
              <Button asChild size="sm">
                <a href={connectHref}>Reconnecter Google Calendar</a>
              </Button>
            )}
          </div>
        ) : appointments.length > 0 ? (
          appointments.map((apt) => (
            <div
              key={apt.id}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                  avatarColor(apt.name),
                )}
              >
                {initials(apt.name) || "?"}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{apt.name}</p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      apt.status === "Confirmé"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700",
                    )}
                  >
                    {apt.status}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">{apt.subtitle}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {apt.date} à {apt.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {apt.duration}
                  </span>
                </div>
              </div>

              {apt.link ? (
                <a
                  href={apt.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Video className="h-3.5 w-3.5" />
                  Rejoindre
                  <ExternalLink className="h-3 w-3" />
                </a>
              ) : null}
            </div>
          ))
        ) : (
          <div className="card-elevated flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Aucun rendez-vous à venir</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre compte est connecté mais aucun événement n'est planifié pour le moment.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
