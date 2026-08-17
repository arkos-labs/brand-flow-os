import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Plus,
  Building2,
  CheckCircle2,
  Clock,
  FileText,
  ReceiptEuro,
  ChevronRight,
  AlertTriangle,
  Trash2,
  X,
  Info,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import type { Marche, MarcheStatus, Situation, SituationStatus } from "@/lib/data-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export const Route = createFileRoute("/situations")({
  head: () => ({
    meta: [
      { title: "Situations de travaux — ClearQuote" },
      {
        name: "description",
        content:
          "Facturation partielle par avancement pour les marchés BTP : situation 1, 2, solde.",
      },
    ],
  }),
  component: Situations,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const VAT_RATES = [20, 10, 5.5, 0];
const RG_RATES = [5, 3, 2, 0];

function today() {
  return new Date().toISOString().split("T")[0] ?? "";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function calcSitAmounts(
  marche: Marche,
  avancementCumule: number,
  prevCumule: number,
) {
  const avancementSituation = Math.max(0, avancementCumule - prevCumule);
  const montantHT = (avancementSituation / 100) * marche.totalHT;
  const retenueGarantie = montantHT * (marche.retenuGarantie / 100);
  const vatAmount = montantHT * (marche.vatRate / 100);
  const montantTTC = montantHT + vatAmount;
  const netAPayer = montantTTC - retenueGarantie;
  return { avancementSituation, montantHT, retenueGarantie, vatAmount, montantTTC, netAPayer };
}

// ── Status styles ─────────────────────────────────────────────────────────────

const marchStatStyles: Record<MarcheStatus, string> = {
  actif: "bg-primary/10 text-primary",
  solde: "bg-success/12 text-success",
  arrete: "bg-destructive/10 text-destructive",
};

const marchStatKey: Record<MarcheStatus, Key> = {
  actif: "sit.status.actif",
  solde: "sit.status.solde",
  arrete: "sit.status.arrete",
};

const sitStatStyles: Record<SituationStatus, string> = {
  brouillon: "bg-secondary text-muted-foreground",
  envoyee: "bg-primary/10 text-primary",
  payee: "bg-success/12 text-success",
};

const sitStatKey: Record<SituationStatus, Key> = {
  brouillon: "sit.sit.brouillon",
  envoyee: "sit.sit.envoyee",
  payee: "sit.sit.payee",
};

const sitStatIcon: Record<SituationStatus, typeof CheckCircle2> = {
  brouillon: FileText,
  envoyee: Clock,
  payee: CheckCircle2,
};

// ── Composant principal ───────────────────────────────────────────────────────

function Situations() {
  const { t, money, lang } = useI18n();
  const {
    marches, addMarche, updateMarche, deleteMarche,
    situations, addSituation, updateSituation,
    invoices, addInvoice, company, updateCompany,
  } = useData();

  const [selectedId, setSelectedId] = useState<string | null>(
    marches[0]?.id ?? null,
  );
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sitDialogOpen, setSitDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ── Marché form state ──────────────────────────────────────────────────────
  const [mForm, setMForm] = useState({
    client: "", title: "", totalHT: "", vatRate: "10",
    retenuGarantie: "5", startDate: today(), endDate: "", notes: "",
  });

  // ── Situation form state ───────────────────────────────────────────────────
  const [sitForm, setSitForm] = useState({ avancementCumule: "", date: today() });

  // ── Dérivées ───────────────────────────────────────────────────────────────
  const selectedMarche = marches.find((m) => m.id === selectedId) ?? null;

  const marcheSituations = useMemo(
    () =>
      situations
        .filter((s) => s.marcheId === selectedId)
        .sort((a, b) => a.number - b.number),
    [situations, selectedId],
  );

  const prevCumule = marcheSituations.length > 0
    ? marcheSituations[marcheSituations.length - 1]?.avancementCumule ?? 0
    : 0;

  const is100 = prevCumule >= 100;

  // Calcul live pour la prévisualisation dans le dialog
  const sitCumul = Number(sitForm.avancementCumule) || 0;
  const sitPreview = selectedMarche
    ? calcSitAmounts(selectedMarche, sitCumul, prevCumule)
    : null;

  const nextSitNumber = marcheSituations.length + 1;
  const nextSitLabel =
    sitCumul >= 100
      ? t("sit.solde_label")
      : `${lang === "fr" ? "Situation" : "Situation"} n°${nextSitNumber}`;

  // KPIs globaux
  const activeMarches = marches.filter((m) => m.status === "actif").length;
  const totalBilled = situations.reduce((s, sit) => s + sit.netAPayer, 0);
  const totalRG = situations.reduce((s, sit) => s + sit.retenueGarantie, 0);
  const totalRestant = marches.reduce((sum, m) => {
    const sitM = situations.filter((s) => s.marcheId === m.id);
    const cumul = sitM.length > 0 ? Math.max(...sitM.map((s) => s.avancementCumule)) : 0;
    const reste = ((100 - cumul) / 100) * m.totalHT * (1 + m.vatRate / 100);
    return sum + reste;
  }, 0);

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleCreateMarche(e: React.FormEvent) {
    e.preventDefault();
    const year = new Date().getFullYear();
    const num = marches.length + 1;
    const number = `MC-${year}-${String(num).padStart(3, "0")}`;
    addMarche({
      number,
      client: mForm.client,
      title: mForm.title,
      totalHT: Number(mForm.totalHT),
      vatRate: Number(mForm.vatRate),
      retenuGarantie: Number(mForm.retenuGarantie),
      startDate: mForm.startDate,
      ...(mForm.endDate ? { endDate: mForm.endDate } : {}),
      status: "actif",
      ...(mForm.notes ? { notes: mForm.notes } : {}),
    });
    setMForm({ client: "", title: "", totalHT: "", vatRate: "10", retenuGarantie: "5", startDate: today(), endDate: "", notes: "" });
    setSheetOpen(false);
  }

  function handleCreateSituation(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMarche || !sitPreview) return;
    const cumul = Number(sitForm.avancementCumule);
    if (cumul <= prevCumule || cumul > 100) return;

    addSituation({
      marcheId: selectedMarche.id,
      number: nextSitNumber,
      label: nextSitLabel,
      date: sitForm.date,
      avancementCumule: cumul,
      ...sitPreview,
      status: "brouillon",
    });

    // Auto-update marché status si 100%
    if (cumul >= 100) {
      updateMarche(selectedMarche.id, { ...selectedMarche, status: "solde" });
    }

    setSitForm({ avancementCumule: "", date: today() });
    setSitDialogOpen(false);
  }

  function handleGenerateInvoice(sit: Situation) {
    if (!selectedMarche) return;
    const year = new Date().getFullYear();
    const num = company.nextInvoiceNumber ?? (invoices.length + 1);
    const pad = String(num).padStart(4, "0");
    const invoiceNumber = `${company.invoicePrefix || "FA"}-${year}-${pad}`;
    const due = new Date();
    due.setDate(due.getDate() + (company.paymentTermsDays ?? 30));

    addInvoice({
      number: invoiceNumber,
      client: selectedMarche.client,
      date: today(),
      due: due.toISOString().split("T")[0] ?? "",
      amount: sit.netAPayer,
      totalHT: sit.montantHT,
      totalVAT: sit.vatAmount,
      status: "sent",
      sentAt: new Date().toISOString(),
    });
    updateCompany({ nextInvoiceNumber: num + 1 });

    updateSituation(sit.id, { ...sit, status: "envoyee", invoiceNumber });
    setSuccessMsg(invoiceNumber);
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleDeleteMarche() {
    if (!selectedMarche) return;
    deleteMarche(selectedMarche.id);
    setSelectedId(marches.find((m) => m.id !== selectedMarche.id)?.id ?? null);
    setDeleteDialogOpen(false);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title={t("sit.title")}
        subtitle={t("sit.subtitle")}
        action={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("sit.new_marche")}
          </Button>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 mb-6">
        {[
          { label: t("sit.kpi.marches"), value: String(activeMarches), icon: Building2, tone: "text-primary", bg: "bg-primary/10" },
          { label: t("sit.kpi.facture"), value: money(totalBilled), icon: ReceiptEuro, tone: "text-foreground", bg: "bg-muted" },
          { label: t("sit.kpi.restant"), value: money(totalRestant), icon: ChevronRight, tone: "text-warning", bg: "bg-warning/10" },
          { label: t("sit.kpi.rg"), value: money(totalRG), icon: AlertTriangle, tone: "text-muted-foreground", bg: "bg-muted" },
        ].map((k) => (
          <div key={k.label} className="card-elevated flex items-center gap-4 p-5">
            <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", k.bg)}>
              <k.icon className={cn("h-5 w-5", k.tone)} />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</p>
              <p className="font-display text-xl font-semibold mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state global */}
      {marches.length === 0 && (
        <div className="card-elevated flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="mb-4 h-12 w-12 text-muted-foreground/30" />
          <p className="font-display text-lg font-semibold">{t("sit.empty")}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("sit.empty.desc")}</p>
          <Button className="mt-6" onClick={() => setSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("sit.new_marche")}
          </Button>
        </div>
      )}

      {/* Split layout */}
      {marches.length > 0 && (
        <div className="flex gap-5 min-h-[600px]">

          {/* ── Liste marchés ── */}
          <div className="w-72 shrink-0 flex flex-col gap-2">
            {marches.map((m) => {
              const mSits = situations.filter((s) => s.marcheId === m.id);
              const cumul = mSits.length > 0 ? Math.max(...mSits.map((s) => s.avancementCumule)) : 0;
              const isSelected = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedId(m.id)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  {/* Badge statut */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium", marchStatStyles[m.status])}>
                      {t(marchStatKey[m.status])}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">{m.number}</span>
                  </div>
                  <p className="text-sm font-semibold leading-snug line-clamp-2">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.client}</p>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-muted-foreground">{t("sit.progress")}</span>
                      <span className="text-[11px] font-semibold text-foreground">{cumul}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          cumul >= 100 ? "bg-success" : "bg-primary",
                        )}
                        style={{ width: `${cumul}%` }}
                      />
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-medium text-foreground">{money(m.totalHT)} HT</p>
                </button>
              );
            })}
          </div>

          {/* ── Détail marché ── */}
          <div className="flex-1 min-w-0">
            {!selectedMarche ? (
              <div className="card-elevated flex flex-col items-center justify-center h-full py-20 text-center">
                <Building2 className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">{t("sit.empty_select")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("sit.empty_select.desc")}</p>
              </div>
            ) : (
              <>
                {/* Header du marché */}
                <div className="card-elevated p-5 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium", marchStatStyles[selectedMarche.status])}>
                          {t(marchStatKey[selectedMarche.status])}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">{selectedMarche.number}</span>
                        <span className="text-xs text-muted-foreground">
                          Début : {fmtDate(selectedMarche.startDate)}
                          {selectedMarche.endDate && ` → ${fmtDate(selectedMarche.endDate)}`}
                        </span>
                      </div>
                      <h2 className="text-lg font-semibold">{selectedMarche.title}</h2>
                      <p className="text-sm text-muted-foreground">{selectedMarche.client}</p>
                    </div>
                    <button
                      onClick={() => setDeleteDialogOpen(true)}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Stats du marché */}
                  <div className="mt-4 grid grid-cols-3 gap-4 border-t border-border pt-4">
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Montant HT</p>
                      <p className="text-base font-semibold mt-0.5">{money(selectedMarche.totalHT)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">
                        TVA {selectedMarche.vatRate}% / RG {selectedMarche.retenuGarantie}%
                      </p>
                      <p className="text-base font-semibold mt-0.5">
                        {money(selectedMarche.totalHT * (1 + selectedMarche.vatRate / 100))} TTC
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{t("sit.progress")}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all", prevCumule >= 100 ? "bg-success" : "bg-primary")}
                            style={{ width: `${prevCumule}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold w-10 text-right">{prevCumule}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline des situations */}
                <div className="card-elevated p-5">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold">
                      {lang === "fr" ? "Situations d'avancement" : "Progress situations"}
                      <span className="ml-2 text-muted-foreground font-normal">({marcheSituations.length})</span>
                    </h3>
                    {!is100 && (
                      <Button size="sm" onClick={() => setSitDialogOpen(true)}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" />
                        {t("sit.new_situation")}
                      </Button>
                    )}
                  </div>

                  {marcheSituations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="mb-3 h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">{t("sit.empty_situations")}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{t("sit.empty_situations.desc")}</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Ligne verticale */}
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                      <div className="flex flex-col gap-0">
                        {marcheSituations.map((sit, idx) => {
                          const Icon = sitStatIcon[sit.status];
                          const isLast = idx === marcheSituations.length - 1;
                          const isSolde = sit.avancementCumule >= 100;
                          return (
                            <div key={sit.id} className={cn("relative pl-10 pb-6", isLast && "pb-0")}>
                              {/* Dot */}
                              <div
                                className={cn(
                                  "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background",
                                  sit.status === "payee"
                                    ? "bg-success text-white"
                                    : sit.status === "envoyee"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-muted-foreground",
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>

                              {/* Carte situation */}
                              <div className={cn(
                                "rounded-xl border p-4 transition-colors",
                                isSolde ? "border-success/40 bg-success/5" : "border-border bg-card",
                              )}>
                                {/* Header */}
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold">{sit.label}</span>
                                      {isSolde && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2 py-0.5 text-[10px] font-medium text-success">
                                          <CheckCircle2 className="h-3 w-3" />
                                          {lang === "fr" ? "Solde" : "Final"}
                                        </span>
                                      )}
                                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", sitStatStyles[sit.status])}>
                                        <Icon className="h-3 w-3" />
                                        {t(sitStatKey[sit.status])}
                                      </span>
                                    </div>
                                    <p className="mt-0.5 text-xs text-muted-foreground">{fmtDate(sit.date)}</p>
                                  </div>
                                  {/* Avancement badge */}
                                  <div className="text-right shrink-0">
                                    <span className="text-lg font-bold text-foreground">+{sit.avancementSituation}%</span>
                                    <p className="text-[11px] text-muted-foreground">
                                      {lang === "fr" ? "Cumul :" : "Cumulative:"} {sit.avancementCumule}%
                                    </p>
                                  </div>
                                </div>

                                {/* Montants */}
                                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm grid-cols-4">
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("sit.col.ht")}</p>
                                    <p className="font-medium">{money(sit.montantHT)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("sit.col.rg")}</p>
                                    <p className="font-medium text-muted-foreground">−{money(sit.retenueGarantie)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">TVA {selectedMarche.vatRate}%</p>
                                    <p className="font-medium">+{money(sit.vatAmount)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{t("sit.col.net")}</p>
                                    <p className="font-semibold text-foreground">{money(sit.netAPayer)}</p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
                                  <div>
                                    {sit.invoiceNumber ? (
                                      <span className="inline-flex items-center gap-1.5 text-xs text-success font-medium">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {t("sit.invoice_generated")} — {sit.invoiceNumber}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        {lang === "fr" ? "Pas encore facturée" : "Not yet invoiced"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Changer statut */}
                                    {sit.status !== "payee" && (
                                      <Select
                                        value={sit.status}
                                        onValueChange={(v) =>
                                          updateSituation(sit.id, { ...sit, status: v as SituationStatus })
                                        }
                                      >
                                        <SelectTrigger className="h-7 w-32 text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="brouillon">{t("sit.sit.brouillon")}</SelectItem>
                                          <SelectItem value="envoyee">{t("sit.sit.envoyee")}</SelectItem>
                                          <SelectItem value="payee">{t("sit.sit.payee")}</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {/* Générer facture */}
                                    {!sit.invoiceNumber && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs"
                                        onClick={() => handleGenerateInvoice(sit)}
                                      >
                                        <ReceiptEuro className="mr-1.5 h-3 w-3" />
                                        {t("sit.generate_invoice")}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Info RG totale */}
                  {marcheSituations.length > 0 && (
                    <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span>
                        {lang === "fr"
                          ? `Retenue de garantie totale retenue : `
                          : `Total retention held: `}
                        <strong className="text-foreground">
                          {money(marcheSituations.reduce((s, sit) => s + sit.retenueGarantie, 0))}
                        </strong>
                        {lang === "fr"
                          ? ` — libérable 1 an après la réception des travaux (Loi du 16 juillet 1971).`
                          : ` — releasable 1 year after works acceptance (French Law of July 16, 1971).`}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Sheet : Nouveau marché ─────────────────────────────────────────────── */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{t("sit.form.title_marche")}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleCreateMarche} className="mt-6 flex flex-col gap-4">
            {/* Client */}
            <div className="space-y-1.5">
              <Label>{t("sit.marche.client")} *</Label>
              <Input
                required
                value={mForm.client}
                onChange={(e) => setMForm((f) => ({ ...f, client: e.target.value }))}
                placeholder="Ex: Résidence Les Pins"
              />
            </div>
            {/* Titre */}
            <div className="space-y-1.5">
              <Label>{t("sit.marche.title")} *</Label>
              <Input
                required
                value={mForm.title}
                onChange={(e) => setMForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex: Rénovation salle de bain"
              />
            </div>
            {/* Montant HT */}
            <div className="space-y-1.5">
              <Label>{t("sit.marche.total")} *</Label>
              <div className="relative">
                <Input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={mForm.totalHT}
                  onChange={(e) => setMForm((f) => ({ ...f, totalHT: e.target.value }))}
                  placeholder="Ex: 42000"
                  className="pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€ HT</span>
              </div>
            </div>
            {/* TVA + RG */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("sit.marche.vat")}</Label>
                <Select value={mForm.vatRate} onValueChange={(v) => setMForm((f) => ({ ...f, vatRate: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VAT_RATES.map((r) => (
                      <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t("sit.marche.rg")}</Label>
                <Select value={mForm.retenuGarantie} onValueChange={(v) => setMForm((f) => ({ ...f, retenuGarantie: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RG_RATES.map((r) => (
                      <SelectItem key={r} value={String(r)}>{r}%</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t("sit.marche.start")} *</Label>
                <Input
                  type="date"
                  required
                  value={mForm.startDate}
                  onChange={(e) => setMForm((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("sit.marche.end")}</Label>
                <Input
                  type="date"
                  value={mForm.endDate}
                  onChange={(e) => setMForm((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            {/* Notes */}
            <div className="space-y-1.5">
              <Label>{t("sit.marche.notes")}</Label>
              <textarea
                value={mForm.notes}
                onChange={(e) => setMForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder={lang === "fr" ? "Informations complémentaires…" : "Additional notes…"}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="pt-2 flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>
                {lang === "fr" ? "Annuler" : "Cancel"}
              </Button>
              <Button type="submit" className="flex-1">
                {lang === "fr" ? "Créer le marché" : "Create contract"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Dialog : Nouvelle situation ────────────────────────────────────────── */}
      <Dialog open={sitDialogOpen} onOpenChange={setSitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sit.form.title_situation")}</DialogTitle>
          </DialogHeader>
          {selectedMarche && (
            <form onSubmit={handleCreateSituation} className="space-y-4 mt-2">
              <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
                <p className="font-medium">{selectedMarche.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("sit.form.prev_cumul")} : <strong>{prevCumule}%</strong>
                  {" "}— {lang === "fr" ? "Restant" : "Remaining"} : <strong>{100 - prevCumule}%</strong>
                </p>
              </div>

              {/* Avancement cumulé */}
              <div className="space-y-1.5">
                <Label>
                  {t("sit.avancement")} *{" "}
                  <span className="text-muted-foreground text-[11px]">
                    (min {prevCumule + 1}% — max 100%)
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    required
                    type="number"
                    min={prevCumule + 1}
                    max={100}
                    value={sitForm.avancementCumule}
                    onChange={(e) => setSitForm((f) => ({ ...f, avancementCumule: e.target.value }))}
                    placeholder={`Ex: ${Math.min(prevCumule + 30, 100)}`}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label>{t("sit.date")} *</Label>
                <Input
                  type="date"
                  required
                  value={sitForm.date}
                  onChange={(e) => setSitForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>

              {/* Prévisualisation live */}
              {sitPreview && sitCumul > prevCumule && sitCumul <= 100 && (
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {nextSitLabel} — {t("sit.form.preview")}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                    <div className="text-muted-foreground">{t("sit.avancement.delta")}</div>
                    <div className="font-medium text-right">+{sitPreview.avancementSituation}%</div>
                    <div className="text-muted-foreground">{t("sit.montant_ht")}</div>
                    <div className="font-medium text-right">{money(sitPreview.montantHT)}</div>
                    <div className="text-muted-foreground">{t("sit.rg_amount")} ({selectedMarche.retenuGarantie}%)</div>
                    <div className="font-medium text-right text-muted-foreground">−{money(sitPreview.retenueGarantie)}</div>
                    <div className="text-muted-foreground">TVA {selectedMarche.vatRate}%</div>
                    <div className="font-medium text-right">+{money(sitPreview.vatAmount)}</div>
                    <div className="border-t border-border pt-1.5 font-semibold">{t("sit.net")}</div>
                    <div className="border-t border-border pt-1.5 font-bold text-right text-primary">{money(sitPreview.netAPayer)}</div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setSitDialogOpen(false)}>
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!sitCumul || sitCumul <= prevCumule || sitCumul > 100}
                >
                  {lang === "fr" ? "Créer la situation" : "Create situation"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Dialog : Supprimer le marché ────────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">
              {t("sit.delete_marche")}
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === "fr"
              ? `Supprimer « ${selectedMarche?.title} » ?`
              : `Delete "${selectedMarche?.title}"?`}
            <br />
            {t("sit.delete_marche.confirm")}
          </p>
          <div className="mt-4 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteDialogOpen(false)}>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleDeleteMarche}>
              {lang === "fr" ? "Supprimer" : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Toast succès ─────────────────────────────────────────────────────────── */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-success/30 bg-background px-4 py-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t("sit.invoice_generated")}</p>
            <p className="text-xs text-muted-foreground font-mono">{successMsg}</p>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="ml-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
