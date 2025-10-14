-- Create storage bucket for inscription documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('inscription-documents', 'inscription-documents', false);

-- Create table to track uploaded documents
CREATE TABLE public.inscription_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inscription_id UUID REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inscription_documents ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own documents
CREATE POLICY "Users can insert their own documents"
ON public.inscription_documents
FOR INSERT
WITH CHECK (true);

-- Allow users to view their own documents
CREATE POLICY "Users can view their own documents"
ON public.inscription_documents
FOR SELECT
USING (true);

-- Storage policies for inscription documents
CREATE POLICY "Anyone can upload inscription documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'inscription-documents');

CREATE POLICY "Anyone can view their inscription documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inscription-documents');

CREATE POLICY "Anyone can update their inscription documents"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'inscription-documents');

CREATE POLICY "Anyone can delete their inscription documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'inscription-documents');