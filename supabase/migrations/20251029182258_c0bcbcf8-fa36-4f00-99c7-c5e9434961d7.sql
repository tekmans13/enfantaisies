-- Réactiver RLS
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;

-- Drop toutes les politiques INSERT existantes
DROP POLICY IF EXISTS "enable_insert_for_anon_and_authenticated" ON public.inscriptions;
DROP POLICY IF EXISTS "enable_insert_for_all" ON public.inscriptions;
DROP POLICY IF EXISTS "Anyone can create inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Allow anonymous inscriptions" ON public.inscriptions;

-- Créer UNE SEULE politique INSERT claire et simple
CREATE POLICY "allow_public_insert"
ON public.inscriptions
FOR INSERT
TO public
WITH CHECK (true);