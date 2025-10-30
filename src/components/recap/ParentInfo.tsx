/**
 * Composant : Informations des parents (Récapitulatif)
 * Affiche les coordonnées des responsables légaux
 */

import { Mail } from "lucide-react";

interface ParentInfoProps {
  inscription: {
    parent_first_name: string;
    parent_last_name: string;
    parent_email: string;
    parent_mobile: string;
    parent_office_phone?: string;
    parent_address: string;
    parent2_first_name?: string;
    parent2_last_name?: string;
    parent2_email?: string;
    parent2_mobile?: string;
    parent2_office_phone?: string;
  };
}

export function ParentInfo({ inscription }: ParentInfoProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Mail className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Contact des responsables légaux</h2>
      </div>
      <div className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="font-semibold mb-3">Responsable légal 1</h3>
          <div className="space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">{inscription.parent_first_name} {inscription.parent_last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{inscription.parent_email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Téléphone mobile</p>
                <p className="font-medium">{inscription.parent_mobile}</p>
              </div>
              {inscription.parent_office_phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Téléphone bureau</p>
                  <p className="font-medium">{inscription.parent_office_phone}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">Adresse</p>
                <p className="font-medium">{inscription.parent_address}</p>
              </div>
            </div>
          </div>
        </div>

        {inscription.parent2_first_name && (
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Responsable légal 2</h3>
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nom complet</p>
                  <p className="font-medium">{inscription.parent2_first_name} {inscription.parent2_last_name}</p>
                </div>
                {inscription.parent2_email && (
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{inscription.parent2_email}</p>
                  </div>
                )}
                {inscription.parent2_mobile && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone mobile</p>
                    <p className="font-medium">{inscription.parent2_mobile}</p>
                  </div>
                )}
                {inscription.parent2_office_phone && (
                  <div>
                    <p className="text-sm text-muted-foreground">Téléphone bureau</p>
                    <p className="font-medium">{inscription.parent2_office_phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
