-- Create a public bucket for centre documents
INSERT INTO storage.buckets (id, name, public) VALUES ('centre-documents', 'centre-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload/update documents
CREATE POLICY "Authenticated users can upload centre documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'centre-documents');

CREATE POLICY "Authenticated users can update centre documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'centre-documents');

CREATE POLICY "Anyone can read centre documents"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'centre-documents');