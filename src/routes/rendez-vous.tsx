import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { fr } from "date-fns/locale";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { getMyOrgId } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CalendarCheck2,
  CalendarPlus,
  Video,
  ExternalLink,
  Clock,
  X,
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
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
  const { data: calendars } = useQuery({
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

  const events = data || [];

  // Grille du mois affiché : du lundi de la 1ère semaine au dimanche de la dernière.
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [visibleMonth]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = format(new Date(event.startTime), "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [events]);

  const connectHref = orgId
    ? `/api/auth/google/login?orgId=${orgId}&returnTo=/rendez-vous`
    : "#";

  const weekDayLabels = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  return (
    <div className="mx-auto max-w-6xl">
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

      <div className="card-elevated mt-6 overflow-hidden">
        {/* Barre de navigation du mois */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold capitalize text-foreground">
              {format(visibleMonth, "MMMM yyyy", { locale: fr })}
            </h2>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/50"
                aria-label="Mois précédent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted/50"
                aria-label="Mois suivant"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth(new Date())}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground hover:bg-muted/50"
            >
              Aujourd'hui
            </button>
          </div>

          {isConnected && calendars && calendars.length > 1 && (
            <select
              value={selectedCalendarId}
              onChange={(e) => updateCompany({ ...company, google_calendar_id: e.target.value })}
              className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>
                  {cal.name}{cal.primary ? " (principal)" : ""}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* États non connecté / chargement / erreur */}
        {!isConnected ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <CalendarCheck2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">Aucun rendez-vous synchronisé</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Connectez votre compte Google Calendar pour voir vos rendez-vous dans ce calendrier.
              </p>
            </div>
            <Button asChild className="mt-2">
              <a href={connectHref}>
                <CalendarPlus className="mr-2 h-4 w-4" />
                Connecter mon compte
              </a>
            </Button>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de vos rendez-vous…</p>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
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
        ) : (
          <>
            {/* En-têtes des jours de la semaine */}
            <div className="grid grid-cols-7 border-b border-border bg-muted/20 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {weekDayLabels.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Grille du mois */}
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const dayEvents = eventsByDay.get(key) || [];
                const inMonth = isSameMonth(day, visibleMonth);
                const today = isToday(day);

                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-h-[110px] flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
                      !inMonth && "bg-muted/10",
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        today
                          ? "bg-primary text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/50",
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="flex flex-col gap-1">
                      {dayEvents.slice(0, 3).map((event) => (
                        <button
                          key={event.id}
                          type="button"
                          onClick={() => setSelectedEvent(event)}
                          className={cn(
                            "truncate rounded px-1.5 py-1 text-left text-[10px] font-medium leading-tight text-white transition-opacity hover:opacity-90",
                            event.status === "confirmed" ? "bg-blue-500" : "bg-amber-600",
                          )}
                        >
                          <div className="truncate font-semibold">
                            {event.attendeeName || event.name}
                          </div>
                          <div className="truncate opacity-90">
                            {format(new Date(event.startTime), "HH:mm")}
                          </div>
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <span className="px-1.5 text-[10px] font-medium text-muted-foreground">
                          +{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Détail d'un rendez-vous */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="card-elevated w-full max-w-sm p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span
                  className={cn(
                    "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    selectedEvent.status === "confirmed"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700",
                  )}
                >
                  {selectedEvent.status === "confirmed" ? "Confirmé" : "Annulé"}
                </span>
                <h3 className="mt-2 text-base font-semibold text-foreground">
                  {selectedEvent.attendeeName || selectedEvent.name}
                </h3>
                {selectedEvent.attendeeName && (
                  <p className="text-sm text-muted-foreground">{selectedEvent.name}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-2 capitalize">
                {format(new Date(selectedEvent.startTime), "EEEE d MMMM yyyy", { locale: fr })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {format(new Date(selectedEvent.startTime), "HH:mm")} ·{" "}
                {formatDuration(selectedEvent.startTime, selectedEvent.endTime)}
              </span>
              {selectedEvent.attendeeEmail && (
                <span className="flex items-center gap-2">{selectedEvent.attendeeEmail}</span>
              )}
            </div>

            {selectedEvent.location && (
              <a
                href={selectedEvent.location}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Video className="h-4 w-4" />
                Rejoindre l'appel
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
