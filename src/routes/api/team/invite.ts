import { createFileRoute } from "@tanstack/react-router";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { requireAuthenticatedUserId } from "@/lib/auth-server";

export const Route = createFileRoute("/api/team/invite")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { email, role, password } = body;

          if (!email || !role || !password) {
            return new Response(JSON.stringify({ error: "Email, rôle et mot de passe requis" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Sécurité : on vérifie que l'utilisateur qui invite est bien connecté
          const auth = await requireAuthenticatedUserId(request);
          if ("error" in auth) return auth.error;
          const callerId = auth.userId;

          const supabaseAdmin = getSupabaseAdmin();

          // Récupérer le profile de l'admin pour avoir son organization_id
          const { data: adminProfile } = await supabaseAdmin
            .from('profiles')
            .select('organization_id')
            .eq('id', callerId)
            .single();

          if (!adminProfile || !adminProfile.organization_id) {
            return new Response(JSON.stringify({ error: "L'administrateur n'a pas d'organisation" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Optionnel : vérifier que le callerId est bien admin
          // (Si owner_id de l'organisation = callerId, il est admin)
          const { data: orgData } = await supabaseAdmin
            .from('organizations')
            .select('owner_id')
            .eq('id', adminProfile.organization_id)
            .single();

          let isAdmin = false;
          if (orgData && orgData.owner_id === callerId) {
            isAdmin = true;
          } else {
            const { data: callerData } = await supabaseAdmin
              .from('team_members')
              .select('role')
              .eq('user_id', callerId)
              .single();
            if (callerData && callerData.role === 'admin') {
              isAdmin = true;
            }
          }

          if (!isAdmin) {
            return new Response(JSON.stringify({ error: "Seuls les administrateurs peuvent inviter" }), {
              status: 403,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Créer l'utilisateur avec le mot de passe fourni via Supabase Auth
          const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Auto-confirmer l'email pour éviter la vérification
          });

          if (inviteError) {
            console.error("Erreur de création:", inviteError);
            return new Response(JSON.stringify({ error: inviteError.message }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // L'utilisateur a été créé, on l'ajoute dans team_members
          if (inviteData.user) {
            // Mettre à jour le profil de l'utilisateur pour le lier à l'organisation de l'admin
            await supabaseAdmin.from('profiles').update({
              organization_id: adminProfile.organization_id
            }).eq('id', inviteData.user.id);

            const { error: dbError } = await supabaseAdmin.from('team_members').insert({
              user_id: inviteData.user.id,
              email: email,
              role: role,
              status: 'active' // Directement actif car créé avec un mot de passe
            });

            if (dbError) {
              console.error("Erreur insertion BDD:", dbError);
              // On ne bloque pas pour autant la création qui est déjà faite
            }
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        } catch (error: any) {
          console.error("Erreur API invite:", error);
          return new Response(JSON.stringify({ error: error.message || "Erreur interne" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
