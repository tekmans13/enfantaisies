-- Créer une table pour stocker la configuration Stripe
CREATE TABLE IF NOT EXISTS public.stripe_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  publishable_key TEXT,
  secret_key TEXT,
  webhook_secret TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.stripe_config ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture aux administrateurs uniquement
CREATE POLICY "Admins can read stripe config"
ON public.stripe_config
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour permettre l'insertion aux administrateurs uniquement
CREATE POLICY "Admins can insert stripe config"
ON public.stripe_config
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Politique pour permettre la mise à jour aux administrateurs uniquement
CREATE POLICY "Admins can update stripe config"
ON public.stripe_config
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Créer un trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER update_stripe_config_updated_at
BEFORE UPDATE ON public.stripe_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();