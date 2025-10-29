-- Drop the existing insert policy
DROP POLICY IF EXISTS "Anyone can create inscriptions" ON public.inscriptions;

-- Create a new policy that explicitly allows anonymous users to insert
CREATE POLICY "Allow anonymous inscriptions"
ON public.inscriptions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);