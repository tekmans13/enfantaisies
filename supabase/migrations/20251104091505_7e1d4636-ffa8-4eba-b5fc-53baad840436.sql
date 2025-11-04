-- Corriger la politique SELECT pour permettre aux utilisateurs anonymes
-- de lire l'inscription qu'ils viennent de créer (basé sur l'heure de création récente)

DROP POLICY IF EXISTS "enable_select_for_all" ON public.inscriptions;

CREATE POLICY "enable_select_for_all"
ON public.inscriptions
FOR SELECT
USING (
  -- Les utilisateurs authentifiés peuvent voir leurs propres inscriptions
  (auth.uid() IS NOT NULL AND parent_email = (auth.jwt() ->> 'email'::text))
  -- Les admins et users peuvent tout voir
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'user'::app_role)
  -- Les utilisateurs anonymes peuvent voir les inscriptions créées il y a moins de 5 minutes
  -- (pour permettre le .select() après l'INSERT)
  OR (auth.uid() IS NULL AND created_at > (now() - interval '5 minutes'))
);