-- Ajouter les colonnes pour les choix alternatifs de chaque semaine
ALTER TABLE public.inscriptions 
ADD COLUMN sejour_preference_1_alternatif uuid,
ADD COLUMN sejour_preference_2_alternatif uuid;

-- Ajouter des commentaires pour expliquer les colonnes
COMMENT ON COLUMN public.inscriptions.sejour_preference_1_alternatif IS 'Choix alternatif pour la première semaine';
COMMENT ON COLUMN public.inscriptions.sejour_preference_2_alternatif IS 'Choix alternatif pour la deuxième semaine';