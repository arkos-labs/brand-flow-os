import { useState, useEffect } from 'react';
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
import { useSupabaseData } from "@/lib/supabase-context";
import { supabase } from "@/lib/supabase";
import { authHeaders } from "@/lib/utils";

export function TeamManagement() {
  const { lang } = useI18n();
  const { session, organization } = useSupabaseData();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('member');
  
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les membres depuis la base de données
  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('organization_id', session?.user?.id ? organization?.id : undefined)
        .order('created_at', { ascending: true });
        
      if (error) throw error;
      
      let fetchedMembers = data || [];
      
      // S'assurer que l'administrateur connecté apparaît toujours dans la liste
      // même s'il n'a pas encore été ajouté manuellement à la table team_members
      if (session?.user?.email) {
        const isAdminInList = fetchedMembers.some((m: any) => m.user_id === session.user.id);
        if (!isAdminInList) {
          fetchedMembers = [
            {
              id: session.user.id,
              user_id: session.user.id,
              email: session.user.email,
              role: 'admin',
              status: 'active',
              created_at: new Date().toISOString()
            },
            ...fetchedMembers
          ];
        }
      }
      
      setMembers(fetchedMembers);
    } catch (err) {
      console.error("Erreur de chargement de l'équipe:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id) {
      fetchMembers();
    }
  }, [session, organization?.id]);

  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsInviting(true);
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: authHeaders(session, { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ email, role, password })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de l\'invitation');
      
      alert(`Utilisateur créé : ${email} avec le rôle ${role}`);
      setEmail('');
      setPassword('');
      setRole('member');
      setInviteOpen(false);
      // Recharger la liste après invitation
      fetchMembers();
    } catch (err: any) {
      alert(`Erreur: ${err.message}`);
    } finally {
      setIsInviting(false);
    }
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
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-sidebar-border/40 text-muted-foreground">
              <th className="p-4 text-left font-medium">{lang === "fr" ? "Utilisateur" : "User"}</th>
              <th className="p-4 text-left font-medium">{lang === "fr" ? "Rôle" : "Role"}</th>
              <th className="p-4 text-left font-medium">{lang === "fr" ? "Statut" : "Status"}</th>
              <th className="p-4 text-left font-medium">{lang === "fr" ? "Ajouté le" : "Added"}</th>
              <th className="p-4 text-right font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">
                  Chargement...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground text-xs">
                  Aucun membre dans l'équipe
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="border-b border-sidebar-border/20 last:border-0 hover:bg-sidebar-accent/10 transition-colors">
                  <td className="p-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">
                        {member.email.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{member.email}</span>
                    </div>
                  </td>
                  <td className="p-4 align-middle">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                      {member.role === 'admin' ? <Shield className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                      {member.role === 'admin' ? 'Administrateur' : 'Membre'}
                    </span>
                  </td>
                  <td className="p-4 align-middle">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      member.status === 'active' 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    }`}>
                      {member.status === 'active' ? (lang === "fr" ? 'Actif' : 'Active') : (lang === "fr" ? 'En attente' : 'Pending')}
                    </span>
                  </td>
                  <td className="p-4 align-middle text-muted-foreground text-xs">
                    {new Date(member.created_at || member.date).toLocaleDateString()}
                  </td>
                  <td className="p-4 align-middle text-right">
                    {member.user_id !== session?.user?.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <form onSubmit={handleInvite}>
            <DialogHeader>
              <DialogTitle>{lang === "fr" ? "Inviter un membre" : "Invite a member"}</DialogTitle>
              <DialogDescription>
                {lang === "fr" ? "Créez un compte pour un membre de votre équipe en lui attribuant un mot de passe provisoire." : "Create an account for a team member and assign a temporary password."}
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
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-xs">{lang === "fr" ? "Mot de passe provisoire" : "Temporary password"}</Label>
                <Input
                  id="password"
                  type="text"
                  placeholder={lang === "fr" ? "ex: @Bienvenue2026!" : "e.g. @Welcome2026!"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 text-sm"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)} className="h-9 text-xs" disabled={isInviting}>
                Annuler
              </Button>
              <Button type="submit" className="h-9 text-xs" disabled={isInviting}>
                <Mail className="mr-2 h-3.5 w-3.5" />
                {isInviting ? (lang === "fr" ? "Envoi..." : "Sending...") : (lang === "fr" ? "Envoyer l'invitation" : "Send invitation")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
