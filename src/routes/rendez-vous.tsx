import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { Calendar, Clock, User, Video, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/rendez-vous")({
  component: RendezVousPage,
});

const DUMMY_APPOINTMENTS: any[] = [];

function RendezVousPage() {
  const { t } = useI18n();
  
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader 
        title={t("app.rendezvous.title" as Key)} 
        subtitle={t("app.rendezvous.subtitle" as Key)}
        action={
          <button className="flex h-9 items-center gap-2 rounded-[var(--shape-control)] bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <Calendar className="h-4 w-4" />
            Connecter Calendly
          </button>
        }
      />
      
      <div className="mt-8 flex flex-col gap-4">
        {DUMMY_APPOINTMENTS.length > 0 ? (
          DUMMY_APPOINTMENTS.map((apt) => (
            <div key={apt.id} className="flex flex-col gap-4 rounded-[var(--shape-control)] border-2 border-navy/20 bg-card p-5 shadow-offset-sm transition-all hover:border-primary lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4 lg:items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--shape-control)] bg-primary/10 text-primary">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{apt.name}</h3>
                  <p className="text-sm text-muted-foreground">{apt.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {apt.date}</span>
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
            <h3 className="text-xl font-bold text-foreground">Aucun rendez-vous synchronisé</h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Vous n'avez pas de rendez-vous actuellement. Connectez votre compte Calendly pour que vos prochains événements s'affichent directement ici.
            </p>
            <button className="mt-6 flex h-10 items-center gap-2 rounded-[var(--shape-control)] bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              <Calendar className="h-4 w-4" />
              Connecter mon compte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
