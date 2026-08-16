export type InvoiceLine = {
  id: string;
  label: string;
  qty: number;
  priceHT: number;
  vatRate: number;
  unit?: string;
  kind?: "prestation" | "option";
};

/** Retourne true si le devis peut être converti en facture. */
export function isQuoteReadyToInvoice(status: string): boolean {
  return status === "Signé" || status === "Facturé" || status === "Payé";
}

export function selectInvoiceLines<T extends { id: string }>(lines: T[], selectedIds: Set<string>): T[] {
  return lines.filter((line) => selectedIds.has(line.id));
}

export function calculateInvoiceTotals(lines: InvoiceLine[]) {
  const totalHT = lines.reduce((total, line) => total + line.qty * line.priceHT, 0);
  const totalTVA = lines.reduce(
    (total, line) => total + line.qty * line.priceHT * (line.vatRate / 100),
    0,
  );

  return {
    totalHT: Math.round(totalHT * 100) / 100,
    totalTVA: Math.round(totalTVA * 100) / 100,
    totalTTC: Math.round((totalHT + totalTVA) * 100) / 100,
  };
}

type QuoteForLines = {
  number: string;
  amount: number;
  details?: {
    vatRate: number;
    items?: Array<{ id: string; label: string; qty: number | string; priceHT: number | string; unit?: string }>;
    upsells?: Array<{ id: string; label: string; qty: number | string; priceHT: number | string; unit?: string }>;
  };
};

/**
 * Construit la liste des lignes facturables à partir d'un devis.
 * Version canonique — utiliser cette fonction dans tous les fichiers
 * plutôt que de la redéfinir localement.
 */
export function invoiceLinesFromQuote(quote: QuoteForLines): InvoiceLine[] {
  const vatRate = quote.details?.vatRate ?? 20;

  const lines: InvoiceLine[] = [
    ...(quote.details?.items ?? [])
      .filter((item) => item.label && item.label.trim() !== "")
      .map((item) => ({
        id: `${quote.number}-prestation-${item.id}`,
        label: item.label,
        qty: Number(item.qty) || 0,
        priceHT: Number(item.priceHT) || 0,
        vatRate,
        ...(item.unit ? { unit: item.unit } : {}),
        kind: "prestation" as const,
      })),
    ...(quote.details?.upsells ?? [])
      .filter((item) => item.label && item.label.trim() !== "")
      .map((item) => ({
        id: `${quote.number}-option-${item.id}`,
        label: item.label,
        qty: Number(item.qty) || 0,
        priceHT: Number(item.priceHT) || 0,
        vatRate,
        ...(item.unit ? { unit: item.unit } : {}),
        kind: "option" as const,
      })),
  ];

  // Fallback : si aucune ligne détaillée, on crée une ligne globale depuis le montant TTC
  return lines.length > 0
    ? lines
    : [
        {
          id: `${quote.number}-total`,
          label: `Prestations du devis ${quote.number}`,
          qty: 1,
          priceHT: quote.amount / (1 + vatRate / 100),
          vatRate,
          kind: "prestation",
        },
      ];
}
