-- Déplacer les champs Stripe de organizations vers profiles
ALTER TABLE public.profiles
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text,
ADD COLUMN plan_tier text DEFAULT 'solo';

-- Optionnel : Supprimer les colonnes de organizations si vous êtes sûr qu'elles ne serviront plus
-- ALTER TABLE public.organizations
-- DROP COLUMN stripe_customer_id,
-- DROP COLUMN stripe_subscription_id,
-- DROP COLUMN plan_tier;

-- Rafraîchir le cache PostgREST si nécessaire (via l'interface Supabase)
