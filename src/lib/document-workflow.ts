export type QuotePipelineStage = "Brouillon" | "Envoyé" | "Signé" | "Facturé" | "APayer" | "Refusé";
export type InvoicePaymentState = "draft" | "pending" | "late" | "paid";
export type PaymentMethod = "virement" | "carte" | "cheque" | "especes" | "prelevement" | "autre";

type QuoteLike = {
  number: string;
  status: { fr: string; en: string };
};

type InvoiceLike = {
  number: string;
  date: string;
  due: string;
  status: string;
  amount?: number;
  paidAmount?: number;
  sourceQuoteNumber?: string;
  sentAt?: string;
  paidAt?: string;
  paymentMethod?: PaymentMethod;
};

export function canEditQuote(status: string): boolean {
  return status === "Brouillon" || status === "Refusé";
}

export function canMoveQuoteManually(from: QuotePipelineStage, to: QuotePipelineStage): boolean {
  if (from === "Brouillon") return to === "Envoyé";
  if (from === "Refusé") return to === "Brouillon";
  return false;
}

export function getInvoicePaymentState(invoice: InvoiceLike, now = new Date()): InvoicePaymentState {
  if (invoice.status === "paid") return "paid";
  if (invoice.status === "draft") return "draft";

  const due = new Date(`${invoice.due}T23:59:59`);
  if (invoice.status === "late" || due.getTime() < now.getTime()) return "late";
  return "pending";
}

export function getQuotePipelineStage(
  quote: QuoteLike,
  invoices: InvoiceLike[],
): QuotePipelineStage {
  const linkedInvoices = invoices.filter((invoice) => invoice.sourceQuoteNumber === quote.number);
  const status = quote.status.fr;

  if (status === "Brouillon") return "Brouillon";
  if (status === "Envoyé" || status === "Vu") return "Envoyé";
  if (status === "Signé") return "Signé";
  if (status === "Refusé" || status === "Expiré") return "Refusé";

  if (status === "Facturé" || status === "Payé") {
    if (linkedInvoices.some((invoice) => ["sent", "late"].includes(invoice.status))) return "APayer";
    return "Facturé";
  }

  return "Brouillon";
}

export function markInvoiceAsPaid<T extends InvoiceLike>(
  invoice: T,
  paidAt = new Date().toISOString(),
  paymentMethod: PaymentMethod = "virement",
): T & { status: "paid"; paidAt: string; paymentMethod: PaymentMethod } {
  return {
    ...invoice,
    status: "paid",
    paidAt,
    paymentMethod,
  };
}

export function recordInvoicePayment<T extends InvoiceLike>(
  invoice: T,
  paymentAmount: number,
  paymentDate = new Date().toISOString(),
  paymentMethod: PaymentMethod = "virement",
): T & {
  status: "sent" | "paid";
  paidAmount: number;
  paymentMethod: PaymentMethod;
  lastPaymentAt: string;
  paidAt?: string;
} {
  const total = Math.max(0, invoice.amount ?? 0);
  const paidAmount = Math.min(total, Math.max(0, (invoice.paidAmount ?? 0) + paymentAmount));
  const complete = total > 0 && paidAmount >= total;
  return {
    ...invoice,
    status: complete ? "paid" : "sent",
    paidAmount,
    paymentMethod,
    lastPaymentAt: paymentDate,
    ...(complete ? { paidAt: paymentDate } : {}),
  };
}

export function getDocumentActivityDate(document: {
  date: string;
  sentAt?: string;
  paidAt?: string;
}): string {
  return document.paidAt ?? document.sentAt ?? document.date;
}
