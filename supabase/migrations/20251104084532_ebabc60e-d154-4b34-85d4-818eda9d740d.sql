-- Fix infinite recursion in user_roles RLS policies
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Recreate policies using the has_role security definer function
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can manage user roles" 
ON public.user_roles 
FOR ALL 
USING (
  public.has_role(auth.uid(), 'user'::app_role) 
  AND role = 'user'::app_role
);