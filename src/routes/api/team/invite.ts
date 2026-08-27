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

          // Optionnel : vérifier que le callerId est bien admin
          const { data: callerData } = await supabaseAdmin
            .from('team_members')
            .select('role')
            .eq('user_id', callerId)
            .single();

          if (callerData && callerData.role !== 'admin') {
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

          // L'utilisateur a été invité, on l'ajoute dans team_members
          if (inviteData.user) {
            const { error: dbError } = await supabaseAdmin.from('team_members').insert({
              user_id: inviteData.user.id,
              email: email,
              role: role,
              status: 'pending'
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
