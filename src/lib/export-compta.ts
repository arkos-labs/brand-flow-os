import type { Invoice } from "./data-context";

/**
 * Génère un fichier CSV pour l'export comptable (format simplifié)
 * Colonnes : Date, Numéro, Client, Montant HT, Montant TVA, Montant TTC
 */
export function generateAccountingExportCSV(invoices: Invoice[]): string {
  // En-têtes (avec séparateur point-virgule, classique en France pour Excel)
  const headers = ["Date", "Numéro", "Client", "Montant HT", "Montant TVA", "Montant TTC"];
  
  const rows = invoices.map(inv => {
    const itemTotals = inv.items?.reduce(
      (totals, item) => {
        const lineHT = item.qty * item.priceHT;
        return {
          ht: totals.ht + lineHT,
          tva: totals.tva + lineHT * (item.vatRate / 100),
        };
      },
      { ht: 0, tva: 0 },
    );
    const fallbackHT = inv.amount / 1.2;
    const ht = inv.totalHT ?? itemTotals?.ht ?? fallbackHT;
    const tva = inv.totalVAT ?? itemTotals?.tva ?? inv.amount - ht;

    return [
      new Date(inv.date).toLocaleDateString("fr-FR"),
      inv.number,
      `"${inv.client.replace(/"/g, '""')}"`, // Échapper les guillemets
      ht.toFixed(2).replace(".", ","),
      tva.toFixed(2).replace(".", ","),
      inv.amount.toFixed(2).replace(".", ",")
    ].join(";");
  });

  return [headers.join(";"), ...rows].join("\r\n");
}

export function downloadCSV(content: string, filename: string) {
  // Ajout du BOM (Byte Order Mark) pour forcer Excel à lire le fichier en UTF-8
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
