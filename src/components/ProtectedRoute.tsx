import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireRole?: "admin" | "user" | "both"; // both = admin ou user
}

export const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  requireRole
}: ProtectedRouteProps) => {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkAuth();
  }, [requireAdmin, requireRole]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setIsAuthorized(false);
        return;
      }

      // Si requireRole est spécifié, on l'utilise (priorité)
      if (requireRole) {
        if (requireRole === "both") {
          // Vérifier si l'utilisateur a le rôle admin OU user
          const { data: isAdmin } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'admin'
          });
          
          const { data: isUser } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: 'user'
          });

          if (!isAdmin && !isUser) {
            toast({
              title: "Accès refusé",
              description: "Vous devez avoir un rôle admin ou utilisateur",
              variant: "destructive",
            });
            setIsAuthorized(false);
            return;
          }
          
          setIsAuthorized(true);
        } else {
          // Vérifier un rôle spécifique
          const { data: hasRole, error } = await supabase.rpc('has_role', {
            _user_id: session.user.id,
            _role: requireRole
          });

          if (error) {
            console.error('Error checking role:', error);
            setIsAuthorized(false);
            toast({
              title: "Erreur",
              description: "Impossible de vérifier vos permissions",
              variant: "destructive",
            });
            return;
          }

          if (!hasRole) {
            toast({
              title: "Accès refusé",
              description: `Vous devez avoir le rôle ${requireRole}`,
              variant: "destructive",
            });
          }

          setIsAuthorized(hasRole || false);
        }
      } else if (requireAdmin) {
        // Ancien comportement pour compatibilité
        const { data: isAdmin, error } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin role:', error);
          setIsAuthorized(false);
          toast({
            title: "Erreur",
            description: "Impossible de vérifier vos permissions",
            variant: "destructive",
          });
          return;
        }

        if (!isAdmin) {
          toast({
            title: "Accès refusé",
            description: "Vous n'avez pas les permissions nécessaires",
            variant: "destructive",
          });
        }

        setIsAuthorized(isAdmin || false);
      } else {
        setIsAuthorized(true);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthorized(false);
    }
  };

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
