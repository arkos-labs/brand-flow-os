import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  requiredPlan: "pro" | "agency";
  features?: string[];
}

export function UpgradeModal({
  isOpen,
  onClose,
  title,
  description,
  requiredPlan,
  features,
}: UpgradeModalProps) {
  const isAgency = requiredPlan === "agency";

  const defaultProFeatures = [
    "Devis et factures illimités",
    "Clients illimités",
    "PDF à vos couleurs avec logo",
    "Signature électronique",
    "Portail client et export comptable",
  ];

  const defaultAgencyFeatures = [
    "Multi-sociétés",
    "Jusqu'à 5 utilisateurs",
    "Marque blanche (domaine personnalisé)",
    "API & Webhooks",
    "Account manager dédié",
  ];

  const displayFeatures = features || (isAgency ? defaultAgencyFeatures : defaultProFeatures);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 mt-2">
          <div className="flex items-center gap-2 mb-3 font-semibold text-primary">
            <Sparkles className="h-4 w-4" />
            <span>Passez au forfait {isAgency ? "Agency" : "Pro"}</span>
          </div>
          <ul className="space-y-2 text-sm">
            {displayFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                <Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="sm:justify-center mt-4 flex gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Plus tard
          </Button>
          <Link to="/tarifs" className="w-full sm:w-auto">
            <Button className="w-full" onClick={onClose}>
              Voir les tarifs
            </Button>
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
