CREATE POLICY "Users delete sejours"
ON public.sejours
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'user'::app_role));