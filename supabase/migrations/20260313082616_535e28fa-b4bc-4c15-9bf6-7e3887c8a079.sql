CREATE POLICY "Users create tarifs"
ON public.tarifs
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Users update tarifs"
ON public.tarifs
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Users delete tarifs"
ON public.tarifs
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'user'::app_role));