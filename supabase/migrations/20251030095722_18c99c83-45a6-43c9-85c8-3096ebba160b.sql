-- Corriger le search_path pour les fonctions existantes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.calculate_age_group(birth_date date, class_level text)
RETURNS age_group
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Pitchouns: 4 ans révolus, MS, GS ou CP
  IF class_level IN ('ms', 'gs', 'cp') THEN
    RETURN 'pitchouns'::age_group;
  -- Minots: CE1, CE2, CM1
  ELSIF class_level IN ('ce1', 'ce2', 'cm1') THEN
    RETURN 'minots'::age_group;
  -- Mias: CM2 à 4ème
  ELSIF class_level IN ('cm2', '6eme', '5eme', '4eme') THEN
    RETURN 'mias'::age_group;
  ELSE
    RETURN 'pitchouns'::age_group; -- défaut
  END IF;
END;
$function$;