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
  MapPin,
  FileText,
  Link as LinkIcon,
  Check,
  User,
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
  meetLink: string | null;
  address: string | null;
  description: string | null;
  htmlLink: string | null;
  organizer: string | null;
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

function EventDetailCard({ event }: { event: CalendarEvent }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!event.htmlLink) return;
    navigator.clipboard.writeText(event.htmlLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={cn(
          "mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full",
          event.status === "confirmed" ? "bg-blue-500" : "bg-amber-600",
        )}
      />
      <div className="flex flex-1 flex-col gap-2.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold leading-snug text-foreground">{event.name}</h3>
            <p className="mt-0.5 text-xs capitalize text-muted-foreground">
              {format(new Date(event.startTime), "EEEE d MMMM", { locale: fr })} · De{" "}
              {format(new Date(event.startTime), "HH:mm")} à {format(new Date(event.endTime), "HH:mm")} (
              {formatDuration(event.startTime, event.endTime)})
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              event.status === "confirmed"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700",
            )}
          >
            {event.status === "confirmed" ? "Confirmé" : "Annulé"}
          </span>
        </div>

        {(event.attendeeName || event.attendeeEmail) && (
          <div className="flex items-start gap-2 text-xs text-foreground">
            <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>
              {event.attendeeName}
              {event.attendeeName && event.attendeeEmail ? " · " : ""}
              {event.attendeeEmail}
            </span>
          </div>
        )}

        {event.address && (
          <div className="flex items-start gap-2 text-xs text-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span>{event.address}</span>
          </div>
        )}

        {event.description && (
          <div className="flex items-start gap-2 text-xs text-foreground">
            <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="whitespace-pre-wrap text-muted-foreground">{event.description}</p>
          </div>
        )}

        {(event.meetLink || event.htmlLink) && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {event.meetLink && (
              <a
                href={event.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5"
              >
                <Video className="h-3.5 w-3.5" />
                Rejoindre l'appel
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {event.htmlLink && (
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <LinkIcon className="h-3.5 w-3.5" />}
                {copied ? "Lien copié" : "Copier le lien"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RendezVousPage() {
  const { t } = useI18n();
  const { company, updateCompany } = useData();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());

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

  // Rendez-vous du mois affiché, avec toutes leurs infos — affichés directement,
  // sans avoir à cliquer pour les ouvrir.
  const monthEvents = useMemo(() => {
    return events
      .filter((e) => isSameMonth(new Date(e.startTime), visibleMonth))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, visibleMonth]);

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

            {/* Grille du mois — aperçu visuel uniquement, le détail complet est listé juste en dessous */}
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
                      "flex min-h-[90px] flex-col gap-1 border-b border-r border-border p-1.5 last:border-r-0",
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
                        <span
                          key={event.id}
                          className={cn(
                            "truncate rounded px-1.5 py-1 text-left text-[10px] font-medium leading-tight text-white",
                            event.status === "confirmed" ? "bg-blue-500" : "bg-amber-600",
                          )}
                        >
                          <span className="block truncate font-semibold">
                            {event.attendeeName || event.name}
                          </span>
                          <span className="block truncate opacity-90">
                            {format(new Date(event.startTime), "HH:mm")}
                          </span>
                        </span>
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

      {/* Détail complet de chaque rendez-vous du mois — tout est visible directement, sans avoir à cliquer */}
      {isConnected && !isLoading && !isError && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Détail des rendez-vous — {format(visibleMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          {monthEvents.length > 0 ? (
            monthEvents.map((event) => <EventDetailCard key={event.id} event={event} />)
          ) : (
            <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              Aucun rendez-vous ce mois-ci.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
