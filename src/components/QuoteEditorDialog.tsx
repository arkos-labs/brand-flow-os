import { useEffect, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Client, Product, Quote, QuoteItem } from "@/lib/data-context";
import {
  buildEditedQuote,
  calculateEditorTotals,
  quoteToEditorForm,
  type QuoteEditorForm,
} from "@/lib/quote-editor";

type Props = {
  quote: Quote | null;
  clients: Client[];
  products: Product[];
  onOpenChange: (open: boolean) => void;
  onSave: (quote: Quote) => void;
};

const emptyLine = (): QuoteItem => ({ id: crypto.randomUUID(), label: "", qty: 1, priceHT: 0 });

export function QuoteEditorDialog({ quote, clients, products, onOpenChange, onSave }: Props) {
  const [form, setForm] = useState<QuoteEditorForm | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!quote) return;
    const knownClient = clients.find((client) => client.id === quote.clientId)
      ?? clients.find((client) => client.name.toLowerCase() === quote.client.toLowerCase());
    setForm(quoteToEditorForm(quote, knownClient));
    setError("");
  }, [quote, clients]);

  const totals = useMemo(
    () => form ? calculateEditorTotals(form.items, form.upsells, form.vatRate) : null,
    [form],
  );

  if (!quote || !form || !totals) return null;

  const patchForm = (partial: Partial<QuoteEditorForm>) => setForm((current) => current ? { ...current, ...partial } : current);
  const updateLine = (kind: "items" | "upsells", id: string, partial: Partial<QuoteItem>) => {
    const lines = form[kind].map((line) => {
      if (line.id !== id) return line;
      const next = { ...line, ...partial };
      if (partial.label) {
        const product = products.find((item) => item.label.fr === partial.label);
        if (product) {
          next.productId = product.id;
          next.priceHT = product.priceHT;
        }
      }
      return next;
    });
    patchForm({ [kind]: lines });
  };
  const removeLine = (kind: "items" | "upsells", id: string) => {
    if (kind === "items" && form.items.length === 1) return;
    patchForm({ [kind]: form[kind].filter((line) => line.id !== id) });
  };

  const selectClient = (clientId: string) => {
    const selected = clients.find((client) => client.id === clientId);
    if (!selected) return;
    patchForm({
      clientId: selected.id,
      clientType: selected.type,
      firstName: selected.firstName ?? "",
      lastName: selected.lastName ?? "",
      companyName: selected.companyName ?? (selected.type === "pro" ? selected.name : ""),
      siret: selected.siret ?? "",
      address: [selected.address, selected.postalCode, selected.city].filter(Boolean).join(", "),
      phone: selected.phone ?? "",
    });
  };

  const submit = () => {
    const hasClient = form.clientType === "pro"
      ? Boolean(form.companyName.trim())
      : Boolean(form.firstName.trim() && form.lastName.trim());
    if (!hasClient) {
      setError("Renseignez le nom du client avant d’enregistrer.");
      return;
    }
    if (!form.items.length || form.items.some((line) => !line.label.trim() || Number(line.qty) <= 0)) {
      setError("Chaque prestation doit avoir un libellé et une quantité supérieure à zéro.");
      return;
    }
    onSave(buildEditedQuote(quote, form));
  };

  return (
    <Dialog open={Boolean(quote)} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[94vh] w-[calc(100vw-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:h-[90vh]">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-4 text-left sm:px-6">
          <DialogTitle>Modifier le devis {quote.number}</DialogTitle>
          <DialogDescription>
            Modifiez le client, les prestations et les options sans quitter le pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5 sm:px-6">
          <section className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label>Client enregistré</Label>
                <select
                  value={form.clientId ?? ""}
                  onChange={(event) => selectClient(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Client actuel</option>
                  {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5 sm:w-44">
                <Label>Type de client</Label>
                <select
                  value={form.clientType}
                  onChange={(event) => patchForm({ clientType: event.target.value as QuoteEditorForm["clientType"] })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="particulier">Particulier</option>
                  <option value="pro">Professionnel</option>
                </select>
              </div>
            </div>

            {form.clientType === "pro" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Entreprise *</Label><Input value={form.companyName} onChange={(e) => patchForm({ companyName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>SIRET</Label><Input value={form.siret} onChange={(e) => patchForm({ siret: e.target.value })} /></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Prénom *</Label><Input value={form.firstName} onChange={(e) => patchForm({ firstName: e.target.value })} /></div>
                <div className="space-y-1.5"><Label>Nom *</Label><Input value={form.lastName} onChange={(e) => patchForm({ lastName: e.target.value })} /></div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Téléphone</Label><Input value={form.phone} onChange={(e) => patchForm({ phone: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Adresse du client</Label><Input value={form.address} onChange={(e) => patchForm({ address: e.target.value })} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Adresse du chantier</Label><Input value={form.serviceAddress} onChange={(e) => patchForm({ serviceAddress: e.target.value })} /></div>
            </div>
          </section>

          <LineSection
            title="Prestations"
            lines={form.items}
            products={products}
            onAdd={() => patchForm({ items: [...form.items, emptyLine()] })}
            onChange={(id, partial) => updateLine("items", id, partial)}
            onRemove={(id) => removeLine("items", id)}
          />
          <LineSection
            title="Options et ventes additionnelles"
            lines={form.upsells}
            products={products}
            onAdd={() => patchForm({ upsells: [...form.upsells, emptyLine()] })}
            onChange={(id, partial) => updateLine("upsells", id, partial)}
            onRemove={(id) => removeLine("upsells", id)}
          />

          <section className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-[180px_1fr] sm:items-end">
            <div className="space-y-1.5">
              <Label>TVA</Label>
              <select value={form.vatRate} onChange={(e) => patchForm({ vatRate: Number(e.target.value) })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {[0, 5.5, 10, 20].map((rate) => <option key={rate} value={rate}>{rate} %</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-2 text-right">
              <Total label="Total HT" value={totals.totalHT} />
              <Total label="TVA" value={totals.totalVAT} />
              <Total label="Total TTC" value={totals.totalTTC} strong />
            </div>
          </section>
          {error && <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t bg-background px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
          <Button type="button" onClick={submit}><Save className="mr-2 h-4 w-4" />Enregistrer les modifications</Button>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function LineSection({ title, lines, products, onAdd, onChange, onRemove }: {
  title: string;
  lines: QuoteItem[];
  products: Product[];
  onAdd: () => void;
  onChange: (id: string, partial: Partial<QuoteItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}><Plus className="mr-1.5 h-3.5 w-3.5" />Ajouter</Button>
      </div>
      <datalist id="quote-editor-products">{products.map((product) => <option key={product.id} value={product.label.fr} />)}</datalist>
      {lines.length === 0 ? (
        <p className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">Aucune option ajoutée.</p>
      ) : lines.map((line) => (
        <div key={line.id} className="grid grid-cols-[1fr_68px_92px_36px] gap-2 rounded-lg bg-muted/30 p-2 sm:grid-cols-[1fr_100px_140px_40px]">
          <Input list="quote-editor-products" aria-label="Désignation" value={line.label} placeholder="Désignation" onChange={(e) => onChange(line.id, { label: e.target.value })} />
          <Input aria-label="Quantité" type="number" min="0.01" step="0.01" value={line.qty} onChange={(e) => onChange(line.id, { qty: e.target.value })} />
          <Input aria-label="Prix HT" type="number" min="0" step="0.01" value={line.priceHT} onChange={(e) => onChange(line.id, { priceHT: e.target.value })} />
          <Button type="button" variant="ghost" size="icon" aria-label="Supprimer la ligne" onClick={() => onRemove(line.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
        </div>
      ))}
    </section>
  );
}

function Total({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return <div><p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p><p className={strong ? "text-lg font-bold text-primary" : "font-semibold"}>{value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}</p></div>;
}
