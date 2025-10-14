import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useSejours = (ageGroup?: string) => {
  return useQuery({
    queryKey: ['sejours', ageGroup],
    queryFn: async () => {
      let query = supabase
        .from('sejours')
        .select('*')
        .order('date_debut', { ascending: true });
      
      if (ageGroup && ['pitchouns', 'minots', 'mias'].includes(ageGroup)) {
        query = query.eq('groupe_age', ageGroup as 'pitchouns' | 'minots' | 'mias');
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });
};
