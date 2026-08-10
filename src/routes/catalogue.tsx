import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useRef, useCallback } from "react";
import {
  Plus, Search, Pencil, Trash2, X, Package, CheckCircle2,
  Layers, Download, Upload, FileText, AlertTriangle, FileDown,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData } from "@/lib/data-context";
import {
  UNIT_LABELS,
  CATEGORY_LABELS,
  type Product,
  type ProductCategory,
  type ProductUnit,
  type VatRate,
} from "@/lib/demo-data";
import {
  exportCatalogueToExcel,
  downloadCsvTemplate,
  parseCatalogueCSV,
  importRowsToProducts,
  type ParseResult,
} from "@/lib/catalogue-io";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/catalogue")({
  head: () => ({
    meta: [
      { title: "Catalogue de prestations — InvoicePro" },
      {
        name: "description",
        content:
          "Gérez vos prestations, tarifs unitaires et taux de TVA pour accélérer la création de devis.",
      },
      { property: "og:title", content: "Catalogue de prestations — InvoicePro" },
      { property: "og:description", content: "Prestations, tarifs et TVA pour devis rapides." },
    ],
  }),
  component: Catalogue,
});

// ─── Constantes ──────────────────────────────────────────────────────────────

const ALL_CATEGORIES: ProductCategory[] = [
  "main-oeuvre",
  "materiaux",
  "deplacement",
  "sous-traitance",
  "equipement",
  "autre",
];

const ALL_UNITS: ProductUnit[] = ["h", "j", "forfait", "m2", "ml", "unite", "km"];
const ALL_VAT: VatRate[] = [20, 10, 5.5, 0];

const VAT_NOTES: Record<number, string> = {
  10: "Rénovation logement",
  5.5: "Amélioration énergétique",
  0: "Auto-liquidation",
};

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  "main-oeuvre": "bg-blue-50 text-blue-700",
  materiaux: "bg-amber-50 text-amber-700",
  deplacement: "bg-slate-100 text-slate-600",
  "sous-traitance": "bg-orange-50 text-orange-700",
  equipement: "bg-emerald-50 text-emerald-700",
  autre: "bg-gray-100 text-gray-600",
};

// ─── Formulaire vide ─────────────────────────────────────────────────────────

const emptyForm = (): Omit<Product, "id"> => ({
  ref: "",
  label: { fr: "", en: "" },
  description: { fr: "", en: "" },
  category: "main-oeuvre",
  unit: "h",
  priceHT: 0,
  vatRate: 20,
  active: true,
  upsells: [],
});

// ─── Composant principal ──────────────────────────────────────────────────────

function Catalogue() {
  const { t, tv, money, lang } = useI18n();
  const { products: items, addProduct, updateProduct, deleteProduct } = useData();

  // Filtres
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");

  // Modale
  const [modal, setModal] = useState<"closed" | "new" | "edit">("closed");
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<Omit<Product, "id">>(emptyForm());

  // Confirmation suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Import / Export
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importDialog, setImportDialog] = useState(false);
  const [importResult, setImportResult] = useState<ParseResult | null>(null);
  const [importMode, setImportMode] = useState<"add" | "replace">("add");
  const [importDragging, setImportDragging] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // ─── Filtrage ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((p) => {
      const matchCat = categoryFilter === "all" || p.category === categoryFilter;
      const matchSearch =
        !q ||
        p.ref.toLowerCase().includes(q) ||
        p.label.fr.toLowerCase().includes(q) ||
        p.label.en.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [items, search, categoryFilter]);

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const kpiTotal = items.length;
  const kpiActive = items.filter((p) => p.active).length;
  const kpiCats = new Set(items.map((p) => p.category)).size;

  // ─── Actions CRUD ──────────────────────────────────────────────────────────

  function openNew() {
    setForm(emptyForm());
    setModal("new");
  }

  function openEdit(p: Product) {
    setEditTarget(p);
    setForm({
      ref: p.ref,
      label: { ...p.label },
      description: { ...p.description },
      category: p.category,
      unit: p.unit,
      priceHT: p.priceHT,
      vatRate: p.vatRate,
      active: p.active,
      upsells: p.upsells || [],
    });
    setModal("edit");
  }

  function closeModal() {
    setModal("closed");
    setEditTarget(null);
  }

  function saveForm() {
    if (modal === "new") {
      const newId = `p${Date.now()}`;
      const newRef = form.ref.trim() || `REF-${String(items.length + 1).padStart(3, "0")}`;
      addProduct({ id: newId, ...form, ref: newRef } as Product);
    } else if (modal === "edit" && editTarget) {
      updateProduct(editTarget.id, { id: editTarget.id, ...form } as Product);
    }
    closeModal();
  }

  function toggleActive(id: string) {
    const p = items.find((x) => x.id === id);
    if (p) updateProduct(id, { ...p, active: !p.active });
  }

  function confirmDelete(id: string) {
    setDeleteId(id);
  }

  function doDelete() {
    if (deleteId) deleteProduct(deleteId);
    setDeleteId(null);
  }

  // ─── Helpers formulaire ────────────────────────────────────────────────────

  function setField<K extends keyof Omit<Product, "id">>(key: K, val: Omit<Product, "id">[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function addFormUpsell() {
    setForm((f) => ({
      ...f,
      upsells: [...(f.upsells || []), { id: `up-${Date.now()}`, label: "", priceHT: 0 }],
    }));
  }

  function updateFormUpsell(id: string, field: "label" | "priceHT", val: string | number) {
    setForm((f) => ({
      ...f,
      upsells: (f.upsells || []).map((u) => (u.id === id ? { ...u, [field]: val } : u)),
    }));
  }

  function removeFormUpsell(id: string) {
    setForm((f) => ({
      ...f,
      upsells: (f.upsells || []).filter((u) => u.id !== id),
    }));
  }

  const priceTTC = Number(form.priceHT || 0) * (1 + form.vatRate / 100);

  // ─── Import / Export handlers ─────────────────────────────────────────────

  function handleExportExcel() {
    setExportLoading(true);
    try {
      exportCatalogueToExcel(items);
    } finally {
      setTimeout(() => setExportLoading(false), 800);
    }
  }

  const processFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".txt")) {
      alert(lang === "fr" ? "Seuls les fichiers .csv sont acceptés." : "Only .csv files are accepted.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCatalogueCSV(text);
      setImportResult(result);
      setImportDialog(true);
    };
    reader.readAsText(file, "UTF-8");
  }, [lang]);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setImportDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  function handleConfirmImport() {
    if (!importResult) return;
    const products = importRowsToProducts(importResult.rows, importMode === "add" ? items.length : 0);

    if (importMode === "replace") {
      // Supprimer tous les produits existants puis ajouter
      items.forEach((p) => deleteProduct(p.id));
    }
    products.forEach((p) => addProduct(p));

    const msg = lang === "fr"
      ? `${products.length} prestation(s) importée(s)`
      : `${products.length} service(s) imported`;
    setImportSuccess(msg);
    setImportDialog(false);
    setImportResult(null);
    setTimeout(() => setImportSuccess(null), 4000);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader title={t("cat.title")} subtitle={t("cat.subtitle")} />

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <div className="card-elevated flex flex-col gap-1 p-3 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 lg:h-10 lg:w-10">
            <Package className="h-3.5 w-3.5 text-primary lg:h-5 lg:w-5" />
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground lg:text-xs">
              {t("cat.kpi.total")}
            </p>
            <p className="font-display text-lg font-semibold lg:text-2xl">{kpiTotal}</p>
          </div>
        </div>
        <div className="card-elevated flex flex-col gap-1 p-3 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-success/10 lg:h-10 lg:w-10">
            <CheckCircle2 className="h-3.5 w-3.5 text-success lg:h-5 lg:w-5" />
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground lg:text-xs">
              {t("cat.kpi.active")}
            </p>
            <p className="font-display text-lg font-semibold lg:text-2xl">{kpiActive}</p>
          </div>
        </div>
        <div className="card-elevated flex flex-col gap-1 p-3 lg:flex-row lg:items-center lg:gap-4 lg:p-5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 lg:h-10 lg:w-10">
            <Layers className="h-3.5 w-3.5 text-primary lg:h-5 lg:w-5" />
          </div>
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground lg:text-xs">
              {t("cat.kpi.categories")}
            </p>
            <p className="font-display text-lg font-semibold lg:text-2xl">{kpiCats}</p>
          </div>
        </div>
      </div>

      {/* Barre outils */}
      <div className="mt-4 flex flex-col gap-2 lg:mt-6 lg:flex-row lg:flex-wrap lg:items-center lg:gap-3">
        {/* Ligne 1 : recherche + boutons icônes */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("cat.search")}
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 lg:min-w-48"
            />
          </div>
          <div className="flex items-center gap-1.5">
            {/* Modèle CSV — icône seule sur mobile */}
            <button
              onClick={downloadCsvTemplate}
              title={t("cat.import_template")}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:px-3"
            >
              <FileDown className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{t("cat.import_template")}</span>
            </button>
            {/* Import CSV */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title={t("cat.import_csv")}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:px-3"
            >
              <Upload className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{t("cat.import_csv")}</span>
            </button>
            {/* Export Excel */}
            <button
              onClick={handleExportExcel}
              disabled={exportLoading || items.length === 0}
              title={t("cat.export_excel")}
              className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed lg:px-3"
            >
              <Download className={cn("h-4 w-4 shrink-0", exportLoading && "animate-bounce")} />
              <span className="hidden lg:inline">{t("cat.export_excel")}</span>
            </button>
            {/* Nouvelle prestation */}
            <button
              onClick={openNew}
              className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 lg:px-4"
            >
              <Plus className="h-4 w-4 shrink-0" />
              <span className="hidden lg:inline">{t("cat.new")}</span>
            </button>
          </div>
        </div>

        {/* Ligne 2 : filtres catégories en scroll horizontal */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 lg:flex-wrap lg:pb-0">
          <button
            onClick={() => setCategoryFilter("all")}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              categoryFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t("cat.all")}
          </button>
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                categoryFilter === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {tv(CATEGORY_LABELS[cat])}
            </button>
          ))}
        </div>
      </div>

      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={handleFileInput}
      />

      {/* Table */}
      <div className="card-elevated mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("cat.col.ref")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("cat.col.label")}
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  {t("cat.col.category")}
                </th>
                <th className="hidden px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  {t("cat.col.unit")}
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("cat.col.price")}
                </th>
                <th className="hidden px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground lg:table-cell">
                  {t("cat.col.vat")}
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("cat.col.status")}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    {t("cat.empty")}
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="group hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {p.ref}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{tv(p.label)}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                      {tv(p.description)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[p.category]}`}
                    >
                      {tv(CATEGORY_LABELS[p.category])}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {tv(UNIT_LABELS[p.unit])}
                  </td>
                  <td className="px-4 py-3 text-right font-display font-semibold whitespace-nowrap">
                    {money(Number(p.priceHT))}
                  </td>
                  <td className="hidden px-4 py-3 text-center lg:table-cell">
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="font-medium">{p.vatRate} %</span>
                      {VAT_NOTES[p.vatRate] && (
                        <span className="text-[10px] text-muted-foreground">
                          {VAT_NOTES[p.vatRate]}
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(p.id)}
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                        p.active
                          ? "bg-success/12 text-success hover:bg-success/20"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p.active ? t("cat.active") : t("cat.inactive")}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(p)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title={t("cat.edit")}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => confirmDelete(p.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title={t("cat.delete")}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modale Formulaire ─────────────────────────────────────────────── */}
      {modal !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-end sm:items-start sm:p-4"
          role="dialog"
          aria-modal="true"
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeModal} />

          {/* Panel */}
          <div className="relative z-10 flex h-full w-full flex-col bg-background shadow-xl sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">
                {modal === "new" ? t("cat.form.title.new") : t("cat.form.title.edit")}
              </h2>
              <button
                onClick={closeModal}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Corps */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Référence */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  {t("cat.form.ref")}
                </label>
                <input
                  type="text"
                  value={form.ref}
                  onChange={(e) => setField("ref", e.target.value)}
                  placeholder="MO-PLO-001"
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              {/* Libellés */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.label.fr")}
                  </label>
                  <input
                    type="text"
                    value={form.label.fr}
                    onChange={(e) => setField("label", { ...form.label, fr: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.label.en")}
                  </label>
                  <input
                    type="text"
                    value={form.label.en}
                    onChange={(e) => setField("label", { ...form.label, en: e.target.value })}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.desc.fr")}
                  </label>
                  <textarea
                    value={form.description.fr}
                    onChange={(e) =>
                      setField("description", { ...form.description, fr: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.desc.en")}
                  </label>
                  <textarea
                    value={form.description.en}
                    onChange={(e) =>
                      setField("description", { ...form.description, en: e.target.value })
                    }
                    rows={2}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {/* Catégorie + Unité */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.category")}
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setField("category", e.target.value as ProductCategory)}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ALL_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {tv(CATEGORY_LABELS[cat])}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.unit")}
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setField("unit", e.target.value as ProductUnit)}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ALL_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {tv(UNIT_LABELS[u])} ({u})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prix + TVA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.price")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={form.priceHT}
                    onChange={(e) =>
                      setField("priceHT", e.target.value === "" ? "" : parseFloat(e.target.value))
                    }
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t("cat.form.vat")}
                  </label>
                  <select
                    value={form.vatRate}
                    onChange={(e) => setField("vatRate", parseFloat(e.target.value) as VatRate)}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {ALL_VAT.map((v) => (
                      <option key={v} value={v}>
                        {v} %{VAT_NOTES[v] ? ` — ${VAT_NOTES[v]}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Récap TTC */}
              <div className="rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prix TTC</span>
                <span className="font-display font-semibold">{money(priceTTC)}</span>
              </div>

              {/* Upsells */}
              <div className="border-t pt-4 mt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Options supplémentaires (Upsells) liées
                  </label>
                  <button
                    onClick={addFormUpsell}
                    className="text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Ajouter option
                  </button>
                </div>

                <div className="space-y-2">
                  {(form.upsells || []).map((u) => (
                    <div key={u.id} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Nom de l'option"
                        value={u.label}
                        onChange={(e) => updateFormUpsell(u.id, "label", e.target.value)}
                        className="flex-1 h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <input
                        type="number"
                        placeholder="Prix HT"
                        value={u.priceHT}
                        onChange={(e) =>
                          updateFormUpsell(
                            u.id,
                            "priceHT",
                            e.target.value === "" ? "" : parseFloat(e.target.value),
                          )
                        }
                        className="w-20 h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <button
                        onClick={() => removeFormUpsell(u.id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {(form.upsells || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic text-center py-2">
                      Aucun upsell configuré pour cette prestation.
                    </p>
                  )}
                </div>
              </div>

              {/* Actif */}
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setField("active", e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span className="text-sm">{t("cat.form.active")}</span>
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={closeModal}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                {t("cat.form.cancel")}
              </button>
              <button
                onClick={saveForm}
                disabled={!form.label.fr.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t("cat.form.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Confirmation suppression ──────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDeleteId(null)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-background p-6 shadow-xl">
            <p className="text-sm font-medium">{t("cat.delete.confirm")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lang === "fr" ? "Cette action est irréversible." : "This action cannot be undone."}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                {t("cat.form.cancel")}
              </button>
              <button
                onClick={doDelete}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:bg-destructive/90 transition-colors"
              >
                {t("cat.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dialog Import CSV ─────────────────────────────────────────────── */}
      {importDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => { setImportDialog(false); setImportResult(null); }}
          />
          <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-xl bg-background shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{t("cat.import.dialog_title")}</h2>
              <button
                onClick={() => { setImportDialog(false); setImportResult(null); }}
                className="rounded-md p-1 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Drop zone (affichée uniquement si pas encore de résultat parsé) */}
              {!importResult && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setImportDragging(true); }}
                  onDragLeave={() => setImportDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
                    importDragging
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/30",
                  )}
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <p className="text-sm font-medium">{t("cat.import.drop")}</p>
                  <p className="text-xs text-muted-foreground">{t("cat.import.browse")}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{t("cat.import.accepted")}</p>
                </div>
              )}

              {/* Résultats du parsing */}
              {importResult && (
                <>
                  {/* Résumé */}
                  <div className="flex items-center gap-3 rounded-lg bg-muted/40 px-4 py-3">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="flex-1 text-sm">
                      <span className="font-semibold text-foreground">{importResult.rows.length}</span>
                      {" "}{lang === "fr" ? "ligne(s) valide(s) détectée(s)" : "valid row(s) detected"}
                      {importResult.skipped > 0 && (
                        <span className="ml-2 text-muted-foreground">
                          ({importResult.skipped} {lang === "fr" ? "ignorée(s)" : "skipped"})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setImportResult(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      {lang === "fr" ? "Changer de fichier" : "Change file"}
                    </button>
                  </div>

                  {/* Avertissements */}
                  {importResult.errors.length > 0 && (
                    <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        <span className="text-xs font-semibold text-warning">
                          {importResult.errors.length} avertissement(s)
                        </span>
                      </div>
                      <ul className="space-y-0.5">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i} className="text-[11px] text-muted-foreground">
                            Ligne {err.line} : {err.message}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li className="text-[11px] text-muted-foreground">
                            …et {importResult.errors.length - 5} autre(s)
                          </li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Aperçu table */}
                  {importResult.rows.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-border bg-muted/40">
                            {["Réf.", "Libellé FR", "Catégorie", "Unité", "Prix HT", "TVA"].map((h) => (
                              <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {importResult.rows.slice(0, 6).map((r, i) => (
                            <tr key={i} className="hover:bg-muted/20">
                              <td className="px-3 py-2 font-mono text-muted-foreground">{r.ref}</td>
                              <td className="px-3 py-2 font-medium max-w-[180px] truncate">{r.label_fr}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.category}</td>
                              <td className="px-3 py-2 text-muted-foreground">{r.unit}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{r.priceHT.toFixed(2)} €</td>
                              <td className="px-3 py-2 text-right tabular-nums">{r.vatRate}%</td>
                            </tr>
                          ))}
                          {importResult.rows.length > 6 && (
                            <tr>
                              <td colSpan={6} className="px-3 py-2 text-center text-muted-foreground">
                                …et {importResult.rows.length - 6} ligne(s) de plus
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Mode d'import */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {lang === "fr" ? "Mode d'import" : "Import mode"}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {(["add", "replace"] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setImportMode(mode)}
                          className={cn(
                            "rounded-lg border px-4 py-3 text-left text-xs transition-colors",
                            importMode === mode
                              ? "border-primary bg-primary/5 font-medium text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40",
                          )}
                        >
                          <p className="font-medium mb-0.5">
                            {mode === "add"
                              ? (lang === "fr" ? "Ajouter" : "Add")
                              : (lang === "fr" ? "Remplacer tout" : "Replace all")}
                          </p>
                          <p className="text-[10px] opacity-70">
                            {mode === "add"
                              ? (lang === "fr" ? "Les prestations existantes sont conservées" : "Existing services are kept")
                              : (lang === "fr" ? "Toutes les prestations existantes seront supprimées" : "All existing services will be deleted")}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-4">
              <button
                onClick={() => { setImportDialog(false); setImportResult(null); }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                {t("cat.form.cancel")}
              </button>
              {importResult && importResult.rows.length > 0 && (
                <button
                  onClick={handleConfirmImport}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {lang === "fr"
                    ? `Importer ${importResult.rows.length} prestation(s)`
                    : `Import ${importResult.rows.length} service(s)`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── Toast succès import ─────────────────────────────────────────────── */}
      {importSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-success/30 bg-background px-4 py-3 shadow-lg">
          <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
          <p className="text-sm font-medium">{importSuccess}</p>
          <button onClick={() => setImportSuccess(null)} className="ml-2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </>
  );
}
