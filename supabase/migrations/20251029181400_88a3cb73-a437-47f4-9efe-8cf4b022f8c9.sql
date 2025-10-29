-- Drop ALL existing insert policies to avoid conflicts
DROP POLICY IF EXISTS "Anyone can create inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Allow anonymous inscriptions" ON public.inscriptions;

-- Create a single clear policy for insertions that allows both anonymous and authenticated users
CREATE POLICY "enable_insert_for_all"
ON public.inscriptions
FOR INSERT
WITH CHECK (true);