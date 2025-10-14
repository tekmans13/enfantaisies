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
  const [sejourPreference1, setSejourPreference1] = useState<string>("");
  const [sejourPreference2, setSejourPreference2] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && inscription) {
      fetchSejours();
      setSejourPreference1(inscription.sejour_preference_1 || "");
      setSejourPreference2(inscription.sejour_preference_2 || "");
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
    if (!sejourPreference1) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins le 1er choix de séjour",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        sejour_preference_1: sejourPreference1,
        sejour_preference_2: sejourPreference2 || null,
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
        description: "Inscription modifiée avec succès",
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

          {/* Choix actuels */}
          <div className="space-y-2">
            <h3 className="font-semibold">Choix de séjour du parent</h3>
            <div className="flex gap-4">
              <div>
                <p className="text-sm text-muted-foreground">1er choix</p>
                <Badge>{inscription?.sejour_preference_1 ? sejours.find(s => s.id === inscription.sejour_preference_1)?.titre || 'N/A' : 'Non renseigné'}</Badge>
              </div>
              {inscription?.sejour_preference_2 && (
                <div>
                  <p className="text-sm text-muted-foreground">2ème choix</p>
                  <Badge variant="outline">{sejours.find(s => s.id === inscription.sejour_preference_2)?.titre || 'N/A'}</Badge>
                </div>
              )}
            </div>
          </div>

          {/* Sélection des séjours */}
          <div className="space-y-4">
            <div>
              <Label className="text-base mb-3 block font-semibold">1er choix de séjour *</Label>
              <RadioGroup value={sejourPreference1} onValueChange={setSejourPreference1}>
                <div className="space-y-3">
                  {sejours.map((sejour) => (
                    <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={sejour.id} id={`pref1-${sejour.id}`} />
                      <Label htmlFor={`pref1-${sejour.id}`} className="flex-1 cursor-pointer">
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
              <Label className="text-base mb-3 block font-semibold">2ème choix de séjour (optionnel)</Label>
              <RadioGroup value={sejourPreference2} onValueChange={setSejourPreference2}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="" id="pref2-none" />
                    <Label htmlFor="pref2-none" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Aucun 2ème choix</div>
                    </Label>
                  </div>
                  {sejours.filter(s => s.id !== sejourPreference1).map((sejour) => (
                    <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={sejour.id} id={`pref2-${sejour.id}`} />
                      <Label htmlFor={`pref2-${sejour.id}`} className="flex-1 cursor-pointer">
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
