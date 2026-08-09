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
} from "lucide-react";
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
      { title: "Dépenses & Achats — InvoicePro" },
      { name: "description", content: "Suivi des frais, achats et sous-traitance." },
    ],
  }),
  component: ExpensesPage,
});

const CATEGORIES: { id: ExpenseCategory; icon: any; color: string; label: { fr: string; en: string } }[] = [
  { id: "software", icon: Monitor, color: "text-blue-500", label: { fr: "Logiciels & Abonnements", en: "Software & Subs" } },
  { id: "hardware", icon: ShoppingCart, color: "text-amber-500", label: { fr: "Matériel", en: "Hardware" } },
  { id: "travel", icon: Plane, color: "text-emerald-500", label: { fr: "Déplacements", en: "Travel" } },
  { id: "subcontractor", icon: Briefcase, color: "text-purple-500", label: { fr: "Sous-traitance", en: "Subcontractor" } },
  { id: "office", icon: Coffee, color: "text-orange-500", label: { fr: "Frais de bureau", en: "Office" } },
  { id: "other", icon: CreditCard, color: "text-slate-500", label: { fr: "Autre", en: "Other" } },
];

const EMPTY_EXPENSE: Omit<Expense, "id" | "createdAt"> = {
  date: new Date().toISOString().split("T")[0] ?? "",
  description: "",
  vendor: "",
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
      amountHT: e.amountHT,
      vatAmount: e.vatAmount,
      amountTTC: e.amountTTC,
      category: e.category,
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
          onChange={(e) => setFilterCat(e.target.value as any)}
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
              <TableHead className="text-right">{lang === "fr" ? "Montant HT" : "Amount excl. VAT"}</TableHead>
              <TableHead className="text-right">{lang === "fr" ? "Montant TTC" : "Amount incl. VAT"}</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
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
                    <TableCell className="text-right">{money(exp.amountHT)}</TableCell>
                    <TableCell className="text-right font-semibold">{money(exp.amountTTC)}</TableCell>
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
                    onChange={(e) => setForm({ ...form, amountTTC: parseFloat(e.target.value) || 0 })}
                  />
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
