/**
 * docuseal.ts — client serveur pour DocuSeal (self-hosted ou cloud).
 *
 * Activation optionnelle : tant que DOCUSEAL_API_URL / DOCUSEAL_API_KEY /
 * DOCUSEAL_TEMPLATE_ID ne sont pas renseignés dans l'environnement, toutes
 * les fonctions ci-dessous sont no-op et l'app retombe sur la signature
 * maison (canvas) déjà en place dans le portail client.
 */

export function isDocusealEnabled(): boolean {
  return !!(process.env.DOCUSEAL_API_URL && process.env.DOCUSEAL_API_KEY && process.env.DOCUSEAL_TEMPLATE_ID);
}

function getConfig() {
  const apiUrl = process.env.DOCUSEAL_API_URL;
  const apiKey = process.env.DOCUSEAL_API_KEY;
  const templateId = process.env.DOCUSEAL_TEMPLATE_ID;
  if (!apiUrl || !apiKey || !templateId) {
    throw new Error("DocuSeal non configuré (DOCUSEAL_API_URL / DOCUSEAL_API_KEY / DOCUSEAL_TEMPLATE_ID manquants).");
  }
  return { apiUrl: apiUrl.replace(/\/$/, ""), apiKey, templateId };
}

export type DocusealSubmitter = { email: string; name: string };

/**
 * Crée une "submission" DocuSeal à partir du template configuré, avec un
 * seul signataire (le client du devis). Retourne l'URL de signature
 * embarquable ainsi que l'id de submission (à conserver côté devis pour
 * réconcilier le webhook plus tard).
 */
export async function createDocusealSubmission(
  submitter: DocusealSubmitter,
  metadata: Record<string, string>,
): Promise<{ submissionId: number; signUrl: string }> {
  const { apiUrl, apiKey, templateId } = getConfig();

  const res = await fetch(`${apiUrl}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Auth-Token": apiKey },
    body: JSON.stringify({
      template_id: Number(templateId),
      send_email: false,
      submitters: [{ email: submitter.email, name: submitter.name, metadata }],
    }),
  });

  if (!res.ok) {
    throw new Error(`DocuSeal createSubmission: ${res.status} ${await res.text().catch(() => "")}`);
  }

  const data = (await res.json()) as Array<{ id: number; submission_id: number; embed_src?: string; slug: string }>;
  const first = data[0];
  if (!first) throw new Error("DocuSeal: réponse de création de submission vide.");

  return {
    submissionId: first.submission_id ?? first.id,
    signUrl: first.embed_src ?? `${apiUrl.replace(/\/api$/, "")}/s/${first.slug}`,
  };
}

/**
 * Vérifie la signature du webhook DocuSeal (header `X-Docuseal-Signature`,
 * HMAC-SHA256 du corps brut avec DOCUSEAL_WEBHOOK_SECRET). Retourne le
 * payload parsé si valide, sinon `null`.
 */
export async function verifyDocusealWebhook(rawBody: string, signatureHeader: string | null): Promise<any | null> {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return null;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expected = Buffer.from(sig).toString("hex");

  if (expected !== signatureHeader) return null;
  return JSON.parse(rawBody);
}
