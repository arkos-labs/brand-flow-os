-- Création de la table team_members
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activation de RLS (Row Level Security)
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Les administrateurs peuvent tout faire
CREATE POLICY "Admins can do everything" ON public.team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.role = 'admin'
        )
    );

-- Les membres actifs peuvent voir l'équipe
CREATE POLICY "Members can view team" ON public.team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.user_id = auth.uid() AND tm.status = 'active'
        )
    );

-- Un utilisateur peut s'ajouter en tant que premier admin (si la table est vide, à gérer selon votre logique)
-- Ou voir sa propre invitation
CREATE POLICY "Users can view their own invitations" ON public.team_members
    FOR SELECT USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
        OR user_id = auth.uid()
    );

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour la mise à jour
CREATE TRIGGER update_team_members_updated_at
BEFORE UPDATE ON public.team_members
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
