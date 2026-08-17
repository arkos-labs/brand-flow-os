import { strict as assert } from "node:assert";
import { createShowcaseData } from "./showcase-data.ts";

const data = createShowcaseData();
const clientIds = new Set(data.clients.map((client) => client.id));
const quoteNumbers = new Set(data.quotes.map((quote) => quote.number));

assert.equal(data.clients.length, 9, "la démonstration doit couvrir neuf clients distincts");
assert.equal(quoteNumbers.size, data.quotes.length, "les numéros de devis doivent être uniques");
assert.equal(new Set(data.invoices.map((invoice) => invoice.number)).size, data.invoices.length);

for (const quote of data.quotes) {
  assert.ok(quote.clientId && clientIds.has(quote.clientId), `${quote.number} doit avoir un client valide`);
}

for (const invoice of data.invoices) {
  assert.ok(invoice.clientId && clientIds.has(invoice.clientId), `${invoice.number} doit avoir un client valide`);
  assert.ok(
    invoice.sourceQuoteNumber && quoteNumbers.has(invoice.sourceQuoteNumber),
    `${invoice.number} doit provenir d'un devis existant`,
  );
}

for (const expectedStatus of ["Brouillon", "Envoyé", "Signé", "Facturé", "Payé", "Refusé"]) {
  assert.ok(data.quotes.some((quote) => quote.status.fr === expectedStatus), `cas devis manquant : ${expectedStatus}`);
}

for (const expectedStatus of ["draft", "sent", "late", "paid"] as const) {
  assert.ok(data.invoices.some((invoice) => invoice.status === expectedStatus), `cas facture manquant : ${expectedStatus}`);
}

const partialInvoice = data.invoices.find(
  (invoice) => invoice.status === "sent" && (invoice.paidAmount ?? 0) > 0,
);
assert.ok(partialInvoice, "un exemple de paiement partiel est nécessaire");
assert.ok(partialInvoice.paidAmount! < partialInvoice.amount);

const paidInvoice = data.invoices.find((invoice) => invoice.status === "paid");
assert.ok(paidInvoice?.paidAt, "une facture payée doit avoir une date de paiement");
assert.equal(paidInvoice?.paidAmount, paidInvoice?.amount);

assert.equal(data.subscriptions.length, 0);
assert.equal(data.nextQuoteNumber, data.quotes.length + 1);
assert.equal(data.nextInvoiceNumber, data.invoices.length + 1);
