import type { Client, Expense, Invoice, Quote, QuoteDetails, Subscription } from "./data-context";

export const SHOWCASE_DATA_VERSION = "2026-08-scenarios-v2-empty";

type ShowcaseData = {
  clients: Client[];
  quotes: Quote[];
  invoices: Invoice[];
  expenses: Expense[];
  subscriptions: Subscription[];
  nextQuoteNumber: number;
  nextInvoiceNumber: number;
};

const client = (
  id: string,
  name: string,
  email: string,
  createdAt: string,
  type: Client["type"] = "particulier",
): Client => ({
  id,
  type,
  name,
  ...(type === "pro" ? { companyName: name } : {}),
  email,
  phone: "06 10 20 30 40",
  address: "Lyon et métropole",
  postalCode: "69000",
  city: "Lyon",
  country: "France",
  createdAt,
});

const details = (clientName: string, label: string, totalTTC: number): QuoteDetails => {
  const totalHT = Math.round((totalTTC / 1.1) * 100) / 100;
  return {
    clientType: "particulier",
    lastName: clientName,
    firstName: "",
    address: "Lyon et métropole",
    phone: "06 10 20 30 40",
    serviceAddress: "Adresse du chantier",
    items: [{ id: `line-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, label, qty: 1, priceHT: totalHT }],
    upsells: [],
    vatRate: 10,
    totalHT,
    totalTTC,
  };
};

const invoiceItems = (id: string, label: string, totalTTC: number) => [{
  id,
  label,
  qty: 1,
  priceHT: Math.round((totalTTC / 1.1) * 100) / 100,
  vatRate: 10,
  kind: "prestation" as const,
}];

export function createShowcaseData(): ShowcaseData {
  const clients: Client[] = [
    client("cli-atelier", "Atelier Bernard", "contact@atelier-bernard.fr", "2026-08-08", "pro"),
    client("cli-sophie", "Sophie Martin", "sophie.martin@example.fr", "2026-08-03"),
    client("cli-halles", "Boulangerie des Halles", "direction@halles-boulangerie.fr", "2026-07-27", "pro"),
    client("cli-marc", "Marc Leroy", "marc.leroy@example.fr", "2026-07-14"),
    client("cli-rivoli", "Cabinet Rivoli", "gestion@cabinet-rivoli.fr", "2026-06-18", "pro"),
    client("cli-bellecour", "Résidence Bellecour", "syndic@bellecour.fr", "2026-05-09", "pro"),
    client("cli-hotel", "Hôtel du Parc", "technique@hotelduparc.fr", "2026-04-11", "pro"),
    client("cli-claire", "Claire Moreau", "claire.moreau@example.fr", "2026-03-08"),
    client("cli-marius", "Restaurant Marius", "contact@restaurant-marius.fr", "2026-07-02", "pro"),
  ];

  const quotes: Quote[] = [
    { number: "DV-2026-001", client: "Claire Moreau", clientId: "cli-claire", amount: 2640, date: "2026-03-10", sentAt: "2026-03-11T09:20:00.000Z", signedAt: "2026-03-13T17:10:00.000Z", status: { fr: "Payé", en: "Paid" }, details: details("Claire Moreau", "Rénovation salle d'eau", 2640) },
    { number: "DV-2026-002", client: "Hôtel du Parc", clientId: "cli-hotel", amount: 3960, date: "2026-04-14", sentAt: "2026-04-15T08:30:00.000Z", signedAt: "2026-04-18T14:00:00.000Z", status: { fr: "Facturé", en: "Invoiced" }, details: details("Hôtel du Parc", "Remise en état de trois chambres", 3960) },
    { number: "DV-2026-003", client: "Résidence Bellecour", clientId: "cli-bellecour", amount: 5830, date: "2026-05-12", sentAt: "2026-05-13T10:15:00.000Z", signedAt: "2026-05-15T16:45:00.000Z", status: { fr: "Facturé", en: "Invoiced" }, details: details("Résidence Bellecour", "Réparation colonne d'eau", 5830) },
    { number: "DV-2026-004", client: "Cabinet Rivoli", clientId: "cli-rivoli", amount: 1870, date: "2026-06-21", sentAt: "2026-06-22T11:05:00.000Z", signedAt: "2026-06-24T09:40:00.000Z", status: { fr: "Facturé", en: "Invoiced" }, details: details("Cabinet Rivoli", "Mise aux normes sanitaires", 1870) },
    { number: "DV-2026-005", client: "Marc Leroy", clientId: "cli-marc", amount: 3190, date: "2026-07-17", sentAt: "2026-07-18T13:00:00.000Z", signedAt: "2026-07-20T18:25:00.000Z", status: { fr: "Facturé", en: "Invoiced" }, details: details("Marc Leroy", "Création douche à l'italienne", 3190) },
    { number: "DV-2026-006", client: "Restaurant Marius", clientId: "cli-marius", amount: 980, date: "2026-07-04", sentAt: "2026-07-05T09:00:00.000Z", refusedAt: "2026-07-08T12:30:00.000Z", status: { fr: "Refusé", en: "Refused" }, details: details("Restaurant Marius", "Remplacement chauffe-eau", 980) },
    { number: "DV-2026-007", client: "Boulangerie des Halles", clientId: "cli-halles", amount: 1485, date: "2026-07-29", sentAt: "2026-07-30T07:45:00.000Z", signedAt: "2026-08-02T16:15:00.000Z", status: { fr: "Signé", en: "Signed" }, details: details("Boulangerie des Halles", "Dépannage réseau d'évacuation", 1485) },
    { number: "DV-2026-008", client: "Sophie Martin", clientId: "cli-sophie", amount: 720, date: "2026-08-05", sentAt: "2026-08-06T10:10:00.000Z", status: { fr: "Envoyé", en: "Sent" }, details: details("Sophie Martin", "Remplacement meuble vasque", 720) },
    { number: "DV-2026-009", client: "Atelier Bernard", clientId: "cli-atelier", amount: 1240, date: "2026-08-09", status: { fr: "Brouillon", en: "Draft" }, details: details("Atelier Bernard", "Installation point d'eau atelier", 1240) },
  ];

  const invoices: Invoice[] = [
    { number: "FA-2026-001", client: "Claire Moreau", clientId: "cli-claire", date: "2026-03-20", sentAt: "2026-03-20T10:00:00.000Z", paidAt: "2026-04-02T15:30:00.000Z", lastPaymentAt: "2026-04-02T15:30:00.000Z", paidAmount: 2640, paymentMethod: "virement", due: "2026-04-19", amount: 2640, totalHT: 2400, totalVAT: 240, status: "paid", sourceQuoteNumber: "DV-2026-001", items: invoiceItems("fa-1-line", "Rénovation salle d'eau", 2640) },
    { number: "FA-2026-002", client: "Hôtel du Parc", clientId: "cli-hotel", date: "2026-04-25", sentAt: "2026-04-26T08:40:00.000Z", lastPaymentAt: "2026-05-19T11:20:00.000Z", paidAmount: 1200, paymentMethod: "virement", due: "2026-05-25", amount: 3960, totalHT: 3600, totalVAT: 360, status: "sent", sourceQuoteNumber: "DV-2026-002", items: invoiceItems("fa-2-line", "Remise en état de trois chambres", 3960) },
    { number: "FA-2026-003", client: "Résidence Bellecour", clientId: "cli-bellecour", date: "2026-05-22", sentAt: "2026-05-23T09:10:00.000Z", due: "2026-06-21", amount: 5830, totalHT: 5300, totalVAT: 530, status: "late", sourceQuoteNumber: "DV-2026-003", items: invoiceItems("fa-3-line", "Réparation colonne d'eau", 5830), reminders: [{ date: "2026-06-29T08:00:00.000Z", type: "J+7" }, { date: "2026-07-07T08:00:00.000Z", type: "J+15" }] },
    { number: "FA-2026-004", client: "Cabinet Rivoli", clientId: "cli-rivoli", date: "2026-06-28", sentAt: "2026-06-29T14:20:00.000Z", due: "2026-07-28", amount: 1870, totalHT: 1700, totalVAT: 170, status: "sent", sourceQuoteNumber: "DV-2026-004", items: invoiceItems("fa-4-line", "Mise aux normes sanitaires", 1870) },
    { number: "FA-2026-005", client: "Marc Leroy", clientId: "cli-marc", date: "2026-08-07", due: "2026-09-06", amount: 3190, totalHT: 2900, totalVAT: 290, status: "draft", sourceQuoteNumber: "DV-2026-005", items: invoiceItems("fa-5-line", "Création douche à l'italienne", 3190) },
  ];

  const expenses: Expense[] = [
    { id: "exp-001", date: "2026-03-16", vendor: "CEDEO", description: "Robinetterie chantier Moreau", quantity: 2, amountHT: 430, vatAmount: 86, amountTTC: 516, category: "hardware", receiptName: "facture-cedeo-mars.pdf", createdAt: "2026-03-16T10:30:00.000Z" },
    { id: "exp-002", date: "2026-04-22", vendor: "Point.P", description: "Matériaux Hôtel du Parc", quantity: 1, amountHT: 780, vatAmount: 156, amountTTC: 936, category: "hardware", receiptName: "facture-pointp-avril.pdf", createdAt: "2026-04-22T14:10:00.000Z" },
    { id: "exp-003", date: "2026-05-19", vendor: "Kiloutou", description: "Location matériel colonne d'eau", quantity: 3, amountHT: 245, vatAmount: 49, amountTTC: 294, category: "hardware", receiptName: "facture-kiloutou-mai.pdf", createdAt: "2026-05-19T08:40:00.000Z" },
    { id: "exp-004", date: "2026-06-25", vendor: "TotalEnergies", description: "Déplacements chantiers", quantity: 1, amountHT: 128, vatAmount: 25.6, amountTTC: 153.6, category: "travel", createdAt: "2026-06-25T18:00:00.000Z" },
    { id: "exp-005", date: "2026-07-24", vendor: "ManoMano Pro", description: "Outillage plomberie", quantity: 1, amountHT: 360, vatAmount: 72, amountTTC: 432, category: "hardware", receiptName: "facture-manomano-juillet.pdf", createdAt: "2026-07-24T12:15:00.000Z" },
    { id: "exp-006", date: "2026-08-08", vendor: "Richardson", description: "Fournitures douche italienne", quantity: 4, amountHT: 615, vatAmount: 123, amountTTC: 738, category: "hardware", receiptName: "facture-richardson-aout.pdf", createdAt: "2026-08-08T09:25:00.000Z" },
  ];

  return {
    clients,
    quotes,
    invoices,
    expenses,
    subscriptions: [],
    nextQuoteNumber: quotes.length + 1,
    nextInvoiceNumber: invoices.length + 1,
  };
}
