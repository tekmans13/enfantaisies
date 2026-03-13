CREATE POLICY "Users create sejours"
ON public.sejours
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'user'::app_role));