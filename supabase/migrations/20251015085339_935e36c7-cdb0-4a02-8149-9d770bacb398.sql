-- Allow anonymous users to create inscriptions (for public registration form)
CREATE POLICY "Anonymous users can create inscriptions"
ON public.inscriptions FOR INSERT
TO anon
WITH CHECK (true);

-- Update document policies to allow anonymous upload during registration
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.inscription_documents;

CREATE POLICY "Anonymous can upload documents"
ON public.inscription_documents FOR INSERT
TO anon
WITH CHECK (true);

-- Allow anonymous to upload to storage during registration
DROP POLICY IF EXISTS "Anyone can upload inscription documents" ON storage.objects;

CREATE POLICY "Anyone can upload inscription documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'inscription-documents');