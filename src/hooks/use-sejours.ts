import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSejours = (ageGroup?: string) => {
  return useQuery({
    queryKey: ['sejours', ageGroup],
    queryFn: async () => {
      // Si le groupe d'âge n'est pas défini, retourner une liste vide
      if (!ageGroup || !['pitchouns', 'minots', 'mias'].includes(ageGroup)) {
        return [];
      }
      
      const { data, error } = await supabase
        .from('sejours')
        .select('*')
        .eq('groupe_age', ageGroup as 'pitchouns' | 'minots' | 'mias')
        .order('date_debut', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};
