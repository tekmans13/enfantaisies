-- Simplifier les politiques RLS pour inscriptions
-- Supprimer toutes les politiques existantes
DROP POLICY IF EXISTS "inscriptions_insert_anon" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert_authenticated" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_select_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_update_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_delete_policy" ON public.inscriptions;

-- Créer une politique INSERT simple qui fonctionne pour tout le monde (anon et authenticated)
CREATE POLICY "enable_insert_for_all"
ON public.inscriptions
FOR INSERT
WITH CHECK (true);

-- Créer une politique SELECT pour tous
CREATE POLICY "enable_select_for_all"
ON public.inscriptions
FOR SELECT
USING (
  -- Les utilisateurs anonymes ne peuvent rien voir
  -- Les utilisateurs authentifiés peuvent voir leurs propres inscriptions via email
  (auth.uid() IS NOT NULL AND parent_email = (auth.jwt() ->> 'email'::text))
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);

-- Créer une politique UPDATE
CREATE POLICY "enable_update_for_authenticated"
ON public.inscriptions
FOR UPDATE
TO authenticated
USING (
  parent_email = (auth.jwt() ->> 'email'::text) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
)
WITH CHECK (
  (parent_email = (auth.jwt() ->> 'email'::text) AND validated_by IS NULL) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);

-- Créer une politique DELETE pour admins et users uniquement
CREATE POLICY "enable_delete_for_staff"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);