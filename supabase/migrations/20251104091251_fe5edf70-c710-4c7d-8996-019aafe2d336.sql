-- Réappliquer les permissions essentielles pour anon et authenticated
-- Ces permissions sont nécessaires même avec les politiques RLS

-- Pour le rôle anon (utilisateurs non authentifiés)
GRANT USAGE ON SCHEMA public TO anon;
GRANT INSERT, SELECT ON public.inscriptions TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Pour le rôle authenticated (utilisateurs authentifiés)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.inscriptions TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Vérifier que les permissions sont bien appliquées
DO $$
BEGIN
  RAISE NOTICE 'Permissions appliquées pour anon et authenticated sur inscriptions';
END $$;