import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useI18n } from "@/lib/i18n";
import { useData, Invoice } from "@/lib/data-context";
import { CheckCircle2, AlertTriangle, Send } from "lucide-react";
import { useState } from "react";
import { ReminderModal } from "@/components/ReminderModal";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/paiements")({
  component: PaymentsPage,
});

function PaymentsPage() {
  const { t, money, date } = useI18n();
  const { invoices, quotes, updateInvoice } = useData();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const paidInvoices = invoices.filter((inv) => inv.status === "paid");
  
  // Prestations considérées comme "terminées" ou prêtes
  const signedQuotes = quotes.filter(
    (q) => q.status.fr === "Signé" || q.status.en === "Signed" || q.status.fr === "Payé" || q.status.en === "Paid"
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lateInvoices = invoices.filter((inv) => {
    if (inv.status === "paid") return false;
    const dueDate = new Date(inv.due);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).map(inv => {
    const dueDate = new Date(inv.due);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return { ...inv, daysLate: diffDays };
  });

  const handleSendReminder = (invoiceNumber: string, type: "J+7" | "J+15" | "J+30") => {
    const invToUpdate = invoices.find(inv => inv.number === invoiceNumber);
    if (invToUpdate) {
      const updatedReminders = [...(invToUpdate.reminders || []), { date: new Date().toISOString(), type }];
      updateInvoice(invoiceNumber, { ...invToUpdate, reminders: updatedReminders });
    }
  };

  return (
    <>
      <PageHeader
        title={t("nav.payments")}
        subtitle="Historique des paiements et des prestations terminées."
      />
      
      <div className="p-6 md:p-10 space-y-12 max-w-6xl mx-auto">
        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Factures en Retard
            </h2>
            <span className="bg-destructive/20 text-destructive text-xs font-bold px-2 py-1 rounded-full">
              {lateInvoices.length}
            </span>
          </div>

          {lateInvoices.length === 0 ? (
            <p className="text-muted-foreground bg-muted/30 p-8 rounded-xl border border-dashed text-center">
              Aucune facture en retard.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lateInvoices.map((inv) => (
                <div key={inv.number} className="p-5 rounded-xl border-destructive/30 border bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{inv.number}</span>
                    <span className="text-destructive font-bold text-sm bg-destructive/10 px-2 py-1 rounded-md">
                      +{inv.daysLate} jours
                    </span>
                  </div>
                  <p className="font-semibold text-lg">{inv.client}</p>
                  <p className="text-3xl font-light tracking-tight mt-2">{money(inv.amount)}</p>
                  
                  <div className="mt-4 pt-3 border-t flex flex-col gap-2 flex-grow justify-end">
                    <p className="text-xs text-muted-foreground">
                      Échéance: {date(inv.due)}
                    </p>
                    {inv.reminders && inv.reminders.length > 0 && (
                      <p className="text-xs text-muted-foreground italic">
                        Dernière relance: {inv.reminders[inv.reminders.length - 1].type} ({date(inv.reminders[inv.reminders.length - 1].date)})
                      </p>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 w-full flex items-center justify-center gap-2"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsModalOpen(true);
                      }}
                    >
                      <Send className="h-3 w-3" />
                      Relancer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold">Factures Réglées</h2>
            <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-full">
              {paidInvoices.length}
            </span>
          </div>
          
          {paidInvoices.length === 0 ? (
            <p className="text-muted-foreground bg-muted/30 p-8 rounded-xl border border-dashed text-center">
              Aucun paiement enregistré pour le moment.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {paidInvoices.map((inv) => (
                <div key={inv.number} className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{inv.number}</span>
                    <CheckCircle2 className="text-success h-5 w-5" />
                  </div>
                  <p className="font-semibold text-lg">{inv.client}</p>
                  <p className="text-3xl font-light tracking-tight mt-2 text-primary">{money(inv.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                    Encaissé le {date(inv.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-xl font-semibold">Prestations Terminées (Devis)</h2>
            <span className="bg-success/20 text-success text-xs font-bold px-2 py-1 rounded-full">
              {signedQuotes.length}
            </span>
          </div>

          {signedQuotes.length === 0 ? (
            <p className="text-muted-foreground bg-muted/30 p-8 rounded-xl border border-dashed text-center">
              Aucune prestation validée ou terminée.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {signedQuotes.map((q) => (
                <div key={q.number} className="p-5 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow opacity-90">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-sm font-medium text-muted-foreground">{q.number}</span>
                    <div className="bg-success/10 text-success text-[10px] uppercase font-bold px-2 py-1 rounded-sm">
                      Terminé
                    </div>
                  </div>
                  <p className="font-semibold text-lg">{q.client}</p>
                  <p className="text-2xl font-light tracking-tight mt-2 text-muted-foreground">{money(q.amount)}</p>
                  <p className="text-xs text-muted-foreground mt-4 border-t pt-3">
                    Dossier validé le {date(q.date)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <ReminderModal 
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={handleSendReminder}
      />
    </>
  );
}
