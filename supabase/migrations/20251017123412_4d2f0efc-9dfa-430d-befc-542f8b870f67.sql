-- Supprimer l'ancienne politique qui peut causer un conflit
DROP POLICY IF EXISTS "Users create own inscriptions" ON public.inscriptions;

-- Recréer une politique plus permissive pour les insertions anonymes
DROP POLICY IF EXISTS "Anonymous users can create inscriptions" ON public.inscriptions;

CREATE POLICY "Anyone can create inscriptions" 
ON public.inscriptions 
FOR INSERT 
WITH CHECK (true);