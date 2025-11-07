/**
 * Composant : Informations d'attribution des séjours
 * Affiche les séjours effectivement attribués par la commission avec leurs coûts
 */

import { CheckCircle2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Sejour {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  type: string;
}

interface AttributionInfoProps {
  inscription: {
    sejour_attribue_1?: string;
    sejour_attribue_2?: string;
    sejour_2_non_attribue?: boolean;
    nombre_semaines_demandees: number;
  };
  sejours: Sejour[];
  calculatePrice: (sejourId: string) => number | null;
}

export function AttributionInfo({ inscription, sejours, calculatePrice }: AttributionInfoProps) {
  // Si aucun séjour n'est attribué, ne rien afficher
  if (!inscription.sejour_attribue_1 && !inscription.sejour_attribue_2 && !inscription.sejour_2_non_attribue) {
    return null;
  }

  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? sejour.titre : 'Non spécifié';
  };

  const getSejourDates = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    if (!sejour) return 'Non spécifié';
    return `${formatDate(sejour.date_debut)} - ${formatDate(sejour.date_fin)}`;
  };

  // Calculer le total à payer
  let totalAPayer = 0;
  if (inscription.sejour_attribue_1) {
    const prix1 = calculatePrice(inscription.sejour_attribue_1);
    if (prix1 !== null) totalAPayer += prix1;
  }
  if (inscription.sejour_attribue_2) {
    const prix2 = calculatePrice(inscription.sejour_attribue_2);
    if (prix2 !== null) totalAPayer += prix2;
  }
  // Si sejour_2_non_attribue, le coût est 0 (déjà inclus)

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle2 className="w-5 h-5 text-green-600" />
        <h2 className="text-xl font-semibold">Attribution finale</h2>
      </div>

      <Alert className="mb-4 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900 dark:text-blue-100">
          La commission d'attribution a étudié votre demande et a attribué les séjours suivants.
        </AlertDescription>
      </Alert>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
        {/* Séjour attribué 1 */}
        {inscription.sejour_attribue_1 && (
          <div className="bg-white dark:bg-background/50 rounded-lg p-4 border border-green-100 dark:border-green-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <h3 className="font-semibold text-green-900 dark:text-green-100">
                    {inscription.nombre_semaines_demandees === 1 ? 'Séjour attribué' : 'Première semaine'}
                  </h3>
                </div>
                <p className="font-medium text-lg">{getSejourTitle(inscription.sejour_attribue_1)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {getSejourDates(inscription.sejour_attribue_1)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-1">Coût</p>
                {calculatePrice(inscription.sejour_attribue_1) !== null && (
                  <Badge variant="default" className="text-base font-semibold bg-green-600">
                    {calculatePrice(inscription.sejour_attribue_1)?.toFixed(2)} €
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Séjour attribué 2 ou non attribué */}
        {inscription.nombre_semaines_demandees === 2 && (
          <>
            {inscription.sejour_attribue_2 && (
              <div className="bg-white dark:bg-background/50 rounded-lg p-4 border border-green-100 dark:border-green-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Deuxième semaine</h3>
                    </div>
                    <p className="font-medium text-lg">{getSejourTitle(inscription.sejour_attribue_2)}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getSejourDates(inscription.sejour_attribue_2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Coût</p>
                    {calculatePrice(inscription.sejour_attribue_2) !== null && (
                      <Badge variant="default" className="text-base font-semibold bg-green-600">
                        {calculatePrice(inscription.sejour_attribue_2)?.toFixed(2)} €
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            {inscription.sejour_2_non_attribue && (
              <div className="bg-white dark:bg-background/50 rounded-lg p-4 border border-orange-100 dark:border-orange-900">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Info className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">Deuxième semaine</h3>
                    </div>
                    <p className="font-medium text-orange-700 dark:text-orange-300">
                      N'a pas pu être attribué
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Aucun séjour disponible correspondant à vos critères
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Coût</p>
                    <Badge variant="secondary" className="text-base font-semibold">
                      0,00 €
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Total à payer */}
        <div className="pt-4 border-t-2 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
              TOTAL À PAYER
            </h3>
            <Badge variant="default" className="text-xl font-bold py-2 px-4 bg-green-700">
              {totalAPayer.toFixed(2)} €
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
