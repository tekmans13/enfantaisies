-- Ajouter les colonnes pour les détails des allergies et médicaments
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS allergies_details TEXT,
ADD COLUMN IF NOT EXISTS medication_details TEXT;