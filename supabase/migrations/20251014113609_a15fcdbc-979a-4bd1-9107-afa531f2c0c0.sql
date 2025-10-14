
-- Ajouter le champ quotient_familial
ALTER TABLE public.inscriptions ADD COLUMN quotient_familial integer;

-- Ajouter les champs pour le parent 2
ALTER TABLE public.inscriptions ADD COLUMN parent2_first_name text;
ALTER TABLE public.inscriptions ADD COLUMN parent2_last_name text;
ALTER TABLE public.inscriptions ADD COLUMN parent2_email text;
ALTER TABLE public.inscriptions ADD COLUMN parent2_authority text;
ALTER TABLE public.inscriptions ADD COLUMN parent2_mobile text;
ALTER TABLE public.inscriptions ADD COLUMN parent2_office_phone text;
