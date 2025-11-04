-- Ajouter une politique INSERT spécifique pour les utilisateurs authentifiés
-- en plus de celle pour public (anon)

CREATE POLICY "inscriptions_insert_authenticated"
ON public.inscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- S'assurer que la politique pour anon existe toujours
-- (elle existe déjà mais on la recrée par sécurité)
DROP POLICY IF EXISTS "inscriptions_insert_public" ON public.inscriptions;

CREATE POLICY "inscriptions_insert_anon"
ON public.inscriptions
FOR INSERT
TO anon
WITH CHECK (true);