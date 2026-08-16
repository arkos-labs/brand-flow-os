/**
 * document-pdf.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Utilitaires pour imprimer / télécharger un document identique à l'aperçu.
 *
 * Stratégie : on injecte une feuille de style @media print temporaire qui
 * masque tout l'AppShell et n'affiche que le template. L'utilisateur voit
 * le même rendu dans la boîte de dialogue d'impression (ou « Enregistrer en PDF »).
 *
 * Aucune dépendance externe nécessaire.
 */

const PRINT_STYLE_ID = "devizia-print-style";

/**
 * Imprime le document dont l'id est passé en paramètre.
 * Masque le reste de l'UI, lance window.print(), puis restaure.
 *
 * @param documentId  - id HTML du <div> contenant <DocumentTemplate />
 * @param title       - Titre affiché dans l'onglet / nom de fichier PDF proposé
 */
export function printDocument(
  documentId: string = "doc-template",
  title?: string,
): void {
  // ── 1. Mémoriser le titre de page actuel ────────────────────────────────
  const prevTitle = document.title;
  if (title) document.title = title;

  // ── 2. Injecter la feuille de style d'impression ────────────────────────
  injectPrintStyle(documentId);

  // ── 3. Déclencher l'impression ──────────────────────────────────────────
  window.print();

  // ── 4. Nettoyer après fermeture de la boîte d'impression ────────────────
  // onafterprint ne fonctionne pas partout — on utilise les deux.
  const cleanup = () => {
    removePrintStyle();
    document.title = prevTitle;
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);

  // Fallback setTimeout au cas où afterprint ne se déclenche pas
  setTimeout(cleanup, 3000);
}

function injectPrintStyle(documentId: string): void {
  removePrintStyle(); // s'assurer qu'il n'y en a pas déjà un

  const style = document.createElement("style");
  style.id = PRINT_STYLE_ID;
  style.textContent = `
    @media print {
      /* ── Masquer tout le shell de l'app ── */
      body > *:not([data-print-root]) {
        display: none !important;
      }
      [data-print-root] {
        display: block !important;
      }

      /* ── Isoler uniquement le template ── */
      body {
        background: #fff !important;
        margin: 0 !important;
        padding: 0 !important;
      }

      /* Le conteneur de portail d'impression */
      #devizia-print-portal {
        display: block !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 99999 !important;
        background: #fff !important;
        overflow: auto !important;
      }

      /* Le template lui-même */
      #${documentId} {
        display: block !important;
        page-break-after: avoid;
        margin: 0 auto !important;
        box-shadow: none !important;
      }

      /* Taille page A4 */
      @page {
        size: A4 portrait;
        margin: 0;
      }

      /* Pas de fond de couleur coupé par l'imprimante */
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  `;

  document.head.appendChild(style);
}

function removePrintStyle(): void {
  const existing = document.getElementById(PRINT_STYLE_ID);
  if (existing) existing.remove();
}

/**
 * Hook React pour déclencher l'impression depuis un composant.
 *
 * Exemple :
 *   const { print } = useDocumentPrint("doc-template", `Devis ${quote.number}`);
 *   <button onClick={print}>Télécharger PDF</button>
 */
export function useDocumentPrint(documentId?: string, title?: string) {
  function print() {
    printDocument(documentId, title);
  }
  return { print };
}
