import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useData } from "@/lib/data-context";
import { useI18n } from "@/lib/i18n";
import { exportQuotePdf, exportQuotePdfBlob } from "@/lib/pdf-export";
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
import { Download, CheckCircle2, Lock, PenTool, X, Clock, MapPin, User, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/portail/$id")({
  component: ClientPortalPremium,
});

// -- Composant Canvas de Signature -----------------------------
function SignaturePad({
  onSign,
}: {
  onSign: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Set clear background
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1e293b";
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touchEvent = e as React.TouchEvent;
      const touch = touchEvent.touches?.[0];
      if (touch) {
        return {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        };
      }
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (!coords) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing) return;
    const coords = getCoordinates(e);
    if (!coords) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
      setHasDrawn(true);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSign(canvas.toDataURL());
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
      onSign("");
    }
  };

  return (
    <div className="relative w-full rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden">
      {!hasDrawn && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40">
          <PenTool className="h-8 w-8 text-slate-400" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="w-full h-[200px] touch-none cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {hasDrawn && (
        <button
          type="button"
          onClick={clearCanvas}
          className="absolute top-2 right-2 rounded-md bg-white p-1.5 shadow-sm border text-slate-500 hover:text-slate-900"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// -- Main Page --------------------------------------------------
function ClientPortalPremium() {
  const { id } = Route.useParams();
  const { quotes, updateQuote, company } = useData();
  const { money, date, lang } = useI18n();
  
  const quote = quotes.find((q) => q.number === id);
  const isSigned = quote?.status?.fr === "Signé" || quote?.status?.fr === "Facturé" || quote?.status?.fr === "Payé" || quote?.status === "Signé" || quote?.status === "Facturé" || quote?.status === "Payé";

  const [step, setStep] = useState<"view" | "signed_success">("view");
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signatureMode, setSignatureMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [signatureData, setSignatureData] = useState("");
  const [exporting, setExporting] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!quote || !company) return;
    let url = "";
    exportQuotePdfBlob(quote, company).then((blob) => {
      url = URL.createObjectURL(blob);
      setPdfUrl(url);
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [quote, company]);
  
  // Simulation IP / Horodatage
  const mockIp = "192.168.1.84";
  const now = new Date();
  const timestamp = `${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`;
  const certHash = `8f9g0h1i2j3k4l5m6n7o8p9q0r`;

  // Vérification de statut initial (une seule fois au chargement)
  useEffect(() => {
    if (quote && (quote.status?.fr === "Signé" || quote.status?.fr === "Facturé" || quote.status?.fr === "Payé" || quote.status === "Signé" || quote.status === "Facturé" || quote.status === "Payé")) {
      // S'il vient juste de signer, on ne force pas s'il veut revenir voir le devis, 
      // mais au chargement initial on affiche le succès.
      const hasSeenSuccess = sessionStorage.getItem(`seen_success_${quote.number}`);
      if (!hasSeenSuccess) {
        setStep("signed_success");
      }
    }
  }, [quote]);

  if (!quote) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md text-center">
          <h1 className="mt-4 text-2xl font-bold">Document introuvable</h1>
        </div>
      </div>
    );
  }

  const handleDownload = async () => {
    setExporting(true);
    await exportQuotePdf(quote, company);
    setExporting(false);
  };

  const submitSignature = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!agreed) return;
    if (signatureMode === "type" && !typedName) return;
    if (signatureMode === "draw" && !signatureData) return;

    updateQuote(quote.number, {
      ...quote,
      status: { fr: "Signé", en: "Signed" },
    });
    
    setIsSignOpen(false);
    setStep("signed_success");
  };

  // --- Écran de Succès ----------------------------------------------------
  if (step === "signed_success") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 p-10 text-center relative overflow-hidden">
          {/* Logo absolu déco */}
          <div className="absolute -inset-10 opacity-5 pointer-events-none flex items-center justify-center">
            <CheckCircle2 className="w-96 h-96" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="h-24 w-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 ring-8 ring-emerald-50">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-4">Document signé avec succès</h1>
            <p className="text-slate-600 text-sm max-w-md mx-auto mb-8 leading-relaxed">
              Un exemplaire signé a été envoyé à votre adresse e-mail ainsi qu'au prestataire.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-sm mx-auto">
              <Button 
                onClick={handleDownload} 
                disabled={exporting}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20 py-6 text-base"
              >
                {exporting ? "Téléchargement..." : "Télécharger le document certifié (PDF)"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  sessionStorage.setItem(`seen_success_${quote.number}`, "true");
                  setStep("view");
                }}
                className="w-full py-6 text-slate-600 bg-white/50 backdrop-blur-sm border-slate-200/60"
              >
                Afficher le devis
              </Button>
            </div>

            <div className="mt-10 p-5 rounded-xl bg-white border border-slate-100 text-left text-xs text-slate-500 w-full max-w-sm mx-auto shadow-sm">
              <h4 className="font-semibold text-slate-900 mb-2">Certificat de signature</h4>
              <div className="space-y-1">
                <p>Signé par : {quote.client}</p>
                <p>Date : {timestamp}</p>
                <p>Hash : <span className="font-mono">{certHash}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Écran Devis (Premium) -----------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e2e8f0] via-[#cbd5e1] to-[#e2e8f0] relative pb-20">
      
      {/* Barre collante (Sticky Header) */}
      <div className="sticky top-0 z-40 bg-white/40 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-xs">
              {company.name?.charAt(0) || "I"}
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {!isSigned && (
              <Button onClick={() => setIsSignOpen(true)} className="bg-slate-500/80 hover:bg-slate-600 backdrop-blur text-white shadow-sm transition-all shadow-slate-500/20 rounded-xl px-6">
                Accepter & Signer
              </Button>
            )}
            <Button variant="outline" onClick={handleDownload} disabled={exporting} className="hidden sm:flex bg-white/50 backdrop-blur rounded-xl border-white/40">
              Télécharger PDF
            </Button>
            <Button asChild variant="outline" className="hidden sm:flex bg-white/50 backdrop-blur rounded-xl border-white/40">
              <a href={`mailto:${company.email || ""} ?subject=Question concernant le devis ${quote.number}`}>
                Poser une question
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col items-center gap-8">
          {/* Document Principal (Lecteur PDF) */}
          <div className="w-full flex justify-center">
            {pdfUrl ? (
              <iframe 
                src={pdfUrl} 
                className="w-full max-w-[21cm] h-[800px] border border-slate-200 rounded-lg shadow-xl"
                title="Document PDF"
              />
            ) : (
              <div className="w-full max-w-[21cm] h-[800px] border border-slate-200 rounded-lg shadow-xl flex items-center justify-center bg-slate-50 text-slate-400">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary"></div>
                  Génération du document...
                </div>
              </div>
            )}
          </div>

          {/* Zone de Validation (Si en attente) */}
          {quote.status?.fr !== "Signé" && quote.status?.fr !== "Facturé" && quote.status?.fr !== "Payé" && quote.status !== "Signé" && quote.status !== "Facturé" && quote.status !== "Payé" && (
            <div className="w-full max-w-[21cm] bg-white p-6 sm:p-8 border border-slate-200 rounded-xl shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Signature électronique</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <Checkbox 
                    id="accept-cgv" 
                    className="w-5 h-5 mt-1 rounded border-slate-300 text-slate-900 data-[state=checked]:bg-slate-900 data-[state=checked]:border-slate-900"
                    checked={agreed}
                    onCheckedChange={(c) => setAgreed(!!c)}
                  />
                  <div className="flex-1">
                    <Label htmlFor="accept-cgv" className="text-sm font-medium text-slate-700 cursor-pointer block mb-1">
                      J'accepte les Conditions Générales de Vente (CGV)
                    </Label>
                    <p className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Lock className="w-3.5 h-3.5" />
                      Signature électronique sécurisée à valeur légale
                    </p>
                  </div>
                </div>

                {/* Espace Signature visuel */}
                <div 
                  className={cn(
                    "rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
                    agreed ? "border-slate-300 hover:border-slate-400 hover:bg-slate-50" : "border-slate-200 opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => { if (agreed) setIsSignOpen(true); }}
                >
                  <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-2">Signature</p>
                  <p className="text-slate-400 font-medium">
                    {agreed ? "Cliquez ici pour signer le document" : "Veuillez accepter les CGV d'abord"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- Modale de Signature ---------------------------------------------- */}
      <Dialog open={isSignOpen} onOpenChange={setIsSignOpen}>
        <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-3xl">
          <div className="p-6 pb-4">
            <DialogHeader className="flex flex-row items-center justify-between space-y-0">
              <DialogTitle className="text-xl font-bold text-slate-900">Signer le document</DialogTitle>
            </DialogHeader>
          </div>

          <div className="px-6 pb-6 space-y-6">
            
            {/* Zone de signature */}
            {signatureMode === "draw" ? (
              <SignaturePad onSign={setSignatureData} />
            ) : (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <Label className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 block">
                  Tapez votre nom pour signer
                </Label>
                <Input
                  autoFocus
                  placeholder="Jean Dupont"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  className="font-display text-2xl h-14 bg-white"
                />
              </div>
            )}

            {/* Toggle Saisir au clavier */}
            <div className="flex items-center gap-3">
              <Switch 
                checked={signatureMode === "type"} 
                onCheckedChange={(c) => {
                  setSignatureMode(c ? "type" : "draw");
                  setSignatureData("");
                  setTypedName("");
                }}
              />
              <Label className="text-sm font-medium text-slate-700 cursor-pointer">Saisir au clavier</Label>
            </div>
            
          </div>

          {/* Footer de modale avec IP et Bouton */}
          <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 space-y-1 font-medium w-full sm:w-auto">
              <p>IP: <span className="text-slate-900">{mockIp}</span></p>
              <p>Horodatage: <span className="text-slate-900">{timestamp}</span></p>
              <p>ID Document: <span className="text-slate-900 font-mono">#{quote.number}</span></p>
            </div>
            <Button 
              onClick={submitSignature}
              disabled={signatureMode === "draw" ? !signatureData : !typedName}
              className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white shadow-lg shadow-slate-900/20 font-semibold gap-2 transition-all disabled:opacity-50"
            >
              <PenTool className="w-4 h-4" />
              Confirmer la signature
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
