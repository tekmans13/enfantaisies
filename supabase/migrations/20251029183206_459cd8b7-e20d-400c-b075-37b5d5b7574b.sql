-- Supprimer la politique INSERT existante
DROP POLICY IF EXISTS "inscriptions_insert_policy" ON public.inscriptions;

-- Créer une politique INSERT explicite pour le rôle anon
CREATE POLICY "inscriptions_insert_anon"
ON public.inscriptions
FOR INSERT
TO anon
WITH CHECK (true);

-- Créer une politique INSERT pour les utilisateurs authentifiés
CREATE POLICY "inscriptions_insert_authenticated"
ON public.inscriptions
FOR INSERT
TO authenticated
WITH CHECK (true);