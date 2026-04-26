-- Fix : autoriser explicitement les rôles 'admin' ET 'user' à supprimer
-- les inscriptions et leurs documents associés. Sans policy DELETE sur
-- inscription_documents, RLS filtrait silencieusement la requête (0 ligne
-- supprimée sans erreur) → faux succès côté UI.

-- ============ inscriptions ============
DROP POLICY IF EXISTS "inscriptions_delete_policy" ON public.inscriptions;
DROP POLICY IF EXISTS "inscriptions_delete_admin" ON public.inscriptions;
DROP POLICY IF EXISTS "Admins delete inscriptions" ON public.inscriptions;

CREATE POLICY "inscriptions_delete_policy"
ON public.inscriptions
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);

-- ============ inscription_documents ============
DROP POLICY IF EXISTS "inscription_documents_delete_policy" ON public.inscription_documents;

CREATE POLICY "inscription_documents_delete_policy"
ON public.inscription_documents
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'user'::app_role)
);
