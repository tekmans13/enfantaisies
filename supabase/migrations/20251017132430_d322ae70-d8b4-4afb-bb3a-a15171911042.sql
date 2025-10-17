-- Ajouter le statut 'attribuee' aux valeurs possibles
-- Vérifier d'abord le type de la colonne status dans inscriptions
DO $$ 
BEGIN
  -- La colonne status est de type text, donc on peut simplement utiliser 'attribuee'
  -- Pas besoin de modifier le type
END $$;