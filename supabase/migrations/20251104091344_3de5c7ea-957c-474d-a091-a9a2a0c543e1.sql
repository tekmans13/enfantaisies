-- Utiliser ALTER DEFAULT PRIVILEGES pour s'assurer que les permissions persistent
-- Cette approche est recommandée par Supabase pour garantir que les permissions sont bien appliquées

-- D'abord, révoquer toutes les permissions existantes pour repartir à zéro
REVOKE ALL ON public.inscriptions FROM anon;
REVOKE ALL ON public.inscriptions FROM authenticated;

-- Accorder les permissions de base
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Permissions pour anon (utilisateurs non authentifiés)
GRANT INSERT, SELECT ON public.inscriptions TO anon;

-- Permissions pour authenticated (utilisateurs authentifiés)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inscriptions TO authenticated;

-- Permissions sur les séquences (pour les IDs auto-générés)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Définir les permissions par défaut pour les futures tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT INSERT, SELECT ON TABLES TO anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;