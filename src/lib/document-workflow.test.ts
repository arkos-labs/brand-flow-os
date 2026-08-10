import { strict as assert } from "node:assert";
import {
  canEditQuote,
  canMoveQuoteManually,
  getInvoicePaymentState,
  getQuotePipelineStage,
  markInvoiceAsPaid,
  recordInvoicePayment,
} from "./document-workflow.ts";

const draftInvoice = {
  number: "FA-2026-001",
  client: "Client test",
  date: "2026-01-01",
  due: "2026-01-31",
  amount: 120,
  status: "draft" as const,
  sourceQuoteNumber: "DV-2026-001",
};

assert.equal(getInvoicePaymentState(draftInvoice, new Date("2026-08-10")), "draft");
assert.equal(canEditQuote("Brouillon"), true);
assert.equal(canEditQuote("Refusé"), true);
assert.equal(canEditQuote("Signé"), false);
assert.equal(canMoveQuoteManually("Brouillon", "Envoyé"), true);
assert.equal(canMoveQuoteManually("Envoyé", "Signé"), false);
assert.equal(canMoveQuoteManually("Envoyé", "Refusé"), false);

assert.equal(
  getQuotePipelineStage(
    { number: "DV-2026-001", status: { fr: "Facturé", en: "Invoiced" } },
    [draftInvoice],
  ),
  "Facturé",
);

assert.equal(
  getQuotePipelineStage(
    { number: "DV-2026-001", status: { fr: "Facturé", en: "Invoiced" } },
    [{ ...draftInvoice, status: "sent" }],
  ),
  "APayer",
);

const paid = markInvoiceAsPaid({ ...draftInvoice, status: "sent" }, "2026-08-10T12:00:00.000Z", "virement");
assert.equal(paid.status, "paid");
assert.equal(paid.paidAt, "2026-08-10T12:00:00.000Z");
assert.equal(paid.paymentMethod, "virement");

const partial = recordInvoicePayment(
  { ...draftInvoice, status: "sent", amount: 120 },
  40,
  "2026-08-10T12:00:00.000Z",
  "carte",
);
assert.equal(partial.status, "sent");
assert.equal(partial.paidAmount, 40);

const completed = recordInvoicePayment(partial, 80, "2026-08-11T12:00:00.000Z", "virement");
assert.equal(completed.status, "paid");
assert.equal(completed.paidAmount, 120);
