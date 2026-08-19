import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, ClientType, QuoteItem, Upsell, Quote, Invoice } from "@/lib/data-context";
import { InvoiceStatus } from "@/lib/demo-data";
import { exportQuotePdf, generateQuotePdfBase64, quoteToDocumentData, companyToDocCompany } from "@/lib/pdf-export";
import { DocumentTemplate } from "@/components/DocumentTemplate";
import { generateQuoteEmailHtml } from "@/lib/email-templates";
import { getMyOrgId } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { searchCompanyBySiret } from "@/lib/siret";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  Send,
  PenLine,
  ReceiptEuro,
  X,
  Link,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Link as RouterLink } from "@tanstack/react-router";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScaledDocument } from "@/components/ScaledDocument";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  calculateInvoiceTotals,
  selectInvoiceLines,
  invoiceLinesFromQuote,
  type InvoiceLine,
} from "@/lib/invoice-from-quote";
import { AIQuoteWidget, AIQuoteResultItem } from "@/components/AIQuoteWidget";
import { Sparkles, Bot, FileText, Clock } from "lucide-react";

function AutocompleteInput({
  value,
  onChange,
  onSelectOption,
  options,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  onSelectOption: (val: string, priceHT: number | string, productId?: string) => void;
  options: { id: string; label: string; priceHT: number | string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const filtered = options.filter((o) => o.label.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div ref={wrapperRef}>
          <Input
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (filtered.length > 0) setOpen(true);
            }}
            placeholder={placeholder}
            required
          />
        </div>
      </PopoverTrigger>
      {filtered.length > 0 && (
        <PopoverContent
          className="p-0"
          style={{ width: wrapperRef.current?.offsetWidth }}
          align="start"
          onOpenAutoFocus={(e) => e.preventDefault()}
          onWheelCapture={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandList>
              <CommandGroup>
                {filtered.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={opt.label}
                    onSelect={() => {
                      setInputValue(opt.label);
                      onChange(opt.label);
                      onSelectOption(opt.label, opt.priceHT, opt.id);
                      setOpen(false);
                    }}
                  >
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}

// invoiceLinesFromQuote est importée depuis @/lib/invoice-from-quote (version canonique partagée)

export const Route = createFileRoute("/devis")({
  head: () => ({
    meta: [
      { title: "Devis interactifs — ClearQuote" },
      {
        name: "description",
        content:
          "Propositions web avec options à cocher, volume ajustable, acomptes et signature en ligne.",
      },
      { property: "og:title", content: "Devis interactifs — ClearQuote" },
      {
        property: "og:description",
        content: "Simulateur d'upsell et suivi des propositions envoyées.",
      },
    ],
  }),
  component: Quotes,
});

const BASE = 12000;
const PER_PAGE = 450;

import { ErrorBoundary } from "@/lib/ErrorBoundary";
import { canEditQuote } from "@/lib/document-workflow";
import { UpgradeModal } from "@/components/UpgradeModal";

function Quotes() {
  return (
    <ErrorBoundary>
      <QuotesInner />
    </ErrorBoundary>
  );
}

function QuotesInner() {
  const { t, tv, money, date, lang } = useI18n();
  const {
    quotes,
    addQuote,
    updateQuote,
    deleteQuote,
    upsells,
    addUpsell,
    invoices,
    addInvoice,
    company,
    updateCompany,
    products,
    clients,
    addClient,
    profile,
  } = useData();
  const [exporting, setExporting] = useState<string | null>(null);

  // Preview Quote State
  const [previewQuote, setPreviewQuote] = useState<Quote | null>(null);

  // Convert to Invoice State
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
  const [selectedInvoiceLineIds, setSelectedInvoiceLineIds] = useState<Set<string>>(new Set());
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  // Email Quote State
  const [emailQuote, setEmailQuote] = useState<Quote | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailTemplateId, setEmailTemplateId] = useState<string>("modele-1");
  const [sendToEmail, setSendToEmail] = useState<string>("");

  const openEmailDialog = (q: Quote) => {
    // Try to resolve client email: from the quote itself, then from the clients list
    const resolved =
      q.clientEmail ||
      clients.find((c) => c.id === q.clientId)?.email ||
      clients.find((c) => c.name.toLowerCase() === q.client.toLowerCase())?.email ||
      "";
    setSendToEmail(resolved);
    setEmailQuote(q);
  };

  const todayStr = new Date().toISOString().split("T")[0] ?? "";
  const dueDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + (company.paymentTermsDays || 30));
    return d.toISOString().split("T")[0] ?? "";
  })();
  const [invoiceDate, setInvoiceDate] = useState(todayStr);
  const [invoiceDueDate, setInvoiceDueDate] = useState(dueDateStr);
  const [invoiceNote, setInvoiceNote] = useState("");

  const conversionLines = convertingQuote ? invoiceLinesFromQuote(convertingQuote) : [];
  const invoicedConversionLineIds = new Set(convertingQuote?.invoicedLineIds ?? []);
  const selectedConversionLines = selectInvoiceLines(conversionLines, selectedInvoiceLineIds);
  const conversionTotals = calculateInvoiceTotals(selectedConversionLines);

  useEffect(() => {
    if (!convertingQuote) {
      setSelectedInvoiceLineIds(new Set());
      return;
    }
    const alreadyInvoiced = new Set(convertingQuote.invoicedLineIds ?? []);
    setSelectedInvoiceLineIds(
      new Set(invoiceLinesFromQuote(convertingQuote).filter((line) => !alreadyInvoiced.has(line.id)).map((line) => line.id)),
    );
  }, [convertingQuote]);

  const toggleInvoiceLine = (lineId: string) => {
    if (invoicedConversionLineIds.has(lineId)) return;
    setSelectedInvoiceLineIds((current) => {
      const next = new Set(current);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const handleConvertToInvoice = (status: InvoiceStatus = "draft") => {
    if (!convertingQuote || selectedConversionLines.length === 0) return;
    const num = company.nextInvoiceNumber || 1;
    const year = new Date().getFullYear();
    const pad = String(num).padStart(4, "0");
    const invoiceNumber = `${company.invoicePrefix || "FA"}-${year}-${pad}`;

    const newInvoice: Invoice = {
      number: invoiceNumber,
      client: convertingQuote.client,
      ...(convertingQuote.clientId ? { clientId: convertingQuote.clientId } : {}),
      date: invoiceDate,
      due: invoiceDueDate,
      amount: conversionTotals.totalTTC,
      totalHT: conversionTotals.totalHT,
      totalVAT: conversionTotals.totalTVA,
      status,
      ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}),
      sourceQuoteNumber: convertingQuote.number,
      items: selectedConversionLines,
    };

    addInvoice(newInvoice);
    updateCompany({ nextInvoiceNumber: num + 1 });
    const nextInvoicedLineIds = Array.from(
      new Set([...(convertingQuote.invoicedLineIds ?? []), ...selectedConversionLines.map((line) => line.id)]),
    );
    updateQuote(convertingQuote.number, {
      ...convertingQuote,
      invoicedLineIds: nextInvoicedLineIds,
      status: { fr: "Facturé", en: "Invoiced" },
    });

    setConvertSuccess(invoiceNumber);
    setConvertingQuote(null);
    setInvoiceDate(todayStr);
    setInvoiceDueDate(dueDateStr);
    setInvoiceNote("");
  };

  // Builder state (Simulateur Rapide)
  const defaultSimulatorProduct = products[0];
  const [simulatorProductId, setSimulatorProductId] = useState<string>(
    defaultSimulatorProduct?.id || "",
  );
  const [simulatorUpsells, setSimulatorUpsells] = useState<string[]>([]);
  const simulatorQty = 1;

  const simulatorProduct =
    products.find((p) => p.id === simulatorProductId) || defaultSimulatorProduct;
  const simBasePrice = Number(simulatorProduct?.priceHT || 0);

  const simAvailableUpsells = simulatorProduct?.upsells || [];
  const simAddonsTotal = simAvailableUpsells
    .filter((a) => simulatorUpsells.includes(a.id))
    .reduce((s, a) => s + Number(a.priceHT || 0), 0);

  const ht = simBasePrice * simulatorQty + simAddonsTotal;
  const vat = ht * 0.2;

  // New Quote Full Form State
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Empêcher la perte de données si on change de page par erreur
  useBlocker({
    shouldBlockFn: () => {
      if (isQuoteOpen) {
        return !window.confirm("Vous êtes en train de créer un devis. Voulez-vous vraiment quitter cette page et perdre vos données ?");
      }
      return false;
    },
    enableBeforeUnload: () => isQuoteOpen,
  });
  const [isAIWidgetOpen, setIsAIWidgetOpen] = useState(false);
  const [clientType, setClientType] = useState<ClientType>("pro");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [siret, setSiret] = useState("");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceAddress, setServiceAddress] = useState("");
  const [vatRate, setVatRate] = useState<number>(20);
  const [isFetchingSiret, setIsFetchingSiret] = useState(false);

  const handleSiretLookup = async (s: string) => {
    const clean = s.replace(/\D/g, "");
    if (clean.length !== 14) return;
    setIsFetchingSiret(true);
    try {
      const data = await searchCompanyBySiret(clean);
      if (data) {
        if (data.name) setCompanyName(data.name);
        const addr = [data.address, data.postalCode, data.city].filter(Boolean).join(", ");
        if (addr) setAddress(addr);
      }
    } finally {
      setIsFetchingSiret(false);
    }
  };

  // Client selector from carnet d'adresses
  const [clientSearch, setClientSearch] = useState("");
  const [showClientList, setShowClientList] = useState(false);
  const filteredClients = clients.filter(
    (c) =>
      (c.name || `${c.firstName || ""} ${c.lastName || ""}`.trim())
        .toLowerCase()
        .includes(clientSearch.toLowerCase()) ||
      (c.companyName || "").toLowerCase().includes(clientSearch.toLowerCase()),
  );
  const handleSelectExistingClient = (c: (typeof clients)[0]) => {
    setClientType(c.type);
    setFirstName(c.firstName || "");
    setLastName(c.lastName || c.name || "");
    setCompanyName(c.companyName || "");
    setSiret(c.siret || "");
    setAddress(c.address || "");
    setPostalCode(c.postalCode || "");
    setCity(c.city || "");
    setEmail(c.email || "");
    setPhone(c.phone || "");
    setClientSearch("");
    setShowClientList(false);
  };

  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([
    { id: "1", label: "", qty: 1, priceHT: "" },
  ]);
  const [quoteUpsells, setQuoteUpsells] = useState<QuoteItem[]>([]);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Ouverture depuis le Pipeline : le devis est chargé dans le même formulaire.
  useEffect(() => {
    const quoteNumber = new URLSearchParams(window.location.search).get("modifier");
    if (!quoteNumber) return;
    const quote = quotes.find((item) => item.number === quoteNumber);
    if (!quote || !canEditQuote(quote.status.fr)) return;
    const saved = quote.details;
    const knownClient = clients.find((client) => client.name.toLowerCase() === quote.client.toLowerCase());
    const type = saved?.clientType ?? knownClient?.type ?? "pro";
    const nameParts = quote.client.trim().split(/\s+/);

    setEditingQuote(quote);
    setClientType(type);
    setFirstName(saved?.firstName || knownClient?.firstName || nameParts[0] || "Client");
    setLastName(saved?.lastName || knownClient?.lastName || nameParts.slice(1).join(" ") || quote.client);
    setCompanyName(saved?.companyName || knownClient?.companyName || (type === "pro" ? quote.client : ""));
    setSiret(saved?.siret || knownClient?.siret || "");
    setAddress(saved?.address || knownClient?.address || "");
    setPostalCode(saved?.postalCode || knownClient?.postalCode || "");
    setCity(saved?.city || knownClient?.city || "");
    setEmail(saved?.email || knownClient?.email || "");
    setPhone(saved?.phone || knownClient?.phone || "");
    setServiceAddress(saved?.serviceAddress || saved?.address || knownClient?.address || "");
    setVatRate(saved?.vatRate ?? 20);
    setQuoteItems(saved?.items?.length ? saved.items : [{ id: "1", label: `Prestation du devis ${quote.number}`, qty: 1, priceHT: quote.amount / 1.2 }]);
    setQuoteUpsells(saved?.upsells ?? []);
    setIsQuoteOpen(true);
    window.history.replaceState({}, "", "/devis");
  }, [quotes, clients]);

  const addQuoteUpsell = () => {
    setQuoteUpsells([
      ...quoteUpsells,
      { id: Math.random().toString(), label: "", qty: 1, priceHT: 0 },
    ]);
  };

  const removeQuoteUpsell = (id: string) => {
    setQuoteUpsells(quoteUpsells.filter((item) => item.id !== id));
  };

  const addQuoteItem = () => {
    setQuoteItems([...quoteItems, { id: Math.random().toString(), label: "", qty: 1, priceHT: 0 }]);
  };

  const removeQuoteItem = (id: string) => {
    setQuoteItems(quoteItems.filter((item) => item.id !== id));
  };

  const updateQuoteItem = (id: string, field: keyof QuoteItem, value: string | number) => {
    setQuoteItems(
      quoteItems.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Si on met à jour le label, on vérifie si ça correspond à un produit du catalogue
          if (field === "label") {
            const matchedProduct = products.find((p) => tv(p.label) === value);
            if (matchedProduct) {
              updated.priceHT = matchedProduct.priceHT;
              updated.productId = matchedProduct.id;
            } else {
              delete updated.productId; // Saisie libre
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const updateQuoteUpsell = (id: string, field: keyof QuoteItem, value: string | number) => {
    setQuoteUpsells(
      quoteUpsells.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "label") {
            const matchedUpsell = availableUpsells.find((u) => u.label === value);
            if (matchedUpsell) {
              updated.priceHT = matchedUpsell.priceHT;
            }
          }
          return updated;
        }
        return item;
      }),
    );
  };

  const handleApplyAIQuote = (items: AIQuoteResultItem[], upsells: AIQuoteResultItem[]) => {
    // Replace current items if they are just the default empty item
    if (quoteItems.length === 1 && !quoteItems[0]?.label) {
      setQuoteItems(items);
    } else {
      setQuoteItems([...quoteItems, ...items]);
    }

    if (upsells.length > 0) {
      setQuoteUpsells([...quoteUpsells, ...upsells]);
    }
  };

  // Compute available upsells based on selected products
  const availableUpsells = products
    .filter((p) => quoteItems.some((qi) => qi.productId === p.id))
    .flatMap((p) => p.upsells || []);

  const catalogOptions = products.map((p) => ({
    id: p.id,
    label: tv(p.label),
    priceHT: p.priceHT,
  }));

  const upsellOptions = availableUpsells.map((u) => ({
    id: u.id,
    label: u.label,
    priceHT: u.priceHT,
  }));

  // Live totals calculation
  const formTotalHT =
    quoteItems.reduce((acc, item) => acc + Number(item.priceHT || 0) * Number(item.qty || 0), 0) +
    quoteUpsells.reduce((acc, item) => acc + Number(item.priceHT || 0) * Number(item.qty || 0), 0);
  const formTotalVat = formTotalHT * (vatRate / 100);
  const formTotalTTC = formTotalHT + formTotalVat;

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lastName || !firstName) return;
    if (clientType === "pro" && !companyName) return;

    const displayName = clientType === "pro" ? companyName : `${firstName} ${lastName}`;
    const existingClient = clients.find((client) => client.name.toLowerCase() === displayName.toLowerCase());
    const clientId = existingClient?.id ?? crypto.randomUUID();

    const qNum = company.nextQuoteNumber || 1;
    const qYear = new Date().getFullYear();
    const qPad = String(qNum).padStart(4, "0");
    const quoteNumber = editingQuote?.number ?? `${company.quotePrefix || "DV"}-${qYear}-${qPad}`;

    const newQuote: Quote = {
      number: quoteNumber,
      client: displayName,
      clientId,
      amount: formTotalTTC,
      status: { fr: "Brouillon", en: "Draft" },
      date: editingQuote?.date ?? new Date().toISOString().split("T")[0] ?? "",
      ...(editingQuote?.invoicedLineIds ? { invoicedLineIds: editingQuote.invoicedLineIds } : {}),
      // Toujours conserver le publicToken existant lors d'une édition —
      // sinon updateQuote l'écrase dans Supabase et le lien portail client
      // cesse de fonctionner.
      ...(editingQuote?.publicToken ? { publicToken: editingQuote.publicToken } : {}),
      details: {
        clientType,
        lastName,
        firstName,
        companyName,
        siret,
        address,
        postalCode,
        city,
        email,
        phone,
        serviceAddress,
        items: quoteItems,
        upsells: quoteUpsells,
        vatRate,
        totalHT: formTotalHT,
        totalTTC: formTotalTTC,
      },
    };

    // Auto-save client if not already in address book
    if (displayName) {
      if (!existingClient) {
        addClient({
          id: clientId,
          type: clientType,
          name: displayName,
          companyName: clientType === "pro" ? companyName : "",
          firstName: clientType === "particulier" ? firstName : "",
          lastName: clientType === "particulier" ? lastName : "",
          siret,
          address,
          postalCode,
          city,
          phone,
          email,
          createdAt: new Date().toISOString().split("T")[0] ?? "",
        });
      }
    }

    if (editingQuote) updateQuote(editingQuote.number, newQuote);
    else {
      addQuote(newQuote);
      updateCompany({ nextQuoteNumber: qNum + 1 });
    }
    setPreviewQuote(newQuote);

    // Reset Form
    setClientType("pro");
    setLastName("");
    setFirstName("");
    setCompanyName("");
    setSiret("");
    setAddress("");
    setPostalCode("");
    setCity("");
    setEmail("");
    setPhone("");
    setServiceAddress("");
    setClientSearch("");
    setShowClientList(false);
    setVatRate(20);
    setQuoteItems([{ id: "1", label: "Prestation principale", qty: 1, priceHT: 1500 }]);
    setQuoteUpsells([]);
    setEditingQuote(null);
    setIsQuoteOpen(false);
  };

  const isCompanyIncomplete = !company.name || !company.siret;

  return (
    <>
      {/* ─── Bannière profil incomplet ────────────────────────────────────── */}
      {isCompanyIncomplete && (
        <RouterLink to="/parametres">
          <div className="mx-4 mb-2 mt-3 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 cursor-pointer hover:bg-amber-100 transition-colors dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>
              <strong>Votre profil d'entreprise est incomplet.</strong>{" "}
              Ajoutez votre nom, SIRET et adresse dans{" "}
              <span className="underline font-medium">Paramètres</span>{" "}
              pour que vos devis soient légalement valides.
            </span>
          </div>
        </RouterLink>
      )}
      <PageHeader
        title={t("quotes.title")}
        subtitle={t("quotes.subtitle")}
        action={
          <>
            <Button onClick={() => {
              const plan = profile?.plan_tier || "solo";
              if (plan === "solo") {
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                // FIX BUG SECONDAIRE : utiliser issue_date (champ DB Supabase) au lieu de date (ancien champ local)
                const quotesThisMonth = quotes.filter(q => {
                  const d = new Date(q.issue_date);
                  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                });
                if (quotesThisMonth.length >= 3) {
                  setIsUpgradeModalOpen(true);
                  return;
                }
              }
              setEditingQuote(null);
              setIsQuoteOpen(true);
            }}>
              Nouveau Devis Complet
            </Button>
            <Sheet open={isQuoteOpen} onOpenChange={setIsQuoteOpen}>
              <SheetContent className="sm:max-w-2xl w-[90vw] p-0 flex flex-col">
              <SheetHeader className="p-6 pb-2 border-b">
                <SheetTitle>{editingQuote ? `Modifier le devis ${editingQuote.number}` : "Créer un devis détaillé"}</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 p-6">
                <form id="quote-form" onSubmit={handleCreateQuote} className="space-y-8">
                  {/* Client Section */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      1. Client
                    </h3>

                    {/* Sélecteur depuis le carnet d'adresses */}
                    {clients.length > 0 && (
                      <div className="relative">
                        <Label className="text-xs text-muted-foreground">
                          Chercher dans le carnet d'adresses
                        </Label>
                        <Input
                          placeholder="Rechercher un client existant..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setShowClientList(true);
                          }}
                          onFocus={() => setShowClientList(true)}
                          className="mt-1"
                        />
                        {showClientList && clientSearch && filteredClients.length > 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg max-h-48 overflow-y-auto">
                            {filteredClients.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex flex-col gap-0.5"
                                onClick={() => handleSelectExistingClient(c)}
                              >
                                <span className="font-medium">
                                  {c.companyName || c.name || `${c.firstName} ${c.lastName}`}
                                </span>
                                {c.companyName && (
                                  <span className="text-xs text-muted-foreground">
                                    {c.firstName} {c.lastName}
                                  </span>
                                )}
                                {c.city && (
                                  <span className="text-xs text-muted-foreground">{c.city}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                        {showClientList && clientSearch && filteredClients.length === 0 && (
                          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg p-3 text-sm text-muted-foreground">
                            Aucun client trouvé — remplissez le formulaire ci-dessous.
                          </div>
                        )}
                      </div>
                    )}

                    <RadioGroup
                      value={clientType}
                      onValueChange={(val) => setClientType(val as ClientType)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pro" id="pro" />
                        <Label htmlFor="pro" className="cursor-pointer">
                          Professionnel
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="particulier" id="particulier" />
                        <Label htmlFor="particulier" className="cursor-pointer">
                          Particulier
                        </Label>
                      </div>
                    </RadioGroup>

                    {clientType === "pro" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nom de la Société *</Label>
                          <Input
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Numéro SIRET</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              value={siret}
                              onChange={(e) => setSiret(e.target.value.replace(/\D/g, "").slice(0, 14))}
                              maxLength={14}
                              className="font-mono flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={!siret || siret.length !== 14 || isFetchingSiret}
                              onClick={() => handleSiretLookup(siret)}
                            >
                              {isFetchingSiret ? <Search className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Prénom du contact *</Label>
                        <Input
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Nom du contact *</Label>
                        <Input
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Adresse de facturation</Label>
                      <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Code postal</Label>
                        <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Ville</Label>
                        <Input value={city} onChange={(e) => setCity(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                    </div>
                  </section>

                  {/* Prestation Section */}
                  <section className="space-y-4">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      2. Prestation
                    </h3>
                    <div className="space-y-2">
                      <Label>Adresse de la prestation (si différente)</Label>
                      <Input
                        value={serviceAddress}
                        onChange={(e) => setServiceAddress(e.target.value)}
                      />
                    </div>
                  </section>

                  {/* Lignes Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        3. Lignes du Devis
                      </h3>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200"
                          onClick={() => setIsAIWidgetOpen(true)}
                        >
                          <Sparkles className="h-4 w-4 mr-2" />
                          Générer avec l'IA
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={addQuoteItem}>
                          <Plus className="h-4 w-4 mr-1" /> Ajouter une ligne
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {quoteItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-3 items-start border p-3 rounded-lg bg-surface"
                        >
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Prestation / Option</Label>
                            <AutocompleteInput
                              value={item.label}
                              onChange={(val) => updateQuoteItem(item.id, "label", val)}
                              onSelectOption={(val, priceHT, productId) => {
                                setQuoteItems((prev) =>
                                  prev.map((qi) =>
                                    qi.id === item.id
                                      ? {
                                          ...qi,
                                          label: val,
                                          priceHT,
                                          ...(productId ? { productId } : {}),
                                        }
                                      : qi,
                                  ),
                                );
                              }}
                              options={catalogOptions}
                              placeholder="Sélectionnez ou tapez..."
                            />
                          </div>
                          <div className="w-20 space-y-1">
                            <Label className="text-xs">Qté</Label>
                            <Input
                              type="number"
                              min="1"
                              required
                              value={item.qty}
                              onChange={(e) =>
                                updateQuoteItem(
                                  item.id,
                                  "qty",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="w-28 space-y-1">
                            <Label className="text-xs">Unité</Label>
                            <Select
                              value={item.unit || "u"}
                              onValueChange={(v) => updateQuoteItem(item.id, "unit", v)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Unité" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="u">u (Unité)</SelectItem>
                                <SelectItem value="pce">pce (Pièce)</SelectItem>
                                <SelectItem value="h">h (Heure)</SelectItem>
                                <SelectItem value="j">j (Jour)</SelectItem>
                                <SelectItem value="m²">m² (M. carré)</SelectItem>
                                <SelectItem value="m">m (Mètre)</SelectItem>
                                <SelectItem value="ml">ml (M. lin.)</SelectItem>
                                <SelectItem value="forfait">Forfait</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Prix HT</Label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={item.priceHT}
                              onChange={(e) =>
                                updateQuoteItem(
                                  item.id,
                                  "priceHT",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-5 text-destructive"
                            onClick={() => removeQuoteItem(item.id)}
                            disabled={quoteItems.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* Upsells Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                        Options Supplémentaires (Upsells)
                      </h3>
                      <Button type="button" variant="outline" size="sm" onClick={addQuoteUpsell}>
                        <Plus className="h-4 w-4 mr-1" /> Ajouter option
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {quoteUpsells.length === 0 && (
                        <p className="text-xs text-muted-foreground italic">
                          Aucune option (upsell) ajoutée à ce devis.
                        </p>
                      )}
                      {quoteUpsells.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex gap-3 items-start border p-3 rounded-lg bg-surface/50 border-primary/20"
                        >
                          <div className="flex-1 space-y-1">
                            <Label className="text-xs">Nom de l'option</Label>
                            <AutocompleteInput
                              value={item.label}
                              onChange={(val) => updateQuoteUpsell(item.id, "label", val)}
                              onSelectOption={(val, priceHT) => {
                                setQuoteUpsells((prev) =>
                                  prev.map((qu) =>
                                    qu.id === item.id ? { ...qu, label: val, priceHT } : qu,
                                  ),
                                );
                              }}
                              options={upsellOptions}
                              placeholder="Sélectionnez une option liée..."
                            />
                          </div>
                          <div className="w-24 space-y-1">
                            <Label className="text-xs">Qté</Label>
                            <Input
                              type="number"
                              min="1"
                              required
                              value={item.qty}
                              onChange={(e) =>
                                updateQuoteUpsell(
                                  item.id,
                                  "qty",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <div className="w-32 space-y-1">
                            <Label className="text-xs">Prix HT</Label>
                            <Input
                              type="number"
                              min="0"
                              required
                              value={item.priceHT}
                              onChange={(e) =>
                                updateQuoteUpsell(
                                  item.id,
                                  "priceHT",
                                  e.target.value === "" ? "" : Number(e.target.value),
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-5 text-destructive"
                            onClick={() => removeQuoteUpsell(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </section>

                  {/* TVA & Totaux Section */}
                  <section className="space-y-4 bg-muted/30 p-4 rounded-lg">
                    <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
                      4. TVA & Totaux
                    </h3>

                    <div className="flex items-center justify-between">
                      <Label>Taux de TVA (%)</Label>
                      <Select
                        value={vatRate.toString()}
                        onValueChange={(v) => setVatRate(Number(v))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue placeholder="TVA" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="20">20 %</SelectItem>
                          <SelectItem value="10">10 %</SelectItem>
                          <SelectItem value="5.5">5.5 %</SelectItem>
                          <SelectItem value="0">0 %</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total HT</span>
                        <span className="font-medium">{money(formTotalHT)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">TVA ({vatRate}%)</span>
                        <span className="font-medium">{money(formTotalVat)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total TTC</span>
                        <span className="text-primary">{money(formTotalTTC)}</span>
                      </div>
                    </div>
                  </section>
                </form>
              </ScrollArea>

              <SheetFooter className="p-6 border-t mt-auto">
                <Button variant="outline" onClick={() => setIsQuoteOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" form="quote-form">
                  {editingQuote ? "Enregistrer les modifications" : "Enregistrer le devis"}
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </>
      }
    />

    <UpgradeModal
      isOpen={isUpgradeModalOpen}
      onClose={() => setIsUpgradeModalOpen(false)}
      title="Limite de devis atteinte"
      description="Le forfait Solo est limité à 3 devis par mois. Passez au forfait Pro pour créer des devis en illimité."
      requiredPlan="pro"
    />

      <AIQuoteWidget
        products={products}
        isOpen={isAIWidgetOpen}
        onClose={() => setIsAIWidgetOpen(false)}
        onApply={handleApplyAIQuote}
      />

      {/* ── AI Hero Card ───────────────────────────────────────────── */}
      <div
        className="card-revenue relative mb-6 cursor-pointer overflow-hidden rounded-xl p-6 transition-all hover:opacity-95 active:scale-[0.995]"
        onClick={() => setIsAIWidgetOpen(true)}
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-8 -top-8 opacity-[0.06]">
          <Bot className="h-48 w-48" />
        </div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/25" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Left */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-lg shadow-black/20 lg:h-11 lg:w-11">
              <Sparkles className="h-4 w-4 text-white lg:h-5 lg:w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">Nouveau</p>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white/90">IA</span>
              </div>
              <h2 className="mt-0.5 font-display text-lg font-bold text-white lg:text-xl">
                Créer un devis avec l'IA
              </h2>
              <p className="mt-1 text-xs text-white/60 lg:text-[13px]">
                Décrivez le projet en quelques mots — l'IA génère les lignes, quantités et tarifs.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 lg:mt-3 lg:gap-2">
                {[
                  { icon: Clock, label: "3 secondes" },
                  { icon: FileText, label: "Éditables" },
                  { icon: Sparkles, label: "Prix auto" },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/75">
                    <Icon className="h-3 w-3" />{label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-[var(--shape-control)] border-2 border-white bg-white/15 px-5 text-sm font-bold text-white shadow-[4px_4px_0_rgba(255,255,255,0.35)] backdrop-blur-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-white/25 hover:shadow-[2px_2px_0_rgba(255,255,255,0.35)] lg:w-auto lg:shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setIsAIWidgetOpen(true);
            }}
          >
            <Sparkles className="h-4 w-4" />
            Générer maintenant
          </button>
        </div>
      </div>

      {/* Le reste de la page reste le simulateur rapide pour avoir une vue catalogue rapide */}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="card-elevated p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("quotes.builder")} (Simulateur Rapide)</h2>
          </div>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label>Prestation de base</Label>
              <Select
                value={simulatorProductId}
                onValueChange={(val) => {
                  setSimulatorProductId(val);
                  setSimulatorUpsells([]); // Reset upsells when product changes
                }}
              >
                <SelectTrigger className="w-full bg-surface">
                  <SelectValue placeholder="Sélectionnez une prestation" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {tv(p.label)} — {money(Number(p.priceHT || 0))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {simAvailableUpsells.length > 0 && (
            <>
              <p className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("quotes.options")}
              </p>
              <div className="mt-2 space-y-2">
                {simAvailableUpsells.map((a) => {
                  const on = simulatorUpsells.includes(a.id);
                  return (
                    <label
                      key={a.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                        on ? "border-primary bg-primary/5" : "border-border hover:bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={on}
                          onChange={() =>
                            setSimulatorUpsells((s) =>
                              on ? s.filter((x) => x !== a.id) : [...s, a.id],
                            )
                          }
                          className="h-4 w-4 accent-primary"
                        />
                        {a.label}
                      </span>
                      <span className="text-muted-foreground">
                        +{money(Number(a.priceHT || 0))}
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="card-elevated flex flex-col justify-between p-6 lg:col-span-2">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("quotes.total")}</span>
              <span className="font-medium">{money(ht)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("quotes.vat")}</span>
              <span className="font-medium">{money(vat)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-muted-foreground">{t("quotes.ttc")}</span>
              <span className="font-display text-2xl font-semibold">{money(ht + vat)}</span>
            </div>
          </div>
          <div className="mt-6 rounded-lg surface-navy p-4">
            <p className="text-xs opacity-70">{t("quotes.deposit")}</p>
            <p className="mt-1 font-display text-xl font-semibold">{money((ht + vat) * 0.3)}</p>
          </div>

          <div className="mt-6">
            <Button
              className="w-full"
              onClick={() => {
                if (!simulatorProduct) return;
                setQuoteItems([
                  {
                    id: Math.random().toString(),
                    label: tv(simulatorProduct.label),
                    qty: simulatorQty,
                    priceHT: simBasePrice,
                    productId: simulatorProduct.id,
                  },
                ]);
                const selectedUpsells = simAvailableUpsells.filter((a) =>
                  simulatorUpsells.includes(a.id),
                );
                setQuoteUpsells(
                  selectedUpsells.map((u) => ({
                    id: Math.random().toString(),
                    label: u.label,
                    qty: 1,
                    priceHT: u.priceHT,
                  })),
                );
                setIsQuoteOpen(true);
              }}
            >
              Créer ce devis
            </Button>
          </div>
        </div>
      </div>

      <div className="card-elevated mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-border bg-gradient-subtle px-5 py-4">
          <h2 className="text-sm font-bold">{t("quotes.list")}</h2>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {quotes.length}
          </span>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-border bg-muted/30 px-5 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground lg:grid-cols-[1fr_140px_120px_auto]">
          <span>Client / Référence</span>
          <span className="hidden lg:block">Statut</span>
          <span className="hidden text-right lg:block">Montant TTC</span>
          <span className="text-right">Actions</span>
        </div>

        <ul className="divide-y divide-border">
          {quotes.map((q) => (
            <li
              key={q.number}
              className="table-row-hover grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 lg:grid-cols-[1fr_140px_120px_auto]"
            >
              {/* Client + ref */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-bold text-primary">
                  {q.client.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{q.client}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {q.number} · {date(q.date)}
                  </p>
                  {q.emailsSent && q.emailsSent.length > 0 ? (
                    <div className="mt-1 space-y-0.5">
                      {q.emailsSent.map((s, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                          <span className="font-medium text-primary/80">{s.label}</span>
                          <span>→ {s.to}</span>
                          <span className="text-muted-foreground/60">· {date(s.date)}</span>
                        </p>
                      ))}
                    </div>
                  ) : q.sentAt ? (
                    <p className="mt-0.5 text-[11px] font-medium text-primary">Envoyé le {date(q.sentAt)}</p>
                  ) : null}
                </div>
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  "badge-status hidden lg:inline-flex",
                  q.status.fr === "Signé" &&
                    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
                  q.status.fr === "Facturé" && "bg-primary/8 text-primary ring-1 ring-primary/20",
                  q.status.fr === "Payé" && "bg-success/10 text-success ring-1 ring-success/25",
                  q.status.fr === "Envoyé" && "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
                  q.status.fr === "Vu" && "bg-orange-50 text-orange-700 ring-1 ring-orange-200",
                  q.status.fr === "Refusé" &&
                    "bg-destructive/8 text-destructive ring-1 ring-destructive/20",
                  q.status.fr === "Expiré" &&
                    "bg-warning/10 text-warning-foreground ring-1 ring-warning/25",
                  !["Signé", "Facturé", "Payé", "Envoyé", "Vu", "Refusé", "Expiré"].includes(
                    q.status.fr,
                  ) && "bg-secondary text-muted-foreground ring-1 ring-border",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    q.status.fr === "Signé" && "bg-emerald-500",
                    q.status.fr === "Facturé" && "bg-primary",
                    q.status.fr === "Payé" && "bg-success",
                    q.status.fr === "Envoyé" && "bg-blue-500",
                    q.status.fr === "Vu" && "bg-orange-500",
                    q.status.fr === "Refusé" && "bg-destructive",
                    q.status.fr === "Expiré" && "bg-warning",
                    !["Signé", "Facturé", "Payé", "Envoyé", "Vu", "Refusé", "Expiré"].includes(
                      q.status.fr,
                    ) && "bg-muted-foreground/50",
                  )}
                />
                {tv(q.status)}
              </span>

              {/* Amount */}
              <span className="hidden text-right font-display text-sm font-bold text-foreground lg:block">
                {money(q.amount)}
              </span>

              {/* Actions */}
              <div className="flex items-center justify-end gap-0.5">
                <button
                  title="Voir le devis"
                  onClick={() => setPreviewQuote(q)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Eye className="h-3.5 w-3.5" />
                </button>
                <button
                  title="Télécharger PDF + XML Factur-X"
                  disabled={exporting === q.number}
                  onClick={async () => {
                    setExporting(q.number);
                    await exportQuotePdf(q, company, profile?.plan_tier);
                    setExporting(null);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-40"
                >
                  <Download
                    className={cn("h-3.5 w-3.5", exporting === q.number && "animate-pulse")}
                  />
                </button>
                {q.status.fr !== "Signé" && q.status.fr !== "Facturé" && q.status.fr !== "Payé" && (
                  <>
                    <button
                      title="Copier le lien portail client"
                      onClick={() => {
                        const url = `${window.location.origin}/portail/${q.publicToken || q.number}`;
                        navigator.clipboard.writeText(url);
                        alert("Lien copié : " + url);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-[2px] text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      <Link className="h-3.5 w-3.5" />
                    </button>
                    <button
                      title="Envoyer par email"
                      onClick={() => openEmailDialog(q)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
                {(q.status.fr === "Signé" || q.status.fr === "Facturé") &&
                  invoiceLinesFromQuote(q).some((line) => !(q.invoicedLineIds ?? []).includes(line.id)) && (
                  <button
                    title="Convertir en facture"
                    onClick={() => {
                      setConvertingQuote(q);
                      setInvoiceDate(todayStr);
                      setInvoiceDueDate(dueDateStr);
                      setInvoiceNote("");
                    }}
                    className="flex h-8 items-center gap-1.5 rounded-[var(--shape-control)] border-2 border-navy bg-primary px-3 text-[11px] font-bold text-white shadow-offset-sm transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:bg-primary/90 hover:shadow-none"
                  >
                    <ReceiptEuro className="h-3.5 w-3.5" />
                    {lang === "fr" ? "Facturer" : "Invoice"}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bannière succès conversion */}
      {convertSuccess && (
        <div className="fixed bottom-6 right-6 z-50 flex items-start gap-3 rounded-xl border border-success/40 bg-success/10 px-5 py-4 shadow-lg backdrop-blur">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success-foreground">
              {lang === "fr" ? "Facture créée !" : "Invoice created!"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {convertSuccess} —{" "}
              {lang === "fr" ? "visible dans l'onglet Factures" : "visible in the Invoices tab"}
            </p>
          </div>
          <button
            onClick={() => setConvertSuccess(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Dialog Convertir en Facture */}
      <Dialog open={!!convertingQuote} onOpenChange={(open) => !open && setConvertingQuote(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ReceiptEuro className="h-5 w-5 text-primary" />
              {lang === "fr" ? "Convertir en facture" : "Convert to invoice"}
            </DialogTitle>
          </DialogHeader>

          {convertingQuote && (
            <div className="space-y-5 py-1">
              {/* Résumé du devis source */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
                <p className="font-medium">{convertingQuote.client}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {lang === "fr" ? "Source :" : "Source:"} {convertingQuote.number} ·{" "}
                  {money(convertingQuote.amount)} TTC
                </p>
                <p className="mt-2 text-xs font-medium text-primary">
                  Retirez les prestations ou options qui n'ont pas été réalisées. Le devis signé restera inchangé.
                </p>
              </div>

              <ScrollArea className="max-h-[38vh] rounded-lg border border-border">
                <div>
                  {(["prestation", "option"] as const).map((kind) => {
                    const sectionLines = conversionLines.filter((line) => line.kind === kind);
                    if (sectionLines.length === 0) return null;
                    return (
                      <div key={kind} className="border-b border-border last:border-b-0">
                        <div className="bg-muted/60 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                          {kind === "prestation" ? "Prestations" : "Options"}
                        </div>
                        <div className="divide-y divide-border">
                          {sectionLines.map((line) => {
                            const isInvoiced = invoicedConversionLineIds.has(line.id);
                            const isSelected = selectedInvoiceLineIds.has(line.id);
                            return (
                              <div
                                key={line.id}
                                className={cn(
                                  "flex items-center gap-3 px-4 py-3 transition-colors",
                                  isInvoiced ? "bg-emerald-50/70" : isSelected ? "bg-card" : "bg-muted/40",
                                )}
                              >
                                <div className="min-w-0 flex-1">
                                  <p className={cn("truncate text-sm font-medium", !isSelected && !isInvoiced && "text-muted-foreground line-through")}>
                                    {line.label}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {line.qty} × {money(line.priceHT)} HT · TVA {line.vatRate}%
                                  </p>
                                </div>
                                <span className="shrink-0 text-sm font-semibold tabular-nums">
                                  {money(line.qty * line.priceHT)}
                                </span>
                                {isInvoiced ? (
                                  <span className="min-w-20 rounded-md bg-emerald-100 px-2.5 py-1.5 text-center text-xs font-bold text-emerald-700">
                                    Facturé
                                  </span>
                                ) : (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant={isSelected ? "outline" : "secondary"}
                                    onClick={() => toggleInvoiceLine(line.id)}
                                    className={cn(
                                      "min-w-20",
                                      isSelected && "border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive",
                                    )}
                                  >
                                    {isSelected ? "Retirer" : "Ajouter"}
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* N° facture auto-généré */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {lang === "fr" ? "Numéro de facture généré" : "Generated invoice number"}
                </p>
                <p className="mt-1 font-mono font-semibold text-primary">
                  {company.invoicePrefix || "FA"}-{new Date().getFullYear()}-
                  {String(company.nextInvoiceNumber || 1).padStart(4, "0")}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    {lang === "fr" ? "Date d'émission" : "Issue date"}
                  </Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">
                    {lang === "fr" ? "Échéance" : "Due date"}
                    <span className="ml-1 text-xs text-muted-foreground">
                      ({company.paymentTermsDays || 30}j)
                    </span>
                  </Label>
                  <Input
                    type="date"
                    value={invoiceDueDate}
                    onChange={(e) => setInvoiceDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Total recap */}
              <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversionLines.length} ligne{selectedConversionLines.length > 1 ? "s" : ""} à facturer
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    HT {money(conversionTotals.totalHT)} · TVA {money(conversionTotals.totalTVA)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Montant TTC</p>
                  <span className="font-display text-lg font-bold text-primary">
                    {money(conversionTotals.totalTTC)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <Button variant="outline" onClick={() => setConvertingQuote(null)}>
                  {lang === "fr" ? "Annuler" : "Cancel"}
                </Button>
                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => handleConvertToInvoice("draft")}
                    disabled={selectedConversionLines.length === 0}
                    className="gap-2"
                  >
                    <ReceiptEuro className="h-4 w-4" />
                    {lang === "fr" ? "Enregistrer en brouillon" : "Save as draft"}
                  </Button>
                  <Button
                    onClick={() => handleConvertToInvoice("sent")}
                    disabled={selectedConversionLines.length === 0}
                    className="gap-2"
                  >
                    <Send className="h-4 w-4" />
                    {lang === "fr" ? `Créer et envoyer (${money(conversionTotals.totalTTC)})` : "Create and send"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={!!previewQuote} onOpenChange={(open) => !open && setPreviewQuote(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-4 border-b shrink-0">
            <DialogTitle>Aperçu du Devis {previewQuote?.number}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto bg-muted/20 custom-scrollbar">
            <div style={{ padding: "32px 16px" }}>
              {previewQuote && (
                <ScaledDocument>
                  <DocumentTemplate
                    doc={quoteToDocumentData(previewQuote)}
                    company={companyToDocCompany(company, profile?.plan_tier)}
                  />
                </ScaledDocument>
              )}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-3 p-4 border-t shrink-0 print:hidden">
            <Button variant="outline" onClick={() => setPreviewQuote(null)}>
              Fermer
            </Button>
            {previewQuote &&
              (previewQuote.status.fr === "Signé" || previewQuote.status.fr === "Facturé") &&
              invoiceLinesFromQuote(previewQuote).some((line) => !(previewQuote.invoicedLineIds ?? []).includes(line.id)) && (
              <Button
                className="bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  setConvertingQuote(previewQuote);
                  setInvoiceDate(todayStr);
                  setInvoiceDueDate(dueDateStr);
                  setInvoiceNote("");
                  setPreviewQuote(null);
                }}
              >
                <ReceiptEuro className="h-4 w-4 mr-2" />
                Convertir en facture
              </Button>
            )}
            {previewQuote &&
              previewQuote.status.fr !== "Signé" &&
              previewQuote.status.fr !== "Facturé" &&
              previewQuote.status.fr !== "Payé" && (
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    if (previewQuote) {
                      openEmailDialog(previewQuote);
                      setPreviewQuote(null);
                    }
                  }}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Envoyer par email
                </Button>
              )}
            <Button
              variant="outline"
              disabled={!!exporting}
              onClick={async () => {
                if (!previewQuote) return;
                setExporting(previewQuote.number);
                await exportQuotePdf(previewQuote, company, profile?.plan_tier);
                setExporting(null);
              }}
            >
              <Download className={cn("h-4 w-4 mr-2", exporting && "animate-pulse")} />
              {exporting ? "Génération…" : "PDF + XML Factur-X"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Envoi d'Email */}
      <Dialog open={!!emailQuote} onOpenChange={(open) => !open && setEmailQuote(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b bg-muted/30">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" />
              Envoyer par E-mail
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground mr-2">Modèle :</span>
              <Select value={emailTemplateId} onValueChange={setEmailTemplateId}>
                <SelectTrigger className="w-[200px] h-8 text-sm">
                  <SelectValue placeholder="Choisir un modèle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="modele-1">Modèle 1 - Devis Complet (A4)</SelectItem>
                  <SelectItem value="modele-relance">Relance automatique</SelectItem>
                  <SelectItem value="modele-merci">Remerciements</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 bg-slate-100 p-4 overflow-hidden relative">
            <div className="absolute inset-4 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="border-b px-4 py-2 bg-slate-50 flex gap-4 text-sm text-slate-600 items-center">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <strong className="shrink-0">À :</strong>
                  <input
                    type="email"
                    value={sendToEmail}
                    onChange={(e) => setSendToEmail(e.target.value)}
                    placeholder="email@client.fr"
                    className={`flex-1 min-w-0 rounded border px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      sendToEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sendToEmail)
                        ? "border-red-400 bg-red-50 text-red-700"
                        : "border-slate-200 bg-white"
                    }`}
                  />
                  {!sendToEmail && (
                    <span className="text-xs text-red-500 shrink-0">⚠ Email manquant</span>
                  )}
                </div>
                <div className="flex-1 shrink-0">
                  <strong>Sujet :</strong> Votre devis {emailQuote?.number} de{" "}
                  {company.name || "notre entreprise"}
                </div>
              </div>
              <iframe
                className="flex-1 w-full bg-white"
                srcDoc={
                  emailQuote ? generateQuoteEmailHtml(emailQuote, company, emailTemplateId) : ""
                }
                title="Prévisualisation de l'e-mail"
              />
            </div>
          </div>

          <div className="p-4 border-t flex justify-end gap-3 bg-white">
            <Button variant="outline" onClick={() => setEmailQuote(null)}>
              Annuler
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isSendingEmail}
              onClick={async () => {
                if (!emailQuote) return;

                // Validate email before anything else
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!sendToEmail || !emailRegex.test(sendToEmail)) {
                  alert(
                    sendToEmail
                      ? `L'adresse email "${sendToEmail}" n'est pas valide.\nCorrigez-la dans le champ "À :" ci-dessus.`
                      : `Aucun email renseigné pour ce client.\nSaisissez l'adresse email dans le champ "À :" ci-dessus, ou ajoutez-la dans la fiche client.`
                  );
                  return;
                }

                setIsSendingEmail(true);
                try {
                  // Garantit que le devis a un publicToken avant l'envoi.
                  // Peut manquer si le devis a été édité avant le correctif
                  // (bug : updateQuote écrasait le payload sans le token).
                  let quoteForEmail = emailQuote;
                  if (!quoteForEmail.publicToken) {
                    const newToken = crypto.randomUUID();
                    quoteForEmail = { ...emailQuote, publicToken: newToken };
                    updateQuote(emailQuote.number, quoteForEmail);
                  }

                  // 1. Generate PDF
                  const pdfBase64 = await generateQuotePdfBase64(quoteForEmail, company, profile?.plan_tier);
                  const currentOrgId = await getMyOrgId() || "";
                  const html = generateQuoteEmailHtml(quoteForEmail, company, emailTemplateId, window.location.origin, currentOrgId);

                  const artisanEmail = company?.email;

                  // 2. Send via API
                  const res = await fetch("/api/quotes/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      to: sendToEmail,
                      subject: `Votre devis ${quoteForEmail.number} de ${company.name || "notre entreprise"}`,
                      html,
                      pdfBase64,
                      pdfFilename: `Devis_${quoteForEmail.number}.pdf`,
                      artisanEmail: artisanEmail,
                    }),
                  });

                  const data = await res.json();

                  if (res.ok) {
                    const now = new Date().toISOString();
                    const isResend = !!quoteForEmail.sentAt;
                    const newSend = {
                      date: now,
                      to: sendToEmail,
                      label: emailTemplateId === "modele-relance"
                        ? "Relance"
                        : emailTemplateId === "modele-merci"
                        ? "Confirmation signature"
                        : isResend ? "Renvoi" : "Envoi initial",
                    };
                    updateQuote(quoteForEmail.number, {
                      ...quoteForEmail,
                      clientEmail: sendToEmail,
                      status: { fr: "Envoyé", en: "Sent" },
                      sentAt: quoteForEmail.sentAt || now,
                      emailsSent: [...(quoteForEmail.emailsSent || []), newSend],
                    });
                    setEmailQuote(null);
                  } else {
                    alert(`❌ Erreur lors de l'envoi :\n\n${data.message || res.statusText}`);
                  }
                } catch (err: any) {
                  alert(`❌ Erreur réseau :\n\n${err.message}`);
                } finally {
                  setIsSendingEmail(false);
                }
              }}
            >
              {isSendingEmail ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer le devis
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
