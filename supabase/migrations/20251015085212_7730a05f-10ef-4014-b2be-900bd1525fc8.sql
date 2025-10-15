-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Only admins can manage roles
CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Update inscriptions RLS policies to use authentication
DROP POLICY IF EXISTS "Parents peuvent voir leurs inscriptions via email" ON public.inscriptions;
DROP POLICY IF EXISTS "Parents peuvent créer des inscriptions" ON public.inscriptions;
DROP POLICY IF EXISTS "Tout le monde peut modifier ses inscriptions" ON public.inscriptions;

-- Users can view their own inscriptions
CREATE POLICY "Users view own inscriptions"
ON public.inscriptions FOR SELECT
TO authenticated
USING (parent_email = auth.jwt()->>'email');

-- Admins can view all inscriptions
CREATE POLICY "Admins view all inscriptions"
ON public.inscriptions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can create their own inscriptions
CREATE POLICY "Users create own inscriptions"
ON public.inscriptions FOR INSERT
TO authenticated
WITH CHECK (parent_email = auth.jwt()->>'email');

-- Users can update their own unvalidated inscriptions
CREATE POLICY "Users update own inscriptions"
ON public.inscriptions FOR UPDATE
TO authenticated
USING (parent_email = auth.jwt()->>'email')
WITH CHECK (parent_email = auth.jwt()->>'email' AND validated_by IS NULL);

-- Admins can update all inscriptions
CREATE POLICY "Admins update all inscriptions"
ON public.inscriptions FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix sejours policies
DROP POLICY IF EXISTS "Bureau peut créer des séjours" ON public.sejours;
DROP POLICY IF EXISTS "Bureau peut modifier les séjours" ON public.sejours;
DROP POLICY IF EXISTS "Bureau peut supprimer les séjours" ON public.sejours;

CREATE POLICY "Admins create sejours"
ON public.sejours FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update sejours"
ON public.sejours FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete sejours"
ON public.sejours FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Fix tarifs policies
DROP POLICY IF EXISTS "Bureau peut créer des tarifs" ON public.tarifs;
DROP POLICY IF EXISTS "Bureau peut modifier les tarifs" ON public.tarifs;
DROP POLICY IF EXISTS "Bureau peut supprimer les tarifs" ON public.tarifs;

CREATE POLICY "Admins create tarifs"
ON public.tarifs FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update tarifs"
ON public.tarifs FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete tarifs"
ON public.tarifs FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));