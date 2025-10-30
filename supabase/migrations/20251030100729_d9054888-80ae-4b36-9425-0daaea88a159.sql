-- Table pour gérer le contenu de la page d'accueil
CREATE TABLE public.home_content (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  title text,
  description text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.home_content ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir le contenu
CREATE POLICY "Tout le monde peut voir le contenu de la page d'accueil" 
ON public.home_content 
FOR SELECT 
USING (true);

-- Seuls les admins peuvent modifier
CREATE POLICY "Admins can update home content" 
ON public.home_content 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert home content" 
ON public.home_content 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_home_content_updated_at
BEFORE UPDATE ON public.home_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insérer les valeurs par défaut
INSERT INTO public.home_content (section_key, title, description) VALUES
('intro', NULL, 'Parce qu''Enfantaisies, c''est bien plus qu''un centre aéré. C''est un lieu unique où parents et enfants construisent ensemble des moments de partage, de créativité et de plaisir. Premier centre aéré parental de France, Enfantaisies place la parentalité, la solidarité et la vie de quartier au cœur de son projet. Entre activités, spectacles et partenariats locaux, chaque journée est une fête pour grandir, apprendre et rêver ensemble.'),
('groupes', 'Groupes adaptés', 'Pitchouns, Minots et Mias : chaque enfant dans le groupe qui lui correspond'),
('sejours', 'Séjours variés', 'Animations au centre ou séjours découverte selon vos préférences'),
('inscription', 'Inscription simplifiée', 'Formulaire progressif, validation du bureau et suivi en ligne');