export interface SiretData {
  siret: string;
  name: string;
  legalForm: string;
  address: string;
  postalCode: string;
  city: string;
  vatNumber: string;
}

/**
 * Calcule la clé de contrôle de TVA intracommunautaire française à partir du SIREN
 * Formule : [12 + 3 * (SIREN modulo 97)] modulo 97
 */
export function calculateFrenchVatNumber(siren: string): string {
  if (siren.length !== 9) return "";
  const sirenNum = parseInt(siren, 10);
  if (isNaN(sirenNum)) return "";
  const key = (12 + 3 * (sirenNum % 97)) % 97;
  const keyStr = key.toString().padStart(2, "0");
  return `FR${keyStr}${siren}`;
}

/**
 * Recherche une entreprise par son SIRET via l'API publique française
 * https://recherche-entreprises.api.gouv.fr/
 */
export async function searchCompanyBySiret(siret: string): Promise<SiretData | null> {
  const cleanSiret = siret.replace(/\D/g, "");
  if (cleanSiret.length !== 14) return null;

  try {
    const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${cleanSiret}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.results || data.results.length === 0) return null;

    const company = data.results[0];
    const siege = company.siege;

    // Calcul du nom : utiliser nom_complet
    const name = company.nom_complet || company.nom_raison_sociale || "";

    // Adresse
    const address = siege?.adresse || [siege?.numero_voie, siege?.type_voie, siege?.libelle_voie].filter(Boolean).join(" ");
    const postalCode = siege?.code_postal || "";
    const city = siege?.libelle_commune || "";

    // SIREN (9 premiers chiffres du SIRET)
    const siren = cleanSiret.substring(0, 9);
    
    // TVA
    const vatNumber = calculateFrenchVatNumber(siren);

    return {
      siret: cleanSiret,
      name,
      legalForm: company.nature_juridique || "",
      address,
      postalCode,
      city,
      vatNumber,
    };
  } catch (error) {
    console.error("Error fetching SIRET data:", error);
    return null;
  }
}

export interface VatCheckResult {
  valid: boolean;
  name: string | null;
  address: string | null;
  countryCode: string;
  vatNumber: string;
  requestDate: string | null;
}

/**
 * Valide un numéro de TVA intracommunautaire via le service officiel VIES
 * (Commission européenne — gratuit, sans clé API). Le numéro complet
 * (ex: "FR32123456789") est découpé en code pays + numéro.
 * Passe par notre route serveur /api/vies/check car l'API VIES ne renvoie
 * pas d'en-têtes CORS exploitables depuis le navigateur.
 */
export async function checkVatNumber(fullVatNumber: string): Promise<VatCheckResult | null> {
  const clean = fullVatNumber.replace(/\s/g, "").toUpperCase();
  const match = clean.match(/^([A-Z]{2})([A-Z0-9]+)$/);
  if (!match) return null;

  const [, countryCode, vatNumber] = match;

  try {
    const res = await fetch("/api/vies/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ countryCode, vatNumber }),
    });
    if (!res.ok) return null;
    return (await res.json()) as VatCheckResult;
  } catch (error) {
    console.error("Error checking VAT number via VIES:", error);
    return null;
  }
}
