import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Sparkles,
  Loader2,
  Check,
  Trash2,
  Plus,
  ChevronLeft,
  Pencil,
  Wand2,
  FileText,
  Zap,
  ArrowRight,
} from "lucide-react";
import { Product } from "@/lib/data-context";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AIQuoteResultItem {
  id: string;
  label: string;
  qty: number;
  priceHT: number | string;
  productId?: string;
  isUpsell?: boolean;
}

interface AIQuoteWidgetProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (items: AIQuoteResultItem[], upsells: AIQuoteResultItem[]) => void;
}

type Step = "prompt" | "loading" | "results";

// ─── Loading steps UI ────────────────────────────────────────────────────────

const LOADING_STEPS = [
  {
    label: "Analyse du besoin client…",
    sublabel: "Lecture du contexte et extraction des intentions",
  },
  { label: "Sélection des prestations…", sublabel: "Correspondance avec votre catalogue" },
  {
    label: "Calcul des tarifs et quantités…",
    sublabel: "Estimation des prix HT et suggestions d'options",
  },
];

// ─── Quick prompt templates ─────────────────────────────────────────────────

const QUICK_PROMPTS = [
  {
    icon: "🚗",
    label: "Nettoyage complet",
    text: "Client souhaite un nettoyage intégral VIP pour une berline, avec soin cuir et protection céramique.",
  },
  {
    icon: "🎨",
    label: "Site vitrine",
    text: "Créer un site vitrine professionnel pour un artisan plombier, avec formulaire de contact et 5 pages.",
  },
  {
    icon: "🔨",
    label: "Rénovation BTP",
    text: "Rénovation complète d'un appartement de 60m², peinture murs et plafonds, parquet, salle de bain.",
  },
  {
    icon: "💻",
    label: "Application mobile",
    text: "Développement d'une app mobile React Native pour la gestion de livraisons, iOS et Android.",
  },
  {
    icon: "📊",
    label: "Audit & conseil",
    text: "Audit complet de la stratégie digitale + formation équipe de 5 personnes sur 2 jours.",
  },
  {
    icon: "🏠",
    label: "Travaux extérieur",
    text: "Ravalement de façade + remplacement de 8 fenêtres double vitrage et isolation des combles.",
  },
];

// ─── Smart simulation engine ─────────────────────────────────────────────────

interface ServiceTemplate {
  keywords: string[];
  items: { label: string; qty: number; priceHT: number; unit?: string }[];
  upsells?: { label: string; priceHT: number }[];
}

const SERVICE_TEMPLATES: ServiceTemplate[] = [
  // Nettoyage auto
  {
    keywords: ["nettoyage", "voiture", "véhicule", "auto", "berline", "suv", "car", "détailing"],
    items: [
      { label: "Nettoyage intérieur complet", qty: 1, priceHT: 50 },
      { label: "Nettoyage extérieur premium", qty: 1, priceHT: 45 },
    ],
    upsells: [
      { label: "Protection céramique longue durée", priceHT: 150 },
      { label: "Soin cuir complet", priceHT: 55 },
    ],
  },
  // Web
  {
    keywords: ["site", "web", "vitrine", "wordpress", "internet", "pages"],
    items: [
      { label: "Conception & design du site", qty: 1, priceHT: 800 },
      { label: "Développement front-end", qty: 1, priceHT: 1200 },
      { label: "Intégration CMS + formation", qty: 1, priceHT: 400 },
    ],
    upsells: [
      { label: "Référencement SEO (3 mois)", priceHT: 450 },
      { label: "Maintenance mensuelle", priceHT: 90 },
    ],
  },
  // Application mobile
  {
    keywords: ["application", "app", "mobile", "ios", "android", "react native", "flutter"],
    items: [
      { label: "Conception UX/UI et maquettes", qty: 1, priceHT: 1500 },
      { label: "Développement mobile (iOS + Android)", qty: 1, priceHT: 6500 },
      { label: "Tests QA & déploiement stores", qty: 1, priceHT: 800 },
    ],
    upsells: [
      { label: "Backend API (Node.js / Supabase)", priceHT: 2500 },
      { label: "Maintenance & mises à jour (6 mois)", priceHT: 900 },
    ],
  },
  // Design / Identité
  {
    keywords: ["logo", "identité", "marque", "charte", "design", "branding", "graphique"],
    items: [
      { label: "Stratégie de marque", qty: 1, priceHT: 400 },
      { label: "Création du logo (3 propositions)", qty: 1, priceHT: 700 },
      { label: "Charte graphique complète (PDF)", qty: 1, priceHT: 500 },
    ],
    upsells: [
      { label: "Supports print (cartes, flyers)", priceHT: 350 },
      { label: "Kit réseaux sociaux (10 templates)", priceHT: 250 },
    ],
  },
  // Peinture / BTP
  {
    keywords: ["peinture", "peindre", "mur", "murs", "plafond", "enduit", "appartement"],
    items: [
      { label: "Préparation des surfaces (ponçage, rebouchage)", qty: 1, priceHT: 300 },
      { label: "Peinture murs et plafonds (2 couches)", qty: 1, priceHT: 1200 },
    ],
    upsells: [
      { label: "Protection meubles et sols", priceHT: 120 },
      { label: "Peinture technique (velours, satiné)", priceHT: 200 },
    ],
  },
  // Plomberie
  {
    keywords: ["plomberie", "robinet", "tuyau", "fuite", "salle de bain", "sanitaire", "cumulus"],
    items: [
      { label: "Diagnostic et devis détaillé", qty: 1, priceHT: 80 },
      { label: "Remplacement robinetterie", qty: 1, priceHT: 250 },
      { label: "Main d'œuvre plomberie", qty: 3, priceHT: 65, unit: "h" },
    ],
    upsells: [
      { label: "Fourniture matériaux premium", priceHT: 180 },
      { label: "Traitement anti-calcaire", priceHT: 90 },
    ],
  },
  // Électricité
  {
    keywords: [
      "électricité",
      "tableau",
      "circuit",
      "prise",
      "interrupteur",
      "éclairage",
      "câblage",
    ],
    items: [
      { label: "Audit électrique complet", qty: 1, priceHT: 150 },
      { label: "Remplacement tableau électrique", qty: 1, priceHT: 800 },
      { label: "Main d'œuvre électricien", qty: 4, priceHT: 75, unit: "h" },
    ],
    upsells: [
      { label: "Mise en conformité NFC 15-100", priceHT: 350 },
      { label: "Domotique / interrupteurs connectés", priceHT: 480 },
    ],
  },
  // Conseil / Formation
  {
    keywords: [
      "audit",
      "conseil",
      "consultant",
      "stratégie",
      "formation",
      "coaching",
      "accompagnement",
    ],
    items: [
      { label: "Audit initial et analyse", qty: 1, priceHT: 600 },
      { label: "Recommandations stratégiques (rapport)", qty: 1, priceHT: 800 },
      { label: "Session de formation (demi-journée)", qty: 2, priceHT: 450 },
    ],
    upsells: [
      { label: "Suivi mensuel (3 mois)", priceHT: 500 },
      { label: "Support Slack dédié", priceHT: 200 },
    ],
  },
  // Développement web
  {
    keywords: [
      "développement",
      "dev",
      "code",
      "react",
      "next",
      "api",
      "backend",
      "frontend",
      "plateforme",
    ],
    items: [
      { label: "Spécifications techniques et architecture", qty: 1, priceHT: 1200 },
      { label: "Développement back-end", qty: 1, priceHT: 3500 },
      { label: "Développement front-end", qty: 1, priceHT: 2800 },
    ],
    upsells: [
      { label: "Déploiement & CI/CD", priceHT: 500 },
      { label: "Tests automatisés (couverture 80%)", priceHT: 900 },
    ],
  },
  // Rénovation / isolation
  {
    keywords: ["rénovation", "isolation", "ravalement", "façade", "toiture", "fenêtres", "combles"],
    items: [
      { label: "Étude technique et relevés", qty: 1, priceHT: 350 },
      { label: "Travaux de rénovation", qty: 1, priceHT: 4500 },
      { label: "Nettoyage et évacuation des déchets", qty: 1, priceHT: 280 },
    ],
    upsells: [
      { label: "Isolation thermique (R≥7)", priceHT: 1800 },
      { label: "Garantie décennale (assurance)", priceHT: 250 },
    ],
  },
];

// Extract a quantity number from text (e.g., "3 véhicules", "60m²", "5 jours")
function extractQuantity(text: string, unit: string): number {
  // Look for patterns like "3 jours", "60 m2", "5 personnes"
  const patterns = [
    new RegExp(`(\\d+)\\s*${unit}`, "i"),
    /(\d+)\s*(heures?|jours?|journées?)/i,
    /(\d+)\s*(personnes?|participants?|collaborateurs?)/i,
    /(\d+)\s*(pages?|sections?|écrans?)/i,
    /(\d+)\s*(m²|m2|mètres?\s*carrés?)/i,
    /(\d+)\s*(véhicules?|voitures?|autos?)/i,
    /(\d+)\s*(fenêtres?|portes?|pièces?)/i,
  ];

  for (const p of patterns) {
    const m = text.match(p);
    if (m) return Math.min(parseInt(m[1]), 99);
  }
  return 1;
}

function runSmartAnalysis(
  prompt: string,
  products: Product[],
  tv: (b: { fr: string; en: string }) => string,
): { items: AIQuoteResultItem[]; upsells: AIQuoteResultItem[] } {
  const lower = prompt.toLowerCase();

  // 1. Check catalog products first
  const catalogItems: AIQuoteResultItem[] = [];
  const catalogUpsells: AIQuoteResultItem[] = [];

  products.forEach((p) => {
    const labelStr = tv(p.label).toLowerCase();
    const descStr = tv(p.description).toLowerCase();
    const words = [...new Set([...labelStr.split(/\s+/), ...descStr.split(/\s+/)])].filter(
      (w) => w.length > 3,
    );
    const score = words.filter((w) => lower.includes(w)).length;

    if (score >= 1) {
      const qty = extractQuantity(lower, "");
      catalogItems.push({
        id: Math.random().toString(36).slice(2),
        label: tv(p.label),
        qty,
        priceHT: p.priceHT,
        productId: p.id,
      });
      if (p.upsells) {
        p.upsells.forEach((u) => {
          if (
            (lower.includes("cuir") && u.label.toLowerCase().includes("cuir")) ||
            (lower.includes("céramique") && u.label.toLowerCase().includes("céramique")) ||
            (lower.includes("phare") && u.label.toLowerCase().includes("phare")) ||
            (lower.includes("brillance") && u.label.toLowerCase().includes("brillance")) ||
            (lower.includes("lustrage") && u.label.toLowerCase().includes("lustrage"))
          ) {
            catalogUpsells.push({
              id: Math.random().toString(36).slice(2),
              label: u.label,
              qty: 1,
              priceHT: u.priceHT,
              isUpsell: true,
            });
          }
        });
      }
    }
  });

  if (catalogItems.length > 0) {
    return { items: catalogItems, upsells: catalogUpsells };
  }

  // 2. Fall back to service templates
  let bestMatch: ServiceTemplate | null = null;
  let bestScore = 0;

  for (const tpl of SERVICE_TEMPLATES) {
    const score = tpl.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = tpl;
    }
  }

  if (bestMatch) {
    const items: AIQuoteResultItem[] = bestMatch.items.map((item) => {
      let qty = item.qty;
      // Try to detect quantity from text
      const qMatch =
        lower.match(/(\d+)\s*(heures?|h\b)/i) ||
        lower.match(/(\d+)\s*(jours?|journées?)/i) ||
        lower.match(/(\d+)\s*(semaines?)/i);
      if (qMatch && item.unit === "h") {
        qty = parseInt(qMatch[1]);
        if (qMatch[0].includes("jour")) qty *= 7;
        if (qMatch[0].includes("semaine")) qty *= 35;
      }
      const nMatch = lower.match(/(\d+)\s*(personnes?|participants?|collaborateurs?)/i);
      if (nMatch && item.label.toLowerCase().includes("formation")) {
        qty = parseInt(nMatch[1]);
      }
      const m2Match = lower.match(/(\d+)\s*(m²|m2)/i);
      if (
        m2Match &&
        (item.label.toLowerCase().includes("peinture") ||
          item.label.toLowerCase().includes("rénovation"))
      ) {
        qty = Math.ceil(parseInt(m2Match[1]) / 10);
      }
      return {
        id: Math.random().toString(36).slice(2),
        label: item.label,
        qty,
        priceHT: item.priceHT,
      };
    });

    const upsells: AIQuoteResultItem[] = (bestMatch.upsells || []).slice(0, 2).map((u) => ({
      id: Math.random().toString(36).slice(2),
      label: u.label,
      qty: 1,
      priceHT: u.priceHT,
      isUpsell: true,
    }));

    return { items, upsells };
  }

  // 3. Last resort: generic items
  return {
    items: [
      {
        id: Math.random().toString(36).slice(2),
        label: "Prestation principale",
        qty: 1,
        priceHT: 500,
      },
      {
        id: Math.random().toString(36).slice(2),
        label: "Frais de déplacement et matériaux",
        qty: 1,
        priceHT: 150,
      },
    ],
    upsells: [
      {
        id: Math.random().toString(36).slice(2),
        label: "Option express (délai réduit 50%)",
        qty: 1,
        priceHT: 200,
        isUpsell: true,
      },
    ],
  };
}

// ─── Main component ──────────────────────────────────────────────────────────

export function AIQuoteWidget({ products, isOpen, onClose, onApply }: AIQuoteWidgetProps) {
  const { tv, money } = useI18n();
  const [step, setStep] = useState<Step>("prompt");
  const [prompt, setPrompt] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [items, setItems] = useState<AIQuoteResultItem[]>([]);
  const [upsells, setUpsells] = useState<AIQuoteResultItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("prompt");
      setPrompt("");
      setLoadingStep(0);
      setItems([]);
      setUpsells([]);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Loading animation
  useEffect(() => {
    if (step !== "loading") return;
    setLoadingStep(0);
    const t1 = setTimeout(() => setLoadingStep(1), 900);
    const t2 = setTimeout(() => setLoadingStep(2), 1700);
    const t3 = setTimeout(() => {
      const result = runSmartAnalysis(prompt, products, tv);
      setItems(result.items);
      setUpsells(result.upsells);
      setStep("results");
    }, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step, prompt, products, tv]);

  const totalHT =
    items.reduce((s, i) => s + Number(i.priceHT) * Number(i.qty), 0) +
    upsells.reduce((s, u) => s + Number(u.priceHT) * Number(u.qty), 0);
  const totalTTC = totalHT * 1.2;

  const updateItem = (id: string, field: keyof AIQuoteResultItem, val: string | number) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: val } : i)));

  const updateUpsell = (id: string, field: keyof AIQuoteResultItem, val: string | number) =>
    setUpsells((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: val } : u)));

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), label: "", qty: 1, priceHT: 0 },
    ]);

  const handleApply = () => {
    onApply(
      items.filter((i) => i.label.trim()),
      upsells.filter((u) => u.label.trim()),
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] p-0 gap-0 overflow-hidden">
        {/* Header gradient */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[oklch(0.22_0.055_264)] to-[oklch(0.32_0.095_268)] px-6 py-5">
          <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.07]">
            <Sparkles className="h-36 w-36" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/20" />
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              Générer avec l'IA
            </DialogTitle>
            <p className="mt-1 text-[13px] text-white/60">
              {step === "prompt" &&
                "Décrivez le besoin de votre client — l'IA structure le devis automatiquement."}
              {step === "loading" && "Analyse en cours…"}
              {step === "results" && "Voici la proposition — modifiez avant d'appliquer."}
            </p>
          </DialogHeader>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            {(["prompt", "loading", "results"] as Step[]).map((s, i) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-all duration-500",
                  step === "prompt" && i === 0 && "bg-white",
                  step === "prompt" && i > 0 && "bg-white/20",
                  step === "loading" && i <= 1 && "bg-white",
                  step === "loading" && i > 1 && "bg-white/20",
                  step === "results" && "bg-white",
                )}
              />
            ))}
          </div>
        </div>

        {/* ── STEP 1: Prompt ─────────────────────────────────────────── */}
        {step === "prompt" && (
          <div className="space-y-5 p-6">
            {/* Quick prompts */}
            <div>
              <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Exemples rapides
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    type="button"
                    onClick={() => setPrompt(qp.text)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-left text-[12px] transition-all hover:border-primary/40 hover:bg-primary/5",
                      prompt === qp.text && "border-primary/40 bg-primary/8 text-primary",
                    )}
                  >
                    <span className="text-base leading-none">{qp.icon}</span>
                    <span className="font-medium leading-tight">{qp.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Description libre
              </p>
              <Textarea
                ref={textareaRef}
                placeholder="Ex : Client souhaite la rénovation complète de son appartement de 80m² — peinture, parquet, salle de bain. Budget indicatif 15 000 €..."
                className="min-h-[110px] resize-none text-sm"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-[11px] text-muted-foreground">
                Soyez précis : type de prestation, surface, quantité, délai, spécificités.
              </p>
            </div>

            <Button
              className="btn-primary-glow w-full gap-2 text-white"
              disabled={prompt.trim().length < 8}
              onClick={() => setStep("loading")}
            >
              <Wand2 className="h-4 w-4" />
              Analyser et générer le devis
            </Button>
          </div>
        )}

        {/* ── STEP 2: Loading ────────────────────────────────────────── */}
        {step === "loading" && (
          <div className="flex flex-col items-center gap-6 px-6 py-10">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-primary" />
              <div
                className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-t-primary/40"
                style={{ animationDirection: "reverse", animationDuration: "1.4s" }}
              />
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <div className="w-full max-w-xs space-y-3">
              {LOADING_STEPS.map((ls, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-xl p-3 transition-all duration-500",
                    i < loadingStep && "opacity-50",
                    i === loadingStep && "bg-primary/8",
                    i > loadingStep && "opacity-20",
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-all duration-300",
                      i < loadingStep && "bg-success/20 text-success",
                      i === loadingStep && "bg-primary/20 text-primary",
                      i > loadingStep && "bg-muted text-muted-foreground",
                    )}
                  >
                    {i < loadingStep ? (
                      <Check className="h-3 w-3" />
                    ) : i === loadingStep ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <span className="text-[10px] font-bold">{i + 1}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold">{ls.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">{ls.sublabel}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Results ───────────────────────────────────────── */}
        {step === "results" && (
          <div className="flex max-h-[calc(90vh-200px)] flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Items */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Prestations ({items.length})
                  </p>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/8 transition-colors"
                  >
                    <Plus className="h-3 w-3" />
                    Ajouter
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[1fr_56px_84px_28px] items-center gap-2 rounded-lg border border-border bg-muted/20 p-2.5"
                    >
                      <Input
                        value={item.label}
                        onChange={(e) => updateItem(item.id, "label", e.target.value)}
                        className="h-7 border-0 bg-transparent p-0 text-[13px] font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Prestation…"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                        className="h-7 border border-border/60 bg-background text-center text-[12px]"
                      />
                      <Input
                        type="number"
                        min="0"
                        value={item.priceHT}
                        onChange={(e) => updateItem(item.id, "priceHT", Number(e.target.value))}
                        className="h-7 border border-border/60 bg-background text-right text-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-[1fr_56px_84px_28px] px-2.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Description</span>
                    <span className="text-center">Qté</span>
                    <span className="text-right">Prix HT (€)</span>
                    <span />
                  </div>
                </div>
              </div>

              {/* Upsells */}
              {upsells.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Options suggérées
                  </p>
                  <div className="space-y-2">
                    {upsells.map((u) => (
                      <div
                        key={u.id}
                        className="grid grid-cols-[1fr_56px_84px_28px] items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-2.5"
                      >
                        <Input
                          value={u.label}
                          onChange={(e) => updateUpsell(u.id, "label", e.target.value)}
                          className="h-7 border-0 bg-transparent p-0 text-[13px] font-medium text-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Option…"
                        />
                        <Input
                          type="number"
                          min="1"
                          value={u.qty}
                          onChange={(e) => updateUpsell(u.id, "qty", Number(e.target.value))}
                          className="h-7 border border-border/60 bg-background text-center text-[12px]"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={u.priceHT}
                          onChange={(e) => updateUpsell(u.id, "priceHT", Number(e.target.value))}
                          className="h-7 border border-border/60 bg-background text-right text-[12px]"
                        />
                        <button
                          type="button"
                          onClick={() => setUpsells((prev) => prev.filter((x) => x.id !== u.id))}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total HT estimé</span>
                  <span className="font-semibold">{money(totalHT)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Total TTC (TVA 20%)</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {money(totalTTC)}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border bg-muted/10 px-6 py-4">
              <button
                type="button"
                onClick={() => setStep("prompt")}
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Modifier la description
              </button>
              <Button className="btn-primary-glow gap-2 text-white" onClick={handleApply}>
                <Check className="h-4 w-4" />
                Appliquer au devis
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
