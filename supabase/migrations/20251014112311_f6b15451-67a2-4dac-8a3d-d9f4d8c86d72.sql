
-- Supprimer la contrainte d'unicité actuelle
ALTER TABLE public.tarifs DROP CONSTRAINT IF EXISTS tarifs_annee_tarif_numero_key;

-- Ajouter une nouvelle contrainte d'unicité incluant qf_min
ALTER TABLE public.tarifs ADD CONSTRAINT tarifs_annee_tarif_numero_qf_min_key UNIQUE (annee, tarif_numero, qf_min);

-- Supprimer l'ancien tarif 1
DELETE FROM public.tarifs WHERE tarif_numero = 1 AND annee = 2025;

-- Insérer les 3 nouvelles lignes pour tarif 1
INSERT INTO public.tarifs (annee, tarif_numero, qf_min, qf_max, tarif_journee_centre_aere, tarif_journee_sejour, tarif_semaine_centre_aere, tarif_semaine_sejour)
VALUES 
  (2025, 1, 0, 100, 3.20, 2.50, 16.00, 15.00),
  (2025, 1, 101, 200, 3.20, 2.50, 16.00, 15.00),
  (2025, 1, 201, 300, 3.20, 2.50, 16.00, 15.00);
