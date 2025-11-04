-- Annuler la politique SELECT bizarre avec fenêtre de 5 minutes
DROP POLICY IF EXISTS "enable_select_for_all" ON public.inscriptions;

-- Recréer une politique SELECT normale et sécurisée
CREATE POLICY "enable_select_for_all"
ON public.inscriptions
FOR SELECT
USING (
  -- Les utilisateurs authentifiés peuvent voir leurs propres inscriptions
  (auth.uid() IS NOT NULL AND parent_email = (auth.jwt() ->> 'email'::text))
  -- Les admins et users peuvent tout voir
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
);