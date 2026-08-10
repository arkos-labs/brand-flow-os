export type InvoiceLine = {
  id: string;
  label: string;
  qty: number;
  priceHT: number;
  vatRate: number;
  kind?: "prestation" | "option";
};

export function isQuoteReadyToInvoice(status: string): boolean {
  return status === "Signé";
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
