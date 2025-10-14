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
  const [numberOfWeeks, setNumberOfWeeks] = useState<"1" | "2">("1");
  const [selectedSejours, setSelectedSejours] = useState<string[]>([]);
  const [prioritySejour, setPrioritySejour] = useState<string>("");
  const [week1Selected, setWeek1Selected] = useState<string[]>([]);
  const [week1Priority, setWeek1Priority] = useState<string>("");
  const [week2Selected, setWeek2Selected] = useState<string[]>([]);
  const [week2Priority, setWeek2Priority] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (open && inscription) {
      fetchSejours();
      
      // Déterminer le nombre de semaines basé sur les préférences existantes
      if (inscription.sejour_preference_1 && inscription.sejour_preference_2) {
        setNumberOfWeeks("2");
        setWeek1Selected([inscription.sejour_preference_1]);
        setWeek1Priority(inscription.sejour_preference_1);
        setWeek2Selected([inscription.sejour_preference_2]);
        setWeek2Priority(inscription.sejour_preference_2);
      } else if (inscription.sejour_preference_1) {
        setNumberOfWeeks("1");
        const prefs = inscription.sejour_preference_2 
          ? [inscription.sejour_preference_1, inscription.sejour_preference_2]
          : [inscription.sejour_preference_1];
        setSelectedSejours(prefs);
        setPrioritySejour(inscription.sejour_preference_1);
      }
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

  const handleAssignSejour = async () => {
    let pref1 = "";
    let pref2 = "";

    if (numberOfWeeks === "1") {
      if (!prioritySejour) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner un séjour prioritaire",
          variant: "destructive",
        });
        return;
      }
      pref1 = prioritySejour;
      pref2 = selectedSejours.find(id => id !== prioritySejour) || "";
    } else {
      if (!week1Priority || !week2Priority) {
        toast({
          title: "Erreur",
          description: "Veuillez sélectionner les séjours pour chaque semaine",
          variant: "destructive",
        });
        return;
      }
      pref1 = week1Priority;
      pref2 = week2Priority;
    }

    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        sejour_preference_1: pref1,
        sejour_preference_2: pref2 || null,
        status: 'validee',
        validated_at: new Date().toISOString()
      })
      .eq('id', inscription.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'assigner le séjour",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Succès",
        description: "Séjour assigné avec succès",
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

          <Alert className="border-primary/50 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              Sélectionnez le nombre de semaines souhaitées, puis choisissez les séjours correspondants avec leur priorité.
            </AlertDescription>
          </Alert>

          {/* Choix du nombre de semaines */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <Label className="text-base mb-3 block font-semibold">Nombre de semaines</Label>
            <RadioGroup 
              value={numberOfWeeks} 
              onValueChange={(value: "1" | "2") => {
                setNumberOfWeeks(value);
                setSelectedSejours([]);
                setPrioritySejour("");
                setWeek1Selected([]);
                setWeek1Priority("");
                setWeek2Selected([]);
                setWeek2Priority("");
              }} 
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1" id="weeks-1" />
                <Label htmlFor="weeks-1" className="cursor-pointer font-medium">1 semaine</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="weeks-2" />
                <Label htmlFor="weeks-2" className="cursor-pointer font-medium">2 semaines</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mode 1 semaine */}
          {numberOfWeeks === "1" && (
            <div>
              <Label className="text-base mb-3 block font-semibold">
                Sélectionnez jusqu'à 2 séjours (1 prioritaire + 1 alternative)
              </Label>
              <div className="space-y-3">
                {sejours.map((sejour) => {
                  const isSelected = selectedSejours.includes(sejour.id);
                  const isPriority = prioritySejour === sejour.id;
                  
                  return (
                    <div 
                      key={sejour.id} 
                      className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-muted/50 border-transparent hover:bg-muted hover:border-muted-foreground/20'
                      }`}
                    >
                      <Checkbox
                        id={`sejour-${sejour.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            if (selectedSejours.length < 2) {
                              const newSelection = [...selectedSejours, sejour.id];
                              setSelectedSejours(newSelection);
                              if (selectedSejours.length === 0) {
                                setPrioritySejour(sejour.id);
                              }
                            } else {
                              const nonPriority = selectedSejours.find(id => id !== prioritySejour);
                              const newSelection = selectedSejours.filter(id => id !== nonPriority);
                              newSelection.push(sejour.id);
                              setSelectedSejours(newSelection);
                            }
                          } else {
                            setSelectedSejours(selectedSejours.filter(id => id !== sejour.id));
                            if (prioritySejour === sejour.id) {
                              const remaining = selectedSejours.filter(id => id !== sejour.id);
                              setPrioritySejour(remaining[0] || "");
                            }
                          }
                        }}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor={`sejour-${sejour.id}`} className="cursor-pointer">
                          <p className="font-semibold">{sejour.titre}</p>
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
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <RadioGroup
                            value={isPriority ? sejour.id : ""}
                            onValueChange={() => {
                              setPrioritySejour(sejour.id);
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value={sejour.id} id={`priority-${sejour.id}`} />
                              <Label htmlFor={`priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                Prioritaire
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2 semaines */}
          {numberOfWeeks === "2" && (
            <>
              <div className="bg-accent/10 p-4 rounded-lg border-2 border-accent/30">
                <Label className="text-base mb-3 block font-semibold text-accent-foreground">
                  Première semaine - Sélectionnez jusqu'à 2 séjours
                </Label>
                <div className="space-y-3">
                  {sejours.map((sejour) => {
                    const isSelected = week1Selected.includes(sejour.id);
                    const isPriority = week1Priority === sejour.id;
                    
                    return (
                      <div 
                        key={sejour.id} 
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-accent/20 border-accent' 
                            : 'bg-background/80 border-transparent hover:bg-background hover:border-muted-foreground/20'
                        }`}
                      >
                        <Checkbox
                          id={`week1-${sejour.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (week1Selected.length < 2) {
                                const newSelection = [...week1Selected, sejour.id];
                                setWeek1Selected(newSelection);
                                if (week1Selected.length === 0) {
                                  setWeek1Priority(sejour.id);
                                }
                              } else {
                                const nonPriority = week1Selected.find(id => id !== week1Priority);
                                const newSelection = week1Selected.filter(id => id !== nonPriority);
                                newSelection.push(sejour.id);
                                setWeek1Selected(newSelection);
                              }
                            } else {
                              setWeek1Selected(week1Selected.filter(id => id !== sejour.id));
                              if (week1Priority === sejour.id) {
                                const remaining = week1Selected.filter(id => id !== sejour.id);
                                setWeek1Priority(remaining[0] || "");
                              }
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`week1-${sejour.id}`} className="cursor-pointer">
                            <p className="font-semibold">{sejour.titre}</p>
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
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <RadioGroup
                              value={isPriority ? sejour.id : ""}
                              onValueChange={() => setWeek1Priority(sejour.id)}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={sejour.id} id={`week1-priority-${sejour.id}`} />
                                <Label htmlFor={`week1-priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                  Prioritaire
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-primary/10 p-4 rounded-lg border-2 border-primary/30">
                <Label className="text-base mb-3 block font-semibold">
                  Deuxième semaine - Sélectionnez jusqu'à 2 séjours
                </Label>
                <div className="space-y-3">
                  {sejours.map((sejour) => {
                    const isSelected = week2Selected.includes(sejour.id);
                    const isPriority = week2Priority === sejour.id;
                    
                    return (
                      <div 
                        key={sejour.id} 
                        className={`flex items-start space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/20 border-primary' 
                            : 'bg-background/80 border-transparent hover:bg-background hover:border-muted-foreground/20'
                        }`}
                      >
                        <Checkbox
                          id={`week2-${sejour.id}`}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              if (week2Selected.length < 2) {
                                const newSelection = [...week2Selected, sejour.id];
                                setWeek2Selected(newSelection);
                                if (week2Selected.length === 0) {
                                  setWeek2Priority(sejour.id);
                                }
                              } else {
                                const nonPriority = week2Selected.find(id => id !== week2Priority);
                                const newSelection = week2Selected.filter(id => id !== nonPriority);
                                newSelection.push(sejour.id);
                                setWeek2Selected(newSelection);
                              }
                            } else {
                              setWeek2Selected(week2Selected.filter(id => id !== sejour.id));
                              if (week2Priority === sejour.id) {
                                const remaining = week2Selected.filter(id => id !== sejour.id);
                                setWeek2Priority(remaining[0] || "");
                              }
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor={`week2-${sejour.id}`} className="cursor-pointer">
                            <p className="font-semibold">{sejour.titre}</p>
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
                        {isSelected && (
                          <div className="flex items-center space-x-2">
                            <RadioGroup
                              value={isPriority ? sejour.id : ""}
                              onValueChange={() => setWeek2Priority(sejour.id)}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={sejour.id} id={`week2-priority-${sejour.id}`} />
                                <Label htmlFor={`week2-priority-${sejour.id}`} className="text-xs font-medium cursor-pointer whitespace-nowrap">
                                  Prioritaire
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleAssignSejour}>
            Valider et assigner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
