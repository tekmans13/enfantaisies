-- Ajouter une colonne pour stocker le nombre de semaines demandées
ALTER TABLE public.inscriptions 
ADD COLUMN nombre_semaines_demandees integer DEFAULT 1;

-- Mettre à jour les inscriptions existantes basées sur leurs préférences
UPDATE public.inscriptions 
SET nombre_semaines_demandees = 2 
WHERE sejour_preference_2 IS NOT NULL;

-- Ajouter un commentaire pour expliquer la colonne
COMMENT ON COLUMN public.inscriptions.nombre_semaines_demandees IS '1 = une semaine (avec choix alternatif si preference_2 renseigné), 2 = deux semaines distinctes';