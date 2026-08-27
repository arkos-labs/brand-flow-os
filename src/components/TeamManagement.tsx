import { useState } from 'react';
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Shield, Mail, Trash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function TeamManagement() {
  const { lang } = useI18n();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  
  // Données fictives pour l'instant
  const mockMembers = [
    { id: '1', email: 'admin@exemple.com', role: 'admin', status: 'active', date: '2026-01-10' },
  ];

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    alert(`Invitation envoyée à ${email} avec le rôle ${role}`);
    setEmail('');
    setRole('member');
    setInviteOpen(false);
  };

  return (
    <div className="card-elevated p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">{lang === "fr" ? "Gestion de l'équipe" : "Team Management"}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {lang === "fr"
              ? "Invitez jusqu'à 5 utilisateurs, gérez leurs rôles et permissions."
              : "Invite up to 5 users, manage their roles and permissions."}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2 h-9 px-3 text-xs">
          <Plus className="h-4 w-4" />
          {lang === "fr" ? "Inviter" : "Invite"}
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden mt-4">
        {mockMembers.length === 0 ? (
          <div className="p-12 text-center bg-muted/10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">
              {lang === "fr" ? "L'équipe est vide" : "Team is empty"}
            </h3>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border text-xs">
              <tr>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Membre</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Rôle</th>
                <th className="py-3 px-4 text-left font-medium text-muted-foreground">Statut</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockMembers.map((member) => (
                <tr key={member.id} className="bg-card hover:bg-muted/30 transition-colors">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        {member.email.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-xs text-foreground">{member.email}</p>
                        <p className="text-[10px] text-muted-foreground">Ajouté le {new Date(member.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-1.5">
                      {member.role === 'admin' ? <Shield className="h-3.5 w-3.5 text-primary" /> : <Users className="h-3.5 w-3.5 text-muted-foreground" />}
                      <span className="capitalize text-xs font-medium">{member.role}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <div className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-success/10 text-success">
                      {member.status === 'active' ? 'Actif' : 'En attente'}
                    </div>
                  </td>
                  <td className="p-4 align-middle text-right">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>{lang === "fr" ? "Inviter un membre" : "Invite a member"}</DialogTitle>
              <DialogDescription>
                {lang === "fr" ? "Entrez l'adresse email de la personne à inviter. Elle recevra un lien d'accès." : "Enter the email address of the person to invite."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="collegue@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs">Rôle</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Sélectionner un rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="member">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="h-9 text-xs">
                Annuler
              </Button>
              <Button type="submit" className="h-9 text-xs">
                <Mail className="mr-2 h-3.5 w-3.5" />
                Envoyer l'invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
