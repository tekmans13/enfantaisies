-- Ajouter un champ pour marquer qu'une semaine n'a pas pu être attribuée
ALTER TABLE public.inscriptions 
ADD COLUMN IF NOT EXISTS sejour_2_non_attribue boolean DEFAULT false;

COMMENT ON COLUMN public.inscriptions.sejour_2_non_attribue IS 'Indique si la commission n''a pas pu attribuer la 2ème semaine';