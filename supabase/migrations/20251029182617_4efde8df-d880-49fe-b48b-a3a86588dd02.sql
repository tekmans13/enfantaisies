-- Supprimer la politique incorrecte
DROP POLICY IF EXISTS "allow_public_insert" ON public.inscriptions;

-- Créer la bonne politique pour le rôle anon (utilisateurs non authentifiés)
CREATE POLICY "allow_anon_insert"
ON public.inscriptions
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

-- Aussi pour les utilisateurs authentifiés
CREATE POLICY "allow_authenticated_insert"
ON public.inscriptions
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);