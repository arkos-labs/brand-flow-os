/**
 * portal-adapters.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Le détail complet d'un devis (lignes, infos client, historique de
 * signature…) est stocké tel quel dans la colonne `quotes.payload`, au
 * format `Quote` legacy défini dans `data-context.tsx` — c'est ce que
 * `/devis` lit et écrit. Les colonnes structurées (`status`, `total_ttc`…)
 * ne sont qu'une synchro partielle utilisée pour les requêtes SQL.
 *
 * On fusionne les deux : le payload pour le détail, la colonne `status`
 * structurée comme source de vérité du verrouillage — mise à jour par
 * `/api/quotes/sign` et `/api/quotes/refuse` EN MÊME TEMPS que le payload,
 * pour ne jamais laisser les deux diverger.
 */

import type { Quote, CompanySettings } from "./data-context";
import type { Database } from "./database.types";

type DbQuote = Database["public"]["Tables"]["quotes"]["Row"];
type DbInvoice = Database["public"]["Tables"]["invoices"]["Row"];
type DbOrganization = Database["public"]["Tables"]["organizations"]["Row"];

export const STATUS_MAP: Record<DbQuote["status"], { fr: string; en: string }> = {
  draft: { fr: "Brouillon", en: "Draft" },
  sent: { fr: "Envoyé", en: "Sent" },
  accepted: { fr: "Signé", en: "Signed" },
  rejected: { fr: "Refusé", en: "Refused" },
  expired: { fr: "Expiré", en: "Expired" },
};

export function dbQuoteToLegacyQuote(row: DbQuote): Quote {
  const payload = (row.payload ?? {}) as Partial<Quote>;

  // FIX M2: Ne JAMAIS retomber sur row.id comme publicToken.
  // row.id est l'UUID Supabase — un identifiant devinable / listable via
  // d'autres endpoints. Le publicToken doit être un token opaque généré par
  // l'artisan au moment de l'envoi. Si le payload n'en contient pas, c'est
  // un devis qui n'a jamais été envoyé et qui ne devrait pas être accessible
  // via le portail public.
  const publicToken = payload.publicToken;
  if (!publicToken) {
    throw new Error(
      `Quote ${row.number} n'a pas de publicToken — ce devis n'a jamais été envoyé et ne peut pas être exposé sur le portail public.`
    );
  }

  return {
    number: row.number,
    client: "Client",
    amount: row.total_ttc,
    date: row.issue_date,
    ...payload,
    // La colonne structurée `status` fait foi (c'est elle que les routes
    // de signature mettent à jour) ; on ne retombe sur le payload que si
    // elle est absente pour une raison quelconque.
    status: STATUS_MAP[row.status] ?? payload.status ?? STATUS_MAP.draft,
    publicToken,
  } as Quote;
}

export function dbInvoiceToLegacyInvoice(row: DbInvoice): any {
  // We use any to quickly satisfy the type constraint for the Cron, since the legacy payload contains everything
  const payload = (row.payload ?? {}) as any;
  return {
    number: row.number,
    client: "Client",
    amount: row.total_ttc,
    date: row.issue_date,
    ...payload,
  };
}

export function dbOrgToCompanySettings(org: DbOrganization): CompanySettings {
  const settings: CompanySettings = {
    name: org.name,
    legalForm: org.legal_form ?? "",
    siret: org.siret ?? "",
    vatNumber: org.vat_number ?? "",
    address: [org.address_line1, org.address_line2].filter(Boolean).join(" "),
    postalCode: org.postal_code ?? "",
    city: org.city ?? "",
    country: org.country ?? "France",
    phone: org.phone ?? "",
    email: org.email ?? "",
    quotePrefix: org.quote_prefix,
    invoicePrefix: org.invoice_prefix,
    nextQuoteNumber: 1,
    nextInvoiceNumber: 1,
    paymentTermsDays: org.default_payment_days,
    lateInterestRate: org.late_penalty_rate != null ? String(org.late_penalty_rate) : "",
    recoveryFee: org.late_penalty_flat != null ? String(org.late_penalty_flat) : "",
    footerNote: org.legal_notice ?? "",
  };
  if (org.website) settings.website = org.website;
  if (org.logo_url) settings.logoBase64 = org.logo_url;
  return settings;
}
