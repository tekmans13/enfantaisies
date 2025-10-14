-- Permettre la gestion complète des séjours depuis le bureau
-- Ajout des policies pour INSERT, UPDATE et DELETE

CREATE POLICY "Bureau peut créer des séjours"
ON public.sejours
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Bureau peut modifier les séjours"
ON public.sejours
FOR UPDATE
USING (true);

CREATE POLICY "Bureau peut supprimer les séjours"
ON public.sejours
FOR DELETE
USING (true);