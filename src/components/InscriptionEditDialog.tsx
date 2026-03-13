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
import { formatSejourTitre } from "@/lib/formatters";

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
  const [tarifs, setTarifs] = useState<any[]>([]);
  const [assignedSejour, setAssignedSejour] = useState<string>("");
  const [assignedSejour2, setAssignedSejour2] = useState<string>("");
  const [sejourAttribution, setSejourAttribution] = useState<Map<string, number>>(new Map());
  const { toast } = useToast();
  
  // Déterminer si l'utilisateur a demandé 2 semaines (et non juste un choix alternatif)
  const wantsTwoWeeks = inscription?.nombre_semaines_demandees === 2;

  useEffect(() => {
    if (open && inscription) {
      fetchSejours();
      // Initialiser avec le séjour actuellement attribué (ou le choix du parent si pas encore attribué)
      setAssignedSejour(inscription.sejour_attribue_1 || inscription.sejour_preference_1 || "");
      setAssignedSejour2(inscription.sejour_attribue_2 || inscription.sejour_preference_2 || "");
      
      // Écouter les changements en temps réel sur la table sejours
      const channel = supabase
        .channel('sejours-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sejours'
          },
          () => {
            fetchSejours();
          }
        )
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
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
      updateSejourAttribution(data);
    }
    
    // Récupérer aussi les tarifs
    const { data: tarifsData } = await supabase
      .from('tarifs')
      .select('*')
      .eq('annee', 2025)
      .order('qf_min', { ascending: true });
    
    if (tarifsData) {
      setTarifs(tarifsData);
    }
  };

  const updateSejourAttribution = (sejoursData: any[]) => {
    // Compter les attributions pour chaque séjour
    supabase
      .from('inscriptions')
      .select('sejour_attribue_1, sejour_attribue_2, id')
      .then(({ data: inscriptions }) => {
        if (inscriptions) {
          const attributionMap = new Map<string, number>();
          
          inscriptions.forEach(insc => {
            // Ne pas compter l'inscription en cours d'édition
            if (insc.id === inscription.id) return;
            
            if (insc.sejour_attribue_1) {
              attributionMap.set(
                insc.sejour_attribue_1, 
                (attributionMap.get(insc.sejour_attribue_1) || 0) + 1
              );
            }
            if (insc.sejour_attribue_2) {
              attributionMap.set(
                insc.sejour_attribue_2, 
                (attributionMap.get(insc.sejour_attribue_2) || 0) + 1
              );
            }
          });
          
          // Ajouter les sélections actuelles
          if (assignedSejour) {
            attributionMap.set(
              assignedSejour, 
              (attributionMap.get(assignedSejour) || 0) + 1
            );
          }
          if (assignedSejour2) {
            attributionMap.set(
              assignedSejour2, 
              (attributionMap.get(assignedSejour2) || 0) + 1
            );
          }
          
          setSejourAttribution(attributionMap);
        }
      });
  };

  // Mettre à jour les compteurs quand les sélections changent
  useEffect(() => {
    if (sejours.length > 0) {
      updateSejourAttribution(sejours);
    }
  }, [assignedSejour, assignedSejour2]);

  const handleSave = async () => {
    if (!assignedSejour) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un séjour à attribuer",
        variant: "destructive",
      });
      return;
    }

    // Récupérer les anciennes attributions pour gérer les places
    const oldSejour1 = inscription.sejour_attribue_1;
    const oldSejour2 = inscription.sejour_attribue_2;

    // Déterminer si les attributions correspondent aux choix prioritaires ou alternatifs
    const isAlternatif = 
      (assignedSejour === inscription.sejour_preference_1_alternatif) ||
      (assignedSejour === inscription.sejour_preference_2_alternatif) ||
      (assignedSejour2 && (
        assignedSejour2 === inscription.sejour_preference_1_alternatif ||
        assignedSejour2 === inscription.sejour_preference_2_alternatif
      ));

    // Déterminer le statut en fonction des choix attribués
    const newStatus = isAlternatif ? 'attribuee_alternatif' : 'attribuee';

    // Mettre à jour l'inscription
    const { error } = await supabase
      .from('inscriptions')
      .update({ 
        sejour_attribue_1: assignedSejour,
        sejour_attribue_2: assignedSejour2 || null,
        status: newStatus,
        validated_at: new Date().toISOString()
      })
      .eq('id', inscription.id);

    if (error) {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'inscription",
        variant: "destructive",
      });
      return;
    }

    // Gérer les places disponibles
    // Rendre les places si on enlève des séjours
    if (oldSejour1 && oldSejour1 !== assignedSejour) {
      const { data: sejour } = await supabase
        .from('sejours')
        .select('places_disponibles')
        .eq('id', oldSejour1)
        .single();
      
      if (sejour) {
        await supabase
          .from('sejours')
          .update({ places_disponibles: sejour.places_disponibles + 1 })
          .eq('id', oldSejour1);
      }
    }

    if (oldSejour2 && oldSejour2 !== assignedSejour2) {
      const { data: sejour } = await supabase
        .from('sejours')
        .select('places_disponibles')
        .eq('id', oldSejour2)
        .single();
      
      if (sejour) {
        await supabase
          .from('sejours')
          .update({ places_disponibles: sejour.places_disponibles + 1 })
          .eq('id', oldSejour2);
      }
    }

    // Prendre des places si on ajoute de nouveaux séjours
    if (assignedSejour && assignedSejour !== oldSejour1) {
      const { data: sejour } = await supabase
        .from('sejours')
        .select('places_disponibles')
        .eq('id', assignedSejour)
        .single();
      
      if (sejour && sejour.places_disponibles > 0) {
        await supabase
          .from('sejours')
          .update({ places_disponibles: sejour.places_disponibles - 1 })
          .eq('id', assignedSejour);
      }
    }

    if (assignedSejour2 && assignedSejour2 !== oldSejour2) {
      const { data: sejour } = await supabase
        .from('sejours')
        .select('places_disponibles')
        .eq('id', assignedSejour2)
        .single();
      
      if (sejour && sejour.places_disponibles > 0) {
        await supabase
          .from('sejours')
          .update({ places_disponibles: sejour.places_disponibles - 1 })
          .eq('id', assignedSejour2);
      }
    }

    // Rafraîchir les données pour mettre à jour les compteurs
    await fetchSejours();

    toast({
      title: "Succès",
      description: "Séjour(s) attribué(s) avec succès",
    });
    onSuccess();
    onOpenChange(false);
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
                  <Label className="text-base mb-3 block font-semibold">
                    {wantsTwoWeeks ? "1ère semaine (choix prioritaire)" : "1er choix"}
                  </Label>
                  {inscription?.sejour_preference_1 && sejours.find(s => s.id === inscription.sejour_preference_1) ? (
                    <div className="p-3 border-2 border-blue-600 bg-blue-600/10 rounded-lg">
                      <div className="font-semibold">{formatSejourTitre(sejours.find(s => s.id === inscription.sejour_preference_1)!)}</div>
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
                
                {/* Choix alternatif pour la 1ère semaine */}
                {wantsTwoWeeks && (
                  <div>
                    <Label className="text-base mb-3 block font-semibold">1ère semaine (choix alternatif)</Label>
                    {inscription?.sejour_preference_1_alternatif && sejours.find(s => s.id === inscription.sejour_preference_1_alternatif) ? (
                      <div className="p-3 border-2 border-blue-400 bg-blue-400/10 rounded-lg">
                        <div className="font-semibold">{sejours.find(s => s.id === inscription.sejour_preference_1_alternatif)?.titre}</div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sejours.find(s => s.id === inscription.sejour_preference_1_alternatif)!.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejours.find(s => s.id === inscription.sejour_preference_1_alternatif)!.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {sejours.find(s => s.id === inscription.sejour_preference_1_alternatif)?.places_disponibles} places
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-2 rounded-lg text-muted-foreground">Non renseigné</div>
                    )}
                  </div>
                )}
                
                {wantsTwoWeeks && (
                  <div>
                    <Label className="text-base mb-3 block font-semibold">2ème semaine (choix prioritaire)</Label>
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
                )}
                
                {!wantsTwoWeeks && (
                  <div>
                    <Label className="text-base mb-3 block font-semibold">2ème choix (alternatif)</Label>
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
                )}
                
                {/* Choix alternatif pour la 2ème semaine */}
                {wantsTwoWeeks && (
                  <div>
                    <Label className="text-base mb-3 block font-semibold">2ème semaine (choix alternatif)</Label>
                    {inscription?.sejour_preference_2_alternatif && sejours.find(s => s.id === inscription.sejour_preference_2_alternatif) ? (
                      <div className="p-3 border-2 border-blue-400 bg-blue-400/10 rounded-lg">
                        <div className="font-semibold">{sejours.find(s => s.id === inscription.sejour_preference_2_alternatif)?.titre}</div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(sejours.find(s => s.id === inscription.sejour_preference_2_alternatif)!.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejours.find(s => s.id === inscription.sejour_preference_2_alternatif)!.date_fin).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {sejours.find(s => s.id === inscription.sejour_preference_2_alternatif)?.places_disponibles} places
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 border-2 rounded-lg text-muted-foreground">Non renseigné</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite : Séjours attribués par le bureau - Modifiable */}
            <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border-2 border-green-200 dark:border-green-800">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                Séjour(s) attribué(s) par le bureau
              </h3>
              
              <div className="space-y-6">
                {/* Bloc 1ère semaine */}
                <div className="bg-white dark:bg-background/50 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                  <Label className="text-base mb-3 block font-semibold text-green-900 dark:text-green-100">
                    {wantsTwoWeeks ? "1ère semaine attribuée *" : "Séjour attribué *"}
                  </Label>
                  <RadioGroup value={assignedSejour} onValueChange={setAssignedSejour}>
                    <div className="space-y-2">
                      {sejours.map((sejour) => {
                        // Calculer le prix pour ce séjour
                        const dateDebut = new Date(sejour.date_debut);
                        const dateFin = new Date(sejour.date_fin);
                        const joursCalc = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                        const nbJours = sejour.nombre_jours ?? joursCalc;
                        const qf = inscription?.quotient_familial || 999999;
                        
                        // Récupération du tarif
                        const tarif = inscription && tarifs ? tarifs.find((t: any) => 
                          qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
                        ) : null;
                        
                        const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
                        const tarifJournalier = tarif ? (isCentreAere ? tarif.tarif_journee_centre_aere : tarif.tarif_journee_sejour) : 0;
                        const prix = tarifJournalier * nbJours;
                        
                        return (
                          <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                            <RadioGroupItem value={sejour.id} id={`assigned1-${sejour.id}`} />
                            <Label htmlFor={`assigned1-${sejour.id}`} className="flex-1 cursor-pointer">
                              <div className="font-semibold">{formatSejourTitre(sejour)}</div>
                              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {sejourAttribution.get(sejour.id) || 0}/{sejour.places_disponibles} places
                                </span>
                                {tarif && (
                                  <Badge variant="secondary" className="text-xs font-semibold">
                                    {prix.toFixed(2)} €
                                  </Badge>
                                )}
                              </div>
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </RadioGroup>
                </div>

                {/* Bloc 2ème semaine (si demandé) */}
                {wantsTwoWeeks && (
                  <div className="bg-white dark:bg-background/50 rounded-lg p-4 border-2 border-green-200 dark:border-green-800">
                    <Label className="text-base mb-3 block font-semibold text-green-900 dark:text-green-100">2ème semaine attribuée</Label>
                    <RadioGroup value={assignedSejour2} onValueChange={setAssignedSejour2}>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="" id="assigned2-none" />
                          <Label htmlFor="assigned2-none" className="flex-1 cursor-pointer">
                            <div className="font-semibold text-orange-700 dark:text-orange-300">N'a pas pu être attribué</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              <Badge variant="secondary" className="text-xs">0,00 €</Badge>
                            </div>
                          </Label>
                        </div>
                        {sejours.filter(s => s.id !== assignedSejour).map((sejour) => {
                          // Calculer le prix pour ce séjour
                          const dateDebut = new Date(sejour.date_debut);
                          const dateFin = new Date(sejour.date_fin);
                          const joursCalc = Math.ceil((dateFin.getTime() - dateDebut.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          const nbJours = sejour.nombre_jours ?? joursCalc;
                          const qf = inscription?.quotient_familial || 999999;
                          
                          // Récupération du tarif
                          const tarif = inscription && tarifs ? tarifs.find((t: any) => 
                            qf >= t.qf_min && (t.qf_max === null || qf <= t.qf_max)
                          ) : null;
                          
                          const isCentreAere = sejour.type === 'centre_aere' || sejour.type === 'animation';
                          const tarifJournalier = tarif ? (isCentreAere ? tarif.tarif_journee_centre_aere : tarif.tarif_journee_sejour) : 0;
                          const prix = tarifJournalier * nbJours;
                          
                          return (
                            <div key={sejour.id} className="flex items-start space-x-3 p-3 border-2 rounded-lg hover:bg-muted/50 transition-colors">
                              <RadioGroupItem value={sejour.id} id={`assigned2-${sejour.id}`} />
                              <Label htmlFor={`assigned2-${sejour.id}`} className="flex-1 cursor-pointer">
                                <div className="font-semibold">{formatSejourTitre(sejour)}</div>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {sejourAttribution.get(sejour.id) || 0}/{sejour.places_disponibles} places
                                  </span>
                                  {tarif && (
                                    <Badge variant="secondary" className="text-xs font-semibold">
                                      {prix.toFixed(2)} €
                                    </Badge>
                                  )}
                                </div>
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  </div>
                )}
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
