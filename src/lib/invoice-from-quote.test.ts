import { strict as assert } from "node:assert";
import { calculateInvoiceTotals, isQuoteReadyToInvoice, selectInvoiceLines } from "./invoice-from-quote.ts";

const lines = [
  { id: "main", label: "Pose", qty: 2, priceHT: 100, vatRate: 10 },
  { id: "option", label: "Option non réalisée", qty: 1, priceHT: 50, vatRate: 20 },
];

const selected = selectInvoiceLines(lines, new Set(["main"]));
assert.equal(selected.length, 1);
assert.deepEqual(calculateInvoiceTotals(selected), { totalHT: 200, totalTVA: 20, totalTTC: 220 });
assert.equal(isQuoteReadyToInvoice("Signé"), true);
assert.equal(isQuoteReadyToInvoice("Facturé"), false);
