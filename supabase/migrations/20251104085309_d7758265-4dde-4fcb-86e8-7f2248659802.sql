-- Nettoyer toutes les anciennes politiques RLS sur inscriptions
DROP POLICY IF EXISTS "Parents peuvent créer des inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Parents peuvent voir leurs inscriptions via email" ON public.inscriptions;
DROP POLICY IF EXISTS "Tout le monde peut modifier ses inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Users view own inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins view all inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Users create own inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Users update own inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins update all inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Anonymous users can create inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Anyone can create inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Allow anonymous inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert_anon" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_insert_authenticated" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_select_authenticated" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_update_authenticated" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_delete_admin" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins delete inscriptions" ON public.inscriptions;

-- Créer les politiques propres et définitives

-- INSERT: Permettre à tout le monde (anon et authenticated) de créer des inscriptions
CREATE POLICY "inscriptions_insert_public"
ON public.inscriptions
FOR INSERT
TO public
WITH CHECK (true);

-- SELECT: Les parents peuvent voir leurs propres inscriptions via email, les admins/users peuvent tout voir
CREATE POLICY "inscriptions_select_policy"
ON public.inscriptions
FOR SELECT
TO public
USING (
  parent_email = (auth.jwt() ->> 'email'::text) 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);

-- UPDATE: Les parents peuvent modifier leurs inscriptions non validées, les admins/users peuvent tout modifier
CREATE POLICY "inscriptions_update_policy"
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

-- DELETE: Seulement les admins et users peuvent supprimer
CREATE POLICY "inscriptions_delete_policy"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);