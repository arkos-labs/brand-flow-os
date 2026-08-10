import { strict as assert } from "node:assert";
import { buildEditedQuote, calculateEditorTotals, quoteToEditorForm } from "./quote-editor.ts";
import type { Client, Quote } from "./data-context.tsx";

const client: Client = {
  id: "cli-1",
  type: "particulier",
  name: "Jean Dupont",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@example.fr",
  address: "10 rue du Test",
  phone: "0600000000",
  createdAt: "2026-08-01",
};

const original: Quote = {
  number: "DV-2026-001",
  client: "Jean Dupont",
  clientId: client.id,
  amount: 132,
  status: { fr: "Refusé", en: "Refused" },
  date: "2026-08-02",
  sentAt: "2026-08-03T09:00:00.000Z",
  signedAt: "2026-08-03T12:00:00.000Z",
  refusedAt: "2026-08-04T10:00:00.000Z",
  closedAt: "2026-08-05T11:00:00.000Z",
  signatureData: {
    signerName: "Jean Dupont",
    signedAt: "2026-08-03T12:00:00.000Z",
    consent: true,
  },
  invoicedLineIds: ["old-line"],
  details: {
    clientType: "particulier",
    firstName: "Jean",
    lastName: "Dupont",
    address: "10 rue du Test",
    phone: "0600000000",
    serviceAddress: "12 rue du Chantier",
    items: [{ id: "line-1", label: "Dépannage", qty: 1, priceHT: 100 }],
    upsells: [{ id: "option-1", label: "Nettoyage", qty: 1, priceHT: 20 }],
    vatRate: 10,
    totalHT: 120,
    totalTTC: 132,
  },
};

const form = quoteToEditorForm(original, client);
assert.equal(form.firstName, "Jean");
assert.equal(form.serviceAddress, "12 rue du Chantier");
assert.equal(form.items.length, 1);
assert.equal(form.upsells.length, 1);

form.items[0] = { ...form.items[0]!, qty: 2, priceHT: 125 };
const totals = calculateEditorTotals(form.items, form.upsells, form.vatRate);
assert.deepEqual(totals, { totalHT: 270, totalVAT: 27, totalTTC: 297 });

const updated = buildEditedQuote(original, form);
assert.equal(updated.amount, 297);
assert.equal(updated.number, original.number);
assert.deepEqual(updated.status, { fr: "Brouillon", en: "Draft" });
assert.equal("sentAt" in updated, false);
assert.equal("signedAt" in updated, false);
assert.equal("refusedAt" in updated, false);
assert.equal("closedAt" in updated, false);
assert.equal("signatureData" in updated, false);
assert.deepEqual(updated.invoicedLineIds, original.invoicedLineIds);
assert.equal(updated.clientId, client.id);
