-- 1. Ajouter la colonne organization_id à la table team_members
ALTER TABLE public.team_members 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- 2. Mettre à jour les anciennes entrées pour éviter de perdre les données existantes
UPDATE public.team_members tm
SET organization_id = p.organization_id
FROM public.profiles p
WHERE tm.user_id = p.id AND p.organization_id IS NOT NULL;

-- 3. Rendre la colonne NOT NULL pour les futurs ajouts (optionnel, mais recommandé)
-- ALTER TABLE public.team_members ALTER COLUMN organization_id SET NOT NULL;

-- 4. Supprimer les anciennes règles de sécurité (RLS)
DROP POLICY IF EXISTS "Admins can do everything" ON public.team_members;
DROP POLICY IF EXISTS "Members can view team" ON public.team_members;

-- 5. Créer les nouvelles règles de sécurité basées sur l'organisation
-- Les admins d'une organisation peuvent tout faire sur les membres de cette organisation
CREATE POLICY "Admins can manage organization members" ON public.team_members
    FOR ALL USING (
        EXISTS (
            -- Soit l'utilisateur est le propriétaire de l'organisation
            SELECT 1 FROM public.organizations org
            WHERE org.id = team_members.organization_id AND org.owner_id = auth.uid()
        )
        OR
        EXISTS (
            -- Soit il est admin dans cette organisation
            SELECT 1 FROM public.team_members tm
            WHERE tm.organization_id = team_members.organization_id 
            AND tm.user_id = auth.uid() 
            AND tm.role = 'admin'
        )
    );

-- Les membres actifs peuvent voir les membres de LEUR organisation
CREATE POLICY "Members can view organization team" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.organization_id = team_members.organization_id 
            AND tm.user_id = auth.uid() 
            AND tm.status = 'active'
        )
        OR
        EXISTS (
            SELECT 1 FROM public.organizations org
            WHERE org.id = team_members.organization_id AND org.owner_id = auth.uid()
        )
    );
