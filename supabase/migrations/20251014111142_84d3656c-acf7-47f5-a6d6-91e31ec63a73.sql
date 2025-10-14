-- Créer la table des tarifs
CREATE TABLE public.tarifs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  annee INTEGER NOT NULL DEFAULT 2025,
  tarif_numero INTEGER NOT NULL,
  qf_min INTEGER NOT NULL,
  qf_max INTEGER,
  tarif_journee_centre_aere DECIMAL(10,2) NOT NULL,
  tarif_journee_sejour DECIMAL(10,2) NOT NULL,
  tarif_semaine_centre_aere DECIMAL(10,2) NOT NULL,
  tarif_semaine_sejour DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(annee, tarif_numero)
);

-- Activer RLS
ALTER TABLE public.tarifs ENABLE ROW LEVEL SECURITY;

-- Politique pour lire les tarifs (tout le monde)
CREATE POLICY "Tout le monde peut voir les tarifs"
ON public.tarifs
FOR SELECT
USING (true);

-- Politique pour créer des tarifs (bureau)
CREATE POLICY "Bureau peut créer des tarifs"
ON public.tarifs
FOR INSERT
WITH CHECK (true);

-- Politique pour modifier des tarifs (bureau)
CREATE POLICY "Bureau peut modifier les tarifs"
ON public.tarifs
FOR UPDATE
USING (true);

-- Politique pour supprimer des tarifs (bureau)
CREATE POLICY "Bureau peut supprimer les tarifs"
ON public.tarifs
FOR DELETE
USING (true);

-- Trigger pour updated_at
CREATE TRIGGER update_tarifs_updated_at
BEFORE UPDATE ON public.tarifs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les tarifs 2025
INSERT INTO public.tarifs (annee, tarif_numero, qf_min, qf_max, tarif_journee_centre_aere, tarif_journee_sejour, tarif_semaine_centre_aere, tarif_semaine_sejour) VALUES
(2025, 1, 0, 300, 3.2, 12.5, 16, 75),
(2025, 2, 301, 400, 4.4, 16.0, 22, 96),
(2025, 3, 401, 500, 5.2, 16.0, 26, 96),
(2025, 4, 501, 600, 5.6, 16.0, 28, 96),
(2025, 5, 601, 700, 7.6, 19.0, 38, 114),
(2025, 6, 701, 800, 8.4, 19.0, 42, 114),
(2025, 7, 801, 900, 9.2, 19.0, 46, 114),
(2025, 8, 901, 1000, 10.0, 24.0, 50, 144),
(2025, 9, 1001, 1100, 10.8, 24.0, 54, 144),
(2025, 10, 1101, 1200, 11.6, 24.0, 58, 144),
(2025, 11, 1201, 1500, 16.0, 30.0, 80, 180),
(2025, 12, 1501, NULL, 19.0, 36.2, 95, 217);