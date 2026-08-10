import type { Client, ClientType, Quote, QuoteItem } from "./data-context";

export type QuoteEditorForm = {
  clientId?: string;
  clientType: ClientType;
  firstName: string;
  lastName: string;
  companyName: string;
  siret: string;
  address: string;
  phone: string;
  serviceAddress: string;
  items: QuoteItem[];
  upsells: QuoteItem[];
  vatRate: number;
};

const cloneLines = (lines: QuoteItem[]) => lines.map((line) => ({ ...line }));
const round = (value: number) => Math.round(value * 100) / 100;

export function calculateEditorTotals(items: QuoteItem[], upsells: QuoteItem[], vatRate: number) {
  const totalHT = round(
    [...items, ...upsells].reduce(
      (sum, line) => sum + Number(line.qty || 0) * Number(line.priceHT || 0),
      0,
    ),
  );
  const totalVAT = round(totalHT * (vatRate / 100));
  return { totalHT, totalVAT, totalTTC: round(totalHT + totalVAT) };
}

export function quoteToEditorForm(quote: Quote, client?: Client): QuoteEditorForm {
  const saved = quote.details;
  const clientType = saved?.clientType ?? client?.type ?? "pro";
  const nameParts = quote.client.trim().split(/\s+/);
  const clientId = quote.clientId ?? client?.id;
  return {
    ...(clientId ? { clientId } : {}),
    clientType,
    firstName: saved?.firstName || client?.firstName || (clientType === "particulier" ? nameParts[0] ?? "" : ""),
    lastName: saved?.lastName || client?.lastName || (clientType === "particulier" ? nameParts.slice(1).join(" ") : ""),
    companyName: saved?.companyName || client?.companyName || (clientType === "pro" ? quote.client : ""),
    siret: saved?.siret || client?.siret || "",
    address: saved?.address || client?.address || "",
    phone: saved?.phone || client?.phone || "",
    serviceAddress: saved?.serviceAddress || saved?.address || client?.address || "",
    items: cloneLines(saved?.items?.length ? saved.items : [{ id: crypto.randomUUID(), label: `Prestation du devis ${quote.number}`, qty: 1, priceHT: quote.amount / 1.2 }]),
    upsells: cloneLines(saved?.upsells ?? []),
    vatRate: saved?.vatRate ?? 20,
  };
}

export function buildEditedQuote(original: Quote, form: QuoteEditorForm): Quote {
  const totals = calculateEditorTotals(form.items, form.upsells, form.vatRate);
  const displayName = form.clientType === "pro"
    ? form.companyName.trim()
    : `${form.firstName} ${form.lastName}`.trim();
  const clientId = form.clientId ?? original.clientId;

  return {
    ...original,
    client: displayName || original.client,
    ...(clientId ? { clientId } : {}),
    amount: totals.totalTTC,
    details: {
      clientType: form.clientType,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      companyName: form.companyName.trim(),
      siret: form.siret.trim(),
      address: form.address.trim(),
      phone: form.phone.trim(),
      serviceAddress: form.serviceAddress.trim(),
      items: cloneLines(form.items),
      upsells: cloneLines(form.upsells),
      vatRate: form.vatRate,
      totalHT: totals.totalHT,
      totalTTC: totals.totalTTC,
    },
  };
}
