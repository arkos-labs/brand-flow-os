import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Invoice } from "@/lib/data-context";
import { useI18n } from "@/lib/i18n";
import { Send, Clock } from "lucide-react";
import { useState, useEffect } from "react";

interface ReminderModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onSend: (invoiceNumber: string, type: "J+7" | "J+15" | "J+30") => void;
}

export function ReminderModal({ invoice, isOpen, onClose, onSend }: ReminderModalProps) {
  const { money, date } = useI18n();
  const [templateType, setTemplateType] = useState<"J+7" | "J+15" | "J+30">("J+7");

  useEffect(() => {
    if (invoice) {
      const today = new Date();
      const dueDate = new Date(invoice.due);
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays >= 30) setTemplateType("J+30");
      else if (diffDays >= 15) setTemplateType("J+15");
      else setTemplateType("J+7");
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSend = () => {
    onSend(invoice.number, templateType);
    onClose();
  };

  const getTemplateContent = () => {
    switch (templateType) {
      case "J+7":
        return `Bonjour ${invoice.client},

Sauf erreur ou omission de notre part, le paiement de la facture ${invoice.number} d'un montant de ${money(invoice.amount)} arrivée à échéance le ${date(invoice.due)} ne nous est pas parvenu.

Nous vous prions de bien vouloir procéder à son règlement dans les meilleurs délais.

Si votre règlement a été effectué entre-temps, veuillez ne pas tenir compte de ce message.

Cordialement,
L'équipe`;
      case "J+15":
        return `Bonjour ${invoice.client},

Nous vous avons adressé une relance il y a quelques jours concernant la facture ${invoice.number} d'un montant de ${money(invoice.amount)}, arrivée à échéance le ${date(invoice.due)}.

Sauf erreur de notre part, nous n'avons toujours pas reçu votre paiement. Nous vous demandons de bien vouloir régulariser cette situation au plus vite.

Dans l'attente de votre retour, nous restons à votre disposition.

Cordialement,
L'équipe`;
      case "J+30":
        return `Bonjour ${invoice.client},

Malgré nos précédentes relances, nous constatons que la facture ${invoice.number} d'un montant de ${money(invoice.amount)}, dont l'échéance était fixée au ${date(invoice.due)}, reste impayée à ce jour.

Nous vous mettons en demeure de procéder au règlement de cette facture sous 48 heures. À défaut, nous nous verrons contraints d'appliquer les pénalités de retard prévues par nos conditions générales et d'engager une procédure de recouvrement.

Nous comptons sur votre compréhension.

Cordialement,
La Direction`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Envoyer une relance</DialogTitle>
          <DialogDescription>
            Facture {invoice.number} — {invoice.client}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex gap-2">
            <Button 
              variant={templateType === "J+7" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTemplateType("J+7")}
            >
              Première relance (J+7)
            </Button>
            <Button 
              variant={templateType === "J+15" ? "default" : "outline"} 
              size="sm"
              onClick={() => setTemplateType("J+15")}
            >
              Deuxième relance (J+15)
            </Button>
            <Button 
              variant={templateType === "J+30" ? "destructive" : "outline"} 
              size="sm"
              onClick={() => setTemplateType("J+30")}
            >
              Mise en demeure (J+30)
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-md border font-mono text-sm whitespace-pre-wrap">
            {getTemplateContent()}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSend} className={templateType === "J+30" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
            <Send className="w-4 h-4 mr-2" />
            Envoyer l'e-mail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
