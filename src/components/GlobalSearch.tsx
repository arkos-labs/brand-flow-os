import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useData } from "@/lib/data-context";
import { useI18n } from "@/lib/i18n";
import { FileText, ReceiptEuro, Users, Package } from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const navigate = useNavigate();
  const { quotes, invoices, clients, products } = useData();
  const { tv, money } = useI18n();
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Reset search when closed
  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  const handleSelect = (path: string) => {
    onOpenChange(false);
    navigate({ to: path });
  };

  const q = search.toLowerCase();

  // Filtrage réel selon le texte tapé (Bug 5 corrigé)
  const filteredQuotes = quotes.filter(
    (item) =>
      !q ||
      item.client.toLowerCase().includes(q) ||
      item.number.toLowerCase().includes(q) ||
      item.status.fr.toLowerCase().includes(q),
  );

  const filteredInvoices = invoices.filter(
    (item) =>
      !q ||
      item.client.toLowerCase().includes(q) ||
      item.number.toLowerCase().includes(q) ||
      item.status.toLowerCase().includes(q),
  );

  const filteredClients = clients.filter(
    (item) =>
      !q ||
      (item.name || "").toLowerCase().includes(q) ||
      (item.companyName || "").toLowerCase().includes(q) ||
      (`${item.firstName || ""} ${item.lastName || ""}`).toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q),
  );

  const filteredProducts = products.filter(
    (item) =>
      !q ||
      tv(item.label).toLowerCase().includes(q) ||
      (item.category || "").toLowerCase().includes(q),
  );

  const hasResults =
    filteredQuotes.length > 0 ||
    filteredInvoices.length > 0 ||
    filteredClients.length > 0 ||
    filteredProducts.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Rechercher un devis, facture, client, prestation..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        {!hasResults && <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>}

        {filteredQuotes.length > 0 && (
          <CommandGroup heading={`Devis (${filteredQuotes.length})`}>
            {filteredQuotes.slice(0, 6).map((q) => (
              <CommandItem
                key={q.number}
                onSelect={() => handleSelect("/devis")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{q.number}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-sm truncate flex-1">{q.client}</span>
                <span className="ml-auto font-medium text-xs text-muted-foreground shrink-0">
                  {money(q.amount)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredInvoices.length > 0 && (
          <CommandGroup heading={`Factures (${filteredInvoices.length})`}>
            {filteredInvoices.slice(0, 6).map((inv) => (
              <CommandItem
                key={inv.number}
                onSelect={() => handleSelect("/factures")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <ReceiptEuro className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium">{inv.number}</span>
                <span className="text-muted-foreground">—</span>
                <span className="text-sm truncate flex-1">{inv.client}</span>
                <span className="ml-auto font-medium text-xs text-muted-foreground shrink-0">
                  {money(inv.amount)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredClients.length > 0 && (
          <CommandGroup heading={`Clients (${filteredClients.length})`}>
            {filteredClients.slice(0, 6).map((c) => (
              <CommandItem
                key={c.id}
                onSelect={() => handleSelect("/clients")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{c.companyName || c.name || `${c.firstName} ${c.lastName}`}</span>
                {c.companyName && (
                  <span className="text-xs text-muted-foreground">{c.firstName} {c.lastName}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {filteredProducts.length > 0 && (
          <CommandGroup heading={`Catalogue (${filteredProducts.length})`}>
            {filteredProducts.slice(0, 6).map((p) => (
              <CommandItem
                key={p.id}
                onSelect={() => handleSelect("/catalogue")}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate flex-1">{tv(p.label)}</span>
                <span className="ml-auto font-medium text-xs text-muted-foreground shrink-0">
                  {money(Number(p.priceHT))}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
