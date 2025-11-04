-- Accorder les permissions nécessaires au role anon sur la table inscriptions
GRANT INSERT ON public.inscriptions TO anon;
GRANT SELECT ON public.inscriptions TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Faire de même pour authenticated pour être sûr
GRANT ALL ON public.inscriptions TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;