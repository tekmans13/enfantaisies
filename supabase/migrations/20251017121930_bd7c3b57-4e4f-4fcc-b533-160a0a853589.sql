-- Ajouter une politique pour permettre aux admins de supprimer les inscriptions
CREATE POLICY "Admins delete inscriptions" 
ON public.inscriptions 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));