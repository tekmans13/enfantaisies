import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Info } from "lucide-react";

interface InscriptionEditDialogProps {
  inscription: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function InscriptionEditDialog({
  inscription,
  open,
  onOpenChange,
  onSuccess,
}: InscriptionEditDialogProps) {
  const [sejours, setSejours] = useState<any[]>([]);
  const [assignedSejour, setAssignedSejour] = useState<string>("");
  const [assignedSejour2, setAssignedSejour2] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && inscription) {
      fetchSejours();
      // Initialiser avec le séjour actuellement attribué (ou le choix du parent si pas encore attribué)
      setAssignedSejour(inscription.sejour_attribue_1 || inscription.sejour_preference_1 || "");
      setAssignedSejour2(inscription.sejour_attribue_2 || inscription.sejour_preference_2 || "");
    }
  }, [open, inscription]);

  const fetchSejours = async () => {
    const { data } = await supabase
      .from('sejours')
      .select('*')
      .eq('groupe_age', inscription.child_age_group)
      .order('date_debut', { ascending: true });
    
    if (data) {
      setSejours(data);
    }
  };

  const handleSave = async () => {
    if (!assignedSejour) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un séjour à attribuer",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        sejour_attribue_1: assignedSejour,
        sejour_attribue_2: assignedSejour2 || null,
      })
      .eq('id', inscription.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'inscription",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Séjour(s) attribué(s) avec succès",
      });
      onSuccess();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Éditer l'inscription - {inscription?.child_first_name} {inscription?.child_last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations enfant */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-semibold">{inscription?.child_first_name} {inscription?.child_last_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date de naissance</p>
              <p className="font-semibold">{new Date(inscription?.child_birth_date).toLocaleDateString('fr-FR')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Classe</p>
              <p className="font-semibold uppercase">{inscription?.child_class}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Groupe d'âge</p>
              <Badge variant="outline" className="capitalize">
                {inscription?.child_age_group}
              </Badge>
            </div>
          </div>

          {/* Deux colonnes : Choix du parent et Séjours attribués */}
          <div className="grid grid-cols-2 gap-4">
            {/* Colonne gauche : Choix du parent - Lecture seule */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Choix du parent (lecture seule)
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block font-semibold">1er choix</Label>
                  {inscription?.sejour_preference_1 && sejours.find(s => s.id === inscription.sejour_preference_1) ? (
                    <div className="p-3 border-2 border-blue-600 bg-blue-600/10 rounded-lg">
                      <div className="font-semibold">{sejours.find(s => s.id === inscription.sejour_preference_1)?.titre}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sejours.find(s => s.id === inscription.sejour_preference_1)!.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejours.find(s => s.id === inscription.sejour_preference_1)!.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {sejours.find(s => s.id === inscription.sejour_preference_1)?.places_disponibles} places
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 rounded-lg text-muted-foreground">Non renseigné</div>
                  )}
                </div>
                
                <div>
                  <Label className="text-base mb-3 block font-semibold">2ème choix</Label>
                  {inscription?.sejour_preference_2 && sejours.find(s => s.id === inscription.sejour_preference_2) ? (
                    <div className="p-3 border-2 border-blue-600 bg-blue-600/10 rounded-lg">
                      <div className="font-semibold">{sejours.find(s => s.id === inscription.sejour_preference_2)?.titre}</div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sejours.find(s => s.id === inscription.sejour_preference_2)!.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejours.find(s => s.id === inscription.sejour_preference_2)!.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {sejours.find(s => s.id === inscription.sejour_preference_2)?.places_disponibles} places
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 border-2 rounded-lg text-muted-foreground">Non renseigné</div>
                  )}
                </div>
              </div>
            </div>

            {/* Colonne droite : Séjours attribués par le bureau - Modifiable */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                Séjour(s) attribué(s) par le bureau
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-base mb-3 block font-semibold">1er séjour attribué *</Label>
                  <RadioGroup value={assignedSejour} onValueChange={setAssignedSejour}>
                    <div className="space-y-2">
                      {sejours.map((sejour) => (
                        <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={sejour.id} id={`assigned1-${sejour.id}`} />
                          <Label htmlFor={`assigned1-${sejour.id}`} className="flex-1 cursor-pointer">
                            <div className="font-semibold">{sejour.titre}</div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {sejour.places_disponibles} places
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label className="text-base mb-3 block font-semibold">2ème séjour attribué (optionnel)</Label>
                  <RadioGroup value={assignedSejour2} onValueChange={setAssignedSejour2}>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                        <RadioGroupItem value="" id="assigned2-none" />
                        <Label htmlFor="assigned2-none" className="flex-1 cursor-pointer">
                          <div className="font-semibold">Aucun 2ème séjour</div>
                        </Label>
                      </div>
                      {sejours.filter(s => s.id !== assignedSejour).map((sejour) => (
                        <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value={sejour.id} id={`assigned2-${sejour.id}`} />
                          <Label htmlFor={`assigned2-${sejour.id}`} className="flex-1 cursor-pointer">
                            <div className="font-semibold">{sejour.titre}</div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {sejour.places_disponibles} places
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
