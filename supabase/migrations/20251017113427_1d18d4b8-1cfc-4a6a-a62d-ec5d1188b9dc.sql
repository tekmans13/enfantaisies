-- Ajouter une colonne tls à la table smtp_config
ALTER TABLE public.smtp_config ADD COLUMN IF NOT EXISTS tls boolean NOT NULL DEFAULT false;