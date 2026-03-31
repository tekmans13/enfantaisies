import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Users, AlertTriangle, Pill, FileDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { InscriptionStatusBadge } from "./InscriptionStatusBadge";
import { exportSejourInscriptionsToExcel } from "@/lib/excelExport";
import { formatSejourTitre } from "@/lib/formatters";

interface SejourDetailsDialogProps {
  sejour: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SejourDetailsDialog({
  sejour,
  open,
  onOpenChange,
}: SejourDetailsDialogProps) {
  const [inscriptions, setInscriptions] = useState<any[]>([]);

  useEffect(() => {
    if (open && sejour) {
      fetchInscriptions();
    }
  }, [open, sejour]);

  const fetchInscriptions = async () => {
    const { data } = await supabase
      .from('inscriptions')
      .select('*')
      .or(`sejour_attribue_1.eq.${sejour.id},sejour_attribue_2.eq.${sejour.id}`)
      .order('child_last_name', { ascending: true });
    
    if (data) {
      const filteredInscriptions = data.filter((inscription: any) =>
        inscription.sejour_attribue_1 === sejour.id ||
        (inscription.nombre_semaines_demandees === 2 && inscription.sejour_attribue_2 === sejour.id)
      );
      setInscriptions(filteredInscriptions);
    }
  };

  const getDietaryInfo = (inscription: any) => {
    const dietary = [];
    if (inscription.food_allergies_details) {
      dietary.push(`Allergies/pratiques alimentaires: ${inscription.food_allergies_details}`);
    }
    return dietary;
  };

  // Calcul des statistiques alimentaires sur toutes les inscriptions
  const dietaryStats = {
    foodAllergies: inscriptions.filter(i => i.food_allergies_details).length,
    medication: inscriptions.filter(i => i.has_medication).length,
    allergies: inscriptions.filter(i => i.has_allergies).length,
  };

  if (!sejour) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-4">
              <div>
                <h2 className="text-2xl">{formatSejourTitre(sejour)}</h2>
                {sejour.lieu && (
                  <p className="text-sm text-muted-foreground font-normal">{sejour.lieu}</p>
                )}
              </div>
              <Badge variant="outline" className="capitalize">
                {sejour.groupe_age}
              </Badge>
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSejourInscriptionsToExcel(sejour, inscriptions)}
            >
              <FileDown className="w-4 h-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info générale */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Calendar className="w-4 h-4" />
                Période
              </div>
              <p className="font-semibold">
                {new Date(sejour.date_debut).toLocaleDateString('fr-FR')} - {new Date(sejour.date_fin).toLocaleDateString('fr-FR')}
              </p>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Durée</div>
              <p className="font-semibold">
                {(() => {
                  const joursCalc = Math.ceil((new Date(sejour.date_fin).getTime() - new Date(sejour.date_debut).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  const nbJours = sejour.nombre_jours ?? joursCalc;
                  return `${nbJours} jour${nbJours > 1 ? 's' : ''}`;
                })()}
                {sejour.nombre_jours && <span className="text-xs text-muted-foreground ml-1">(personnalisé)</span>}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Users className="w-4 h-4" />
                Inscrits
              </div>
              <p className="font-semibold">
                {inscriptions.length} / {sejour.places_disponibles}
              </p>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground mb-1">Type</div>
              <p className="font-semibold capitalize">
                {sejour.type}
              </p>
            </Card>
          </div>

          {/* Résumé régimes alimentaires et santé */}
          {inscriptions.length > 0 && (
            <Card className="p-4 bg-muted/50">
              <h3 className="font-semibold mb-3">Résumé des besoins spécifiques</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{dietaryStats.foodAllergies}</p>
                  <p className="text-xs text-muted-foreground">Allergies alim.</p>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{dietaryStats.medication}</p>
                  <p className="text-xs text-muted-foreground">Médicaments</p>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-2xl font-bold text-orange-500">{dietaryStats.allergies}</p>
                  <p className="text-xs text-muted-foreground">Allergies</p>
                </div>
              </div>
            </Card>
          )}

          {/* Liste de tous les inscrits */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Inscrits ({inscriptions.length})</h3>
            {inscriptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Aucun inscrit</p>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table className="text-xs">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs whitespace-nowrap">Enfant</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Parent</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Contact</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Préférences</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Allergies alim.</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Médicaments</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Allergies</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">1ère inscr.</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Prioritaire</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Adhésion</TableHead>
                      <TableHead className="text-xs whitespace-nowrap">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inscriptions.map((inscription) => {
                      return (
                        <TableRow key={inscription.id}>
                          <TableCell>
                            <div>
                              <p className="font-semibold">
                                {inscription.child_first_name} {inscription.child_last_name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {inscription.child_gender === 'garcon' ? '👦' : '👧'} {inscription.child_class.toUpperCase()}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {inscription.parent_first_name} {inscription.parent_last_name}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{inscription.parent_mobile}</p>
                              <p className="text-muted-foreground">{inscription.parent_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {inscription.demande_specifique ? (
                              <div className="text-sm max-w-[200px]">
                                <p className="truncate" title={inscription.demande_specifique}>
                                  {inscription.demande_specifique}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {inscription.food_allergies_details ? (
                              <div className="text-sm max-w-[200px]">
                                <p className="truncate" title={inscription.food_allergies_details}>
                                  {inscription.food_allergies_details}
                                </p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {inscription.has_medication ? (
                              inscription.medication_details ? (
                                <div className="text-sm max-w-[200px]">
                                  <p className="truncate" title={inscription.medication_details}>
                                    {inscription.medication_details}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">
                                  <Pill className="w-3 h-3 mr-1" />
                                  Oui
                                </Badge>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {inscription.has_allergies ? (
                              inscription.allergies_details ? (
                                <div className="text-sm max-w-[200px]">
                                  <p className="truncate" title={inscription.allergies_details}>
                                    {inscription.allergies_details}
                                  </p>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-600 border-red-500/20">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Oui
                                </Badge>
                              )
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={inscription.is_first_inscription ? "default" : "secondary"} className="text-xs">
                              {inscription.is_first_inscription ? 'Oui' : 'Non'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={inscription.is_prioritaire || false}
                              onCheckedChange={async (checked) => {
                                await supabase.from('inscriptions').update({ is_prioritaire: !!checked } as any).eq('id', inscription.id);
                                fetchInscriptions();
                              }}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={inscription.has_adhesion || false}
                              onCheckedChange={async (checked) => {
                                await supabase.from('inscriptions').update({ has_adhesion: !!checked } as any).eq('id', inscription.id);
                                fetchInscriptions();
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <InscriptionStatusBadge status={inscription.status} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
