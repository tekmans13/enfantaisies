-- Vider la base et créer les nouveaux séjours
DELETE FROM public.documents;
DELETE FROM public.inscriptions;
DELETE FROM public.sejours;

-- PITCHOUNS
INSERT INTO public.sejours (titre, type, date_debut, date_fin, groupe_age, places_disponibles, lieu) VALUES
('Centre de loisirs', 'animation', '2025-07-07', '2025-07-11', 'pitchouns', 30, 'Sérignan'),
('Centre de loisirs', 'animation', '2025-07-15', '2025-07-18', 'pitchouns', 30, 'Sérignan'),
('Centre de loisirs', 'animation', '2025-07-21', '2025-07-25', 'pitchouns', 30, 'Sérignan');

-- MINOTS (7/9ans)
INSERT INTO public.sejours (titre, type, date_debut, date_fin, groupe_age, places_disponibles, lieu) VALUES
('Séjour Sérigons', 'sejour', '2025-07-06', '2025-07-11', 'minots', 25, 'Sérigons'),
('Centre de loisirs', 'animation', '2025-07-15', '2025-07-18', 'minots', 30, 'Sérignan'),
('Centre de loisirs', 'animation', '2025-07-21', '2025-07-25', 'minots', 30, 'Sérignan'),
('Séjour Sérigons', 'sejour', '2025-07-13', '2025-07-18', 'minots', 25, 'Sérigons');

-- MIAS (11/13ans)
INSERT INTO public.sejours (titre, type, date_debut, date_fin, groupe_age, places_disponibles, lieu) VALUES
('Séjour Sérigons', 'sejour', '2025-07-13', '2025-07-18', 'mias', 25, 'Sérigons'),
('Séjour Alpin Sérigons', 'sejour', '2025-07-20', '2025-07-25', 'mias', 20, 'Sérigons'),
('Séjour Alpin Sérigons', 'sejour', '2025-07-27', '2025-08-01', 'mias', 20, 'Sérigons');