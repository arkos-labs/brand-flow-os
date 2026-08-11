import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Repeat,
  Plus,
  Search,
  MoreHorizontal,
  Trash2,
  Pencil,
  PauseCircle,
  PlayCircle,
  Calendar,
  Landmark,
  Calculator,
  Bell,
  CreditCard,
} from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, type Subscription, type SubscriptionInterval } from "@/lib/data-context";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/abonnements")({
  head: () => ({
    meta: [
      { title: "Abonnements — ClearQuote" },
      { name: "description", content: "Gestion des factures récurrentes." },
    ],
  }),
  component: SubscriptionsPage,
});

const EMPTY_SUB: Omit<Subscription, "id" | "createdAt"> = {
  client: "",
  title: "",
  amountHT: 0,
  vatRate: 20,
  interval: "monthly",
  nextBillingDate: new Date().toISOString().split("T")[0] ?? "",
  status: "active",
};

const INTERVAL_LABELS = {
  monthly: { fr: "Mensuel", en: "Monthly" },
  quarterly: { fr: "Trimestriel", en: "Quarterly" },
  yearly: { fr: "Annuel", en: "Yearly" },
};

function SubscriptionsPage() {
  const { t, money, date, lang } = useI18n();
  const { subscriptions, addSubscription, updateSubscription, deleteSubscription } = useData();

  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_SUB);

  const filtered = subscriptions.filter((s) => {
    return (
      s.client.toLowerCase().includes(search.toLowerCase()) ||
      s.title.toLowerCase().includes(search.toLowerCase())
    );
  });

  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const mrrHT = subscriptions
    .filter((s) => s.status === "active")
    .reduce((acc, s) => {
      if (s.interval === "monthly") return acc + s.amountHT;
      if (s.interval === "quarterly") return acc + s.amountHT / 3;
      if (s.interval === "yearly") return acc + s.amountHT / 12;
      return acc;
    }, 0);

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_SUB);
    setIsFormOpen(true);
  };

  const openEdit = (s: Subscription) => {
    setEditingId(s.id);
    setForm({
      client: s.client,
      title: s.title,
      amountHT: s.amountHT,
      vatRate: s.vatRate,
      interval: s.interval,
      nextBillingDate: s.nextBillingDate,
      status: s.status,
    });
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateSubscription(editingId, form);
    } else {
      addSubscription(form);
    }
    setIsFormOpen(false);
  };

  const toggleStatus = (s: Subscription) => {
    updateSubscription(s.id, { status: s.status === "active" ? "paused" : "active" });
  };

  return (
    <>
      <PageHeader
        title={lang === "fr" ? "Abonnements" : "Subscriptions"}
        subtitle={lang === "fr" ? "Générez vos factures récurrentes automatiquement" : "Generate recurring invoices automatically"}
        action={
          <Button onClick={openNew}>
            <Plus className="mr-2 h-4 w-4" />
            {lang === "fr" ? "Nouvel abonnement" : "New subscription"}
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 mb-6">
        <div className="card-elevated p-5 relative overflow-hidden">
          <div className="pointer-events-none absolute -right-2 -top-2 opacity-5">
            <Repeat className="h-24 w-24" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{lang === "fr" ? "Revenu Récurrent Mensuel (MRR)" : "Monthly Recurring Revenue"}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{money(mrrHT)} <span className="text-sm font-normal text-muted-foreground">HT</span></p>
        </div>
        <div className="card-elevated p-5">
          <p className="text-sm font-medium text-muted-foreground">{lang === "fr" ? "Abonnements actifs" : "Active subscriptions"}</p>
          <p className="text-3xl font-bold mt-2 text-foreground">{activeCount}</p>
        </div>
      </div>

      <div className="card-elevated flex flex-row gap-4 p-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={lang === "fr" ? "Rechercher un client ou un contrat..." : "Search client or contract..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background/50"
          />
        </div>
      </div>

      <div className="card-elevated overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead>{lang === "fr" ? "Client & Contrat" : "Client & Contract"}</TableHead>
                <TableHead className="hidden lg:table-cell">{lang === "fr" ? "Récurrence" : "Interval"}</TableHead>
                <TableHead className="text-right">{lang === "fr" ? "Montant HT" : "Amount HT"}</TableHead>
                <TableHead className="hidden lg:table-cell">{lang === "fr" ? "Prochaine Facture" : "Next Invoice"}</TableHead>
                <TableHead>{lang === "fr" ? "Statut" : "Status"}</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    {lang === "fr" ? "Aucun abonnement trouvé." : "No subscriptions found."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{sub.client}</div>
                      <div className="text-xs text-muted-foreground">{sub.title}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground lg:hidden">
                        <Repeat className="h-3 w-3" />
                        {INTERVAL_LABELS[sub.interval][lang as "fr" | "en"]}
                        <span className="mx-1">·</span>
                        <Calendar className="h-3 w-3" />
                        {date(sub.nextBillingDate)}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Repeat className="h-3.5 w-3.5" />
                        {INTERVAL_LABELS[sub.interval][lang as "fr" | "en"]}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {money(sub.amountHT)}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {date(sub.nextBillingDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.status === "active" ? (
                        <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20">
                          {lang === "fr" ? "Actif" : "Active"}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          {lang === "fr" ? "En pause" : "Paused"}
                        </Badge>
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
                          <DropdownMenuItem onClick={() => toggleStatus(sub)}>
                            {sub.status === "active" ? (
                              <><PauseCircle className="mr-2 h-4 w-4" /> {lang === "fr" ? "Mettre en pause" : "Pause"}</>
                            ) : (
                              <><PlayCircle className="mr-2 h-4 w-4" /> {lang === "fr" ? "Réactiver" : "Resume"}</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(sub)}>
                            <Pencil className="mr-2 h-4 w-4" /> {lang === "fr" ? "Modifier" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteSubscription(sub.id)} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> {lang === "fr" ? "Supprimer" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ── Stratégie & Produit — Fonctionnalités Core à venir ── */}
      <div className="mt-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {lang === "fr" ? "Stratégie & Produit — Fonctionnalités Core" : "Product Roadmap — Core Features"}
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            {
              icon: Landmark,
              color: "bg-blue-500/10 text-blue-600",
              title: lang === "fr" ? "Synchronisation Bancaire" : "Bank Sync (Open Banking)",
              tag: "Open Banking · Bridge / Tink",
              desc: lang === "fr"
                ? "Rapprochement bancaire automatique dans Trésorerie & Paiements pour lettrer les factures sans saisie manuelle."
                : "Automatic bank reconciliation in Cashflow & Payments to match invoices without manual entry.",
            },
            {
              icon: Calculator,
              color: "bg-amber-500/10 text-amber-600",
              title: lang === "fr" ? "Tableau de Bord Fiscal & URSSAF" : "Tax & Social Charges Dashboard",
              tag: lang === "fr" ? "TVA prévisionnelle · Cotisations" : "VAT forecast · Social charges",
              desc: lang === "fr"
                ? "Encart prévisionnel de TVA à décaisser et cotisations sociales estimées basées sur le CA encaissé."
                : "Estimated VAT payable and social charges forecast based on collected revenue.",
            },
            {
              icon: Bell,
              color: "bg-rose-500/10 text-rose-600",
              title: lang === "fr" ? "Automatisation des Relances" : "Automated Follow-ups",
              tag: "J+3 · J+7 · J+15",
              desc: lang === "fr"
                ? "Scénarios de relance automatique par email à J+3, J+7 et J+15 pour les factures en retard."
                : "Automated email reminder workflows at D+3, D+7 and D+15 for overdue invoices.",
            },
            {
              icon: CreditCard,
              color: "bg-emerald-500/10 text-emerald-600",
              title: lang === "fr" ? "Paiement en Ligne" : "Online Payment",
              tag: "Stripe · GoCardless",
              desc: lang === "fr"
                ? "Liens de paiement sur devis (acomptes) et factures pour accélérer l'encaissement via Stripe ou GoCardless."
                : "Payment links on quotes (deposits) and invoices to speed up collection via Stripe or GoCardless.",
            },
          ].map(({ icon: Icon, color, title, tag, desc }) => (
            <div key={title} className="card-elevated relative overflow-hidden rounded-xl p-4">
              <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <span className="mb-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {tag}
              </span>
              <h3 className="mt-1 text-sm font-semibold text-foreground">{title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] font-medium text-muted-foreground">
                  {lang === "fr" ? "Phase 2 — Roadmap" : "Phase 2 — Roadmap"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="p-6 pb-3 border-b">
            <SheetTitle>
              {editingId ? (lang === "fr" ? "Modifier l'abonnement" : "Edit subscription") : (lang === "fr" ? "Nouvel abonnement" : "New subscription")}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <form id="sub-form" onSubmit={handleSave} className="space-y-6 p-6">
              <div className="space-y-2">
                <Label>{lang === "fr" ? "Client" : "Client"}</Label>
                <Input
                  required
                  value={form.client}
                  onChange={(e) => setForm({ ...form, client: e.target.value })}
                  placeholder="Ex: Entreprise Dupont"
                />
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Intitulé du contrat" : "Contract title"}</Label>
                <Input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Hébergement & Maintenance"
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
                    onChange={(e) => setForm({ ...form, amountHT: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{lang === "fr" ? "TVA (%)" : "VAT (%)"}</Label>
                  <select
                    value={form.vatRate}
                    onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="20">20%</option>
                    <option value="10">10%</option>
                    <option value="5.5">5.5%</option>
                    <option value="0">0%</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Récurrence" : "Interval"}</Label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm({ ...form, interval: e.target.value as SubscriptionInterval })}
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="monthly">{lang === "fr" ? "Mensuel" : "Monthly"}</option>
                  <option value="quarterly">{lang === "fr" ? "Trimestriel" : "Quarterly"}</option>
                  <option value="yearly">{lang === "fr" ? "Annuel" : "Yearly"}</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>{lang === "fr" ? "Prochaine facturation" : "Next billing date"}</Label>
                <Input
                  type="date"
                  required
                  value={form.nextBillingDate}
                  onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {lang === "fr"
                    ? "Une facture brouillon sera générée automatiquement à cette date."
                    : "A draft invoice will be automatically generated on this date."}
                </p>
              </div>
            </form>
          </ScrollArea>
          <div className="flex justify-end gap-3 border-t p-6">
            <Button variant="outline" type="button" onClick={() => setIsFormOpen(false)}>
              {lang === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button type="submit" form="sub-form">
              {lang === "fr" ? "Enregistrer" : "Save"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
