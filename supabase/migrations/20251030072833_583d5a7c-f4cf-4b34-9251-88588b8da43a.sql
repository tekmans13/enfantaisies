-- Supprimer les colonnes no_pork et no_meat
ALTER TABLE public.inscriptions 
DROP COLUMN IF EXISTS no_pork,
DROP COLUMN IF EXISTS no_meat;

-- Remplacer has_food_allergies (boolean) par food_allergies_details (text)
ALTER TABLE public.inscriptions 
DROP COLUMN IF EXISTS has_food_allergies;

ALTER TABLE public.inscriptions 
ADD COLUMN food_allergies_details TEXT;