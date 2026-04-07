/**
 * Composant : Informations de l'enfant (Récapitulatif)
 * Affiche les détails de l'enfant inscrit
 */

import { User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate, getClassLabel, getAgeGroupLabel } from "@/lib/formatters";

interface ChildInfoProps {
  inscription: {
    child_first_name: string;
    child_last_name: string;
    child_birth_date: string;
    child_class: string;
    child_age_group: string;
    child_school: string;
    child_gender: string;
  };
}

export function ChildInfo({ inscription }: ChildInfoProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Informations de l'enfant</h2>
      </div>
      <div className="bg-muted/50 rounded-lg p-6 space-y-3">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom complet</p>
            <p className="font-medium">{inscription.child_first_name} {inscription.child_last_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Date de naissance</p>
            <p className="font-medium">{formatDate(inscription.child_birth_date)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Classe (septembre {new Date().getFullYear()})</p>
            <p className="font-medium">{getClassLabel(inscription.child_class)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Groupe d'âge</p>
            <Badge variant="secondary">{getAgeGroupLabel(inscription.child_age_group)}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">École</p>
            <p className="font-medium">{inscription.child_school}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sexe</p>
            <p className="font-medium">{inscription.child_gender === 'garcon' ? 'Garçon' : 'Fille'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
