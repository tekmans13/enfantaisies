-- Ajouter les colonnes pour les séjours attribués par le bureau
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS sejour_attribue_1 uuid REFERENCES public.sejours(id),
ADD COLUMN IF NOT EXISTS sejour_attribue_2 uuid REFERENCES public.sejours(id);