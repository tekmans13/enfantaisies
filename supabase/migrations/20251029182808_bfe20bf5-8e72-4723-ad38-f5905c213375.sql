-- TOUT supprimer et repartir de zéro
DROP POLICY IF EXISTS "allow_anon_insert" ON public.inscriptions;
DROP POLICY IF EXISTS "allow_authenticated_insert" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins delete inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins update all inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins view all inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Users update own inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Users view own inscriptions" ON public.inscriptions;

-- Désactiver puis réactiver RLS pour forcer le rafraîchissement
ALTER TABLE public.inscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Créer des politiques simples et claires
CREATE POLICY "inscriptions_insert_policy"
ON public.inscriptions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "inscriptions_select_authenticated"
ON public.inscriptions
FOR SELECT
TO authenticated
USING (
  parent_email = (auth.jwt() ->> 'email'::text)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

CREATE POLICY "inscriptions_update_authenticated"
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

CREATE POLICY "inscriptions_delete_admin"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);