import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useData } from "@/lib/data-context";
import { useI18n } from "@/lib/i18n";
import { exportQuotePdf } from "@/lib/pdf-export";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  Lock,
  PenTool,
  X,
  Download,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/portail/$id")({
  component: ClientPortalPremium,
});

// ─── Signature Pad ───────────────────────────────────────────────────────────
function SignaturePad({ onSign }: { onSign: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
  }, []);

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const t = (e as React.TouchEvent).touches?.[0];
      if (t) return { x: t.clientX - rect.left, y: t.clientY - rect.top };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const c = getCoords(e);
    if (!c) return;
    canvasRef.current?.getContext("2d")?.beginPath();
    canvasRef.current?.getContext("2d")?.moveTo(c.x, c.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const c = getCoords(e);
    if (!c) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) { ctx.lineTo(c.x, c.y); ctx.stroke(); setHasDrawn(true); }
  };

  const stopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && hasDrawn) onSign(canvas.toDataURL());
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    onSign("");
  };

  return (
    <div className="relative w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 overflow-hidden">
      {!hasDrawn && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none gap-2">
          <PenTool className="h-7 w-7 text-slate-300" />
          <p className="text-xs text-slate-400 font-medium">Dessinez votre signature ici</p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="w-full h-[160px] touch-none cursor-crosshair"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={stopDraw}
        onMouseLeave={stopDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={stopDraw}
      />
      {hasDrawn && (
        <button
          type="button"
          onClick={clear}
          className="absolute top-2 right-2 rounded-full bg-white p-1.5 shadow border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function ClientPortalPremium() {
  const { id } = Route.useParams();
  const { quotes, updateQuote, company } = useData();
  const { money, date } = useI18n();

  const quote = quotes.find((q) => q.number === id);
  const details = quote?.details;

  // Un devis est "signé" du point de vue client uniquement s'il porte le statut Signé
  const isSigned = quote?.status?.fr === "Signé" || quote?.status?.fr === "Facturé";
  const isRefused = quote?.status?.fr === "Refusé";

  // Initialise l'écran selon le statut actuel (mais ne bascule JAMAIS automatiquement
  // sur "signed" — cela doit être déclenché uniquement par le clic du client)
  const [step, setStep] = useState<"view" | "signed" | "refused">(() => {
    if (isRefused) return "refused";
    return "view";
  });
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [isRefuseOpen, setIsRefuseOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [refuseReason, setRefuseReason] = useState("");
  const [exporting, setExporting] = useState(false);

  const now = new Date();
  const timestamp = `${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`;

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Document introuvable</h1>
          <p className="text-slate-500 text-sm">Ce lien est invalide ou le devis a été supprimé.</p>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setExporting(true);
    await exportQuotePdf(quote, company);
    setExporting(false);
  };

  const handleSign = () => {
    const signedAt = new Date().toISOString();
    updateQuote(quote.number, {
      ...quote,
      status: { fr: "Signé", en: "Signed" },
      signedAt,
      signatureData: {
        signerName: typedName.trim() || quote.client,
        signedAt,
        consent: agreed,
      },
    });
    setIsSignOpen(false);
    sessionStorage.setItem(`seen_${quote.number}`, "true");
    setStep("signed");
  };

  const handleRefuse = () => {
    updateQuote(quote.number, {
      ...quote,
      status: { fr: "Refusé", en: "Refused" },
      refusedAt: new Date().toISOString(),
    });
    setIsRefuseOpen(false);
    setStep("refused");
  };

  // ── Écran Signé ─────────────────────────────────────────────────────────────
  if (step === "signed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6 ring-8 ring-emerald-50">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Devis accepté !</h1>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Merci {quote.client}. Votre signature a bien été enregistrée.<br />
            Votre acceptation est enregistrée dans cette version locale. Vous pouvez conserver le PDF ci-dessous.
          </p>
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleDownload}
              disabled={exporting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-xl font-semibold gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? "Téléchargement..." : "Télécharger le devis accepté"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { sessionStorage.setItem(`seen_${quote.number}`, "true"); setStep("view"); }}
              className="w-full py-5 rounded-xl"
            >
              Consulter le devis
            </Button>
          </div>
          <div className="mt-8 p-4 rounded-xl bg-white border border-slate-100 shadow-sm text-left text-xs text-slate-500">
            <p className="font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Trace d'acceptation locale
            </p>
            <p>Signé par : <span className="text-slate-800 font-medium">{quote.client}</span></p>
            <p>Date : <span className="text-slate-800">{timestamp}</span></p>
            <p>Document : <span className="text-slate-800 font-mono">{quote.number}</span></p>
          </div>
        </div>
      </div>
    );
  }

  // ── Écran Refusé ─────────────────────────────────────────────────────────────
  if (step === "refused") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 ring-8 ring-red-50">
            <X className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Devis refusé</h1>
          <p className="text-slate-500 text-sm leading-relaxed">
            Votre réponse a été transmise au prestataire.<br />
            Il pourra vous proposer une nouvelle offre adaptée.
          </p>
        </div>
      </div>
    );
  }

  // ── Calculs ──────────────────────────────────────────────────────────────────
  const items = details?.items ?? [];
  const upsells = details?.upsells ?? [];
  const allItems = [...items, ...upsells];
  const vatRate = details?.vatRate ?? 20;
  const totalHT = details?.totalHT ?? quote.amount / (1 + vatRate / 100);
  const totalTTC = details?.totalTTC ?? quote.amount;
  const totalVAT = totalTTC - totalHT;

  // ── Vue principale ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f1f5f9]">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo / Nom entreprise */}
          <div className="flex items-center gap-3">
            {company.logoBase64 ? (
              <img src={company.logoBase64} alt={company.name} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-9 w-9 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                {company.name?.charAt(0)?.toUpperCase() || "P"}
              </div>
            )}
            <span className="font-semibold text-slate-900 text-sm block">
              {company.name || "Mon Entreprise"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={exporting}
              className="gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <Download className="h-4 w-4" />
              <span className="inline">PDF</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-1.5 text-slate-600 hover:text-slate-900"
            >
              <a href={`mailto:${company.email || ""}?subject=Question — Devis ${quote.number}`}>
                <MessageSquare className="h-4 w-4" />
                <span className="inline">Question</span>
              </a>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-32">

        {/* ── Intro ──────────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <p className="text-sm text-slate-500 mb-1">Proposition commerciale</p>
          <h1 className="text-2xl font-bold text-slate-900">{quote.number}</h1>
          <p className="text-slate-500 text-sm mt-1">
            Émis le {date(quote.date)}
            {company.name && <> · par <span className="font-medium text-slate-700">{company.name}</span></>}
          </p>
        </div>

        {/* ── Statut si déjà signé ─────────────────────────────────────────── */}
        {isSigned && (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800">Ce devis a été accepté et signé.</p>
          </div>
        )}

        {/* ── Card devis ─────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-5">

          {/* En-tête du document */}
          <div className="flex items-start justify-between p-6 sm:p-8 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Prestataire</p>
              <p className="font-bold text-slate-900">{company.name || "—"}</p>
              {company.address && <p className="text-sm text-slate-500">{company.address}</p>}
              {(company.postalCode || company.city) && (
                <p className="text-sm text-slate-500">{company.postalCode} {company.city}</p>
              )}
              {company.siret && <p className="text-xs text-slate-400 mt-1">SIRET {company.siret}</p>}
            </div>
            <div className="text-right">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 uppercase tracking-wide">
                DEVIS
              </span>
              <p className="mt-2 font-mono text-sm font-bold text-slate-900">{quote.number}</p>
              <p className="text-xs text-slate-400 mt-0.5">{date(quote.date)}</p>
            </div>
          </div>

          {/* Destinataire */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-100 bg-slate-50/50">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Destinataire</p>
            <p className="font-bold text-slate-900 text-lg">{quote.client}</p>
            {details?.companyName && details.companyName !== quote.client && (
              <p className="text-sm text-slate-600">{details.companyName}</p>
            )}
            {details?.siret && <p className="text-xs text-slate-400">SIRET {details.siret}</p>}
            {details?.address && <p className="text-sm text-slate-500 mt-1">{details.address}</p>}
            {details?.phone && <p className="text-sm text-slate-500">{details.phone}</p>}
          </div>

          {/* Tableau des prestations */}
          <div className="px-6 sm:px-8 py-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Désignation
                  </th>
                  <th className="text-center pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 w-16">
                    Qté
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">
                    Prix unit. HT
                  </th>
                  <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 w-28">
                    Total HT
                  </th>
                </tr>
              </thead>
              <tbody>
                {allItems.length > 0 ? (
                  allItems.map((item, i) => {
                    const price = Number(item.priceHT) || 0;
                    const qty = Number(item.qty) || 1;
                    return (
                      <tr key={item.id || i} className="border-b border-slate-50 last:border-0">
                        <td className="py-3 text-slate-800 font-medium">{item.label}</td>
                        <td className="py-3 text-center text-slate-600">{qty}</td>
                        <td className="py-3 text-right text-slate-600 font-mono text-xs">
                          {money(price)}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-800 font-mono text-xs">
                          {money(price * qty)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400 text-sm italic">
                      Détail des prestations non disponible
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totaux */}
          <div className="px-6 sm:px-8 py-5 border-t border-slate-100 bg-slate-50/50">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total HT</span>
                <span className="font-medium font-mono">{money(totalHT)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500">
                <span>TVA ({vatRate}%)</span>
                <span className="font-mono">{money(totalVAT)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 border-t border-slate-200 pt-2 mt-2">
                <span>Total TTC</span>
                <span className="text-primary font-mono">{money(totalTTC)}</span>
              </div>
            </div>
          </div>

          {/* Conditions & mentions */}
          {company.footerNote && (
            <div className="px-6 sm:px-8 py-4 border-t border-slate-100">
              <p className="text-xs text-slate-400 leading-relaxed">{company.footerNote}</p>
            </div>
          )}
        </div>

        {/* ── Badge sécurité ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-5">
          <ShieldCheck className="h-4 w-4" />
          <span>Portail de démonstration · Acceptation conservée dans ce navigateur</span>
        </div>

        {/* ── CTA (si pas encore signé) ──────────────────────────────────────── */}
        {!isSigned && !isRefused && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 z-20">
            <div className="max-w-3xl mx-auto flex flex-row gap-3">
              <Button
                onClick={() => setIsSignOpen(true)}
                className="flex-1 h-12 text-base font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 shadow-lg shadow-slate-900/20"
              >
                <PenTool className="h-4 w-4" />
                Accepter & Signer
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsRefuseOpen(true)}
                className="sm:w-auto h-12 text-sm font-medium border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-xl gap-2"
              >
                <X className="h-4 w-4" />
                Refuser le devis
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* ── Modale de Signature ─────────────────────────────────────────────── */}
      <Dialog open={isSignOpen} onOpenChange={setIsSignOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-slate-900 text-white px-6 py-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                <PenTool className="h-4 w-4" />
              </div>
              <DialogTitle className="text-base font-bold text-white">
                Signer le devis
              </DialogTitle>
            </div>
            <p className="text-xs text-white/50 ml-11">{quote.number} · {quote.client}</p>
          </div>

          <div className="p-6 space-y-5">

            {/* CGV */}
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <Checkbox
                id="cgv"
                checked={agreed}
                onCheckedChange={(c) => setAgreed(!!c)}
                className="mt-0.5 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
              />
              <div>
                <Label htmlFor="cgv" className="text-sm font-medium text-slate-800 cursor-pointer block mb-0.5">
                  J'accepte les Conditions Générales de Vente
                </Label>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Acceptation enregistrée en mode local
                </p>
              </div>
            </div>

            {/* Zone de signature */}
            <div className={cn("transition-opacity", !agreed && "opacity-40 pointer-events-none")}>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {signatureMode === "draw" ? "Tracez votre signature" : "Tapez votre nom"}
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-slate-500 cursor-pointer">
                    <Switch
                      checked={signatureMode === "type"}
                      onCheckedChange={(c) => {
                        setSignatureMode(c ? "type" : "draw");
                        setSignatureData("");
                        setTypedName("");
                      }}
                      className="mr-1.5"
                    />
                    Clavier
                  </Label>
                </div>
              </div>

              {signatureMode === "draw" ? (
                <SignaturePad onSign={setSignatureData} />
              ) : (
                <Input
                  autoFocus
                  placeholder="Jean Dupont"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="font-display text-xl h-14 rounded-xl bg-slate-50 border-slate-200"
                />
              )}
            </div>

            {/* Info légale */}
            <div className="text-[10px] text-slate-400 space-y-0.5 pt-1">
              <p>Horodatage : {timestamp}</p>
              <p>Référence : {quote.number}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 pb-6">
            <Button
              onClick={handleSign}
              disabled={
                !agreed ||
                (signatureMode === "draw" ? !signatureData : !typedName)
              }
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-2 text-sm shadow-lg shadow-slate-900/20 disabled:opacity-40"
            >
              <CheckCircle2 className="h-4 w-4" />
              Confirmer ma signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Modale de Refus ─────────────────────────────────────────────────── */}
      <Dialog open={isRefuseOpen} onOpenChange={setIsRefuseOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
          {/* Header */}
          <div className="bg-red-50 border-b border-red-100 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                <X className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Refuser le devis
                </DialogTitle>
                <p className="text-xs text-slate-400">{quote.number} · {quote.client}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Vous êtes sur le point de refuser cette proposition commerciale.
              Le prestataire sera notifié et pourra vous soumettre une nouvelle offre.
            </p>
            <div>
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                Motif du refus <span className="normal-case font-normal text-slate-400">(optionnel)</span>
              </Label>
              <Textarea
                placeholder="Ex : Budget trop élevé, délai non compatible, autre prestataire retenu…"
                value={refuseReason}
                onChange={(e) => setRefuseReason(e.target.value)}
                className="rounded-xl border-slate-200 bg-slate-50 resize-none text-sm"
                rows={3}
              />
            </div>
          </div>

          <div className="px-6 pb-6 flex flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setIsRefuseOpen(false)}
              className="flex-1 h-11 rounded-xl"
            >
              Annuler
            </Button>
            <Button
              onClick={handleRefuse}
              className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold gap-2"
            >
              <X className="h-4 w-4" />
              Confirmer le refus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
