/**
 * Hook personnalisé pour calculer les tarifs des séjours
 * Centralise toute la logique de calcul de prix
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateDaysBetween } from '@/lib/formatters';
import { CURRENT_TARIF_YEAR } from '@/lib/constants';

interface Sejour {
  id: string;
  type: string;
  date_debut: string;
  date_fin: string;
  [key: string]: any;
}

interface Tarif {
  qf_min: number;
  qf_max: number | null;
  tarif_journee_centre_aere: number;
  tarif_journee_sejour: number;
  [key: string]: any;
}

/**
 * Récupère les tarifs de l'année en cours
 */
export const useTarifs = () => {
  return useQuery({
    queryKey: ['tarifs', CURRENT_TARIF_YEAR],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tarifs')
        .select('*')
        .eq('annee', CURRENT_TARIF_YEAR)
        .order('qf_min', { ascending: true });
      
      if (error) throw error;
      return data as Tarif[] || [];
    },
  });
};

/**
 * Trouve le tarif applicable selon le quotient familial
 */
export const findApplicableTarif = (tarifs: Tarif[], quotientFamilial: number | null): Tarif | null => {
  if (!tarifs || tarifs.length === 0) return null;
  
  // Si pas de QF, utiliser une valeur très élevée pour obtenir le tarif plein
  const qf = quotientFamilial || 999999;
  
  return tarifs.find(t => 
    qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
  ) || tarifs[tarifs.length - 1];
};

/**
 * Calcule le prix d'un séjour selon le tarif applicable
 */
export const calculateSejourPrice = (
  sejour: Sejour | null,
  tarif: Tarif | null
): number | null => {
  if (!sejour || !tarif) return null;
  
  // Calculer le nombre de jours
  const nbJours = calculateDaysBetween(sejour.date_debut, sejour.date_fin);
  
  // Déterminer le type de tarif (animation/centre_aere vs séjour)
  const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
  const tarifJournalier = isCentreAere
    ? tarif.tarif_journee_centre_aere 
    : tarif.tarif_journee_sejour;
  
  return Number(tarifJournalier) * nbJours;
};

/**
 * Hook combiné qui retourne les tarifs et la fonction de calcul
 */
export const useTarifCalculator = (quotientFamilial: number | null = null) => {
  const { data: tarifs, ...query } = useTarifs();
  
  const calculatePrice = (sejour: Sejour | null): number | null => {
    if (!tarifs) return null;
    const tarif = findApplicableTarif(tarifs, quotientFamilial);
    return calculateSejourPrice(sejour, tarif);
  };
  
  return {
    tarifs,
    calculatePrice,
    ...query
  };
};
