import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ImagePlus,
  Trash2,
  FileText,
  Landmark,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Palette,
  Sun,
  Moon,
  Monitor,
  SlidersHorizontal,
  Search,
  CreditCard,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n, type Key } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import { usePrefs, useTheme, type Theme } from "@/lib/theme";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { searchCompanyBySiret, checkVatNumber, type VatCheckResult } from "@/lib/siret";
import { useSupabaseData } from "@/lib/supabase-context";

export const Route = createFileRoute("/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres entreprise — ClearQuote" },
      {
        name: "description",
        content:
          "Configurez les informations de votre entreprise : SIRET, TVA, coordonnées, logo et numérotation des documents.",
      },
    ],
  }),
  component: SettingsPage,
});

const LEGAL_FORMS = [
  "Auto-entrepreneur / Micro",
  "EI",
  "EIRL",
  "EURL",
  "SARL",
  "SAS",
  "SASU",
  "SA",
  "SNC",
  "Association",
  "Autre",
];

type Section = "identity" | "contact" | "logo" | "docs" | "bank" | "prefs" | "integrations" | "subscription";

function SectionHeader({
  icon: Icon,
  label,
  id,
  active,
  onClick,
}: {
  icon: typeof Building2;
  label: string;
  id: Section;
  active: boolean;
  onClick: (id: Section) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{label}</span>
      <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", active && "rotate-90")} />
    </button>
  );
}

function FieldRow({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── PrefToggleRow ─────────────────────────────────────────────────────────────

function PrefToggleRow({
  icon: Icon,
  label,
  desc,
  checked,
  onChange,
}: {
  icon: typeof SlidersHorizontal;
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3 min-w-0">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium leading-tight">{label}</p>
          <p className="mt-0.5 text-xs text-muted-foreground leading-snug">{desc}</p>
        </div>
      </div>
      {/* Toggle switch */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
          checked ? "bg-primary" : "bg-muted-foreground/30",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

// ── SettingsPage ──────────────────────────────────────────────────────────────

function SettingsPage() {
  const { t, lang } = useI18n();
  const { company, updateCompany } = useData();
  const { profile } = useSupabaseData();
  const { prefs, setPrefs } = usePrefs();
  const { theme, setTheme } = useTheme();
  
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);
  const [isCheckingVat, setIsCheckingVat] = useState(false);
  const [vatCheckResult, setVatCheckResult] = useState<VatCheckResult | null | "error">(null);

  useEffect(() => {
    // Check if we just returned from Google OAuth. Le refresh token ne
    // transite plus jamais par l'URL : on le récupère via un endpoint qui lit
    // un cookie httpOnly à usage unique posé par /api/auth/google/callback.
    const params = new URLSearchParams(window.location.search);
    const googleConnected = params.get("google_connected");
    const googleError = params.get("google_error");

    if (googleConnected) {
      window.history.replaceState({}, document.title, window.location.pathname);
      fetch("/api/auth/google/consume-token", { credentials: "include" })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then((data: { token?: string }) => {
          if (data.token) {
            updateCompany({ ...company, google_refresh_token: data.token });
            alert("Votre compte Gmail a été connecté avec succès !");
          }
        })
        .catch(() => {
          alert("Erreur de connexion à Gmail. Merci de réessayer.");
        });
    } else if (googleError) {
      alert("Erreur de connexion à Gmail. Avez-vous bien coché toutes les cases ?");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSiretLookup = async (siret: string) => {
    const clean = siret.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setIsFetchingSiret(true);
    try {
      const data = await searchCompanyBySiret(clean);
      if (data) {
        setForm((prev) => ({
          ...prev,
          name: data.name || prev.name,
          legalForm: data.legalForm || prev.legalForm,
          address: data.address || prev.address,
          postalCode: data.postalCode || prev.postalCode,
          city: data.city || prev.city,
          vatNumber: data.vatNumber || prev.vatNumber,
        }));
      }
    } finally {
      setIsFetchingSiret(false);
    }
  };
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>("identity");
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ ...company });

  const set = useCallback(<K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = () => {
    updateCompany(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert(lang === "fr" ? "Fichier trop volumineux (max 2 Mo)" : "File too large (max 2 MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      set("logoBase64", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Vérification complétude des champs obligatoires
  const requiredFields: (keyof typeof form)[] = ["name", "siret", "address", "postalCode", "city", "email"];
  const missingFields = requiredFields.filter((k) => !form[k]);
  const isComplete = missingFields.length === 0;

  const sections: { id: Section; icon: typeof Building2; label: string }[] = [
    { id: "identity", icon: Building2, label: lang === "fr" ? "Identité" : "Identity" },
    { id: "contact", icon: MapPin, label: lang === "fr" ? "Coordonnées" : "Contact" },
    { id: "logo", icon: ImagePlus, label: "Logo" },
    { id: "docs", icon: FileText, label: lang === "fr" ? "Documents" : "Documents" },
    { id: "bank", icon: Landmark, label: lang === "fr" ? "Bancaire" : "Bank" },
    { id: "integrations", icon: SlidersHorizontal, label: "Intégrations" },
    { id: "subscription", icon: CreditCard, label: "Abonnement" },
    { id: "prefs", icon: Palette, label: t("pref.title") },
  ];

  return (
    <>
      <PageHeader
        title={t("set.title")}
        subtitle={t("set.subtitle")}
        action={
          activeSection !== "prefs" ? (
            <button
              onClick={handleSave}
              className={cn(
                "flex h-10 items-center gap-2 rounded-[var(--shape-control)] border-2 border-navy px-5 text-sm font-bold text-white shadow-offset transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-offset-sm",
                saved
                  ? "bg-success hover:bg-success/90"
                  : "bg-primary hover:bg-primary/90",
              )}
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  {t("set.saved")}
                </>
              ) : (
                t("set.save")
              )}
            </button>
          ) : (
            <span className="rounded-full bg-muted px-3 py-1.5 text-xs text-muted-foreground">
              {lang === "fr" ? "Enregistrement automatique" : "Auto-saved"}
            </span>
          )
        }
      />

      {/* Alerte incomplétude */}
      {!isComplete && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/8 px-4 py-3">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div>
            <p className="text-sm font-medium text-warning-foreground">{t("set.incomplete")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("set.incomplete.desc")}</p>
          </div>
        </div>
      )}

      <div className="flex gap-6 lg:gap-8">
        {/* Sidebar navigation */}
        <aside className="hidden w-48 shrink-0 lg:block">
          <div className="sticky top-24 flex flex-col gap-0.5">
            {sections.map((s) => (
              <SectionHeader
                key={s.id}
                id={s.id}
                icon={s.icon}
                label={s.label}
                active={activeSection === s.id}
                onClick={setActiveSection}
              />
            ))}
          </div>
        </aside>

        {/* Contenu principal */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Mobile : tabs */}
          <div className="flex gap-2 overflow-x-auto lg:hidden">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                  activeSection === s.id
                    ? "bg-primary text-white"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>

          {/* ── Identité ── */}
          {activeSection === "identity" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">{t("set.section.identity")}</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <FieldRow label={t("set.name")} required>
                    <Input
                      value={form.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="Ma Société SAS"
                    />
                  </FieldRow>
                </div>

                <FieldRow label={t("set.legalForm")}>
                  <select
                    value={form.legalForm}
                    onChange={(e) => set("legalForm", e.target.value)}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {LEGAL_FORMS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </FieldRow>

                <FieldRow label={t("set.capital")} hint={lang === "fr" ? "Optionnel — EI/Auto-entrepreneur : laisser vide" : "Optional — sole trader: leave blank"}>
                  <Input
                    value={form.capital ?? ""}
                    onChange={(e) => set("capital", e.target.value)}
                    placeholder="10 000"
                  />
                </FieldRow>

                <FieldRow label={t("set.siret")} required hint="14 chiffres (auto-complétion possible)">
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.siret}
                      onChange={(e) => set("siret", e.target.value.replace(/\D/g, "").slice(0, 14))}
                      placeholder="12345678901234"
                      maxLength={14}
                      className={cn(form.siret && form.siret.length !== 14 && "border-warning", "flex-1")}
                    />
                    <button
                      type="button"
                      disabled={!form.siret || form.siret.length !== 14 || isFetchingSiret}
                      onClick={() => handleSiretLookup(form.siret || "")}
                      className="flex h-9 items-center justify-center rounded-[var(--shape-control)] border-2 border-navy bg-primary px-3 text-sm font-bold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
                      title={lang === "fr" ? "Rechercher via API" : "Search via API"}
                    >
                      {isFetchingSiret ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.siret && form.siret.length > 0 && form.siret.length !== 14 && (
                    <p className="text-xs text-warning-foreground mt-1">
                      {form.siret.length}/14 chiffres
                    </p>
                  )}
                </FieldRow>

                <FieldRow label={t("set.vatNumber")} hint={lang === "fr" ? "Ex : FR12345678901 — laisser vide si non assujetti" : "E.g. FR12345678901 — leave blank if exempt"}>
                  <div className="flex gap-2">
                    <Input
                      value={form.vatNumber}
                      onChange={(e) => {
                        set("vatNumber", e.target.value.toUpperCase());
                        setVatCheckResult(null);
                      }}
                      placeholder="FR12345678901"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        if (!form.vatNumber) return;
                        setIsCheckingVat(true);
                        setVatCheckResult(null);
                        const result = await checkVatNumber(form.vatNumber);
                        setVatCheckResult(result ?? "error");
                        setIsCheckingVat(false);
                      }}
                      disabled={!form.vatNumber || isCheckingVat}
                      className="flex h-9 items-center justify-center rounded-[var(--shape-control)] border-2 border-navy bg-primary px-3 text-sm font-bold text-primary-foreground shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none disabled:opacity-50"
                      title={lang === "fr" ? "Vérifier via VIES" : "Verify via VIES"}
                    >
                      {isCheckingVat ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </button>
                  </div>
                  {vatCheckResult === "error" && (
                    <p className="text-xs text-warning-foreground mt-1">
                      {lang === "fr" ? "Vérification VIES indisponible pour le moment." : "VIES verification unavailable right now."}
                    </p>
                  )}
                  {vatCheckResult && vatCheckResult !== "error" && (
                    <p className={`text-xs mt-1 ${vatCheckResult.valid ? "text-success" : "text-destructive"}`}>
                      {vatCheckResult.valid
                        ? lang === "fr"
                          ? `Numéro valide${vatCheckResult.name ? ` — ${vatCheckResult.name}` : ""}`
                          : `Valid number${vatCheckResult.name ? ` — ${vatCheckResult.name}` : ""}`
                        : lang === "fr"
                          ? "Numéro invalide selon VIES"
                          : "Invalid number according to VIES"}
                    </p>
                  )}
                </FieldRow>

                <FieldRow label={t("set.rcs")} hint={lang === "fr" ? "RCS Ville N° / RM Ville N°" : "Trade register"}>
                  <Input
                    value={form.rcs ?? ""}
                    onChange={(e) => set("rcs", e.target.value)}
                    placeholder="RCS Paris 123 456 789"
                  />
                </FieldRow>
              </div>
            </div>
          )}

          {/* ── Coordonnées ── */}
          {activeSection === "contact" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">{t("set.section.contact")}</h2>
              <div className="grid grid-cols-2 gap-5">
                <div className="col-span-2">
                  <FieldRow label={t("set.address")} required>
                    <Input
                      value={form.address}
                      onChange={(e) => set("address", e.target.value)}
                      placeholder="12 rue de la Paix"
                    />
                  </FieldRow>
                </div>

                <FieldRow label={t("set.postalCode")} required>
                  <Input
                    value={form.postalCode}
                    onChange={(e) => set("postalCode", e.target.value.replace(/\D/g, "").slice(0, 5))}
                    placeholder="75001"
                    maxLength={5}
                  />
                </FieldRow>

                <FieldRow label={t("set.city")} required>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    placeholder="Paris"
                  />
                </FieldRow>

                <FieldRow label={t("set.country")}>
                  <Input
                    value={form.country}
                    onChange={(e) => set("country", e.target.value)}
                    placeholder="France"
                  />
                </FieldRow>

                <FieldRow label={t("set.phone")}>
                  <Input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    placeholder="06 12 34 56 78"
                  />
                </FieldRow>

                <FieldRow label={t("set.email")} required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="contact@masociete.fr"
                  />
                </FieldRow>

                <FieldRow label={t("set.website")}>
                  <Input
                    type="url"
                    value={form.website ?? ""}
                    onChange={(e) => set("website", e.target.value)}
                    placeholder="https://masociete.fr"
                  />
                </FieldRow>
              </div>
            </div>
          )}

          {/* ── Logo ── */}
          {activeSection === "logo" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">{t("set.section.logo")}</h2>

              {form.logoBase64 ? (
                <div className="flex flex-wrap items-start gap-6">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <img
                      src={form.logoBase64}
                      alt="Logo entreprise"
                      className="h-24 max-w-[200px] object-contain"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">
                      {lang === "fr" ? "Logo chargé avec succès." : "Logo uploaded successfully."}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
                      >
                        <ImagePlus className="h-4 w-4" />
                        {lang === "fr" ? "Changer" : "Replace"}
                      </button>
                      <button
                        type="button"
                        onClick={() => set("logoBase64", undefined)}
                        className="flex items-center gap-2 rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/8 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                        {t("set.logo.remove")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex w-full flex-col items-center gap-3 rounded-xl border-2 border-dashed border-border py-10 text-center transition-colors hover:border-primary/40 hover:bg-primary/4"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t("set.logo.upload")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t("set.logo.hint")}</p>
                  </div>
                </button>
              )}

              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleLogoUpload}
              />

              {/* Aperçu document */}
              <div className="rounded-xl border border-border bg-muted/20 p-5">
                <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("set.preview")}
                </p>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {form.logoBase64 ? (
                      <img src={form.logoBase64} alt="Logo" className="mb-3 h-12 object-contain" />
                    ) : (
                      <div className="mb-3 flex h-12 w-32 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                        Logo ici
                      </div>
                    )}
                    <p className="text-sm font-semibold">{form.name || "Raison sociale"}</p>
                    <p className="text-xs text-muted-foreground">{form.legalForm}</p>
                    {form.address && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {form.address}
                        <br />
                        {form.postalCode} {form.city}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {form.quotePrefix}-2026-001
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lang === "fr" ? "Devis du" : "Quote dated"} {new Date().toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {activeSection === "docs" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">{t("set.section.docs")}</h2>
              
              <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-4">
                <h3 className="text-sm font-semibold text-primary mb-3">
                  {lang === "fr" ? "Design & Modèles" : "Design & Templates"}
                </h3>
                <div className="grid grid-cols-2 gap-5">
                  <FieldRow label={lang === "fr" ? "Couleur Principale" : "Primary Color"} hint={lang === "fr" ? "Couleur utilisée dans les PDFs" : "Color used in PDFs"}>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={form.primaryColor || "#0f172a"}
                        onChange={(e) => set("primaryColor", e.target.value)}
                        className="h-9 w-12 p-1"
                      />
                      <Input
                        value={form.primaryColor || "#0f172a"}
                        onChange={(e) => set("primaryColor", e.target.value)}
                        className="flex-1 font-mono uppercase"
                      />
                    </div>
                  </FieldRow>
                  
                  <div className="block"></div>

                  <FieldRow label={lang === "fr" ? "Modèle Devis par défaut" : "Default Quote Template"}>
                    <select
                      value={form.defaultQuoteTemplate || "classic"}
                      onChange={(e) => set("defaultQuoteTemplate", e.target.value as typeof form.defaultQuoteTemplate)}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="classic">{lang === "fr" ? "Classique (A4 Standard)" : "Classic (Standard A4)"}</option>
                      <option value="modern">{lang === "fr" ? "Moderne (Lignes colorées)" : "Modern (Colored Lines)"}</option>
                      <option value="minimal">{lang === "fr" ? "Épuré (Noir & Blanc)" : "Minimal (Black & White)"}</option>
                      <option value="elegant">{lang === "fr" ? "Élégant (Centré)" : "Elegant (Centered)"}</option>
                      <option value="bold">{lang === "fr" ? "Audacieux (Massif)" : "Bold (Massive)"}</option>
                    </select>
                  </FieldRow>

                  <FieldRow label={lang === "fr" ? "Modèle Facture par défaut" : "Default Invoice Template"}>
                    <select
                      value={form.defaultInvoiceTemplate || "classic"}
                      onChange={(e) => set("defaultInvoiceTemplate", e.target.value as typeof form.defaultInvoiceTemplate)}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="classic">{lang === "fr" ? "Classique (A4 Standard)" : "Classic (Standard A4)"}</option>
                      <option value="modern">{lang === "fr" ? "Moderne (Lignes colorées)" : "Modern (Colored Lines)"}</option>
                      <option value="minimal">{lang === "fr" ? "Épuré (Noir & Blanc)" : "Minimal (Black & White)"}</option>
                      <option value="elegant">{lang === "fr" ? "Élégant (Centré)" : "Elegant (Centered)"}</option>
                      <option value="bold">{lang === "fr" ? "Audacieux (Massif)" : "Bold (Massive)"}</option>
                    </select>
                  </FieldRow>

                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <FieldRow label={t("set.quotePrefix")} hint={lang === "fr" ? "Ex: DV → DV-2026-001" : "E.g. DV → DV-2026-001"}>
                  <Input
                    value={form.quotePrefix}
                    onChange={(e) => set("quotePrefix", e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="DV"
                    maxLength={4}
                  />
                </FieldRow>

                <FieldRow label={t("set.invoicePrefix")} hint={lang === "fr" ? "Ex: FA → FA-2026-0001" : "E.g. FA → FA-2026-0001"}>
                  <Input
                    value={form.invoicePrefix}
                    onChange={(e) => set("invoicePrefix", e.target.value.toUpperCase().slice(0, 4))}
                    placeholder="FA"
                    maxLength={4}
                  />
                </FieldRow>

                <FieldRow label={t("set.nextQuoteNumber")} hint={lang === "fr" ? "Séquence inaltérable — à ne modifier qu'avec précaution" : "Immutable sequence — change with care"}>
                  <Input
                    type="number"
                    min={1}
                    value={form.nextQuoteNumber}
                    onChange={(e) => set("nextQuoteNumber", parseInt(e.target.value) || 1)}
                  />
                </FieldRow>

                <FieldRow label={t("set.nextInvoiceNumber")}>
                  <Input
                    type="number"
                    min={1}
                    value={form.nextInvoiceNumber}
                    onChange={(e) => set("nextInvoiceNumber", parseInt(e.target.value) || 1)}
                  />
                </FieldRow>

                <FieldRow label={t("set.paymentTermsDays")} hint={lang === "fr" ? "Légal : 30 jours nets ou 45 jours fin de mois (Loi LME)" : "Legal: 30 net days or 45 end of month (LME)"}>
                  <select
                    value={form.paymentTermsDays}
                    onChange={(e) => set("paymentTermsDays", parseInt(e.target.value))}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={30}>30 {lang === "fr" ? "jours nets" : "net days"}</option>
                    <option value={45}>45 {lang === "fr" ? "jours fin de mois" : "days end of month"}</option>
                    <option value={60}>60 {lang === "fr" ? "jours (accord inter-entreprises)" : "days (B2B agreement)"}</option>
                    <option value={0}>{lang === "fr" ? "À réception" : "Upon receipt"}</option>
                  </select>
                </FieldRow>

                <FieldRow label={t("set.lateInterestRate")} hint={lang === "fr" ? "Légal : taux BCE + 10 points minimum" : "Legal: ECB rate + 10 points minimum"}>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.1"
                      value={form.lateInterestRate}
                      onChange={(e) => set("lateInterestRate", e.target.value)}
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </FieldRow>

                <FieldRow label={t("set.recoveryFee")} hint={lang === "fr" ? "Indemnité légale obligatoire B2B : 40 € minimum" : "Mandatory B2B legal fee: €40 minimum"}>
                  <div className="relative">
                    <Input
                      type="number"
                      min={40}
                      value={form.recoveryFee}
                      onChange={(e) => set("recoveryFee", e.target.value)}
                      className="pr-8"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">€</span>
                  </div>
                </FieldRow>

                <div className="col-span-2">
                  <FieldRow
                    label={t("set.footerNote")}
                    hint={lang === "fr"
                      ? "Apparaît en bas de chaque document — inclure : forme juridique, capital, SIRET, RCS, TVA"
                      : "Appears at the bottom of each document — include: legal form, capital, SIRET, trade register, VAT"}
                  >
                    <Textarea
                      rows={4}
                      value={form.footerNote}
                      onChange={(e) => set("footerNote", e.target.value)}
                      placeholder={
                        lang === "fr"
                          ? `${form.name || "Ma Société"} ${form.legalForm} — Capital : ${form.capital || "10 000"} € — SIRET : ${form.siret || "XXX XXX XXX XXXXX"} — RCS ${form.city || "Ville"} — N° TVA : ${form.vatNumber || "FRXXXXXXXXX"}`
                          : `${form.name || "My Company"} ${form.legalForm} — Capital: ${form.capital || "10,000"} € — SIRET: ${form.siret || "XXX XXX XXX XXXXX"}`
                      }
                      className="resize-none font-mono text-xs"
                    />
                  </FieldRow>
                </div>
              </div>

              {/* Bouton auto-remplissage pied de page */}
              {(form.name || form.siret) && (
                <button
                  type="button"
                  onClick={() => {
                    const footer = [
                      form.name,
                      form.legalForm,
                      form.capital ? `Capital : ${form.capital} €` : null,
                      form.siret ? `SIRET : ${form.siret}` : null,
                      form.rcs ? `RCS : ${form.rcs}` : null,
                      form.vatNumber ? `N° TVA : ${form.vatNumber}` : null,
                      form.address ? `${form.address}, ${form.postalCode} ${form.city}` : null,
                    ]
                      .filter(Boolean)
                      .join(" — ");
                    set("footerNote", footer);
                  }}
                  className="text-sm text-primary underline-offset-2 hover:underline"
                >
                  {lang === "fr" ? "↺ Générer automatiquement depuis les infos saisies" : "↺ Auto-generate from entered info"}
                </button>
              )}
            </div>
          )}

          {/* ── Bancaire ── */}
          {activeSection === "bank" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">{t("set.section.bank")}</h2>
              <p className="text-xs text-muted-foreground">
                {lang === "fr"
                  ? "Affiché sur les factures pour faciliter le virement. Non obligatoire mais recommandé."
                  : "Shown on invoices to facilitate bank transfers. Optional but recommended."}
              </p>
              <div className="grid grid-cols-2 gap-5">
                <FieldRow label={t("set.bankName")}>
                  <Input
                    value={form.bankName ?? ""}
                    onChange={(e) => set("bankName", e.target.value)}
                    placeholder="BNP Paribas"
                  />
                </FieldRow>

                <div className="col-span-2">
                  <FieldRow label={t("set.iban")} hint="FR76 XXXX XXXX XXXX XXXX XXXX XXX">
                    <Input
                      value={form.iban ?? ""}
                      onChange={(e) => set("iban", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34))}
                      placeholder="FR7614508122000001234567890"
                      className="font-mono"
                    />
                  </FieldRow>
                </div>

                <FieldRow label={t("set.bic")}>
                  <Input
                    value={form.bic ?? ""}
                    onChange={(e) => set("bic", e.target.value.toUpperCase().replace(/\s/g, "").slice(0, 11))}
                    placeholder="BNPAFRPPXXX"
                    className="font-mono"
                  />
                </FieldRow>
              </div>

              {/* Aperçu bloc virement */}
              {(form.iban || form.bankName) && (
                <div className="rounded-lg border border-border bg-muted/20 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {lang === "fr" ? "Bloc virement sur facture" : "Bank transfer block on invoice"}
                  </p>
                  <div className="space-y-0.5 text-sm">
                    {form.bankName && <p><span className="text-muted-foreground">{lang === "fr" ? "Banque : " : "Bank: "}</span>{form.bankName}</p>}
                    {form.iban && <p className="font-mono text-xs"><span className="text-muted-foreground">IBAN : </span>{form.iban.replace(/(.{4})/g, "$1 ").trim()}</p>}
                    {form.bic && <p className="font-mono text-xs"><span className="text-muted-foreground">BIC : </span>{form.bic}</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Intégrations ── */}
          {activeSection === "integrations" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">Intégrations & E-mail</h2>
              <p className="text-xs text-muted-foreground">
                Gérez vos intégrations de services tiers.
              </p>
              
              <div className="rounded-lg border border-border p-5 bg-card flex flex-col items-start gap-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold text-lg">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">Envoi d'E-mails (ClearQuote)</h3>
                    <p className="text-xs text-muted-foreground">Inclus avec votre abonnement. Vos e-mails sont envoyés instantanément.</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full text-xs font-medium border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Automatique
                  </div>
                </div>
                
                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-3">
                    Vous n'avez rien à configurer. Lorsque vos clients répondent à vos devis, la réponse arrive directement sur votre adresse e-mail ({company.email}).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Abonnement ── */}
          {activeSection === "subscription" && (
            <div className="card-elevated p-6 space-y-5">
              <h2 className="text-sm font-semibold">Gérer mon abonnement</h2>
              <p className="text-xs text-muted-foreground">
                Gérez votre abonnement, passez au forfait supérieur (Pro, Agency) pour débloquer de nouvelles fonctionnalités ou mettez à jour votre moyen de paiement.
              </p>

              <div className="rounded-lg border border-border p-5 bg-card flex flex-col items-start gap-4">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground">Portail Client Sécurisé</h3>
                    <p className="text-xs text-muted-foreground">Propulsé par Stripe</p>
                  </div>
                </div>

                <div className="w-full">
                  <p className="text-xs text-muted-foreground mb-4">
                    Vous allez être redirigé vers l'interface sécurisée Stripe où vous pourrez gérer vos factures, changer de carte bancaire, et ajuster votre plan (options multi-sociétés, utilisateurs supplémentaires, etc.).
                  </p>
                  
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      const btn = e.currentTarget;
                      const originalText = btn.innerHTML;
                      btn.innerHTML = "Redirection...";
                      btn.disabled = true;
                      
                      try {
                        // On passe un org ID ou customerId si dispo, sinon le backend le trouvera
                        const res = await fetch("/api/stripe/portal", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            customerId: (profile as any)?.stripe_customer_id, // Fetching from user profile
                            returnUrl: window.location.href,
                          }),
                        });
                        
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error || "Erreur lors de l'accès au portail");
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          throw new Error("Lien introuvable");
                        }
                      } catch (err: any) {
                        alert(err.message || "Impossible d'ouvrir le portail d'abonnement. Avez-vous déjà souscrit ?");
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                      }
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700"
                  >
                    Ouvrir le portail d'abonnement <ExternalLink className="w-4 h-4" />
                  </button>
                  {!(profile as any)?.stripe_customer_id && (
                    <p className="mt-2 text-xs text-warning-foreground font-medium">
                      ⚠️ Note: Vous n'avez pas encore de souscription active rattachée à ce compte ou votre ID Stripe n'est pas renseigné dans la base de données. 
                      Vous pouvez souscrire depuis l'onglet Tarifs.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Préférences ── */}
          {activeSection === "prefs" && (
            <div className="space-y-5">
              {/* Thème */}
              <div className="card-elevated p-6 space-y-5">
                <div>
                  <h2 className="text-sm font-semibold">{t("pref.theme.label")}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">{t("pref.theme.hint")}</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(
                    [
                      {
                        value: "light" as Theme,
                        icon: Sun,
                        labelKey: "pref.theme.light" as Key,
                        descKey: "pref.theme.light.desc" as Key,
                        preview: (
                          <div className="h-16 rounded-lg border border-border overflow-hidden bg-white">
                            <div className="h-3 bg-slate-100 border-b border-slate-200" />
                            <div className="p-1.5 space-y-1">
                              <div className="h-1.5 w-10 rounded bg-slate-200" />
                              <div className="h-1.5 w-7 rounded bg-slate-100" />
                              <div className="h-1.5 w-8 rounded bg-blue-200" />
                            </div>
                          </div>
                        ),
                      },
                      {
                        value: "dark" as Theme,
                        icon: Moon,
                        labelKey: "pref.theme.dark" as Key,
                        descKey: "pref.theme.dark.desc" as Key,
                        preview: (
                          <div className="h-16 rounded-lg border border-slate-700 overflow-hidden bg-slate-900">
                            <div className="h-3 bg-slate-800 border-b border-slate-700" />
                            <div className="p-1.5 space-y-1">
                              <div className="h-1.5 w-10 rounded bg-slate-600" />
                              <div className="h-1.5 w-7 rounded bg-slate-700" />
                              <div className="h-1.5 w-8 rounded bg-blue-700" />
                            </div>
                          </div>
                        ),
                      },
                    ]
                  ).map(({ value, icon: Icon, labelKey, descKey, preview }) => {
                    const active = theme === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={cn(
                          "flex flex-col gap-2 rounded-xl border-2 p-3 text-left transition-all",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40 hover:bg-muted/40",
                        )}
                      >
                        {preview}
                        <div className="flex items-center gap-1.5">
                          <Icon className={cn("h-3.5 w-3.5", active ? "text-primary" : "text-muted-foreground")} />
                          <span className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                            {t(labelKey)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-tight">{t(descKey)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Autres préférences */}
              <div className="card-elevated p-6 space-y-0 divide-y divide-border">
                <h2 className="text-sm font-semibold pb-4">{lang === "fr" ? "Affichage & comportement" : "Display & behaviour"}</h2>

                {/* Compact mode */}
                <PrefToggleRow
                  icon={SlidersHorizontal}
                  label={t("pref.compact")}
                  desc={t("pref.compact.desc")}
                  checked={prefs.compactMode}
                  onChange={(v) => setPrefs({ compactMode: v })}
                />

                {/* TTC par défaut */}
                <PrefToggleRow
                  icon={SlidersHorizontal}
                  label={t("pref.ttc")}
                  desc={t("pref.ttc.desc")}
                  checked={prefs.showTTCByDefault}
                  onChange={(v) => setPrefs({ showTTCByDefault: v })}
                />

                {/* Notifications */}
                <PrefToggleRow
                  icon={SlidersHorizontal}
                  label={t("pref.notif.label")}
                  desc={t("pref.notif.desc")}
                  checked={prefs.notificationsEnabled}
                  onChange={(v) => setPrefs({ notificationsEnabled: v })}
                />
              </div>

              {/* Note info */}
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                {lang === "fr"
                  ? "Les préférences sont enregistrées automatiquement et propres à cet appareil."
                  : "Preferences are saved automatically and are specific to this device."}
              </div>
            </div>
          )}

          {/* Bouton save mobile — masqué sur prefs (auto-save) */}
          {activeSection !== "prefs" && (
            <div className="flex justify-end pt-2">
              <button
                onClick={handleSave}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-[var(--shape-control)] border-2 border-navy px-6 text-sm font-bold text-white shadow-offset transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-offset-sm",
                  saved ? "bg-success" : "bg-primary hover:bg-primary/90",
                )}
              >
                {saved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("set.saved")}
                  </>
                ) : (
                  t("set.save")
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
