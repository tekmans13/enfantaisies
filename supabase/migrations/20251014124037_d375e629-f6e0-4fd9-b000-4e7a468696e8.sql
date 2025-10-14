-- Ajouter le champ de statut de paiement à la table inscriptions
ALTER TABLE public.inscriptions 
ADD COLUMN paiement_statut text DEFAULT 'en_attente' CHECK (paiement_statut IN ('en_attente', 'paye', 'echoue', 'rembourse'));

-- Ajouter un champ pour stocker l'ID de paiement Stripe
ALTER TABLE public.inscriptions 
ADD COLUMN stripe_payment_id text;

-- Ajouter un champ pour la date de paiement
ALTER TABLE public.inscriptions 
ADD COLUMN paiement_date timestamp with time zone;