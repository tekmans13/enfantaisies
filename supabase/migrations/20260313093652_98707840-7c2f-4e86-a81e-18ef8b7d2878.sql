CREATE POLICY "Users update sejours"
ON public.sejours
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'user'::app_role));