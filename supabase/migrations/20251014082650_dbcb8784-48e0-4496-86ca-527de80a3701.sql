-- Table pour les groupes d'âge
CREATE TYPE age_group AS ENUM ('pitchouns', 'minots', 'mias');

-- Table pour les types de séjours
CREATE TABLE public.sejours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  type TEXT NOT NULL, -- 'sejour' ou 'animation'
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  groupe_age age_group NOT NULL,
  places_disponibles INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les inscriptions
CREATE TABLE public.inscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Étape 2 - Préalables
  is_first_inscription BOOLEAN DEFAULT false,
  has_medication BOOLEAN DEFAULT false,
  has_allergies BOOLEAN DEFAULT false,
  has_food_allergies BOOLEAN DEFAULT false,
  no_pork BOOLEAN DEFAULT false,
  no_meat BOOLEAN DEFAULT false,
  
  -- Étape 3 - Enfant
  child_first_name TEXT NOT NULL,
  child_last_name TEXT NOT NULL,
  child_birth_date DATE NOT NULL,
  child_class TEXT NOT NULL,
  child_gender TEXT NOT NULL,
  child_school TEXT NOT NULL,
  child_age_group age_group,
  
  -- Responsable légal 1
  parent_first_name TEXT NOT NULL,
  parent_last_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_authority TEXT NOT NULL,
  parent_mobile TEXT NOT NULL,
  parent_office_phone TEXT,
  parent_address TEXT NOT NULL,
  caf_number TEXT,
  social_security_regime TEXT NOT NULL,
  
  -- Étape 4 - Séjours (préférences)
  sejour_preference_1 UUID REFERENCES public.sejours(id),
  sejour_preference_2 UUID REFERENCES public.sejours(id),
  
  -- Statut de validation
  status TEXT DEFAULT 'en_attente', -- 'en_attente', 'validee', 'refusee'
  validated_by UUID,
  validated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table pour les documents uploadés
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscription_id UUID REFERENCES public.inscriptions(id) ON DELETE CASCADE,
  type_document TEXT NOT NULL, -- 'fiche_sanitaire', 'autorisation_parentale', etc.
  file_url TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sejours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Policies pour sejours (lecture publique)
CREATE POLICY "Tout le monde peut voir les séjours"
ON public.sejours FOR SELECT
USING (true);

-- Policies pour inscriptions (les parents peuvent créer et voir leurs propres inscriptions)
CREATE POLICY "Parents peuvent créer des inscriptions"
ON public.inscriptions FOR INSERT
WITH CHECK (true);

CREATE POLICY "Parents peuvent voir leurs inscriptions via email"
ON public.inscriptions FOR SELECT
USING (true);

CREATE POLICY "Tout le monde peut modifier ses inscriptions"
ON public.inscriptions FOR UPDATE
USING (true);

-- Policies pour documents
CREATE POLICY "Tout le monde peut uploader des documents"
ON public.documents FOR INSERT
WITH CHECK (true);

CREATE POLICY "Tout le monde peut voir les documents"
ON public.documents FOR SELECT
USING (true);

-- Trigger pour mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inscriptions_updated_at
BEFORE UPDATE ON public.inscriptions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer automatiquement le groupe d'âge
CREATE OR REPLACE FUNCTION calculate_age_group(birth_date DATE, class_level TEXT)
RETURNS age_group AS $$
BEGIN
  -- Pitchouns: 4 ans révolus, MS, GS ou CP
  IF class_level IN ('ms', 'gs', 'cp') THEN
    RETURN 'pitchouns'::age_group;
  -- Minots: CE1, CE2, CM1
  ELSIF class_level IN ('ce1', 'ce2', 'cm1') THEN
    RETURN 'minots'::age_group;
  -- Mias: CM2 à 4ème
  ELSIF class_level IN ('cm2', '6eme', '5eme', '4eme') THEN
    RETURN 'mias'::age_group;
  ELSE
    RETURN 'pitchouns'::age_group; -- défaut
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Insérer quelques séjours de test
INSERT INTO public.sejours (titre, type, date_debut, date_fin, groupe_age, places_disponibles) VALUES
('Semaine Découverte Nature - Pitchouns', 'sejour', '2025-07-07', '2025-07-11', 'pitchouns', 20),
('Animation Centre - Pitchouns', 'animation', '2025-07-14', '2025-07-18', 'pitchouns', 30),
('Camp Aventure - Minots', 'sejour', '2025-07-07', '2025-07-13', 'minots', 25),
('Animation Sportive - Minots', 'animation', '2025-07-21', '2025-07-25', 'minots', 30),
('Séjour Montagne - Mias', 'sejour', '2025-07-14', '2025-07-20', 'mias', 20),
('Animation Artistique - Mias', 'animation', '2025-07-28', '2025-08-01', 'mias', 25);