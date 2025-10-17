-- Ajouter la colonne pour les demandes spécifiques
ALTER TABLE public.inscriptions
ADD COLUMN IF NOT EXISTS demande_specifique TEXT;