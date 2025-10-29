-- Drop the existing policy
DROP POLICY IF EXISTS "enable_insert_for_all" ON public.inscriptions;

-- Create policy explicitly for anon and authenticated roles
CREATE POLICY "enable_insert_for_anon_and_authenticated"
ON public.inscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);