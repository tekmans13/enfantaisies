/**
 * Composant : Informations des séjours (Récapitulatif)
 * Affiche les séjours choisis avec leurs prix
 */

import { Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/formatters";

interface Sejour {
  id: string;
  titre: string;
  date_debut: string;
  date_fin: string;
  type: string;
}

interface SejourInfoProps {
  inscription: {
    nombre_semaines_demandees: number;
    sejour_preference_1?: string;
    sejour_preference_2?: string;
    sejour_preference_1_alternatif?: string;
    sejour_preference_2_alternatif?: string;
  };
  sejours: Sejour[];
  calculatePrice: (sejourId: string) => number | null;
}

export function SejourInfo({ inscription, sejours, calculatePrice }: SejourInfoProps) {
  const getSejourTitle = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    return sejour ? sejour.titre : 'Non spécifié';
  };

  const getSejourDates = (sejourId: string) => {
    const sejour = sejours.find(s => s.id === sejourId);
    if (!sejour) return 'Non spécifié';
    return `${formatDate(sejour.date_debut)} - ${formatDate(sejour.date_fin)}`;
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Séjours demandés</h2>
      </div>
      <div className="bg-muted/50 rounded-lg p-6 space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">Nombre de semaines</p>
          <Badge>{inscription.nombre_semaines_demandees} semaine{inscription.nombre_semaines_demandees > 1 ? 's' : ''}</Badge>
        </div>
        
        {inscription.nombre_semaines_demandees === 1 ? (
          <div className="space-y-3">
            {inscription.sejour_preference_1 && (
              <div>
                <p className="text-sm text-muted-foreground">Choix préféré</p>
                <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                {calculatePrice(inscription.sejour_preference_1) !== null && (
                  <Badge variant="secondary" className="mt-2">
                    Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                  </Badge>
                )}
              </div>
            )}
            {inscription.sejour_preference_2 && (
              <div>
                <p className="text-sm text-muted-foreground">Choix secondaire</p>
                <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                {calculatePrice(inscription.sejour_preference_2) !== null && (
                  <Badge variant="secondary" className="mt-2">
                    Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                  </Badge>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Première semaine</h3>
              {inscription.sejour_preference_1 && (
                <div>
                  <p className="text-sm text-muted-foreground">Choix préféré</p>
                  <p className="font-medium">{getSejourTitle(inscription.sejour_preference_1)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1)}</p>
                  {calculatePrice(inscription.sejour_preference_1) !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Prix: {calculatePrice(inscription.sejour_preference_1)?.toFixed(2)} €
                    </Badge>
                  )}
                </div>
              )}
              {inscription.sejour_preference_1_alternatif && (
                <div>
                  <p className="text-sm text-muted-foreground">Choix secondaire</p>
                  <p className="font-medium text-muted-foreground">{getSejourTitle(inscription.sejour_preference_1_alternatif)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_1_alternatif)}</p>
                  {calculatePrice(inscription.sejour_preference_1_alternatif) !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Prix: {calculatePrice(inscription.sejour_preference_1_alternatif)?.toFixed(2)} €
                    </Badge>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Deuxième semaine</h3>
              {inscription.sejour_preference_2 && (
                <div>
                  <p className="text-sm text-muted-foreground">Choix préféré</p>
                  <p className="font-medium">{getSejourTitle(inscription.sejour_preference_2)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2)}</p>
                  {calculatePrice(inscription.sejour_preference_2) !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Prix: {calculatePrice(inscription.sejour_preference_2)?.toFixed(2)} €
                    </Badge>
                  )}
                </div>
              )}
              {inscription.sejour_preference_2_alternatif && (
                <div>
                  <p className="text-sm text-muted-foreground">Choix secondaire</p>
                  <p className="font-medium text-muted-foreground">{getSejourTitle(inscription.sejour_preference_2_alternatif)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getSejourDates(inscription.sejour_preference_2_alternatif)}</p>
                  {calculatePrice(inscription.sejour_preference_2_alternatif) !== null && (
                    <Badge variant="secondary" className="mt-2">
                      Prix: {calculatePrice(inscription.sejour_preference_2_alternatif)?.toFixed(2)} €
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
