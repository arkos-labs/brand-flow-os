import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CreditCard,
  Plus,
  Search,
  ShoppingCart,
  Briefcase,
  Plane,
  Monitor,
  Coffee,
  MoreHorizontal,
  Trash2,
  Pencil,
  Paperclip,
  Sparkles,
  Upload,
  FileCheck2,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, type Expense, type ExpenseCategory } from "@/lib/data-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/depenses")({
  head: () => ({
    meta: [
      { title: "Dépenses & Achats — ClearQuote" },
      { name: "description", content: "Suivi des frais, achats et sous-traitance." },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES: { id: ExpenseCategory; icon: LucideIcon; color: string; label: { fr: string; en: string } }[] = [
  { id: "software", icon: Monitor, color: "text-blue-500", label: { fr: "Logiciels & Abonnements", en: "Software & Subs" } },
  { id: "hardware", icon: ShoppingCart, color: "text-amber-500", label: { fr: "Matériel", en: "Hardware" } },
  { id: "travel", icon: Plane, color: "text-emerald-500", label: { fr: "Déplacements", en: "Travel" } },
  { id: "subcontractor", icon: Briefcase, color: "text-orange-500", label: { fr: "Sous-traitance", en: "Subcontractor" } },
  { id: "office", icon: Coffee, color: "text-orange-500", label: { fr: "Frais de bureau", en: "Office" } },
  { id: "other", icon: CreditCard, color: "text-slate-500", label: { fr: "Autre", en: "Other" } },
];

const EMPTY_EXPENSE: Omit<Expense, "id" | "createdAt"> = {
  date: new Date().toISOString().split("T")[0] ?? "",
  description: "",
  vendor: "",
  quantity: 1,
  amountHT: 0,
  vatAmount: 0,
  amountTTC: 0,
  category: "other",
};

function ExpensesPage() {
  const { t, money, date, lang } = useI18n();
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();

  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<ExpenseCategory | "all">("all");
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EXPENSE);
  const [expensePrompt, setExpensePrompt] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const matchSearch =
        e.description.toLowerCase().includes(search.toLowerCase()) ||
        e.vendor.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || e.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [expenses, search, filterCat]);

  const totalTTC = filtered.reduce((acc, e) => acc + e.amountTTC, 0);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_EXPENSE);
    setIsFormOpen(true);
  };

  const openEdit = (e: Expense) => {
    setEditingId(e.id);
    setForm({
      date: e.date,
      description: e.description,
      vendor: e.vendor,
      quantity: e.quantity ?? 1,
      amountHT: e.amountHT,
      vatAmount: e.vatAmount,
      amountTTC: e.amountTTC,
      category: e.category,
      ...(e.receiptName ? { receiptName: e.receiptName } : {}),
      ...(e.receiptData ? { receiptData: e.receiptData } : {}),
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateExpense(editingId, form);
    } else {
      addExpense(form);
    }
    setIsFormOpen(false);
  };

  const handleAmountHTChange = (val: string) => {
    const ht = parseFloat(val) || 0;
    const tva = ht * 0.2; // default 20%
    setForm({ ...form, amountHT: ht, vatAmount: tva, amountTTC: ht + tva });
  };

  const handleAmountTTCChange = (val: string) => {
    const ttc = parseFloat(val.replace(",", ".")) || 0;
    const ht = Math.round((ttc / 1.2) * 100) / 100;
    setForm({ ...form, amountTTC: ttc, amountHT: ht, vatAmount: Math.round((ttc - ht) * 100) / 100 });
  };

  const clearReceipt = () => {
    setForm((current) => {
      const next = { ...current };
      delete next.receiptName;
      delete next.receiptData;
      return next;
    });
  };

  const analyseExpensePrompt = () => {
    const prompt = expensePrompt.trim();
    if (!prompt) return;
    setIsAnalysing(true);
    window.setTimeout(() => {
      const normalized = prompt.toLowerCase();
      const amountMatch = prompt.match(/(\d+(?:[,.]\d{1,2})?)\s*€?\s*(ttc|ht)?/i);
      const amount = amountMatch ? Number((amountMatch[1] ?? "0").replace(",", ".")) : 0;
      const isHT = amountMatch?.[2]?.toLowerCase() === "ht";
      const vendorMatch = prompt.match(/(?:chez|à|auprès de)\s+([^,.;\d]+?)(?=\s+(?:pour|le|en|de|à)|[,.;]|$)/i);
      const category: ExpenseCategory = /carburant|péage|parking|train|essence|déplacement/.test(normalized)
        ? "travel"
        : /outil|perceuse|vis|matériel|fourniture|leroy|castorama|brico|câble|plomberie/.test(normalized)
          ? "hardware"
          : /sous.trait|intérim|artisan/.test(normalized)
            ? "subcontractor"
            : /logiciel|abonnement|application|saas/.test(normalized)
              ? "software"
              : /bureau|téléphone|internet|impression/.test(normalized)
                ? "office"
                : "other";
      const amountHT = isHT ? amount : Math.round((amount / 1.2) * 100) / 100;
      const amountTTC = isHT ? Math.round((amount * 1.2) * 100) / 100 : amount;
      const quantityMatch = normalized.match(/(?:^|\s)(\d+)\s+(?:sac|sacs|pièce|pièces|unité|unités|lot|lots|mètre|mètres|carton|cartons)/);
      setForm((current) => ({
        ...current,
        description: prompt,
        vendor: vendorMatch?.[1]?.trim() || current.vendor,
        category,
        quantity: quantityMatch ? Number(quantityMatch[1] ?? "1") : current.quantity,
        amountHT,
        vatAmount: Math.round((amountTTC - amountHT) * 100) / 100,
        amountTTC,
      }));
      setIsAnalysing(false);
    }, 550);
  };

  const handleReceiptChange = (file?: File) => {
    if (!file) return;
    if (file.size > 1_500_000) {
      alert("En mode local, le justificatif doit faire moins de 1,5 Mo. Le stockage de fichiers volumineux sera activé avec le backend.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, receiptName: file.name, receiptData: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PageHeader
        title={lang === "fr" ? "Dépenses & Achats" : "Expenses & Purchases"}
        subtitle={lang === "fr" ? "Suivez vos frais pour calculer votre bénéfice réel" : "Track your expenses to calculate real profit"}
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            {lang === "fr" ? "Nouvelle dépense" : "New expense"}
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card-elevated p-5">
          <p className="text-sm font-medium text-muted-foreground">{lang === "fr" ? "Total Dépenses TTC" : "Total Expenses (incl. VAT)"}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{money(totalTTC)}</p>
        </div>
      </div>

      <div className="card-elevated flex flex-row gap-4 p-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={lang === "fr" ? "Rechercher une dépense..." : "Search expenses..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as ExpenseCategory | "all")}
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 sm:w-[200px]"
        >
          <option value="all">{lang === "fr" ? "Toutes les catégories" : "All categories"}</option>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.label[lang]}</option>
          ))}
        </select>
      </div>

      <div className="card-elevated overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>{lang === "fr" ? "Date" : "Date"}</TableHead>
              <TableHead>{lang === "fr" ? "Fournisseur" : "Vendor"}</TableHead>
              <TableHead>{lang === "fr" ? "Catégorie" : "Category"}</TableHead>
              <TableHead className="text-right">{lang === "fr" ? "Qté" : "Qty"}</TableHead>
              <TableHead className="text-right">{lang === "fr" ? "Montant HT" : "Amount excl. VAT"}</TableHead>
              <TableHead className="text-right">{lang === "fr" ? "Montant TTC" : "Amount incl. VAT"}</TableHead>
              <TableHead>{lang === "fr" ? "Justificatif" : "Receipt"}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  {lang === "fr" ? "Aucune dépense trouvée." : "No expenses found."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((exp) => {
                const catInfo = CATEGORIES.find(c => c.id === exp.category) || CATEGORIES[5]!;
                const CatIcon = catInfo.icon;
                return (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{date(exp.date)}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{exp.vendor}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1">{exp.description}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex w-fit items-center gap-1.5 bg-background">
                        <CatIcon className={`h-3 w-3 ${catInfo.color}`} />
                        {catInfo.label[lang]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{exp.quantity ?? 1}</TableCell>
                    <TableCell className="text-right">{money(exp.amountHT)}</TableCell>
                    <TableCell className="text-right font-semibold">{money(exp.amountTTC)}</TableCell>
                    <TableCell>
                      {exp.receiptName ? (
                        <a
                          href={exp.receiptData}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex max-w-32 items-center gap-1.5 truncate rounded-md bg-success/10 px-2 py-1 text-xs font-semibold text-success hover:bg-success/20"
                        >
                          <FileCheck2 className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{exp.receiptName}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sans justificatif</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(exp)}>
                            <Pencil className="mr-2 h-4 w-4" /> {lang === "fr" ? "Modifier" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteExpense(exp.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> {lang === "fr" ? "Supprimer" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-3 border-b">
            <SheetTitle>
              {editingId ? (lang === "fr" ? "Modifier la dépense" : "Edit expense") : (lang === "fr" ? "Nouvelle dépense" : "New expense")}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <form id="expense-form" onSubmit={handleSave} className="space-y-6 p-6">
              {!editingId && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white"><Sparkles className="h-4 w-4" /></span>
                    <div>
                      <p className="text-sm font-bold">Assistant de saisie — mode local</p>
                      <p className="text-xs text-muted-foreground">Décrivez votre achat, je pré-remplis la dépense.</p>
                    </div>
                  </div>
                  <textarea
                    value={expensePrompt}
                    onChange={(event) => setExpensePrompt(event.target.value)}
                    placeholder="Ex. J'ai acheté du matériel de plomberie chez Leroy Merlin pour 142,80 € TTC."
                    className="mt-3 min-h-20 w-full resize-none rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <Button type="button" size="sm" onClick={analyseExpensePrompt} disabled={!expensePrompt.trim() || isAnalysing} className="mt-2 w-full gap-2">
                    {isAnalysing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {isAnalysing ? "Analyse en cours…" : "Pré-remplir automatiquement"}
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Date" : "Date"}</Label>
                <Input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Fournisseur / Marchand" : "Vendor / Merchant"}</Label>
                <Input
                  required
                  value={form.vendor}
                  onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                  placeholder="Ex: Apple, SNCF, Amazon..."
                />
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Description" : "Description"}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Abonnement mensuel..."
                />
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Catégorie" : "Category"}</Label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as ExpenseCategory })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label[lang]}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Quantité" : "Quantity"}</Label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={form.quantity || ""}
                  onChange={(e) => setForm({ ...form, quantity: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{lang === "fr" ? "Montant HT" : "Amount HT"}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.amountHT || ""}
                    onChange={(e) => handleAmountHTChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === "fr" ? "Montant TTC" : "Amount TTC"}</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={form.amountTTC || ""}
                    onChange={(e) => handleAmountTTCChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary ring-1 ring-border"><Paperclip className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">Facture ou ticket d’achat</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">PDF, photo ou scan du justificatif.</p>
                    {form.receiptName ? (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-md bg-success/10 px-2.5 py-2 text-xs font-semibold text-success">
                        <span className="truncate">{form.receiptName}</span>
                        <button type="button" onClick={clearReceipt} className="text-muted-foreground hover:text-destructive">Retirer</button>
                      </div>
                    ) : (
                      <label className="mt-3 flex h-9 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-xs font-semibold transition hover:border-primary hover:text-primary">
                        <Upload className="h-3.5 w-3.5" /> Ajouter un document
                        <input type="file" accept="application/pdf,image/*" onChange={(event) => handleReceiptChange(event.target.files?.[0])} className="hidden" />
                      </label>
                    )}
                  </div>
                </div>
              </div>

            </form>
          </ScrollArea>
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button type="submit" form="expense-form">
              {lang === "fr" ? "Enregistrer" : "Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
